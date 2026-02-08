import { useMemo, useState } from 'react';
import { Typography, Button, Radio, Space, theme } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { Rnd } from 'react-rnd';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from 'recharts';
import useStore from '../../store';
import { detectColumnType, createHistogramBins, createValueCounts } from './utils';

const { Text } = Typography;

const COLORS = [
    '#4a90a4', '#e6815c', '#5cb89a', '#d4a35c', '#7c8dba',
    '#c96b8c', '#6bb5c9', '#9aba6b', '#c9a96b', '#8b6bb5',
    '#b56b6b', '#6bb58b', '#b5a36b', '#6b8bb5', '#b56ba3',
];

export default function ColumnChart({ filteredData }) {
    const { token } = theme.useToken();

    const chartColumn = useStore((s) => s.chartColumn);
    const chartOpen = useStore((s) => s.chartOpen);
    const closeChart = useStore((s) => s.closeChart);

    const [chartType, setChartType] = useState('bar');

    const colType = useMemo(
        () => (chartColumn ? detectColumnType(filteredData, chartColumn) : 'string'),
        [filteredData, chartColumn],
    );

    const values = useMemo(
        () => (chartColumn ? filteredData.map((r) => r[chartColumn]) : []),
        [filteredData, chartColumn],
    );

    const histogramData = useMemo(
        () => (colType === 'number' ? createHistogramBins(values) : []),
        [colType, values],
    );

    const valueCountData = useMemo(
        () => createValueCounts(values, 15),
        [values],
    );

    if (!chartOpen || !chartColumn) return null;

    const isNumeric = colType === 'number';
    const chartData = isNumeric && chartType === 'bar' ? histogramData : valueCountData;

    return (
        <Rnd
            className="chart-floating"
            default={{
                x: 120,
                y: 60,
                width: 520,
                height: 380,
            }}
            minWidth={350}
            minHeight={280}
            bounds="parent"
            dragHandleClassName="chart-titlebar"
            style={{
                zIndex: 1200,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 8,
                boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
                border: `1px solid ${token.colorBorder}`,
                overflow: 'hidden',
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
                {/* Title bar */}
                <div
                    className="chart-titlebar"
                    style={{
                        height: 42,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 12px',
                        background: token.colorBgElevated,
                        borderBottom: `1px solid ${token.colorBorderSecondary}`,
                        borderRadius: '8px 8px 0 0',
                        cursor: 'move',
                        userSelect: 'none',
                        flexShrink: 0,
                    }}
                >
                    <Text strong style={{ fontSize: 13 }}>
                        {chartColumn}
                    </Text>
                    <Space size={4}>
                        <Radio.Group
                            size="small"
                            value={chartType}
                            onChange={(e) => setChartType(e.target.value)}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <Radio.Button value="bar">Столбцы</Radio.Button>
                            <Radio.Button value="pie">Круговая</Radio.Button>
                        </Radio.Group>
                        <Button
                            size="small"
                            type="text"
                            icon={<CloseOutlined />}
                            onClick={closeChart}
                        />
                    </Space>
                </div>

                {/* Chart area */}
                <div
                    style={{
                        flex: 1,
                        padding: 12,
                        background: token.colorBgContainer,
                        borderRadius: '0 0 8px 8px',
                        minHeight: 0,
                    }}
                >
                    {chartType === 'bar' ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{ top: 5, right: 10, left: 0, bottom: 40 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke={token.colorBorderSecondary} />
                                <XAxis
                                    dataKey={isNumeric ? 'range' : 'name'}
                                    tick={{ fontSize: 10, fill: token.colorTextSecondary }}
                                    angle={-35}
                                    textAnchor="end"
                                    interval={0}
                                    height={60}
                                />
                                <YAxis tick={{ fontSize: 10, fill: token.colorTextSecondary }} />
                                <Tooltip
                                    contentStyle={{
                                        background: token.colorBgElevated,
                                        border: `1px solid ${token.colorBorder}`,
                                        borderRadius: 4,
                                        fontSize: 12,
                                    }}
                                />
                                <Bar dataKey="count" fill={token.colorPrimary} radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={valueCountData}
                                    dataKey="count"
                                    nameKey="name"
                                    cx="50%"
                                    cy="45%"
                                    outerRadius="70%"
                                    label={({ name, percent }) =>
                                        `${name.length > 12 ? name.slice(0, 12) + '…' : name} ${(percent * 100).toFixed(0)}%`
                                    }
                                    labelLine={{ stroke: token.colorTextSecondary }}
                                >
                                    {valueCountData.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        background: token.colorBgElevated,
                                        border: `1px solid ${token.colorBorder}`,
                                        borderRadius: 4,
                                        fontSize: 12,
                                    }}
                                />
                                <Legend
                                    wrapperStyle={{ fontSize: 11 }}
                                    layout="horizontal"
                                    verticalAlign="bottom"
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </Rnd>
    );
}
