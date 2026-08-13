import { expect, test } from "@playwright/test";

import { createDangerDeck, installHarness, readObsCalls } from "./helpers";

test("requires explicit confirmation before running dangerous actions", async ({ page }) => {
  await installHarness(page, {
    connection: { host: "192.168.1.20", port: 4455 },
    deck: createDangerDeck(),
  });

  await page.goto("/");

  await expect(page.getByRole("heading", { name: /danger deck/i })).toBeVisible();
  await page.getByRole("button", { name: /slot 1: stop stream/i }).click();

  await expect(page.getByRole("button", { name: /confirm stop stream/i })).toBeVisible();
  await expect.poll(() => readObsCalls(page)).toEqual([]);

  await page.getByRole("button", { name: /confirm stop stream/i }).click();

  await expect.poll(() => readObsCalls(page)).toEqual([{ type: "stopStream" }]);
});
