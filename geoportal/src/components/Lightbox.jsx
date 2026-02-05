import { useEffect } from 'react';

export default function Lightbox({ image, images, index, onClose, onNext, onPrev }) {
    const currentCaption = images[index]?.caption || '';
    
    // Keyboard navigation
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') onNext();
            if (e.key === 'ArrowLeft') onPrev();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose, onNext, onPrev]);
    
    return (
        <div className="lightbox" onClick={onClose}>
            <div className="lightbox-content" onClick={e => e.stopPropagation()}>
                <button className="lightbox-close" onClick={onClose}>×</button>
                
                {images.length > 1 && (
                    <>
                        <button className="lightbox-nav prev" onClick={onPrev}>‹</button>
                        <button className="lightbox-nav next" onClick={onNext}>›</button>
                    </>
                )}
                
                <img src={image} alt="" className="lightbox-image" />
                
                {currentCaption && (
                    <div className="lightbox-caption">{currentCaption}</div>
                )}
                
                {images.length > 1 && (
                    <div className="lightbox-counter">
                        {index + 1} / {images.length}
                    </div>
                )}
            </div>
        </div>
    );
}
