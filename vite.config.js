import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      incluadeAssets: ['tree.png', 'robots.txt'],
      manifest: {
        name: 'ระบบนับวันตัดต้นไม้',
        short_name: 'นับวันต้นไม้',
        description: 'เว็บนับวันตัดต้นไม้แบบออฟไลน์',
        theme_color: '#22c55e',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'tree.png',
            sizes: '64x64',
            type: 'image/x-icon',
          },
        ],
      },
    })
  ],
})
