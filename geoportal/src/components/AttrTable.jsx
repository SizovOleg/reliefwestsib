import { useMemo, useState, useCallback } from 'react';
import { Table, Input, Typography, Space, Button, theme } from 'antd';
import { SearchOutlined, AimOutlined, CloseOutlined, FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import { Rnd } from 'react-rnd';
import { Resizable } from 'react-resizable';
import useStore from '../store';
import * as turf from '@turf/turf';

const { Text } = Typography;

const DEFAULT_COL_WIDTH = 150;
const MIN_COL_WIDTH = 60;

// Resizable header cell for Ant Design Table
function ResizableTitle({ onResize, width, ...restProps }) {
    if (!width) return <th {...restProps} />;

    return (
        <Resizable
            width={width}
            height={0}
            handle={
                <span
                    className="react-resizable-handle"
                    onClick={(e) => e.stopPropagation()}
                />
            }
            onResize={onResize}
            draggableOpts={{ enableUserSelectHack: false }}
        >
            <th {...restProps} />
        </Resizable>
    );
}

export default function AttrTable() {
    const { token } = theme.useToken();

    const attrTableLayer = useStore((s) => s.attrTableLayer);
    const attrTableData = useStore((s) => s.attrTableData);
    const attrTableGeometries = useStore((s) => s.attrTableGeometries);
    const attrTableLoading = useStore((s) => s.attrTableLoading);
    const closeAttrTable = useStore((s) => s.closeAttrTable);
    const selectFeature = useStore((s) => s.selectFeature);
    const fitBounds = useStore((s) => s.fitBounds);
    const flyTo = useStore((s) => s.flyTo);
    const setHighlightedFeature = useStore((s) => s.setHighlightedFeature);

    const [filter, setFilter] = useState('');
    const [selectedRowKey, setSelectedRowKey] = useState(null);
    const [colWidths, setColWidths] = useState({});
    const [maximized, setMaximized] = useState(false);

    // Build columns from data with resizable widths
    const baseColumns = useMemo(() => {
        if (attrTableData.length === 0) return [];

        return Object.keys(attrTableData[0])
            .filter(k => k !== '_key')
            .map(key => ({
                title: key,
                dataIndex: key,
                key,
                ellipsis: true,
                sorter: (a, b) => {
                    const va = a[key];
                    const vb = b[key];
                    if (va == null) return 1;
                    if (vb == null) return -1;
                    if (typeof va === 'number') return va - vb;
                    return String(va).localeCompare(String(vb));
                },
                width: colWidths[key] || DEFAULT_COL_WIDTH,
            }));
    }, [attrTableData, colWidths]);

    // Handle column resize
    const handleColumnResize = useCallback((key) => (_, { size }) => {
        setColWidths((prev) => ({
            ...prev,
            [key]: Math.max(size.width, MIN_COL_WIDTH),
        }));
    }, []);

    // Columns with resize handlers
    const columns = baseColumns.map((col) => ({
        ...col,
        onHeaderCell: (column) => ({
            width: column.width,
            onResize: handleColumnResize(col.key),
        }),
    }));

    // Filter data
    const filteredData = useMemo(() => {
        if (!filter) return attrTableData;
        const q = filter.toLowerCase();
        return attrTableData.filter(row =>
            Object.values(row).some(v =>
                v != null && String(v).toLowerCase().includes(q)
            )
        );
    }, [attrTableData, filter]);

    // Handle row click -> select feature + highlight on map
    const handleRowClick = (record) => {
        setSelectedRowKey(record._key);

        const feature = {
            properties: { ...record },
            id: record._key,
        };
        selectFeature(feature, attrTableLayer);

        // Highlight geometry on map
        const geom = attrTableGeometries[record._key];
        if (geom) {
            setHighlightedFeature({ geometry: geom, id: record._key });
        }
    };

    // Zoom to selected feature
    const handleZoomTo = () => {
        if (!selectedRowKey) return;
        const geom = attrTableGeometries[selectedRowKey];
        if (!geom) return;

        try {
            if (geom.type === 'Point') {
                const [lng, lat] = geom.coordinates;
                flyTo([lat, lng], 14);
            } else {
                const bbox = turf.bbox(geom);
                // bbox = [minLng, minLat, maxLng, maxLat]
                fitBounds([
                    [bbox[1], bbox[0]],
                    [bbox[3], bbox[2]],
                ]);
            }
        } catch (err) {
            console.error('Zoom to feature error:', err);
        }
    };

    if (!attrTableLayer) return null;

    const headerHeight = 44;
    const tableComponents = {
        header: { cell: ResizableTitle },
    };

    const titleBar = (
        <div
            className="attr-table-titlebar"
            style={{
                height: headerHeight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 12px',
                background: token.colorBgElevated,
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                borderRadius: maximized ? 0 : '8px 8px 0 0',
                cursor: 'move',
                userSelect: 'none',
                flexShrink: 0,
            }}
        >
            <Space size="small">
                <Text strong style={{ fontSize: 13 }}>
                    {attrTableLayer?.title}
                </Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                    ({filteredData.length} записей)
                </Text>
            </Space>

            <Space size={4}>
                <Input
                    placeholder="Поиск..."
                    prefix={<SearchOutlined />}
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    allowClear
                    size="small"
                    style={{ width: 160 }}
                    onMouseDown={(e) => e.stopPropagation()}
                />
                <Button
                    icon={<AimOutlined />}
                    size="small"
                    disabled={!selectedRowKey || !attrTableGeometries[selectedRowKey]}
                    onClick={handleZoomTo}
                    title="Приблизить к объекту"
                />
                <Button
                    icon={maximized ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                    size="small"
                    onClick={() => setMaximized(!maximized)}
                    title={maximized ? 'Восстановить' : 'Развернуть'}
                />
                <Button
                    icon={<CloseOutlined />}
                    size="small"
                    type="text"
                    onClick={() => {
                        closeAttrTable();
                        setSelectedRowKey(null);
                        setFilter('');
                        setHighlightedFeature(null);
                    }}
                />
            </Space>
        </div>
    );

    const tableContent = (
        <div style={{
            flex: 1,
            overflow: 'hidden',
            background: token.colorBgContainer,
            borderRadius: maximized ? 0 : '0 0 8px 8px',
        }}>
            <Table
                dataSource={filteredData}
                columns={columns}
                components={tableComponents}
                rowKey="_key"
                size="small"
                loading={attrTableLoading}
                scroll={{ x: 'max-content', y: 'calc(100% - 56px)' }}
                pagination={{
                    pageSize: 50,
                    showSizeChanger: true,
                    showTotal: (total) => `Всего: ${total}`,
                    size: 'small',
                }}
                onRow={(record) => ({
                    onClick: () => handleRowClick(record),
                    style: {
                        cursor: 'pointer',
                        background: record._key === selectedRowKey
                            ? 'rgba(74, 144, 164, 0.15)'
                            : undefined,
                    },
                })}
            />
        </div>
    );

    if (maximized) {
        return (
            <div
                className="attr-table-floating"
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 1100,
                    display: 'flex',
                    flexDirection: 'column',
                    background: token.colorBgContainer,
                    border: `1px solid ${token.colorBorder}`,
                }}
            >
                {titleBar}
                {tableContent}
            </div>
        );
    }

    return (
        <Rnd
            className="attr-table-floating"
            default={{
                x: 80,
                y: window.innerHeight - 500,
                width: 900,
                height: 400,
            }}
            minWidth={400}
            minHeight={200}
            bounds="parent"
            dragHandleClassName="attr-table-titlebar"
            style={{
                zIndex: 1100,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 8,
                boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
                border: `1px solid ${token.colorBorder}`,
                overflow: 'hidden',
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
                {titleBar}
                {tableContent}
            </div>
        </Rnd>
    );
}
