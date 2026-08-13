import fs from "node:fs";

import { defineConfig, devices } from "@playwright/test";

const linuxSnapChromiumPath = "/snap/bin/chromium";
const playwrightPort = Number(process.env.PLAYWRIGHT_TEST_PORT ?? "4273");

function resolveChromiumLaunchOptions() {
  const executablePath =
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ??
    (process.platform === "linux" && fs.existsSync(linuxSnapChromiumPath)
      ? linuxSnapChromiumPath
      : undefined);

  return executablePath ? { launchOptions: { executablePath } } : {};
}

const chromiumLaunchOptions = resolveChromiumLaunchOptions();

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: `http://127.0.0.1:${playwrightPort}`,
    trace: "on-first-retry",
  },
  webServer: {
    command: `pnpm dev --host 127.0.0.1 --port ${playwrightPort}`,
    port: playwrightPort,
    reuseExistingServer: false,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...chromiumLaunchOptions,
      },
    },
    {
      name: "phone-chromium",
      use: {
        ...devices["Pixel 7"],
        browserName: "chromium",
        ...chromiumLaunchOptions,
      },
    },
    {
      name: "tablet-chromium",
      use: {
        ...devices["iPad Mini"],
        browserName: "chromium",
        ...chromiumLaunchOptions,
      },
    },
  ],
});
