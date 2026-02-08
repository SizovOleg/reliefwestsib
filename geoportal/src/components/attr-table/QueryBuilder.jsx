import { useMemo } from 'react';
import { Select, Input, InputNumber, Button, Space, Radio, theme } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import useStore from '../../store';
import { OPERATORS, detectColumnType } from './utils';

let _condId = 0;

export default function QueryBuilder({ data }) {
    const { token } = theme.useToken();

    const queryConditions = useStore((s) => s.queryConditions);
    const queryLogic = useStore((s) => s.queryLogic);
    const setQueryConditions = useStore((s) => s.setQueryConditions);
    const setQueryLogic = useStore((s) => s.setQueryLogic);

    // Available fields from data
    const fields = useMemo(() => {
        if (!data.length) return [];
        return Object.keys(data[0]).filter((k) => k !== '_key');
    }, [data]);

    // Column types cache
    const columnTypes = useMemo(() => {
        const types = {};
        fields.forEach((f) => {
            types[f] = detectColumnType(data, f);
        });
        return types;
    }, [data, fields]);

    const addCondition = () => {
        setQueryConditions([...queryConditions, { id: ++_condId, field: null, operator: null, value: '' }]);
    };

    const updateCondition = (id, patch) => {
        setQueryConditions(queryConditions.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    };

    const removeCondition = (id) => {
        setQueryConditions(queryConditions.filter((c) => c.id !== id));
    };

    const reset = () => {
        setQueryConditions([]);
    };

    const getOperatorsForField = (fieldName) => {
        const type = columnTypes[fieldName] || 'string';
        return OPERATORS.filter((op) => op.types.includes(type));
    };

    return (
        <div
            className="attr-query-builder"
            style={{
                padding: '8px 12px',
                background: token.colorBgElevated,
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                flexShrink: 0,
            }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            {queryConditions.length > 1 && (
                <Radio.Group
                    size="small"
                    value={queryLogic}
                    onChange={(e) => setQueryLogic(e.target.value)}
                    style={{ marginBottom: 6 }}
                >
                    <Radio.Button value="AND">И (AND)</Radio.Button>
                    <Radio.Button value="OR">ИЛИ (OR)</Radio.Button>
                </Radio.Group>
            )}

            {queryConditions.map((cond) => {
                const ops = cond.field ? getOperatorsForField(cond.field) : OPERATORS;
                const isNoValue = cond.operator === 'is_null' || cond.operator === 'is_not_null';
                const isNumeric = cond.field && columnTypes[cond.field] === 'number';

                return (
                    <Space key={cond.id} size={4} style={{ marginBottom: 4, display: 'flex' }} wrap>
                        <Select
                            size="small"
                            placeholder="Поле"
                            value={cond.field}
                            onChange={(v) => updateCondition(cond.id, { field: v, operator: null, value: '' })}
                            style={{ width: 140 }}
                            showSearch
                            options={fields.map((f) => ({ value: f, label: f }))}
                        />
                        <Select
                            size="small"
                            placeholder="Оператор"
                            value={cond.operator}
                            onChange={(v) => updateCondition(cond.id, { operator: v })}
                            style={{ width: 120 }}
                            options={ops.map((op) => ({ value: op.value, label: op.label }))}
                            disabled={!cond.field}
                        />
                        {!isNoValue &&
                            (isNumeric ? (
                                <InputNumber
                                    size="small"
                                    placeholder="Значение"
                                    value={cond.value}
                                    onChange={(v) => updateCondition(cond.id, { value: v })}
                                    style={{ width: 120 }}
                                    disabled={!cond.operator}
                                />
                            ) : (
                                <Input
                                    size="small"
                                    placeholder="Значение"
                                    value={cond.value}
                                    onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
                                    style={{ width: 120 }}
                                    disabled={!cond.operator}
                                />
                            ))}
                        <Button
                            size="small"
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => removeCondition(cond.id)}
                        />
                    </Space>
                );
            })}

            <Space size={8} style={{ marginTop: 4 }}>
                <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={addCondition}>
                    Условие
                </Button>
                {queryConditions.length > 0 && (
                    <Button size="small" onClick={reset}>
                        Сбросить
                    </Button>
                )}
            </Space>
        </div>
    );
}
