import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/travel-payment-advisor/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'app-icon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: '어떻게 결제할까?',
        short_name: '결제 조언',
        description: '일본 여행 결제수단의 예상 원화 비용을 기기 안에서 비교합니다.',
        theme_color: '#125cf5',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/travel-payment-advisor/',
        scope: '/travel-payment-advisor/',
        lang: 'ko-KR',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        navigateFallback: '/travel-payment-advisor/index.html',
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,svg,woff2}']
      }
    })
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts']
  }
});
