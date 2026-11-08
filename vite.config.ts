import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@noble/hashes/sha2.js': new URL(
        'node_modules/@noble/hashes/sha2.js',
        import.meta.url,
      ).pathname,
      '@noble/hashes/utils.js': new URL(
        'node_modules/@noble/hashes/utils.js',
        import.meta.url,
      ).pathname,
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // antd/leaflet-heavy page tests routinely pass in ~1s alone but exceed the
    // 5s default when several workers compete for CPU.
    testTimeout: 20000,
    exclude: ['**/node_modules/**', '.claude/**', 'e2e/**'],
    env: {
      // Pin the timezone so date/weekday tests behave the same locally (VN)
      // and on UTC CI runners.
      TZ: 'Asia/Ho_Chi_Minh',
      VITE_USE_MOCK_API: 'true',
      VITE_REAL_API_ROUTES: '',
    },
  },
})
