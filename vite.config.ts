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
  build: {
    rolldownOptions: {
      output: {
        // Split the big third-party libraries into their own long-lived chunks so
        // each portal downloads only the libraries it actually imports (previously
        // antd, FullCalendar and recharts were merged into one shared ~1.3 MB chunk).
        codeSplitting: {
          groups: [
            {
              name: 'vendor-react',
              test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 50,
            },
            {
              name: 'vendor-fullcalendar',
              test: /node_modules[\\/]@fullcalendar[\\/]/,
              priority: 40,
            },
            {
              name: 'vendor-charts',
              test: /node_modules[\\/](recharts|d3-[^\\/]+|victory-vendor|internmap|decimal\.js-light|es-toolkit|immer|reselect|redux|@reduxjs)[\\/]/,
              priority: 40,
            },
            {
              name: 'vendor-leaflet',
              test: /node_modules[\\/]leaflet[\\/]/,
              priority: 40,
            },
            {
              name: 'vendor-antd',
              test: /node_modules[\\/](antd|@ant-design|@rc-component|rc-[^\\/]+|@babel[\\/]runtime|dayjs|classnames|@emotion|stylis|compute-scroll-into-view|scroll-into-view-if-needed|throttle-debounce|resize-observer-polyfill|json2mq|string-convert|async-validator)[\\/]/,
              priority: 30,
            },
          ],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['**/node_modules/**', '.claude/**', 'e2e/**'],
    env: {
      VITE_USE_MOCK_API: 'true',
      VITE_REAL_API_ROUTES: '',
    },
  },
})
