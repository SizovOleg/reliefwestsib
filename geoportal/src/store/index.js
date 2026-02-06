import { create } from 'zustand';
import { API_BASE, GEOSERVER_WFS } from '../config';

const useStore = create((set, get) => ({
    // ===== UI =====
    darkTheme: localStorage.getItem('theme') !== 'light',
    sidebarCollapsed: false,
    activeTab: 'info',
    
    toggleTheme: () => {
        const next = !get().darkTheme;
        localStorage.setItem('theme', next ? 'dark' : 'light');
        set({ darkTheme: next });
    },
    setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
    setActiveTab: (tab) => set({ activeTab: tab }),

    // ===== Project =====
    project: null,
    
    // ===== Layers =====
    layers: [],
    layersLoading: true,
    visibility: {}, // { [layerId]: boolean }
    
    toggleLayerVisibility: (id) => set((s) => ({
        visibility: { ...s.visibility, [id]: !s.visibility[id] }
    })),
    
    // ===== Map =====
    basemap: 'osm',
    mapCenter: [64, 69],
    mapZoom: 6,
    cursorCoords: { lat: 0, lng: 0 },
    mapRef: null, // Leaflet map instance ref
    
    setBasemap: (b) => set({ basemap: b }),
    setCursorCoords: (coords) => set({ cursorCoords: coords }),
    setMapRef: (ref) => set({ mapRef: ref }),
    flyTo: (center, zoom) => {
        const map = get().mapRef;
        if (map) map.flyTo(center, zoom, { duration: 0.5 });
    },
    fitBounds: (bounds) => {
        const map = get().mapRef;
        if (map) map.fitBounds(bounds, { padding: [50, 50] });
    },

    // ===== Selected Feature =====
    selectedFeature: null,
    featureContent: null,
    featureLoading: false,
    
    selectFeature: async (feature, layer) => {
        if (!feature || !layer) {
            set({ selectedFeature: null, featureContent: null });
            return;
        }
        
        const props = feature.properties || {};
        const featureId = props.gid || props.id || (feature.id?.split('.').pop());
        
        set({
            selectedFeature: { ...feature, layer, featureId },
            featureContent: null,
            featureLoading: true,
            activeTab: 'info',
            sidebarCollapsed: false,
        });
        
        // Fetch rich content
        try {
            const res = await fetch(`${API_BASE}/api/features/${layer.slug}/${featureId}/`);
            if (res.ok) {
                const content = await res.json();
                set({ featureContent: content, featureLoading: false });
            } else {
                set({ featureLoading: false });
            }
        } catch {
            set({ featureLoading: false });
        }
    },
    
    clearSelection: () => set({ selectedFeature: null, featureContent: null }),

    // ===== Attribute Table =====
    attrTableLayer: null,
    attrTableData: [],
    attrTableLoading: false,
    
    openAttrTable: async (layer) => {
        set({ attrTableLayer: layer, attrTableData: [], attrTableLoading: true });
        
        try {
            const url = `${GEOSERVER_WFS}?service=WFS&version=1.1.0&request=GetFeature&typeName=${layer.geoserver_layer_name}&outputFormat=application/json&srsName=EPSG:4326`;
            const res = await fetch(url);
            const geojson = await res.json();
            const data = (geojson.features || []).map((f, i) => ({
                _key: f.id || i,
                ...f.properties,
            }));
            set({ attrTableData: data, attrTableLoading: false });
        } catch {
            set({ attrTableLoading: false });
        }
    },
    
    closeAttrTable: () => set({ attrTableLayer: null, attrTableData: [] }),

    // ===== Search =====
    searchQuery: '',
    searchResults: [],
    
    setSearchQuery: (q) => set({ searchQuery: q }),
    setSearchResults: (r) => set({ searchResults: r }),
    clearSearch: () => set({ searchQuery: '', searchResults: [] }),

    // ===== Initial Load =====
    loadInitialData: async () => {
        set({ layersLoading: true });
        try {
            const [projRes, layersRes] = await Promise.all([
                fetch(`${API_BASE}/api/projects/`),
                fetch(`${API_BASE}/api/layers/`),
            ]);
            
            const projects = await projRes.json();
            const layers = await layersRes.json();
            
            const project = projects[0] || null;
            const visibility = {};
            layers.forEach((l) => {
                visibility[l.id] = l.default_visible ?? false;
            });
            
            set({
                project,
                layers,
                visibility,
                layersLoading: false,
                mapCenter: project ? [project.center_lat, project.center_lon] : [64, 69],
                mapZoom: project?.default_zoom || 6,
                basemap: project?.default_basemap || 'osm',
            });
        } catch (err) {
            console.error('Load failed:', err);
            set({ layersLoading: false });
        }
    },
}));

export default useStore;
