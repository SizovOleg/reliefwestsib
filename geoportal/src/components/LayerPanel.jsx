import { Card, Checkbox, Button, Typography, Space, Spin, Tooltip, theme } from 'antd';
import { TableOutlined, AimOutlined } from '@ant-design/icons';
import useStore from '../store';

const { Text } = Typography;

function LayerCard({ layer }) {
    const { token } = theme.useToken();
    const visibility = useStore((s) => s.visibility);
    const toggleLayerVisibility = useStore((s) => s.toggleLayerVisibility);
    const openAttrTable = useStore((s) => s.openAttrTable);
    const fitBounds = useStore((s) => s.fitBounds);
    
    const isVisible = visibility[layer.id] ?? false;
    
    const handleZoom = () => {
        if (layer.bbox_west && layer.bbox_south && layer.bbox_east && layer.bbox_north) {
            fitBounds([
                [layer.bbox_south, layer.bbox_west],
                [layer.bbox_north, layer.bbox_east],
            ]);
        }
    };
    
    return (
        <Card
            size="small"
            style={{
                marginBottom: 8,
                border: isVisible ? `1px solid ${token.colorPrimary}` : `1px solid ${token.colorBorder}`,
                background: token.colorBgElevated,
            }}
            styles={{ body: { padding: '10px 12px' } }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Checkbox
                    checked={isVisible}
                    onChange={() => toggleLayerVisibility(layer.id)}
                />
                
                {layer.fill_color && (
                    <div style={{
                        width: 12,
                        height: 12,
                        borderRadius: 3,
                        background: layer.fill_color,
                        flexShrink: 0,
                    }} />
                )}
                
                <Text strong style={{ flex: 1, fontSize: 13 }}>{layer.title}</Text>
                
                {layer.feature_count && (
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        {layer.feature_count}
                    </Text>
                )}
                
                <Space size={4}>
                    <Tooltip title="Приблизить">
                        <Button
                            type="text"
                            size="small"
                            icon={<AimOutlined />}
                            onClick={handleZoom}
                        />
                    </Tooltip>
                    
                    {layer.geom_type !== 'raster' && (
                        <Tooltip title="Атрибутивная таблица">
                            <Button
                                type="text"
                                size="small"
                                icon={<TableOutlined />}
                                onClick={() => openAttrTable(layer)}
                            />
                        </Tooltip>
                    )}
                </Space>
            </div>
            
            {layer.description && (
                <Text type="secondary" style={{ display: 'block', marginTop: 6, fontSize: 12 }}>
                    {layer.description.length > 80 
                        ? layer.description.slice(0, 80) + '...' 
                        : layer.description}
                </Text>
            )}
        </Card>
    );
}

export default function LayerPanel() {
    const layers = useStore((s) => s.layers);
    const layersLoading = useStore((s) => s.layersLoading);
    
    if (layersLoading) {
        return (
            <div style={{ textAlign: 'center', padding: 40 }}>
                <Spin />
                <div style={{ marginTop: 12 }}>
                    <Text type="secondary">Загрузка слоёв...</Text>
                </div>
            </div>
        );
    }
    
    const vectorLayers = layers.filter(l => l.geom_type !== 'raster');
    const rasterLayers = layers.filter(l => l.geom_type === 'raster');
    
    return (
        <div>
            {vectorLayers.length > 0 && (
                <>
                    <Text type="secondary" style={{ 
                        display: 'block', 
                        fontSize: 11, 
                        textTransform: 'uppercase', 
                        letterSpacing: 0.5,
                        marginBottom: 10,
                    }}>
                        Векторные слои
                    </Text>
                    {vectorLayers.map(l => <LayerCard key={l.id} layer={l} />)}
                </>
            )}
            
            {rasterLayers.length > 0 && (
                <>
                    <Text type="secondary" style={{ 
                        display: 'block', 
                        fontSize: 11, 
                        textTransform: 'uppercase', 
                        letterSpacing: 0.5,
                        marginTop: 20,
                        marginBottom: 10,
                    }}>
                        Растровые слои
                    </Text>
                    {rasterLayers.map(l => <LayerCard key={l.id} layer={l} />)}
                </>
            )}
        </div>
    );
}
