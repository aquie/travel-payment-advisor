import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/travel-payment-advisor/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['app-icon.svg'],
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
            src: 'app-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
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
    globals: true
  }
});
