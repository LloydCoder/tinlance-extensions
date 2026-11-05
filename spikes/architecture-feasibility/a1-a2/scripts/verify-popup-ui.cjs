const { chromium } = require("playwright");
const fs = require("node:fs/promises");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "artifacts", "brand-ui");
const cases = [
  { directory: "extension-readonly", target: "chrome-mv3", label: "read-only" },
  { directory: "extension-permission-sensitive", target: "chrome-mv3", label: "permission-sensitive" }
];

(async () => {
  await fs.mkdir(output, { recursive: true });
  for (const item of cases) {
    const extensionPath = path.join(root, "apps", item.directory, ".output", item.target);
    const context = await chromium.launchPersistentContext("", {
      headless: false,
      viewport: { width: 420, height: 560 },
      args: [
        "--no-sandbox",
        "--disable-dev-shm-usage",
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`
      ]
    });
    try {
      const workers = context.serviceWorkers();
      const worker = workers[0] || await context.waitForEvent("serviceworker", { timeout: 20000 });
      const extensionId = new URL(worker.url()).host;
      const page = await context.newPage();
      await page.goto(`chrome-extension://${extensionId}/popup.html`);
      await page.locator("header.brand").waitFor({ state: "visible" });
      await page.getByRole("heading", { name: "Extensions" }).waitFor({ state: "visible" });
      const mark = page.locator("img.brand__mark");
      await mark.waitFor({ state: "visible" });
      const imageState = await mark.evaluate((img) => ({ complete: img.complete, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight }));
      if (!imageState.complete || imageState.naturalWidth !== 32 || imageState.naturalHeight !== 32) {
        throw new Error(`Official 32px mark did not render: ${JSON.stringify(imageState)}`);
      }
      const colors = await page.evaluate(() => ({
        background: getComputedStyle(document.body).backgroundColor,
        foreground: getComputedStyle(document.body).color,
        accent: getComputedStyle(document.querySelector(".brand__eyebrow")).color
      }));
      if (colors.background !== "rgb(10, 12, 11)" || colors.foreground !== "rgb(244, 244, 240)" || colors.accent !== "rgb(198, 255, 74)") {
        throw new Error(`Brand token mismatch: ${JSON.stringify(colors)}`);
      }
      await page.screenshot({ path: path.join(output, `${item.label}.png`), fullPage: true });
      console.log(JSON.stringify({ case: item.label, extensionId, imageState, colors, screenshot: `${item.label}.png` }));
    } finally {
      await context.close();
    }
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
