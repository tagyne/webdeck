import { expect, test } from "@playwright/test";

import { createImportDeckPayload, createStarterDeckConfig, installHarness } from "./helpers";

test("previews an imported deck before replacing saved local state", async ({ page }) => {
  await installHarness(page, {
    connection: { host: "192.168.1.20", port: 4455 },
    deck: createStarterDeckConfig(),
  });

  await page.goto("/");

  await page.getByRole("button", { name: /import \/ export/i }).click();
  await page.getByLabel(/import deck file/i).setInputFiles({
    name: "travel-deck.webdeck.json",
    mimeType: "application/json",
    buffer: Buffer.from(createImportDeckPayload()),
  });

  const preview = page.getByRole("dialog", { name: /import preview/i });
  await expect(preview).toBeVisible();
  await expect(preview).toContainText(/travel deck/i);
  await expect(preview).toContainText(/3 x 3/i);
  await expect(preview).toContainText(/1 configured button/i);
  await expect(preview).toContainText(/connection settings included/i);

  await preview.getByRole("button", { name: /replace current deck/i }).click();

  await expect(page.getByRole("heading", { name: /travel deck/i })).toBeVisible();
  await expect(page.getByText(/192\.168\.1\.44:4455/i)).toBeVisible();
});
