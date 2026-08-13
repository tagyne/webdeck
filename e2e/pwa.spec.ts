import { expect, test } from "@playwright/test";

test("exposes the web app manifest and install metadata", async ({ page }) => {
  await page.goto("/");

  const manifestLink = page.locator('link[rel="manifest"]');
  await expect(manifestLink).toHaveAttribute("href", /manifest\.webmanifest$/);

  const manifestUrl = await manifestLink.getAttribute("href");
  expect(manifestUrl).toBeTruthy();

  const response = await page.request.get(manifestUrl!);
  expect(response.ok()).toBe(true);

  const manifest = await response.json();

  expect(manifest.name).toBe("Webdeck OBS Controller");
  expect(manifest.short_name).toBe("Webdeck");
  expect(manifest.display).toBe("standalone");
  expect(manifest.theme_color).toBe("#111827");
  expect(manifest.background_color).toBe("#f4efe6");
  expect(manifest.start_url).toBe("/");
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        src: "/icons/webdeck-icon.svg",
        purpose: "any",
      }),
      expect.objectContaining({
        src: "/icons/webdeck-maskable.svg",
        purpose: "maskable",
      }),
    ]),
  );
});
