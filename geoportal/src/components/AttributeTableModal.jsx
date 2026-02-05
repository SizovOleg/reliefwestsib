import { useState, useEffect, useRef } from 'react';

export default function AttributeTableModal({ 
    layer, 
    data, 
    filter, 
    onFilterChange, 
    sortState, 
    onSort, 
    onClose, 
    onHighlight, 
    onZoomTo 
}) {
    const [position, setPosition] = useState({ x: 100, y: 100 });
    const [selectedRow, setSelectedRow] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [colWidths, setColWidths] = useState({});
    const modalRef = useRef(null);
    
    if (!layer) return null;
    
    const columns = data.length > 0 ? Object.keys(data[0]).filter(k => k !== '_id') : [];
    
    const handleMouseDown = (e) => {
        if (e.target.closest('.attr-table-close') || e.target.closest('.attr-table-search')) return;
        if (e.target.classList.contains('resizer')) return;
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };
    
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            setPosition({
                x: e.clientX - dragOffset.x,
                y: e.clientY - dragOffset.y
            });
        };
        const handleMouseUp = () => setIsDragging(false);
        
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);
    
    const startResize = (col, e) => {
        e.stopPropagation();
        const startX = e.clientX;
        const startWidth = colWidths[col] || 120;
        
        const onMove = (ev) => {
            const newWidth = Math.max(60, startWidth + ev.clientX - startX);
            setColWidths(prev => ({ ...prev, [col]: newWidth }));
        };
        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    };
    
    return (
        <>
            <div className="attr-table-overlay" onClick={onClose}></div>
            <div 
                ref={modalRef}
                className="attr-table-modal"
                style={{ left: position.x, top: position.y }}
            >
                <div className="attr-table-header" onMouseDown={handleMouseDown}>
                    <span className="attr-table-title">📋 {layer.title}</span>
                    <button className="attr-table-close" onClick={onClose}>×</button>
                </div>
                <div className="attr-table-toolbar">
                    <input 
                        type="text"
                        className="attr-table-search"
                        placeholder="Поиск по таблице..."
                        value={filter}
                        onChange={(e) => onFilterChange(e.target.value)}
                    />
                    <button 
                        className="attr-table-zoom-btn"
                        disabled={selectedRow === null}
                        onClick={() => selectedRow !== null && onZoomTo(data[selectedRow], layer)}
                        title="Приблизить к выбранному объекту"
                    >
                        🔍 Приблизить
                    </button>
                    <span className="attr-table-count">{data.length} записей</span>
                </div>
                <div className="attr-table-container">
                    <table className="attr-table">
                        <thead>
                            <tr>
                                {columns.map(col => (
                                    <th key={col} style={{ width: colWidths[col] || 'auto', position: 'relative' }}>
                                        <span className="th-content" onClick={() => onSort(col)}>
                                            {col} {sortState.field === col ? (sortState.asc ? '↑' : '↓') : ''}
                                        </span>
                                        <div className="resizer" onMouseDown={(e) => startResize(col, e)}></div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, idx) => (
                                <tr 
                                    key={row._id || idx} 
                                    className={selectedRow === idx ? 'highlighted' : ''}
                                    onClick={() => { setSelectedRow(idx); onHighlight(row, layer); }}
                                >
                                    {columns.map(col => (
                                        <td key={col} style={{ width: colWidths[col] || 'auto' }} title={row[col]}>{row[col]}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
