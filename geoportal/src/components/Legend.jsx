export default function Legend({ layers, visibleLayers, show, onToggle }) {
    // Collect styles from visible layers
    const legendItems = [];
    
    layers.forEach(layer => {
        if (visibleLayers[layer.id] && layer.styles && layer.styles.length > 0) {
            layer.styles.forEach(style => {
                legendItems.push({
                    color: style.fill_color,
                    label: style.legend_label || style.attribute_value,
                    layerTitle: layer.title
                });
            });
        }
    });
    
    if (legendItems.length === 0) return null;
    
    return (
        <div className="map-legend">
            <div 
                className="legend-header" 
                onClick={onToggle}
            >
                <span className="legend-title" style={{margin: 0}}>Легенда</span>
                <span style={{fontSize: '0.8rem'}}>{show ? '▼' : '▲'}</span>
            </div>
            {show && legendItems.map((item, idx) => (
                <div key={idx} className="legend-item">
                    <span className="legend-color" style={{background: item.color}}></span>
                    <span>{item.label}</span>
                </div>
            ))}
        </div>
    );
}
