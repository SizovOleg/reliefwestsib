import { saveAs } from 'file-saver';

// ===== Operators for Query Builder =====

export const OPERATORS = [
    { value: 'eq', label: '=', types: ['number', 'string'] },
    { value: 'neq', label: '≠', types: ['number', 'string'] },
    { value: 'gt', label: '>', types: ['number'] },
    { value: 'lt', label: '<', types: ['number'] },
    { value: 'gte', label: '≥', types: ['number'] },
    { value: 'lte', label: '≤', types: ['number'] },
    { value: 'contains', label: 'содержит', types: ['string'] },
    { value: 'starts_with', label: 'начинается с', types: ['string'] },
    { value: 'is_null', label: 'пусто', types: ['number', 'string'] },
    { value: 'is_not_null', label: 'не пусто', types: ['number', 'string'] },
];

// ===== Column Type Detection =====

export function detectColumnType(data, key) {
    const values = data.map((r) => r[key]).filter((v) => v != null);
    if (values.length === 0) return 'string';
    const numericCount = values.filter(
        (v) => typeof v === 'number' || (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v))),
    ).length;
    return numericCount > values.length * 0.7 ? 'number' : 'string';
}

// ===== Query Builder Filtering =====

function evaluateCondition(row, condition) {
    const { field, operator, value } = condition;
    if (!field || !operator) return true;
    const cellValue = row[field];

    switch (operator) {
        case 'is_null':
            return cellValue == null || String(cellValue).trim() === '';
        case 'is_not_null':
            return cellValue != null && String(cellValue).trim() !== '';
        case 'eq':
            if (cellValue == null) return false;
            // eslint-disable-next-line eqeqeq
            return String(cellValue) == String(value);
        case 'neq':
            if (cellValue == null) return true;
            // eslint-disable-next-line eqeqeq
            return String(cellValue) != String(value);
        case 'gt':
            return cellValue != null && Number(cellValue) > Number(value);
        case 'lt':
            return cellValue != null && Number(cellValue) < Number(value);
        case 'gte':
            return cellValue != null && Number(cellValue) >= Number(value);
        case 'lte':
            return cellValue != null && Number(cellValue) <= Number(value);
        case 'contains':
            return cellValue != null && String(cellValue).toLowerCase().includes(String(value).toLowerCase());
        case 'starts_with':
            return cellValue != null && String(cellValue).toLowerCase().startsWith(String(value).toLowerCase());
        default:
            return true;
    }
}

export function applyQueryConditions(data, conditions, logic) {
    const active = conditions.filter((c) => c.field && c.operator);
    if (active.length === 0) return data;
    return data.filter((row) => {
        const results = active.map((c) => evaluateCondition(row, c));
        return logic === 'AND' ? results.every(Boolean) : results.some(Boolean);
    });
}

// ===== Statistics =====

export function computeNumericStats(values) {
    const nums = values.filter((v) => v != null && !isNaN(Number(v))).map(Number);
    if (nums.length === 0) return null;
    const count = nums.length;
    const sum = nums.reduce((a, b) => a + b, 0);
    const mean = sum / count;
    const sorted = [...nums].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const median =
        count % 2 === 0 ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2 : sorted[Math.floor(count / 2)];
    const variance = nums.reduce((s, v) => s + (v - mean) ** 2, 0) / count;
    const stddev = Math.sqrt(variance);
    return { count, sum, mean, median, min, max, stddev };
}

export function computeTextStats(values) {
    const strs = values.filter((v) => v != null).map(String);
    const count = strs.length;
    const unique = new Set(strs);
    const uniqueCount = unique.size;
    const freq = {};
    strs.forEach((s) => {
        freq[s] = (freq[s] || 0) + 1;
    });
    const topValues = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([value, cnt]) => ({ value, count: cnt }));
    return { count, uniqueCount, topValues };
}

// ===== Histogram / Value Counts for Charts =====

export function createHistogramBins(values, binCount = null) {
    const nums = values.filter((v) => v != null && !isNaN(Number(v))).map(Number);
    if (nums.length === 0) return [];
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    if (min === max) return [{ range: `${min}`, count: nums.length }];
    const k = binCount || Math.max(5, Math.ceil(1 + 3.322 * Math.log10(nums.length)));
    const width = (max - min) / k;
    const bins = Array.from({ length: k }, (_, i) => ({
        range: `${(min + i * width).toFixed(1)}–${(min + (i + 1) * width).toFixed(1)}`,
        count: 0,
    }));
    nums.forEach((v) => {
        let idx = Math.floor((v - min) / width);
        if (idx >= k) idx = k - 1;
        bins[idx].count++;
    });
    return bins;
}

export function createValueCounts(values, limit = 15) {
    const strs = values.filter((v) => v != null).map(String);
    const freq = {};
    strs.forEach((s) => {
        freq[s] = (freq[s] || 0) + 1;
    });
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, limit).map(([name, count]) => ({ name, count }));
    if (sorted.length > limit) {
        const otherCount = sorted.slice(limit).reduce((s, [, c]) => s + c, 0);
        top.push({ name: 'Другие', count: otherCount });
    }
    return top;
}

// ===== Export =====

export function exportCSV(rows, filename) {
    if (!rows.length) return;
    const keys = Object.keys(rows[0]).filter((k) => k !== '_key');
    const header = keys.join(',');
    const lines = rows.map((row) =>
        keys
            .map((k) => {
                const v = row[k];
                if (v == null) return '';
                const s = String(v);
                return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
            })
            .join(','),
    );
    const csv = [header, ...lines].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, filename);
}

export function exportGeoJSON(rows, geometries, filename) {
    const features = rows
        .filter((row) => geometries[row._key])
        .map((row) => {
            const { _key, ...props } = row;
            return {
                type: 'Feature',
                geometry: geometries[_key],
                properties: props,
            };
        });
    const fc = { type: 'FeatureCollection', features };
    const blob = new Blob([JSON.stringify(fc, null, 2)], { type: 'application/json' });
    saveAs(blob, filename);
}
