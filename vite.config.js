import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // 모바일 설치형(PWA)으로 쓰기 위한 매니페스트와 서비스워커.
    // 캐싱은 앱 셸과 정적 자산까지만 한다. 혼잡도처럼 신선도가 중요한 API 응답을 캐싱하면
    // 오래된 값이 최신처럼 보여 오히려 혼란스럽다.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: '투어스위치',
        short_name: '투어스위치',
        description: '친구들과 서울 여행지를 고르고 혼잡도를 피해 코스를 만드는 서비스',
        lang: 'ko',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#00bfc4',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // API는 서비스워커가 가로채지 않는다. 항상 네트워크로 나간다.
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  // 개발 서버Prozy 정의
  server: {
    proxy: {
      // 프론트엣서 /api로 시작하는 요청이 오면 localhost:8088 백엔드로 대신 보내
      '/api': {
        // target 주소에 요청하기
        target: 'http://localhost:8088', // Request대상 서버 도메인 (BE application.yaml의 server.port와 일치)
        // 즉 host를 바꿔 나는 8088에 직접 요청한 사람으로 보이게 하는거
        changeOrigin: true, // Request Header Host 필드 값을 대상 서버 호스트로 변경
        secure: false,  // SSL 인증서 검증 무시
      }
    }
  }
})
