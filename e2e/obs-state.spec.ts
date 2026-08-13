import { expect, test } from "@playwright/test";

import { createStarterDeckConfig, installHarness, pushObsState } from "./helpers";

test("shows the disconnected shell state while keeping the saved deck visible", async ({ page }) => {
  await installHarness(page, {
    connection: { host: "192.168.1.20", port: 4455 },
    deck: createStarterDeckConfig(),
    connectErrorMessage: "OBS is offline on the local network.",
  });

  await page.goto("/");

  await expect(page.getByRole("heading", { name: /main obs deck/i })).toBeVisible();
  await expect(page.getByText(/^Disconnected$/)).toBeVisible();
  await expect(page.getByText(/obs connection lost/i)).toBeVisible();
  await expect(page.getByText(/obs is offline on the local network/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /slot 1: mic/i })).toBeVisible();
});

test("restores the connected state after a reconnect", async ({ page }) => {
  await installHarness(page, {
    connection: { host: "192.168.1.20", port: 4455 },
    deck: createStarterDeckConfig(),
  });

  await page.goto("/");
  await expect(page.getByText(/^Connected$/)).toBeVisible();

  await pushObsState(page, {
    connectionStatus: "disconnected",
    lastError: "OBS is offline on the local network.",
  });

  await expect(page.getByText(/^Disconnected$/)).toBeVisible();
  await expect(page.getByRole("button", { name: /reconnect obs/i })).toBeVisible();

  await page.getByRole("button", { name: /reconnect obs/i }).click();

  await expect(page.getByText(/^Connected$/)).toBeVisible();
  await expect(page.getByRole("heading", { name: /main obs deck/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /slot 1: mic/i })).toBeVisible();
});
