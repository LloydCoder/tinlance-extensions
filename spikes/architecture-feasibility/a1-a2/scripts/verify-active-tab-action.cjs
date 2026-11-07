const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { createServer } = require("node:http");
const { chromium } = require("playwright");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const extensionPath = path.join(root, "apps", "extension-permission-sensitive", ".output", "chrome-mv3");
const extensionName = "Tinlance Permission-sensitive Browser Spike";
const fixtureTitle = "Tinlance A2 ActiveTab Permission Fixture";
const shortcut = "Ctrl+Shift+Y";

async function discoverExtensionId(context) {
  const diagnostics = await context.newPage();
  await diagnostics.goto("chrome://extensions-internals/");
  await diagnostics.waitForLoadState("domcontentloaded");
  await diagnostics.waitForTimeout(300);
  const records = JSON.parse(await diagnostics.locator("body").innerText());
  const matching = records.filter((record) => record.name === extensionName);
  await diagnostics.close();
  assert.equal(matching.length, 1, "expected exactly one loaded permission-sensitive extension");
  assert.match(matching[0].id, /^[a-p]{32}$/);
  return matching[0].id;
}

async function waitForActionPopup(context, extensionId, timeoutMs = 10000) {
  const expectedUrl = `chrome-extension://${extensionId}/popup.html`;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const popup = context.pages().find((page) => page.url() === expectedUrl);
    if (popup) return popup;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`The action shortcut did not open ${expectedUrl}`);
}

(async () => {
  const server = createServer((_request, response) => {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(`<!doctype html><html><head><title>${fixtureTitle}</title></head><body><main>Local activeTab fixture</main></body></html>`);
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  assert.ok(address && typeof address === "object");
  const origin = `http://127.0.0.1:${address.port}`;

  const context = await chromium.launchPersistentContext("", {
    headless: false,
    viewport: { width: 900, height: 700 },
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ]
  });

  try {
    const extensionId = await discoverExtensionId(context);
    const extensionPage = await context.newPage();
    await extensionPage.goto(`chrome-extension://${extensionId}/popup.html`);
    const commands = await extensionPage.evaluate(() => chrome.commands.getAll());
    const actionCommand = commands.find((command) => command.name === "_execute_action");
    assert.equal(actionCommand?.shortcut, shortcut, "the action must have the test keyboard shortcut");
    await extensionPage.close();

    const page = await context.newPage();
    await page.goto(origin);
    await page.bringToFront();

    const windowIds = execFileSync("xdotool", [
      "search",
      "--onlyvisible",
      "--name",
      fixtureTitle
    ], { encoding: "utf8" }).trim().split("\n").filter(Boolean);
    assert.ok(windowIds.length > 0, "the headed Chromium fixture window must be discoverable through X11");

    execFileSync("xdotool", ["windowfocus", "--sync", windowIds[0]]);
    execFileSync("xdotool", ["key", "--clearmodifiers", "ctrl+shift+y"]);

    const popup = await waitForActionPopup(context, extensionId);
    await popup.locator("#inspect").click();
    await popup.waitForFunction(
      ({ expectedTitle, expectedOrigin }) => {
        const output = document.querySelector("#result");
        const value = output?.value || output?.textContent || "";
        return value.includes(expectedTitle) && value.includes(expectedOrigin);
      },
      { expectedTitle: fixtureTitle, expectedOrigin: origin },
      { timeout: 10000 }
    );

    const result = await popup.locator("#result").evaluate((output) => output.value || output.textContent);
    assert.ok(result.includes(fixtureTitle));
    assert.ok(result.includes(origin));

    console.log(JSON.stringify({
      case: "chromium-activeTab-user-action",
      extensionId,
      shortcut,
      origin,
      result,
      activeTabGrantedByAction: true
    }));
  } finally {
    await context.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
