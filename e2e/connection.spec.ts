import { expect, test } from "@playwright/test";

import { createStarterDeckConfig, installHarness } from "./helpers";

test("connects successfully from first launch and shows the deck", async ({ page }) => {
  await installHarness(page, {
    deck: createStarterDeckConfig(),
  });

  await page.goto("/");

  await page.getByLabel(/host/i).fill("192.168.1.20");
  await page.getByLabel(/port/i).fill("4455");
  await page.getByLabel(/password/i).fill("secret");
  await page.getByRole("button", { name: /connect obs/i }).click();

  await expect(page.getByRole("heading", { name: /main obs deck/i })).toBeVisible();
  await expect(page.getByText(/^Connected$/)).toBeVisible();
});

test("keeps the setup form editable when OBS rejects the connection", async ({ page }) => {
  await installHarness(page, {
    deck: createStarterDeckConfig(),
    connectErrorMessage: "OBS rejected the password.",
  });

  await page.goto("/");

  await page.getByLabel(/host/i).fill("192.168.1.20");
  await page.getByLabel(/port/i).fill("4455");
  await page.getByRole("button", { name: /connect obs/i }).click();

  await expect(page.getByRole("alert")).toContainText(/obs rejected the password/i);
  await expect(page.getByLabel(/host/i)).toHaveValue("192.168.1.20");
});
