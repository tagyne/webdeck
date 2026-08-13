import { expect, test } from "@playwright/test";

test("shows the starter shell", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /connect to obs/i,
    }),
  ).toBeVisible();
});
