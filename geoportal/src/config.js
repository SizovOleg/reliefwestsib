// API
export const API_BASE = '';
export const GEOSERVER_WMS = '/geoserver/wms';
export const GEOSERVER_WFS = '/geoserver/wfs';

// Map defaults
export const MAP_CENTER = [64, 69];
export const MAP_ZOOM = 6;

// Basemaps
export const BASEMAPS = {
    osm: {
        name: 'OpenStreetMap',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors',
    },
    satellite: {
        name: 'Спутник',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '© Esri',
    },
    topo: {
        name: 'Топокарта',
        url: 'https://reliefwestsib.ru/tiles/topo/{z}/{x}/{y}',
        attribution: '© Генштаб',
    },
    dem: {
        name: 'Рельеф',
        url: 'https://reliefwestsib.ru/tiles/dem3/{z}/{x}/{y}.png',
        attribution: '© TanDEM-X',
    },
};
