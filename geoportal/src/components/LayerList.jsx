export default function LayerList({ layers, visibleLayers, onToggle, onZoom, onOpenAttrTable, loading }) {
    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
                <span>Загрузка слоёв...</span>
            </div>
        );
    }
    
    const vectorLayers = layers.filter(l => l.geom_type === 'point' || l.geom_type === 'polygon' || l.geom_type === 'line');
    const rasterLayers = layers.filter(l => l.geom_type === 'raster');
    
    return (
        <div className="layer-list">
            {vectorLayers.length > 0 && (
                <>
                    <div className="layer-group-title">Векторные слои</div>
                    {vectorLayers.map(layer => (
                        <div 
                            key={layer.id}
                            className={`layer-card ${visibleLayers[layer.id] ? 'active' : ''}`}
                        >
                            <div className="layer-header">
                                <input 
                                    type="checkbox"
                                    className="layer-checkbox"
                                    checked={visibleLayers[layer.id] || false}
                                    onChange={() => onToggle(layer.id)}
                                />
                                <span 
                                    className="layer-color" 
                                    style={{background: layer.fill_color || '#6366f1'}}
                                ></span>
                                <span className="layer-title">{layer.title}</span>
                                {layer.feature_count && (
                                    <span className="layer-count">{layer.feature_count}</span>
                                )}
                                <button 
                                    className="layer-attr-btn"
                                    onClick={(e) => { e.stopPropagation(); onOpenAttrTable(layer); }}
                                    title="Атрибутивная таблица"
                                >
                                    📋
                                </button>
                            </div>
                            <div className="layer-meta">
                                {layer.description && layer.description.substring(0, 60) + '...'}
                            </div>
                        </div>
                    ))}
                </>
            )}
            
            {rasterLayers.length > 0 && (
                <>
                    <div className="layer-group-title">Растровые слои</div>
                    {rasterLayers.map(layer => (
                        <div 
                            key={layer.id}
                            className={`layer-card ${visibleLayers[layer.id] ? 'active' : ''}`}
                        >
                            <div className="layer-header">
                                <input 
                                    type="checkbox"
                                    className="layer-checkbox"
                                    checked={visibleLayers[layer.id] || false}
                                    onChange={() => onToggle(layer.id)}
                                />
                                <span className="layer-title">{layer.title}</span>
                            </div>
                        </div>
                    ))}
                </>
            )}
        </div>
    );
}
