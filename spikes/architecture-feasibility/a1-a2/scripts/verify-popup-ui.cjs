const { chromium } = require("playwright");
const fs = require("node:fs/promises");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const cases = [
  { directory: "extension-readonly", target: "chrome-mv3", label: "read-only", name: "Tinlance Read-only Browser Spike" },
  { directory: "extension-permission-sensitive", target: "chrome-mv3", label: "permission-sensitive", name: "Tinlance Permission-sensitive Browser Spike" }
];

async function discoverExtensionId(context, expectedName) {
  // A popup-only extension has no background service worker. Discover its ID
  // from Chromium's own extensions diagnostics page instead of waiting for a
  // service worker that the manifest intentionally does not declare.
  const diagnostics = await context.newPage();
  await diagnostics.goto("chrome://extensions-internals/");
  await diagnostics.waitForLoadState("domcontentloaded");
  await diagnostics.waitForTimeout(500);
  const body = await diagnostics.locator("body").innerText();
  let records;
  try {
    records = JSON.parse(body);
  } catch (error) {
    throw new Error(`Chromium extensions diagnostics did not return JSON: ${String(error)}`);
  }
  const matching = records.filter((record) => record.name === expectedName);
  const ids = matching.map((record) => record.id).filter((id) => typeof id === "string");
  await diagnostics.close();
  if (ids.length !== 1) {
    throw new Error(`Expected one loaded unpacked extension ID in chrome://extensions-internals/, found ${ids.length} for manifest name "${expectedName}"`);
  }
  return ids[0];
}

(async () => {
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
      const extensionId = await discoverExtensionId(context, item.name);
      const page = await context.newPage();
      await page.goto(`chrome-extension://${extensionId}/popup.html`);
      await page.locator("header.brand").waitFor({ state: "visible" });
      await page.getByRole("heading", { name: "Extensions" }).waitFor({ state: "visible" });
      const mark = page.locator("img.brand__mark");
      await mark.waitFor({ state: "visible" });
      const imageState = await mark.evaluate((img) => ({
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight
      }));
      if (!imageState.complete || imageState.naturalWidth !== 32 || imageState.naturalHeight !== 32) {
        throw new Error(`Official 32px mark did not render: ${JSON.stringify(imageState)}`);
      }
      const colors = await page.evaluate(() => ({
        background: getComputedStyle(document.body).backgroundColor,
        foreground: getComputedStyle(document.body).color,
        accent: getComputedStyle(document.querySelector(".brand__eyebrow")).color
      }));
      if (
        colors.background !== "rgb(10, 12, 11)" ||
        colors.foreground !== "rgb(244, 244, 240)" ||
        colors.accent !== "rgb(198, 255, 74)"
      ) {
        throw new Error(`Brand token mismatch: ${JSON.stringify(colors)}`);
      }
      console.log(JSON.stringify({
        case: item.label,
        extensionId,
        imageState,
        colors
      }));
    } finally {
      await context.close();
    }
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
