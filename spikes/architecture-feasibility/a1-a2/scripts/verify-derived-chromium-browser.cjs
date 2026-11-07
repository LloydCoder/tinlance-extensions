const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { createServer } = require("node:http");
const { chromium } = require("playwright");
const fs = require("node:fs");

const browserName = process.env.BROWSER_NAME;
const browserBinary = process.env.BROWSER_BINARY;
const extensionPath = process.env.EXTENSION_PATH;
const fixtureTitle = "Tinlance A2 Derived Chromium Browser Fixture";
const shortcut = "Alt+Shift+Y";

assert.ok(browserName, "BROWSER_NAME must identify the browser under test");
assert.ok(browserBinary && fs.existsSync(browserBinary), "BROWSER_BINARY must point to an installed browser executable");
assert.ok(extensionPath && fs.existsSync(extensionPath), "EXTENSION_PATH must point to the built unpacked MV3 extension");

async function focusFixtureAndInvokeShortcut() {
  const ids = execFileSync("xdotool", [
    "search", "--onlyvisible", "--name", fixtureTitle
  ], { encoding: "utf8" }).trim().split("\n").filter(Boolean);
  assert.ok(ids.length > 0, browserName + ": headed fixture window must be discoverable");
  const windowId = ids[0];
  execFileSync("xdotool", ["windowactivate", "--sync", windowId]);
  execFileSync("xdotool", ["windowraise", windowId]);
  execFileSync("xdotool", ["windowfocus", "--sync", windowId]);
  const focused = execFileSync("xdotool", [
    "getwindowfocus", "getwindowname"
  ], { encoding: "utf8" }).trim();
  assert.ok(focused.includes(fixtureTitle), browserName + ": fixture did not receive keyboard focus (" + focused + ")");
  execFileSync("xdotool", ["key", "--clearmodifiers", "--delay", "100", "alt+shift+y"]);
}

(async () => {
  const server = createServer((_request, response) => {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end("<!doctype html><html><head><title>" + fixtureTitle + "</title></head><body><main>Loopback-only extension permission fixture</main></body></html>");
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  assert.ok(address && typeof address === "object");
  const origin = "http://127.0.0.1:" + address.port;
  let context;

  try {
    context = await chromium.launchPersistentContext("", {
      executablePath: browserBinary,
      headless: false,
      viewport: { width: 1100, height: 760 },
      args: [
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-extensions-except=" + extensionPath,
        "--load-extension=" + extensionPath
      ]
    });

    const worker = context.serviceWorkers()[0] ??
      await context.waitForEvent("serviceworker", { timeout: 15000 });
    const extensionId = new URL(worker.url()).host;
    assert.match(extensionId, /^[a-p]{32}$/, browserName + ": browser must expose the extension service worker");

    const popup = await context.newPage();
    await popup.goto("chrome-extension://" + extensionId + "/popup.html");
    await popup.getByRole("heading", { name: "Extensions" }).waitFor({ state: "visible" });

    const manifest = await popup.evaluate(() => chrome.runtime.getManifest());
    assert.equal(manifest.manifest_version, 3);
    assert.deepEqual([...manifest.permissions].sort(), ["activeTab", "scripting"]);
    const commands = await popup.evaluate(() => chrome.commands.getAll());
    const command = commands.find((item) => item.name === "inspect-active-tab");
    assert.equal(command?.shortcut, shortcut, browserName + ": expected the user-invoked keyboard shortcut");

    const fixture = await context.newPage();
    await fixture.goto(origin);
    assert.equal(await fixture.title(), fixtureTitle);
    await fixture.bringToFront();
    await focusFixtureAndInvokeShortcut();

    await popup.waitForFunction(
      ({ expectedTitle, expectedOrigin }) => {
        const output = document.querySelector("#result");
        const value = output?.value || output?.textContent || "";
        return value.includes(expectedTitle) && value.includes(expectedOrigin);
      },
      { expectedTitle: fixtureTitle, expectedOrigin: origin },
      { timeout: 12000 }
    );

    const result = await popup.locator("#result").evaluate((output) => output.value || output.textContent);
    assert.ok(result.includes(fixtureTitle));
    assert.ok(result.includes(origin));

    console.log(JSON.stringify({
      case: "derived-chromium-mv3-activeTab-keyboard-runtime",
      browser: browserName,
      browserVersion: context.browser()?.version() ?? "unknown",
      extensionId,
      manifestVersion: manifest.manifest_version,
      permissions: manifest.permissions,
      shortcut: command.shortcut,
      fixtureOrigin: origin,
      result,
      activeTabGrantedByUserAction: true
    }, null, 2));
  } finally {
    if (context) await context.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
