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
    // antd-heavy page tests render slowly in jsdom when the whole suite runs in parallel.
    testTimeout: 20000,
    exclude: ['**/node_modules/**', '.claude/**', 'e2e/**'],
    env: {
      VITE_USE_MOCK_API: 'true',
      VITE_REAL_API_ROUTES: '',
    },
  },
})
