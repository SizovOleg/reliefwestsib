export default function FeaturePanel({ feature, content, onBack, onShowAttributes, onImageClick }) {
    const props = feature.properties || {};
    
    const title = content?.title || 
        props.name1 || props.Name || props.name || props.NAME ||
        `Объект #${feature.featureId}`;
    
    // Build gallery images array
    const allImages = [];
    if (content?.main_image_url) {
        allImages.push({ url: content.main_image_url, caption: content.image_caption });
    }
    if (content?.gdrive_gallery) {
        content.gdrive_gallery.forEach(img => {
            allImages.push({ url: img.url, caption: img.caption });
        });
    }
    if (content?.gallery) {
        content.gallery.forEach(img => {
            allImages.push({ url: img.image_url, caption: img.caption });
        });
    }
    
    return (
        <div className="feature-panel">
            <button className="feature-back" onClick={onBack}>
                ← Назад
            </button>
            
            {/* Main Image */}
            {content?.main_image_url ? (
                <img 
                    src={content.main_image_url} 
                    alt={title}
                    className="feature-image"
                    onClick={() => onImageClick(content.main_image_url, allImages, 0)}
                />
            ) : (
                <div className="feature-image-placeholder">
                    📷 Нет изображения
                </div>
            )}
            
            {/* Title & Subtitle */}
            <h2 className="feature-title">{title}</h2>
            {content?.subtitle && (
                <div className="feature-subtitle">{content.subtitle}</div>
            )}
            
            {/* Description */}
            {content?.description ? (
                <div 
                    className="feature-description"
                    dangerouslySetInnerHTML={{ __html: content.description }}
                />
            ) : (
                <p className="feature-description" style={{color: 'var(--text-muted)', fontStyle: 'italic'}}>
                    Описание не добавлено. Откройте админку для редактирования.
                </p>
            )}
            
            {/* Gallery */}
            {content?.gallery && content.gallery.length > 0 && (
                <div className="feature-gallery">
                    {content.gallery.map((img, idx) => (
                        <img 
                            key={idx}
                            src={img.image_url}
                            alt={img.caption || ''}
                            className="gallery-thumb"
                            onClick={() => onImageClick(img.image_url, allImages, idx + 1)}
                        />
                    ))}
                </div>
            )}
            
            {/* Google Drive Gallery */}
            {content?.gdrive_gallery && content.gdrive_gallery.length > 0 && (
                <div className="feature-gallery">
                    {content.gdrive_gallery.map((img, idx) => (
                        <img 
                            key={idx}
                            src={img.url}
                            alt={img.caption || ''}
                            className="gallery-thumb"
                            onClick={() => onImageClick(img.url, allImages, (content.gallery?.length || 0) + idx + 1)}
                        />
                    ))}
                </div>
            )}
            
            {/* Show Attributes Button */}
            <button className="show-attrs-btn" onClick={onShowAttributes}>
                📋 Показать атрибуты слоя
            </button>
        </div>
    );
}
