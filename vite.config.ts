import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// IMPORTANT: change this to match your GitHub repo name, e.g. '/matchpulse/'
// If you deploy to a custom domain or user/org root page, set this to '/'
const BASE_PATH = '/matchpulse/'

export default defineConfig({
  base: BASE_PATH,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'MatchPulse',
        short_name: 'MatchPulse',
        description: 'Never miss a match.',
        theme_color: '#0B1220',
        background_color: '#0B1220',
        display: 'standalone',
        start_url: BASE_PATH,
        scope: BASE_PATH,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json}'],
        runtimeCaching: [
          {
            urlPattern: /\/data\/.*\.json$/,
            handler: 'NetworkFirst',
            options: { cacheName: 'matchpulse-data', expiration: { maxEntries: 20 } }
          }
        ]
      }
    })
  ]
})
