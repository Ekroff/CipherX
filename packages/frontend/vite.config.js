import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        port: 5173,
        proxy: {
            // Proxy all /api/v1 requests to the backend API gateway
            '/api/v1': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                secure: false,
            },
        },
    },
    build: {
        outDir: 'dist',
    },
});
