import { useEffect, useCallback, useState } from 'react';
import { MapContainer, TileLayer, WMSTileLayer, GeoJSON, useMap, useMapEvents, ScaleControl } from 'react-leaflet';
import L from 'leaflet';
import useStore from '../store';
import { BASEMAPS, GEOSERVER_WMS, GEOSERVER_WFS } from '../config';
import MapControls from './MapControls';

// Sync map instance to Zustand store
function MapSync() {
    const map = useMap();
    const setMapRef = useStore((s) => s.setMapRef);
    const setCursorCoords = useStore((s) => s.setCursorCoords);
    
    useEffect(() => {
        setMapRef(map);
        return () => setMapRef(null);
    }, [map, setMapRef]);
    
    useMapEvents({
        mousemove: (e) => setCursorCoords({ lat: e.latlng.lat, lng: e.latlng.lng }),
    });
    
    return null;
}

// Vector layer (WFS → GeoJSON)
function VectorLayer({ layer, visible, onFeatureClick }) {
    const [geojson, setGeojson] = useState(null);
    
    useEffect(() => {
        if (!visible || !layer.geoserver_layer_name) {
            setGeojson(null);
            return;
        }
        
        const url = `${GEOSERVER_WFS}?service=WFS&version=1.1.0&request=GetFeature&typeName=${layer.geoserver_layer_name}&outputFormat=application/json&srsName=EPSG:4326`;
        
        fetch(url)
            .then(r => r.json())
            .then(setGeojson)
            .catch(err => console.error('WFS error:', err));
    }, [visible, layer.geoserver_layer_name]);
    
    const getStyle = useCallback((feature) => {
        const base = {
            fillColor: layer.fill_color || '#4a90a4',
            color: '#fff',
            weight: 2,
            fillOpacity: 0.8,
        };
        
        if (layer.styles?.length > 0) {
            const field = layer.styles[0].attribute_field;
            const val = String(feature.properties?.[field] || '');
            const matched = layer.styles.find(s => s.attribute_value === val);
            if (matched) {
                return {
                    fillColor: matched.fill_color,
                    color: matched.stroke_color || '#fff',
                    weight: matched.stroke_width || 2,
                    fillOpacity: matched.fill_opacity || 0.8,
                    radius: matched.radius || 8,
                };
            }
        }
        return base;
    }, [layer]);
    
    const pointToLayer = useCallback((feature, latlng) => {
        const s = getStyle(feature);
        return L.circleMarker(latlng, {
            radius: s.radius || 8,
            fillColor: s.fillColor,
            color: s.color,
            weight: s.weight,
            fillOpacity: s.fillOpacity,
        });
    }, [getStyle]);
    
    const onEachFeature = useCallback((feature, lyr) => {
        const name = feature.properties?.name1 || feature.properties?.Name || feature.properties?.name || 'Объект';
        lyr.bindTooltip(name, { direction: 'top', offset: [0, -8] });
        lyr.on('click', () => onFeatureClick(feature, layer));
    }, [layer, onFeatureClick]);
    
    if (!geojson || !visible) return null;
    
    return (
        <GeoJSON
            key={`${layer.id}-${geojson.features?.length || 0}`}
            data={geojson}
            pointToLayer={layer.geom_type === 'point' ? pointToLayer : undefined}
            style={layer.geom_type !== 'point' ? getStyle : undefined}
            onEachFeature={onEachFeature}
        />
    );
}

// Raster layer (WMS)
function RasterLayer({ layer, visible }) {
    if (!visible || !layer.geoserver_layer_name) return null;
    
    return (
        <WMSTileLayer
            url={GEOSERVER_WMS}
            layers={layer.geoserver_layer_name}
            format="image/png"
            transparent
            opacity={layer.opacity || 1}
        />
    );
}

// Main map component
export default function MapView() {
    const mapCenter = useStore((s) => s.mapCenter);
    const mapZoom = useStore((s) => s.mapZoom);
    const basemap = useStore((s) => s.basemap);
    const layers = useStore((s) => s.layers);
    const visibility = useStore((s) => s.visibility);
    const selectFeature = useStore((s) => s.selectFeature);
    
    const basemapCfg = BASEMAPS[basemap] || BASEMAPS.osm;
    
    const onFeatureClick = useCallback((feature, layer) => {
        selectFeature(feature, layer);
    }, [selectFeature]);
    
    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ width: '100%', height: '100%' }}
                zoomControl
            >
                <MapSync />
                <ScaleControl position="bottomleft" metric imperial={false} />
                
                <TileLayer key={basemap} url={basemapCfg.url} attribution={basemapCfg.attribution} />
                
                {layers.filter(l => l.geom_type === 'raster').map(l => (
                    <RasterLayer key={l.id} layer={l} visible={visibility[l.id]} />
                ))}
                
                {layers.filter(l => l.geom_type !== 'raster').map(l => (
                    <VectorLayer key={l.id} layer={l} visible={visibility[l.id]} onFeatureClick={onFeatureClick} />
                ))}
            </MapContainer>
            
            <MapControls />
        </div>
    );
}
