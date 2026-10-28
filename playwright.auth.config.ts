import { defineConfig } from '@playwright/test'

const origin = 'http://localhost:5175'

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/auth-session.spec.ts',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: origin,
    channel: process.platform === 'win32' ? 'chrome' : undefined,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --port 5175 --strictPort',
    url: origin,
    reuseExistingServer: false,
    env: {
      VITE_USE_MOCK_API: 'false',
      VITE_API_BASE_URL: origin,
      VITE_REAL_API_ROUTES: '',
    },
  },
})
