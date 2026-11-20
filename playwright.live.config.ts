import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e/live',
  testMatch: '**/*.e2e.ts',
  workers: 1,
  retries: 0,
  timeout: 300_000,
  reporter: 'list',
})
