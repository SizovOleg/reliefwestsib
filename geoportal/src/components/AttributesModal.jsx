export default function AttributesModal({ feature, onClose }) {
    const props = feature.properties || {};
    
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <span className="modal-title">
                        Атрибуты слоя «{feature.layer?.title}»
                    </span>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    {Object.entries(props)
                        .filter(([key, value]) => value !== null && value !== '')
                        .map(([key, value]) => (
                            <div className="attr-row" key={key}>
                                <div className="attr-name">{key}</div>
                                <div className="attr-value">{String(value)}</div>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    );
}
