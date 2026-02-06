import { useMemo, useState } from 'react';
import { Drawer, Table, Input, Typography, Space, Button } from 'antd';
import { SearchOutlined, AimOutlined } from '@ant-design/icons';
import useStore from '../store';

const { Text } = Typography;

export default function AttrTable() {
    const attrTableLayer = useStore((s) => s.attrTableLayer);
    const attrTableData = useStore((s) => s.attrTableData);
    const attrTableLoading = useStore((s) => s.attrTableLoading);
    const closeAttrTable = useStore((s) => s.closeAttrTable);
    const selectFeature = useStore((s) => s.selectFeature);
    const flyTo = useStore((s) => s.flyTo);
    
    const [filter, setFilter] = useState('');
    const [selectedRowKey, setSelectedRowKey] = useState(null);
    
    // Build columns from data
    const columns = useMemo(() => {
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
                width: 150,
            }));
    }, [attrTableData]);
    
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
    
    // Handle row click → select feature
    const handleRowClick = (record) => {
        setSelectedRowKey(record._key);
        
        // Create minimal feature object
        const feature = {
            properties: { ...record },
            id: record._key,
        };
        
        // Select feature (will fetch rich content)
        selectFeature(feature, attrTableLayer);
    };
    
    // Zoom to selected
    const handleZoomTo = () => {
        // This would require geometry - for now just a placeholder
        // Real implementation would store coordinates in table or refetch
    };
    
    return (
        <Drawer
            title={
                <Space>
                    <Text strong>📋 {attrTableLayer?.title}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        ({filteredData.length} записей)
                    </Text>
                </Space>
            }
            open={!!attrTableLayer}
            onClose={closeAttrTable}
            width={800}
            placement="bottom"
            height={450}
            extra={
                <Space>
                    <Input
                        placeholder="Поиск..."
                        prefix={<SearchOutlined />}
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        allowClear
                        style={{ width: 200 }}
                    />
                    <Button
                        icon={<AimOutlined />}
                        disabled={!selectedRowKey}
                        onClick={handleZoomTo}
                    >
                        Приблизить
                    </Button>
                </Space>
            }
        >
            <Table
                dataSource={filteredData}
                columns={columns}
                rowKey="_key"
                size="small"
                loading={attrTableLoading}
                scroll={{ x: 'max-content', y: 320 }}
                pagination={{ 
                    pageSize: 50, 
                    showSizeChanger: true, 
                    showTotal: (total) => `Всего: ${total}`,
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
        </Drawer>
    );
}
