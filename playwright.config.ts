import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.E2E_PORT ?? 5173)
const ORIGIN = `http://localhost:${PORT}`

/**
 * E2E runs the real SPA against the in-app mock API (no backend needed). Only the two
 * endpoints a test must control are routed to the "network" - weather forecast and order
 * creation - and Playwright answers them deterministically. The API base URL is the dev
 * server itself, so those calls are same-origin (no CORS) and never reach a live service.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: ORIGIN,
    trace: 'retain-on-failure',
    viewport: { width: 1366, height: 900 },
    launchOptions: process.env.PW_CHROMIUM_PATH
      ? { executablePath: process.env.PW_CHROMIUM_PATH, args: ['--no-sandbox'] }
      : {},
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 900 },
      },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: ORIGIN,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      VITE_USE_MOCK_API: 'true',
      VITE_API_BASE_URL: ORIGIN,
      VITE_REAL_API_ROUTES: 'GET /api/weather/forecast,POST /api/orders',
    },
  },
})
