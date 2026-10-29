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
    // antd + leaflet-heavy pages take several seconds to import and render under
    // jsdom, especially on 2-core CI runners; the 5s default causes spurious timeouts.
    testTimeout: 60000,
    hookTimeout: 60000,
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['**/node_modules/**', '.claude/**', 'e2e/**'],
    env: {
      // Fixtures and expectations assume Vietnam time (UTC+7); CI runners default to UTC.
      TZ: 'Asia/Ho_Chi_Minh',
      VITE_USE_MOCK_API: 'true',
      VITE_REAL_API_ROUTES: '',
    },
  },
})
