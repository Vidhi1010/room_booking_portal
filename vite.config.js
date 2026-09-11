import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['images/**', 'banner/**', 'gallery/**'],
      manifest: {
        name: 'Kartik Yatra App',
        short_name: 'Yatra Booking',
        description: 'Room Booking Portal for Katik Yatra 2026',
        theme_color: '#f97316',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/images/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/images/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/images/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,webp}'],
        maximumFileSizeToCacheInBytes: 25 * 1024 * 1024,
      },
    }),
  ],
})
