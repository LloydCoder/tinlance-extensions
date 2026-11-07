const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { createServer } = require("node:http");
const { chromium } = require("playwright");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const extensionPath = path.join(root, "apps", "extension-permission-sensitive", ".output", "chrome-mv3");
const extensionName = "Tinlance Permission-sensitive Browser Spike";
const fixtureTitle = "Tinlance A2 ActiveTab Permission Fixture";
const commandName = "inspect-active-tab";
const shortcut = "Alt+Shift+Y";

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

  let context;
  try {
    context = await chromium.launchPersistentContext("", {
      headless: false,
      viewport: { width: 900, height: 700 },
      args: [
        "--no-sandbox",
        "--disable-dev-shm-usage",
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`
      ]
    });

    const extensionId = await discoverExtensionId(context);
    const extensionPage = await context.newPage();
    await extensionPage.goto(`chrome-extension://${extensionId}/popup.html`);
    const commands = await extensionPage.evaluate(() => chrome.commands.getAll());
    const actionCommand = commands.find((command) => command.name === commandName);
    assert.equal(actionCommand?.shortcut, shortcut, "the explicit inspection command must be registered");

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

    execFileSync("xdotool", ["windowactivate", "--sync", windowIds[0]]);
    execFileSync("xdotool", ["windowraise", windowIds[0]]);
    execFileSync("xdotool", ["windowfocus", "--sync", windowIds[0]]);
    const focusedWindow = execFileSync("xdotool", ["getwindowfocus", "getwindowname"], { encoding: "utf8" }).trim();
    console.log(JSON.stringify({ commandName, shortcut, windowId: windowIds[0], focusedWindow }));
    execFileSync("xdotool", ["key", "--clearmodifiers", "--delay", "100", "alt+shift+y"]);

    await extensionPage.waitForFunction(
      ({ expectedTitle, expectedOrigin }) => {
        const output = document.querySelector("#result");
        const value = output?.value || output?.textContent || "";
        return value.includes(expectedTitle) && value.includes(expectedOrigin);
      },
      { expectedTitle: fixtureTitle, expectedOrigin: origin },
      { timeout: 10000 }
    );

    const result = await extensionPage.locator("#result").evaluate((output) => output.value || output.textContent);
    assert.ok(result.includes(fixtureTitle));
    assert.ok(result.includes(origin));

    console.log(JSON.stringify({
      case: "chromium-activeTab-user-command",
      extensionId,
      commandName,
      shortcut,
      origin,
      result,
      activeTabGrantedByCommand: true
    }));
  } finally {
    if (context) await context.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
