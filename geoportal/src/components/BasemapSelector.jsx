import { BASEMAPS } from '../config';

export default function BasemapSelector({ currentBasemap, onSwitch, show, onToggleMenu }) {
    return (
        <div className="basemap-control">
            <button className="basemap-toggle" onClick={onToggleMenu}>
                🗺 Подложка ▾
            </button>
            {show && (
                <div className="basemap-menu">
                    {Object.entries(BASEMAPS).map(([key, value]) => (
                        <div 
                            key={key}
                            className={`basemap-option ${currentBasemap === key ? "active" : ""}`}
                            onClick={() => { onSwitch(key); onToggleMenu(); }}
                        >
                            <span className="check">{currentBasemap === key ? "✓" : ""}</span>
                            {value.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
