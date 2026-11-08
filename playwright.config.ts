import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  workers: process.env.PW_WORKERS ? Number(process.env.PW_WORKERS) : '50%',
  timeout: 60_000,
  expect: { timeout: 8_000 },
  reporter: [['list'], ['html', { outputFolder: 'tests/report', open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1447, height: 1024 },
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1447, height: 1024 }, deviceScaleFactor: 1 },
      testIgnore: ['**/gates/build.spec.ts'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], viewport: { width: 1447, height: 1024 }, deviceScaleFactor: 1 },
      testMatch: ['**/e2e/smoke.spec.ts'],
    },
    {
      name: 'build-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1447, height: 1024 }, deviceScaleFactor: 1 },
      testMatch: ['**/gates/build.spec.ts'],
    },
    {
      name: 'build-webkit',
      use: { ...devices['Desktop Safari'], viewport: { width: 1447, height: 1024 }, deviceScaleFactor: 1 },
      testMatch: ['**/gates/build.spec.ts'],
    },
  ],
  webServer: process.env.PW_NO_SERVER
    ? undefined
    : {
        command: `npm run preview -- --port ${PORT}`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
