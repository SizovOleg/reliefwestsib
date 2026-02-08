import { Button, Space, Badge, theme } from 'antd';
import { FilterOutlined, CheckSquareOutlined, ClearOutlined } from '@ant-design/icons';
import useStore from '../../store';
import ExportMenu from './ExportMenu';

export default function AttrTableToolbar({ filteredData }) {
    const { token } = theme.useToken();

    const selectedRowKeys = useStore((s) => s.selectedRowKeys);
    const setSelectedRowKeys = useStore((s) => s.setSelectedRowKeys);
    const syncHighlightsFromSelection = useStore((s) => s.syncHighlightsFromSelection);
    const clearRowSelection = useStore((s) => s.clearRowSelection);
    const queryBuilderOpen = useStore((s) => s.queryBuilderOpen);
    const setQueryBuilderOpen = useStore((s) => s.setQueryBuilderOpen);
    const queryConditions = useStore((s) => s.queryConditions);

    const activeFilters = queryConditions.filter((c) => c.field && c.operator).length;

    const handleSelectAll = () => {
        const allKeys = filteredData.map((r) => r._key);
        setSelectedRowKeys(allKeys);
        // Defer sync to next tick since setSelectedRowKeys is async
        setTimeout(() => useStore.getState().syncHighlightsFromSelection(), 0);
    };

    const handleClearSelection = () => {
        clearRowSelection();
    };

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 12px',
                background: token.colorBgElevated,
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                flexShrink: 0,
                gap: 8,
            }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <Space size={4} wrap>
                <Badge count={activeFilters} size="small" offset={[-4, 0]}>
                    <Button
                        size="small"
                        type={queryBuilderOpen ? 'primary' : 'default'}
                        icon={<FilterOutlined />}
                        onClick={() => setQueryBuilderOpen(!queryBuilderOpen)}
                    >
                        Фильтр
                    </Button>
                </Badge>

                <ExportMenu filteredData={filteredData} />

                <Button
                    size="small"
                    icon={<CheckSquareOutlined />}
                    onClick={handleSelectAll}
                    title="Выбрать все отфильтрованные"
                >
                    Все
                </Button>

                {selectedRowKeys.length > 0 && (
                    <Button
                        size="small"
                        icon={<ClearOutlined />}
                        onClick={handleClearSelection}
                    >
                        Сброс ({selectedRowKeys.length})
                    </Button>
                )}
            </Space>

            {selectedRowKeys.length > 0 && (
                <span style={{ fontSize: 11, color: token.colorTextSecondary }}>
                    Выбрано: {selectedRowKeys.length}
                </span>
            )}
        </div>
    );
}
