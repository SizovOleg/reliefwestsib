import { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { API_BASE, GEOSERVER_WMS, GEOSERVER_WFS, BASEMAPS, DEFAULT_CENTER, DEFAULT_ZOOM } from '../config';

export function useGeoServer() {
    const [project, setProject] = useState(null);
    const [layers, setLayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [visibleLayers, setVisibleLayers] = useState({});
    const [currentBasemap, setCurrentBasemap] = useState('osm');
    const [coords, setCoords] = useState({ lat: 0, lng: 0 });
    
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const basemapLayerRef = useRef(null);
    const wmsLayersRef = useRef({});
    const vectorLayersRef = useRef({});
    const highlightLayerRef = useRef(null);

    // Load initial data
    useEffect(() => {
        async function loadData() {
            try {
                const [projectsRes, layersRes] = await Promise.all([
                    fetch(`${API_BASE}/api/projects/`),
                    fetch(`${API_BASE}/api/layers/`)
                ]);
                
                const projects = await projectsRes.json();
                const layersData = await layersRes.json();
                
                if (projects.length > 0) {
                    setProject(projects[0]);
                }
                
                setLayers(layersData);
                
                const visibility = {};
                layersData.forEach(l => {
                    visibility[l.id] = l.default_visible;
                });
                setVisibleLayers(visibility);
                
                setLoading(false);
            } catch (err) {
                console.error('Failed to load data:', err);
                setLoading(false);
            }
        }
        
        loadData();
    }, []);

    // Initialize map
    const initMap = useCallback((mapContainer) => {
        if (!mapContainer || mapInstanceRef.current) return;
        
        const map = L.map(mapContainer, {
            center: DEFAULT_CENTER,
            zoom: DEFAULT_ZOOM,
            zoomControl: true
        });
        
        basemapLayerRef.current = L.tileLayer(BASEMAPS[currentBasemap].url, {
            attribution: BASEMAPS[currentBasemap].attribution
        }).addTo(map);
        
        map.on('mousemove', (e) => {
            setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
        });
        
        mapInstanceRef.current = map;
        mapRef.current = mapContainer;
        
        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, [currentBasemap]);

    // Update map center when project loads
    useEffect(() => {
        if (!mapInstanceRef.current || !project) return;
        
        mapInstanceRef.current.setView(
            [project.center_lat, project.center_lon],
            project.default_zoom || DEFAULT_ZOOM
        );
        
        if (project.default_basemap && BASEMAPS[project.default_basemap]) {
            switchBasemap(project.default_basemap);
        }
    }, [project]);

    // Switch basemap
    const switchBasemap = useCallback((name) => {
        if (!mapInstanceRef.current || !BASEMAPS[name]) return;
        
        const map = mapInstanceRef.current;
        
        if (basemapLayerRef.current) {
            map.removeLayer(basemapLayerRef.current);
        }
        
        basemapLayerRef.current = L.tileLayer(BASEMAPS[name].url, {
            attribution: BASEMAPS[name].attribution
        }).addTo(map);
        basemapLayerRef.current.bringToBack();
        setCurrentBasemap(name);
    }, []);

    // Toggle layer visibility
    const toggleLayer = useCallback((layerId) => {
        setVisibleLayers(prev => ({
            ...prev,
            [layerId]: !prev[layerId]
        }));
    }, []);

    // Load WFS layer
    const loadWfsLayer = useCallback(async (layer, map, onFeatureClick) => {
        const wfsUrl = `${GEOSERVER_WFS}?service=WFS&version=1.1.0&request=GetFeature&typeName=${layer.geoserver_layer_name}&outputFormat=application/json&srsName=EPSG:4326`;
        
        try {
            const resp = await fetch(wfsUrl);
            const geojson = await resp.json();
            
            const vectorLayer = L.geoJSON(geojson, {
                pointToLayer: (feature, latlng) => {
                    let style = {
                        radius: 8,
                        fillColor: layer.fill_color || '#6366f1',
                        color: '#fff',
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.9
                    };
                    
                    if (layer.styles && layer.styles.length > 0) {
                        const attrField = layer.styles[0].attribute_field;
                        const attrValue = String(feature.properties?.[attrField] || '');
                        const matchedStyle = layer.styles.find(s => s.attribute_value === attrValue);
                        if (matchedStyle) {
                            style = {
                                radius: matchedStyle.radius || 8,
                                fillColor: matchedStyle.fill_color,
                                color: matchedStyle.stroke_color || '#fff',
                                weight: matchedStyle.stroke_width || 2,
                                opacity: 1,
                                fillOpacity: matchedStyle.fill_opacity || 0.9
                            };
                        }
                    }
                    
                    return L.circleMarker(latlng, style);
                },
                onEachFeature: (feature, leafletLayer) => {
                    leafletLayer.on('click', () => {
                        onFeatureClick(feature, layer);
                    });
                    
                    const name = feature.properties?.name1 || 
                                feature.properties?.Name || 
                                feature.properties?.name ||
                                `Объект`;
                    leafletLayer.bindTooltip(name, {
                        permanent: false,
                        direction: 'top',
                        offset: [0, -10]
                    });
                }
            }).addTo(map);
            
            vectorLayersRef.current[layer.id] = vectorLayer;
        } catch (err) {
            console.error('Failed to load WFS layer:', err);
        }
    }, []);

    // Manage layers visibility
    const updateLayers = useCallback((onFeatureClick) => {
        if (!mapInstanceRef.current || layers.length === 0) return;
        
        const map = mapInstanceRef.current;
        
        layers.forEach(layer => {
            if (!layer.geoserver_layer_name) return;
            
            const isVisible = visibleLayers[layer.id];
            const existingWmsLayer = wmsLayersRef.current[layer.id];
            const existingVectorLayer = vectorLayersRef.current[layer.id];
            
            if (layer.geom_type === 'point') {
                if (isVisible && !existingVectorLayer) {
                    loadWfsLayer(layer, map, onFeatureClick);
                } else if (!isVisible && existingVectorLayer) {
                    map.removeLayer(existingVectorLayer);
                    delete vectorLayersRef.current[layer.id];
                }
            } else {
                if (isVisible && !existingWmsLayer) {
                    const wmsLayer = L.tileLayer.wms(GEOSERVER_WMS, {
                        layers: layer.geoserver_layer_name,
                        format: 'image/png',
                        transparent: true,
                        opacity: layer.opacity || 1
                    }).addTo(map);
                    wmsLayersRef.current[layer.id] = wmsLayer;
                } else if (!isVisible && existingWmsLayer) {
                    map.removeLayer(existingWmsLayer);
                    delete wmsLayersRef.current[layer.id];
                }
            }
        });
    }, [layers, visibleLayers, loadWfsLayer]);

    // Highlight feature
    const highlightFeature = useCallback((row, layer) => {
        if (highlightLayerRef.current && mapInstanceRef.current) {
            mapInstanceRef.current.removeLayer(highlightLayerRef.current);
        }
        
        const vectorLayer = vectorLayersRef.current[layer.id];
        if (!vectorLayer) return;
        
        vectorLayer.eachLayer((leafletLayer) => {
            const props = leafletLayer.feature?.properties || {};
            const featureId = leafletLayer.feature?.id || '';
            
            const match = (row.name1 && props.name1 === row.name1) ||
                          (row.id && props.id === row.id) ||
                          (row._id && featureId === row._id);
            
            if (match) {
                let latlng = null;
                if (leafletLayer.getLatLng) {
                    latlng = leafletLayer.getLatLng();
                } else if (leafletLayer.getBounds) {
                    latlng = leafletLayer.getBounds().getCenter();
                }
                if (!latlng) return;
                
                const highlight = L.circleMarker(latlng, {
                    radius: 15,
                    fillColor: '#ffcc00',
                    color: '#ff6600',
                    weight: 3,
                    opacity: 1,
                    fillOpacity: 0.5
                }).addTo(mapInstanceRef.current);
                highlightLayerRef.current = highlight;
            }
        });
    }, []);

    // Zoom to feature
    const zoomToFeature = useCallback((row, layer) => {
        const vectorLayer = vectorLayersRef.current[layer.id];
        if (!vectorLayer || !mapInstanceRef.current) return;
        
        vectorLayer.eachLayer((leafletLayer) => {
            const props = leafletLayer.feature?.properties || {};
            const match = (row.name1 && props.name1 === row.name1) || (row.id && props.id === row.id);
            
            if (match) {
                if (leafletLayer.getLatLng) {
                    mapInstanceRef.current.setView(leafletLayer.getLatLng(), 9);
                } else if (leafletLayer.getBounds) {
                    mapInstanceRef.current.setView(leafletLayer.getBounds().getCenter(), 16);
                }
                highlightFeature(row, layer);
            }
        });
    }, [highlightFeature]);

    // Zoom to layer
    const zoomToLayer = useCallback((layer) => {
        if (!mapInstanceRef.current) return;
        if (layer.bbox_west && layer.bbox_south && layer.bbox_east && layer.bbox_north) {
            mapInstanceRef.current.fitBounds([
                [layer.bbox_south, layer.bbox_west],
                [layer.bbox_north, layer.bbox_east]
            ], { padding: [50, 50] });
        }
    }, []);

    // Search features
    const searchFeatures = useCallback((query) => {
        const results = [];
        if (query.length < 2) return results;
        
        const q = query.toLowerCase();
        
        Object.entries(vectorLayersRef.current).forEach(([layerId, vectorLayer]) => {
            const layer = layers.find(l => l.id === parseInt(layerId));
            if (!layer) return;
            
            vectorLayer.eachLayer((leafletLayer) => {
                const props = leafletLayer.feature?.properties || {};
                const name = props.name1 || props.Name || props.name || props.title || '';
                const descr = props.descr_1 || props.descr || props.description || '';
                
                if (name.toLowerCase().includes(q) || descr.toLowerCase().includes(q)) {
                    results.push({
                        feature: leafletLayer.feature,
                        layer: layer,
                        leafletLayer: leafletLayer,
                        name: name || `Объект #${props.gid || ''}`,
                        coords: leafletLayer.getLatLng ? leafletLayer.getLatLng() : null
                    });
                }
            });
        });
        
        return results.slice(0, 20);
    }, [layers]);

    // Handle search result click
    const handleSearchResultClick = useCallback((result, onFeatureClick) => {
        if (result.coords && mapInstanceRef.current) {
            mapInstanceRef.current.setView(result.coords, 12);
        }
        onFeatureClick(result.feature, result.layer);
    }, []);

    // Get attribute table data
    const getAttributeTableData = useCallback(async (layer) => {
        if (!layer.geoserver_layer_name) return [];
        
        const wfsUrl = `${GEOSERVER_WFS}?service=WFS&version=1.1.0&request=GetFeature&typeName=${layer.geoserver_layer_name}&outputFormat=application/json&srsName=EPSG:4326`;
        
        try {
            const resp = await fetch(wfsUrl);
            const geojson = await resp.json();
            const features = geojson.features || [];
            return features.map(f => ({...f.properties, _id: f.id}));
        } catch (err) {
            console.error('Failed to load attribute table:', err);
            return [];
        }
    }, []);

    return {
        // State
        project,
        layers,
        loading,
        visibleLayers,
        currentBasemap,
        coords,
        
        // Refs
        mapRef,
        mapInstanceRef,
        vectorLayersRef,
        
        // Actions
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
    };
}
