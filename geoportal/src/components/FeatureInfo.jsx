import { Button, Typography, Image, Descriptions, Spin, theme } from 'antd';
import { ArrowLeftOutlined, UnorderedListOutlined } from '@ant-design/icons';
import useStore from '../store';

const { Title, Text, Paragraph } = Typography;

export default function FeatureInfo() {
    const { token } = theme.useToken();
    
    const selectedFeature = useStore((s) => s.selectedFeature);
    const featureContent = useStore((s) => s.featureContent);
    const featureLoading = useStore((s) => s.featureLoading);
    const clearSelection = useStore((s) => s.clearSelection);
    
    if (!selectedFeature) return null;
    
    const props = selectedFeature.properties || {};
    const content = featureContent;
    
    // Title from content or properties
    const title = content?.title 
        || props.name1 || props.Name || props.name || props.NAME 
        || `Объект #${selectedFeature.featureId}`;
    
    // Build gallery images
    const images = [];
    if (content?.main_image_url) {
        images.push({ url: content.main_image_url, caption: content.image_caption });
    }
    if (content?.gdrive_gallery) {
        content.gdrive_gallery.forEach(img => images.push({ url: img.url, caption: img.caption }));
    }
    if (content?.gallery) {
        content.gallery.forEach(img => images.push({ url: img.image_url, caption: img.caption }));
    }
    
    return (
        <div>
            {/* Back button */}
            <Button 
                type="text" 
                icon={<ArrowLeftOutlined />} 
                onClick={clearSelection}
                style={{ marginBottom: 16 }}
            >
                Назад
            </Button>
            
            {/* Main image */}
            {images.length > 0 ? (
                <Image
                    src={images[0].url}
                    alt={title}
                    style={{ 
                        width: '100%', 
                        maxHeight: 280, 
                        objectFit: 'cover', 
                        borderRadius: 6,
                        marginBottom: 16,
                    }}
                    preview={{ 
                        src: images[0].url,
                    }}
                />
            ) : (
                <div style={{
                    width: '100%',
                    height: 160,
                    background: token.colorBgElevated,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                }}>
                    <Text type="secondary">📷 Нет изображения</Text>
                </div>
            )}
            
            {/* Title */}
            <Title level={4} style={{ marginBottom: 8 }}>{title}</Title>
            
            {/* Subtitle */}
            {content?.subtitle && (
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    {content.subtitle}
                </Text>
            )}
            
            {/* Loading indicator */}
            {featureLoading && (
                <div style={{ textAlign: 'center', padding: 20 }}>
                    <Spin size="small" />
                </div>
            )}
            
            {/* Description (HTML content) */}
            {content?.description ? (
                <div 
                    className="rich-content"
                    style={{ marginBottom: 20, lineHeight: 1.7 }}
                    dangerouslySetInnerHTML={{ __html: content.description }}
                />
            ) : !featureLoading && (
                <Paragraph type="secondary" italic style={{ marginBottom: 20 }}>
                    Описание не добавлено
                </Paragraph>
            )}
            
            {/* Gallery */}
            {images.length > 1 && (
                <div className="feature-gallery" style={{ marginBottom: 20 }}>
                    <Image.PreviewGroup>
                        {images.slice(1).map((img, i) => (
                            <Image
                                key={i}
                                src={img.url}
                                alt={img.caption || ''}
                                style={{ cursor: 'pointer' }}
                            />
                        ))}
                    </Image.PreviewGroup>
                </div>
            )}
            
            {/* Attributes (collapsed by default) */}
            <details style={{ marginTop: 16 }}>
                <summary style={{ 
                    cursor: 'pointer', 
                    color: token.colorPrimary,
                    marginBottom: 12,
                    fontSize: 13,
                }}>
                    <UnorderedListOutlined style={{ marginRight: 6 }} />
                    Показать атрибуты слоя
                </summary>
                
                <Descriptions
                    size="small"
                    column={1}
                    bordered
                    style={{ background: token.colorBgContainer }}
                >
                    {Object.entries(props)
                        .filter(([k, v]) => v != null && v !== '')
                        .map(([key, value]) => (
                            <Descriptions.Item key={key} label={key}>
                                {String(value)}
                            </Descriptions.Item>
                        ))
                    }
                </Descriptions>
            </details>
        </div>
    );
}
