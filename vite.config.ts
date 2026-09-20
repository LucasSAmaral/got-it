import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Got it?',
        short_name: 'Got it?',
        description: 'Catálogo da sua coleção de quadrinhos, HQs, encadernados e mangás.',
        lang: 'pt-BR',
        theme_color: '#1976d2',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [],
      },
    }),
  ],
})
