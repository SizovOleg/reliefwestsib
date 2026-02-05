import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    base: '/geoportal/',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false
    },
    server: {
        proxy: {
            '/api': 'http://localhost:8000',
            '/geoserver': 'http://localhost:8080'
        }
    }
});
