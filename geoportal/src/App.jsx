import { useState, useEffect, useCallback } from 'react';
import { useGeoServer } from './hooks/useGeoServer';
import { API_BASE } from './config';
import {
    Header,
    ProjectInfo,
    FeaturePanel,
    LayerList,
    Legend,
    Lightbox,
    AttributesModal,
    AttributeTableModal,
    BasemapSelector
} from './components';

export default function App() {
    const {
        project,
        layers,
        loading,
        visibleLayers,
        currentBasemap,
        coords,
        mapRef,
        mapInstanceRef,
        initMap,
        switchBasemap,
        toggleLayer,
        updateLayers,
        zoomToLayer,
        zoomToFeature,
        highlightFeature,
        searchFeatures,
        handleSearchResultClick,
        getAttributeTableData
    } = useGeoServer();

    // UI State
    const [activeTab, setActiveTab] = useState('info');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [selectedFeature, setSelectedFeature] = useState(null);
    const [featureContent, setFeatureContent] = useState(null);
    const [showAttributesModal, setShowAttributesModal] = useState(false);
    const [showLegend, setShowLegend] = useState(true);
    const [showBasemapMenu, setShowBasemapMenu] = useState(false);
    const [darkTheme, setDarkTheme] = useState(localStorage.getItem('darkTheme') === 'true');
    
    // Lightbox state
    const [lightboxImage, setLightboxImage] = useState(null);
    const [lightboxImages, setLightboxImages] = useState([]);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    
    // Attribute table state
    const [attributeTableLayer, setAttributeTableLayer] = useState(null);
    const [attributeTableData, setAttributeTableData] = useState([]);
    const [attrTableSort, setAttrTableSort] = useState({field: null, asc: true});
    const [attrTableFilter, setAttrTableFilter] = useState('');
    
    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    // Dark theme effect
    useEffect(() => {
        document.body.classList.toggle('dark-theme', darkTheme);
        localStorage.setItem('darkTheme', darkTheme);
    }, [darkTheme]);

    // Handle feature click
    const onFeatureClick = useCallback(async (feature, layer) => {
        const props = feature.properties || {};
        const featureId = props.gid || (feature.id ? feature.id.split('.').pop() : null);
        
        setSelectedFeature({
            ...feature,
            layer: layer,
            featureId: featureId
        });
        
        // Fetch rich content
        try {
            const contentResp = await fetch(
                `${API_BASE}/api/features/${layer.slug}/${featureId}/`
            );
            if (contentResp.ok) {
                const content = await contentResp.json();
                setFeatureContent(content);
            } else {
                setFeatureContent(null);
            }
        } catch {
            setFeatureContent(null);
        }
        
        setActiveTab('info');
        setSidebarCollapsed(false);
    }, []);

    // Update layers when visibility changes
    useEffect(() => {
        updateLayers(onFeatureClick);
    }, [layers, visibleLayers, onFeatureClick, updateLayers]);

    // Clear selection
    const clearSelection = () => {
        setSelectedFeature(null);
        setFeatureContent(null);
    };

    // Lightbox functions
    const openLightbox = (imageUrl, allImages = [], index = 0) => {
        setLightboxImage(imageUrl);
        setLightboxImages(allImages);
        setLightboxIndex(index);
    };
    
    const closeLightbox = () => {
        setLightboxImage(null);
        setLightboxImages([]);
    };
    
    const nextImage = () => {
        if (lightboxImages.length > 0) {
            const newIndex = (lightboxIndex + 1) % lightboxImages.length;
            setLightboxIndex(newIndex);
            setLightboxImage(lightboxImages[newIndex].url);
        }
    };
    
    const prevImage = () => {
        if (lightboxImages.length > 0) {
            const newIndex = (lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length;
            setLightboxIndex(newIndex);
            setLightboxImage(lightboxImages[newIndex].url);
        }
    };

    // Attribute table functions
    const openAttributeTable = async (layer) => {
        const data = await getAttributeTableData(layer);
        setAttributeTableData(data);
        setAttributeTableLayer(layer);
        setAttrTableFilter('');
        setAttrTableSort({field: null, asc: true});
    };
    
    const closeAttributeTable = () => {
        setAttributeTableLayer(null);
        setAttributeTableData([]);
    };
    
    const handleSort = (field) => {
        setAttrTableSort(prev => ({
            field,
            asc: prev.field === field ? !prev.asc : true
        }));
    };
    
    const getFilteredSortedData = () => {
        let data = [...attributeTableData];
        
        // Filter
        if (attrTableFilter) {
            const q = attrTableFilter.toLowerCase();
            data = data.filter(row => 
                Object.values(row).some(v => 
                    v && String(v).toLowerCase().includes(q)
                )
            );
        }
        
        // Sort
        if (attrTableSort.field) {
            data.sort((a, b) => {
                const va = a[attrTableSort.field];
                const vb = b[attrTableSort.field];
                if (va === vb) return 0;
                if (va === null || va === undefined) return 1;
                if (vb === null || vb === undefined) return -1;
                const cmp = va < vb ? -1 : 1;
                return attrTableSort.asc ? cmp : -cmp;
            });
        }
        
        return data;
    };

    // Search functions
    const handleSearch = (query) => {
        setSearchQuery(query);
        if (query.length >= 2) {
            const results = searchFeatures(query);
            setSearchResults(results);
        } else {
            setSearchResults([]);
        }
    };
    
    const onSearchResultClick = (result) => {
        handleSearchResultClick(result, onFeatureClick);
        setSearchQuery('');
        setSearchResults([]);
    };

    return (
        <div className="app">
            <Header darkTheme={darkTheme} setDarkTheme={setDarkTheme} />
            
            <div className="main">
                <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
                    <div className="tabs">
                        <button 
                            className={`tab ${activeTab === 'info' ? 'active' : ''}`}
                            onClick={() => setActiveTab('info')}
                        >
                            Информация
                        </button>
                        <button 
                            className={`tab ${activeTab === 'layers' ? 'active' : ''}`}
                            onClick={() => setActiveTab('layers')}
                        >
                            Слои ({layers.length})
                        </button>
                    </div>
                    
                    <div className="search-container">
                        <input 
                            type="text"
                            className="search-input"
                            placeholder="🔍 Поиск по объектам..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>
                    
                    {searchResults.length > 0 && (
                        <div className="search-results">
                            {searchResults.map((result, idx) => (
                                <div 
                                    key={idx} 
                                    className="search-result-item"
                                    onClick={() => onSearchResultClick(result)}
                                >
                                    <div className="search-result-title">{result.name}</div>
                                    <div className="search-result-layer">{result.layer.title}</div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {searchQuery.length >= 2 && searchResults.length === 0 && (
                        <div className="search-no-results">Ничего не найдено</div>
                    )}
                    
                    <div className="sidebar-content">
                        {activeTab === 'info' && (
                            selectedFeature ? (
                                <FeaturePanel 
                                    feature={selectedFeature}
                                    content={featureContent}
                                    onBack={clearSelection}
                                    onShowAttributes={() => setShowAttributesModal(true)}
                                    onImageClick={openLightbox}
                                />
                            ) : (
                                <ProjectInfo project={project} loading={loading} />
                            )
                        )}
                        
                        {activeTab === 'layers' && (
                            <LayerList 
                                layers={layers}
                                visibleLayers={visibleLayers}
                                onToggle={toggleLayer}
                                onZoom={zoomToLayer}
                                onOpenAttrTable={openAttributeTable}
                                loading={loading}
                            />
                        )}
                    </div>
                </aside>
                
                <button 
                    className="sidebar-toggle"
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                >
                    {sidebarCollapsed ? '▶' : '◀'}
                </button>
                
                <div className="map-container">
                    <div id="map" ref={initMap}></div>
                    
                    <BasemapSelector 
                        currentBasemap={currentBasemap}
                        onSwitch={switchBasemap}
                        show={showBasemapMenu}
                        onToggleMenu={() => setShowBasemapMenu(!showBasemapMenu)}
                    />
                    
                    <div className="coords-display">
                        {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                    </div>
                    
                    <Legend 
                        layers={layers} 
                        visibleLayers={visibleLayers} 
                        show={showLegend} 
                        onToggle={() => setShowLegend(!showLegend)} 
                    />
                </div>
            </div>
            
            {/* Attributes Modal */}
            {showAttributesModal && selectedFeature && (
                <AttributesModal 
                    feature={selectedFeature}
                    onClose={() => setShowAttributesModal(false)}
                />
            )}
            
            {/* Lightbox */}
            {lightboxImage && (
                <Lightbox 
                    image={lightboxImage}
                    images={lightboxImages}
                    index={lightboxIndex}
                    onClose={closeLightbox}
                    onNext={nextImage}
                    onPrev={prevImage}
                />
            )}
            
            {/* Attribute Table */}
            {attributeTableLayer && (
                <AttributeTableModal 
                    layer={attributeTableLayer}
                    data={getFilteredSortedData()}
                    filter={attrTableFilter}
                    onFilterChange={setAttrTableFilter}
                    sortState={attrTableSort}
                    onSort={handleSort}
                    onClose={closeAttributeTable}
                    onHighlight={highlightFeature}
                    onZoomTo={zoomToFeature}
                />
            )}
        </div>
    );
}
