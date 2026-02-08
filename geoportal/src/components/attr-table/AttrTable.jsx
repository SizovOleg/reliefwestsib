import { useMemo, useState, useCallback, useRef } from 'react';
import { Table, Input, Typography, Space, Button, theme } from 'antd';
import { SearchOutlined, AimOutlined, CloseOutlined, FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import { Rnd } from 'react-rnd';
import { Resizable } from 'react-resizable';
import * as turf from '@turf/turf';
import useStore from '../../store';
import { applyQueryConditions } from './utils';
import AttrTableToolbar from './AttrTableToolbar';
import QueryBuilder from './QueryBuilder';
import ColumnStatsPopover from './ColumnStatsPopover';
import ColumnChart from './ColumnChart';

const { Text } = Typography;

const DEFAULT_COL_WIDTH = 150;
const MIN_COL_WIDTH = 60;

// Track resize state globally so click on <th> can be suppressed after resize
let resizingFlag = false;

// Resizable header cell — block sort while resizing
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
                    onMouseDown={(e) => e.stopPropagation()}
                />
            }
            onResizeStart={() => { resizingFlag = true; }}
            onResizeStop={() => { setTimeout(() => { resizingFlag = false; }, 300); }}
            onResize={onResize}
            draggableOpts={{ enableUserSelectHack: false }}
        >
            <th
                {...restProps}
                onClick={(e) => {
                    if (resizingFlag) {
                        e.stopPropagation();
                        e.preventDefault();
                        return;
                    }
                    restProps.onClick?.(e);
                }}
            />
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

    // Multi-select
    const selectedRowKeys = useStore((s) => s.selectedRowKeys);
    const setSelectedRowKeys = useStore((s) => s.setSelectedRowKeys);
    const syncHighlightsFromSelection = useStore((s) => s.syncHighlightsFromSelection);

    // Query builder
    const queryConditions = useStore((s) => s.queryConditions);
    const queryLogic = useStore((s) => s.queryLogic);
    const queryBuilderOpen = useStore((s) => s.queryBuilderOpen);

    const [filter, setFilter] = useState('');
    const [colWidths, setColWidths] = useState({});
    const [maximized, setMaximized] = useState(false);
    const lastClickedIdx = useRef(null);

    // Stage 1: apply query builder conditions
    const queryFiltered = useMemo(
        () => applyQueryConditions(attrTableData, queryConditions, queryLogic),
        [attrTableData, queryConditions, queryLogic],
    );

    // Stage 2: apply text search
    const filteredData = useMemo(() => {
        if (!filter) return queryFiltered;
        const q = filter.toLowerCase();
        return queryFiltered.filter((row) =>
            Object.values(row).some((v) => v != null && String(v).toLowerCase().includes(q)),
        );
    }, [queryFiltered, filter]);

    // Build columns
    const baseColumns = useMemo(() => {
        if (attrTableData.length === 0) return [];
        return Object.keys(attrTableData[0])
            .filter((k) => k !== '_key')
            .map((key) => ({
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

    // Column resize handler
    const handleColumnResize = useCallback(
        (key) => (_, { size }) => {
            setColWidths((prev) => ({ ...prev, [key]: Math.max(size.width, MIN_COL_WIDTH) }));
        },
        [],
    );

    // Columns with resize + stats icon
    const columns = baseColumns.map((col) => ({
        ...col,
        title: (
            <Space size={4}>
                <span>{col.title}</span>
                <ColumnStatsPopover data={filteredData} columnKey={col.key}>
                    <span
                        className="col-stats-icon"
                        onClick={(e) => e.stopPropagation()}
                        style={{ cursor: 'pointer', opacity: 0.4, fontSize: 11 }}
                        title="Статистика"
                    >
                        📊
                    </span>
                </ColumnStatsPopover>
            </Space>
        ),
        onHeaderCell: (column) => ({
            width: column.width,
            onResize: handleColumnResize(col.key),
        }),
    }));

    // Row click with Ctrl/Shift
    const handleRowClick = (record, index, e) => {
        if (e.ctrlKey || e.metaKey) {
            // Toggle single
            const current = selectedRowKeys;
            const next = current.includes(record._key)
                ? current.filter((k) => k !== record._key)
                : [...current, record._key];
            setSelectedRowKeys(next);
        } else if (e.shiftKey && lastClickedIdx.current != null) {
            // Range select
            const start = Math.min(lastClickedIdx.current, index);
            const end = Math.max(lastClickedIdx.current, index);
            const rangeKeys = filteredData.slice(start, end + 1).map((r) => r._key);
            setSelectedRowKeys([...new Set([...selectedRowKeys, ...rangeKeys])]);
        } else {
            // Single select
            setSelectedRowKeys([record._key]);
        }
        lastClickedIdx.current = index;

        // Sync map highlights (deferred to allow state update)
        setTimeout(() => useStore.getState().syncHighlightsFromSelection(), 0);

        // Also select feature for sidebar info
        selectFeature({ properties: { ...record }, id: record._key }, attrTableLayer);
    };

    // Zoom to first selected
    const handleZoomTo = () => {
        const key = selectedRowKeys[0];
        if (!key) return;
        const geom = attrTableGeometries[key];
        if (!geom) return;
        try {
            if (geom.type === 'Point') {
                const [lng, lat] = geom.coordinates;
                flyTo([lat, lng], 14);
            } else {
                const bbox = turf.bbox(geom);
                fitBounds([[bbox[1], bbox[0]], [bbox[3], bbox[2]]]);
            }
        } catch (err) {
            console.error('Zoom to feature error:', err);
        }
    };

    // Ant Design rowSelection (checkboxes)
    const rowSelection = {
        selectedRowKeys,
        onChange: (newKeys) => {
            setSelectedRowKeys(newKeys);
            setTimeout(() => useStore.getState().syncHighlightsFromSelection(), 0);
        },
        columnWidth: 36,
    };

    if (!attrTableLayer) return null;

    const tableComponents = { header: { cell: ResizableTitle } };

    const titleBar = (
        <div
            className="attr-table-titlebar"
            style={{
                height: 42,
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
                    disabled={selectedRowKeys.length === 0}
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
                        setFilter('');
                    }}
                />
            </Space>
        </div>
    );

    const tableContent = (
        <div
            className="attr-table-content-wrap"
            style={{
                flex: 1,
                overflow: 'hidden',
                background: token.colorBgContainer,
                borderRadius: maximized ? 0 : '0 0 8px 8px',
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <Table
                dataSource={filteredData}
                columns={columns}
                components={tableComponents}
                rowKey="_key"
                size="small"
                loading={attrTableLoading}
                rowSelection={rowSelection}
                scroll={{ x: 'max-content' }}
                sticky
                pagination={{
                    pageSize: 50,
                    showSizeChanger: true,
                    showTotal: (total) => `Всего: ${total}`,
                    size: 'small',
                }}
                onRow={(record, index) => ({
                    onClick: (e) => handleRowClick(record, index, e),
                    style: {
                        cursor: 'pointer',
                        background: selectedRowKeys.includes(record._key)
                            ? 'rgba(74, 144, 164, 0.15)'
                            : undefined,
                    },
                })}
            />
        </div>
    );

    const inner = (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
            {titleBar}
            <AttrTableToolbar filteredData={filteredData} />
            {queryBuilderOpen && <QueryBuilder data={attrTableData} />}
            {tableContent}
        </div>
    );

    if (maximized) {
        return (
            <>
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
                    {inner}
                </div>
                <ColumnChart filteredData={filteredData} />
            </>
        );
    }

    return (
        <>
            <Rnd
                className="attr-table-floating"
                default={{
                    x: 80,
                    y: Math.max(40, window.innerHeight - 520),
                    width: 900,
                    height: 440,
                }}
                minWidth={400}
                minHeight={240}
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
                {inner}
            </Rnd>
            <ColumnChart filteredData={filteredData} />
        </>
    );
}
