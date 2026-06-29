import { defineConfig, devices } from "@playwright/test";

const apiHealthUrl = "http://127.0.0.1:8000/health";
const webUrl = "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 180000,
  expect: {
    timeout: 15000,
  },
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: webUrl,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: [
    {
      command: "powershell -ExecutionPolicy Bypass -File ./scripts/start-api-e2e.ps1",
      url: apiHealthUrl,
      timeout: 120000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "npm run dev -- --hostname=127.0.0.1 --port=3000",
      url: webUrl,
      timeout: 120000,
      reuseExistingServer: !process.env.CI,
      env: {
        NEXT_PUBLIC_API_URL: "http://127.0.0.1:8000",
      },
    },
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
