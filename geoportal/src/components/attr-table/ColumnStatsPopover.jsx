import { useMemo } from 'react';
import { Popover, Descriptions, Button, Table, Space, theme } from 'antd';
import { BarChartOutlined } from '@ant-design/icons';
import useStore from '../../store';
import { detectColumnType, computeNumericStats, computeTextStats } from './utils';

function StatsContent({ data, columnKey }) {
    const { token } = theme.useToken();
    const openChart = useStore((s) => s.openChart);

    const colType = useMemo(() => detectColumnType(data, columnKey), [data, columnKey]);
    const values = useMemo(() => data.map((r) => r[columnKey]), [data, columnKey]);

    const numStats = useMemo(
        () => (colType === 'number' ? computeNumericStats(values) : null),
        [colType, values],
    );
    const textStats = useMemo(
        () => (colType === 'string' ? computeTextStats(values) : null),
        [colType, values],
    );

    const fmt = (v) => (typeof v === 'number' ? (Number.isInteger(v) ? v : v.toFixed(3)) : v);

    return (
        <div style={{ maxWidth: 260 }}>
            {numStats && (
                <Descriptions
                    column={1}
                    size="small"
                    bordered
                    style={{ marginBottom: 8 }}
                    items={[
                        { key: 'count', label: 'Количество', children: numStats.count },
                        { key: 'min', label: 'Минимум', children: fmt(numStats.min) },
                        { key: 'max', label: 'Максимум', children: fmt(numStats.max) },
                        { key: 'mean', label: 'Среднее', children: fmt(numStats.mean) },
                        { key: 'median', label: 'Медиана', children: fmt(numStats.median) },
                        { key: 'sum', label: 'Сумма', children: fmt(numStats.sum) },
                        { key: 'stddev', label: 'Станд. откл.', children: fmt(numStats.stddev) },
                    ]}
                />
            )}

            {textStats && (
                <>
                    <Descriptions
                        column={1}
                        size="small"
                        bordered
                        style={{ marginBottom: 8 }}
                        items={[
                            { key: 'count', label: 'Количество', children: textStats.count },
                            { key: 'unique', label: 'Уникальных', children: textStats.uniqueCount },
                        ]}
                    />
                    {textStats.topValues.length > 0 && (
                        <Table
                            dataSource={textStats.topValues}
                            columns={[
                                { title: 'Значение', dataIndex: 'value', ellipsis: true, width: 160 },
                                { title: 'Кол-во', dataIndex: 'count', width: 60 },
                            ]}
                            rowKey="value"
                            size="small"
                            pagination={false}
                            style={{ marginBottom: 8 }}
                        />
                    )}
                </>
            )}

            <Button
                size="small"
                type="primary"
                icon={<BarChartOutlined />}
                onClick={() => openChart(columnKey)}
                block
            >
                Диаграмма
            </Button>
        </div>
    );
}

export default function ColumnStatsPopover({ data, columnKey, children }) {
    return (
        <Popover
            content={<StatsContent data={data} columnKey={columnKey} />}
            title={`Статистика: ${columnKey}`}
            trigger="click"
            placement="bottomLeft"
        >
            {children}
        </Popover>
    );
}
