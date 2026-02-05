// API Configuration
export const API_BASE = '';
export const GEOSERVER_WMS = '/geoserver/wms';
export const GEOSERVER_WFS = '/geoserver/wfs';

// Basemaps
export const BASEMAPS = {
    osm: { 
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', 
        name: 'OSM',
        attribution: '© OpenStreetMap',
        icon: '🗺'
    },
    satellite: { 
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', 
        name: 'Спутник',
        attribution: '© Esri',
        icon: '🛰'
    },
    topo: { 
        url: 'https://reliefwestsib.ru/tiles/topo/{z}/{x}/{y}', 
        name: 'Топокарта',
        attribution: '© TopoMapper',
        icon: '🏔'
    }
};

// Default map settings
export const DEFAULT_CENTER = [64, 69];
export const DEFAULT_ZOOM = 6;
