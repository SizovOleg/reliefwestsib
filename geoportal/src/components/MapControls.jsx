import { Card, Dropdown, Button, Typography, Space, theme } from 'antd';
import { GlobalOutlined, DownOutlined } from '@ant-design/icons';
import useStore from '../store';
import { BASEMAPS } from '../config';

const { Text } = Typography;

// Basemap selector dropdown
function BasemapSelector() {
    const { token } = theme.useToken();
    const basemap = useStore((s) => s.basemap);
    const setBasemap = useStore((s) => s.setBasemap);
    
    const items = Object.entries(BASEMAPS).map(([key, cfg]) => ({
        key,
        label: cfg.name,
        onClick: () => setBasemap(key),
    }));
    
    return (
        <Dropdown menu={{ items, selectedKeys: [basemap] }} trigger={['click']}>
            <Button icon={<GlobalOutlined />} style={{ background: token.colorBgContainer }}>
                {BASEMAPS[basemap]?.name || 'Подложка'} <DownOutlined />
            </Button>
        </Dropdown>
    );
}

// Coordinates display
function CoordsDisplay() {
    const { token } = theme.useToken();
    const coords = useStore((s) => s.cursorCoords);
    
    return (
        <div style={{
            background: token.colorBgContainer,
            border: `1px solid ${token.colorBorder}`,
            borderRadius: 4,
            padding: '4px 10px',
            fontSize: 12,
            fontFamily: 'monospace',
            color: token.colorTextSecondary,
        }}>
            {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
        </div>
    );
}

// Legend panel
function Legend() {
    const { token } = theme.useToken();
    const layers = useStore((s) => s.layers);
    const visibility = useStore((s) => s.visibility);
    
    // Collect legend items from visible layers with styles
    const items = [];
    layers.forEach(layer => {
        if (visibility[layer.id] && layer.styles?.length > 0) {
            layer.styles.forEach(style => {
                items.push({
                    color: style.fill_color,
                    label: style.legend_label || style.attribute_value,
                    layerTitle: layer.title,
                });
            });
        }
    });
    
    if (items.length === 0) return null;
    
    return (
        <Card
            size="small"
            title={<Text strong style={{ fontSize: 12, textTransform: 'uppercase' }}>Легенда</Text>}
            style={{ background: token.colorBgContainer }}
            styles={{ body: { padding: '8px 12px' } }}
        >
            <Space direction="vertical" size={4}>
                {items.map((item, i) => (
                    <Space key={i} size={8}>
                        <div style={{
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            background: item.color,
                            border: '2px solid #fff',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                        }} />
                        <Text style={{ fontSize: 13 }}>{item.label}</Text>
                    </Space>
                ))}
            </Space>
        </Card>
    );
}

// All map controls
export default function MapControls() {
    return (
        <>
            <div className="map-basemap-control">
                <BasemapSelector />
            </div>
            
            <div className="map-coords">
                <CoordsDisplay />
            </div>
            
            <div className="map-legend">
                <Legend />
            </div>
        </>
    );
}
