import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 개발 서버Prozy 정의 
  server: {
    proxy: {
      // 프론트엣서 /api로 시작하는 요청이 오면 localhost:8808 백엔드로 대신 보내
      '/api': {
        // target 주소에 요청하기
        target: 'http://localhost:8080', // Request대상 서버 도메인
        // 즉 host를 바꿔 나는 8808에 직접 요청한 사람으로 보이게 하는거
        changeOrigin: true, // Request Header Host 필드 값을 대상 서버 호스트로 변경
        secure: false,  // SSL 인증서 검증 무시
      }
    }
  }
})
