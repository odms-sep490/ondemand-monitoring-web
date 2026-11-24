import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: './e2e/live',
  testMatch: 'deepeval-order.e2e.ts',
  workers: 1,
  retries: 0,
  timeout: 300_000,
  expect: { timeout: 20_000 },
  reporter: [
    ['list'],
    [
      'json',
      {
        outputFile:
          process.env.DEEPEVAL_BROWSER_REPORT ??
          'test-results/deepeval-browser.json',
      },
    ],
  ],
  outputDir:
    process.env.ORDER_AGENT_OUTPUT_DIR ?? 'test-results/order-agent-live',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.ORDER_AGENT_WEB_URL ?? 'http://localhost:5173',
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
    viewport: { width: 1440, height: 1000 },
    trace: 'off',
    screenshot: 'only-on-failure',
    launchOptions: {
      args: process.env.ORDER_AGENT_AUDIO_FIXTURE
        ? [
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
            '--use-file-for-fake-audio-capture=' +
              process.env.ORDER_AGENT_AUDIO_FIXTURE,
          ]
        : [],
    },
  },
})
