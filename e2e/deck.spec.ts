import { expect, test } from "@playwright/test";

import { createStarterDeckConfig, installHarness, readObsCalls } from "./helpers";

test("renders the starter deck and runs single-tap actions through the fake OBS client", async ({ page }) => {
  await installHarness(page, {
    connection: { host: "192.168.1.20", port: 4455 },
    deck: createStarterDeckConfig(),
  });

  await page.goto("/");

  await expect(page.getByRole("heading", { name: /main obs deck/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /slot/i })).toHaveCount(9);

  await page.getByRole("button", { name: /slot 1: mic/i }).click();
  await page.getByRole("button", { name: /slot 2: gameplay/i }).click();

  await expect.poll(() => readObsCalls(page)).toEqual([
    { type: "toggleInputMute", inputName: "Mic/Aux" },
    { type: "setCurrentProgramScene", sceneName: "Gameplay" },
  ]);
});

test("can edit an empty slot into a working scene button", async ({ page }) => {
  await installHarness(page, {
    connection: { host: "192.168.1.20", port: 4455 },
    deck: createStarterDeckConfig(),
  });

  await page.goto("/");

  await page.getByRole("button", { name: /edit deck/i }).click();
  await page.getByRole("button", { name: /slot 6: empty slot/i }).click();

  await expect(page.getByRole("heading", { name: /edit slot 6/i })).toBeVisible();
  await page.getByLabel(/label/i).fill("BRB");
  await page.getByLabel(/action type/i).selectOption("setCurrentProgramScene");
  await page.getByLabel(/scene name/i).fill("BRB");
  await page.getByRole("button", { name: /save button/i }).click();
  await page.getByRole("button", { name: /exit edit deck/i }).click();

  await page.getByRole("button", { name: /slot 6: brb/i }).click();

  await expect.poll(() => readObsCalls(page)).toEqual([
    { type: "setCurrentProgramScene", sceneName: "BRB" },
  ]);
});
