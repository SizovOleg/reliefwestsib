import { Tabs, Input, Empty, List, Typography, theme } from 'antd';
import { InfoCircleOutlined, AppstoreOutlined } from '@ant-design/icons';
import useStore from '../store';
import LayerPanel from './LayerPanel';
import FeatureInfo from './FeatureInfo';

const { Search } = Input;
const { Text } = Typography;

export default function Sidebar() {
    const { token } = theme.useToken();
    
    const activeTab = useStore((s) => s.activeTab);
    const setActiveTab = useStore((s) => s.setActiveTab);
    const layers = useStore((s) => s.layers);
    const project = useStore((s) => s.project);
    const selectedFeature = useStore((s) => s.selectedFeature);
    
    // Search state
    const searchQuery = useStore((s) => s.searchQuery);
    const searchResults = useStore((s) => s.searchResults);
    const setSearchQuery = useStore((s) => s.setSearchQuery);
    const setSearchResults = useStore((s) => s.setSearchResults);
    const clearSearch = useStore((s) => s.clearSearch);
    const selectFeature = useStore((s) => s.selectFeature);
    const flyTo = useStore((s) => s.flyTo);
    
    // Search handler (simple client-side search through loaded features would require caching)
    // For now, just UI placeholder - full search would need backend endpoint
    const handleSearch = (value) => {
        setSearchQuery(value);
        // TODO: Implement search via backend or cached features
        if (value.length < 2) {
            setSearchResults([]);
        }
    };
    
    const handleSearchResultClick = (result) => {
        selectFeature(result.feature, result.layer);
        if (result.coords) {
            flyTo([result.coords.lat, result.coords.lng], 12);
        }
        clearSearch();
    };
    
    const tabItems = [
        {
            key: 'info',
            label: <span><InfoCircleOutlined /> Информация</span>,
            children: (
                <div>
                    {selectedFeature ? (
                        <FeatureInfo />
                    ) : (
                        <div>
                            <Typography.Title level={4} style={{ marginBottom: 12 }}>
                                {project?.title || 'Геопортал'}
                            </Typography.Title>
                            <Text type="secondary">
                                {project?.description || 'Выберите объект на карте для просмотра информации'}
                            </Text>
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'layers',
            label: <span><AppstoreOutlined /> Слои ({layers.length})</span>,
            children: <LayerPanel />,
        },
    ];
    
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Search */}
            <div style={{ padding: 12, borderBottom: `1px solid ${token.colorBorder}` }}>
                <Search
                    placeholder="Поиск по объектам..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    allowClear
                    onClear={clearSearch}
                />
            </div>
            
            {/* Search results */}
            {searchResults.length > 0 && (
                <List
                    size="small"
                    style={{ maxHeight: 240, overflowY: 'auto', borderBottom: `1px solid ${token.colorBorder}` }}
                    dataSource={searchResults}
                    renderItem={(item) => (
                        <List.Item
                            style={{ cursor: 'pointer', padding: '8px 12px' }}
                            onClick={() => handleSearchResultClick(item)}
                        >
                            <List.Item.Meta
                                title={item.name}
                                description={<Text type="secondary" style={{ fontSize: 12 }}>{item.layer.title}</Text>}
                            />
                        </List.Item>
                    )}
                />
            )}
            
            {searchQuery.length >= 2 && searchResults.length === 0 && (
                <div style={{ padding: 16 }}>
                    <Empty description="Ничего не найдено" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </div>
            )}
            
            {/* Tabs */}
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems}
                className="sidebar-tabs"
                centered
            />
        </div>
    );
}
