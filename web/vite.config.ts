import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const BACKEND_PORT = process.env.PORT || '5203'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-192x192.svg', 'pwa-512x512.svg'],
      manifest: {
        name: 'CommBank Goal Tracker',
        short_name: 'Goal Tracker',
        description: 'Track and achieve your financial goals',
        theme_color: '#2563eb',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: 'pwa-512x512.svg', sizes: '512x512', type: 'image/svg+xml' },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: `http://localhost:${BACKEND_PORT}`,
        changeOrigin: true,
      },
    },
  },
})
