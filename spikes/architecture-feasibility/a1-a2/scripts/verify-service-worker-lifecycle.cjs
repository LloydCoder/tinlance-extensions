const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const extensionPath = path.join(root, "apps", "extension-readonly", ".output", "chrome-mv3");
const messageType = "tinlance:a2-lifecycle-probe";

async function waitForTargetState(cdp, predicate, expected, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const { targetInfos } = await cdp.send("Target.getTargets");
    const found = targetInfos.some(predicate);
    if (found === expected) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for service-worker target to become ${expected ? "present" : "absent"}`);
}

(async () => {
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

  let cdp;
  try {
    const firstWorker = context.serviceWorkers()[0] ??
      await context.waitForEvent("serviceworker", { timeout: 10000 });
    const extensionId = new URL(firstWorker.url()).host;
    assert.match(extensionId, /^[a-p]{32}$/);

    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);

    const first = await popup.evaluate(async (type) => {
      return chrome.runtime.sendMessage({ type });
    }, messageType);
    assert.equal(first?.ok, true, "the first runtime message must reach the extension worker");
    assert.equal(typeof first.workerInstanceId, "string");

    cdp = await context.browser().newBrowserCDPSession();
    const workerTarget = (await cdp.send("Target.getTargets")).targetInfos.find((target) =>
      target.type === "service_worker" &&
      target.url.startsWith(`chrome-extension://${extensionId}/`)
    );
    assert.ok(workerTarget, "Chromium must expose the extension service-worker target");

    await cdp.send("Target.closeTarget", { targetId: workerTarget.targetId });
    await waitForTargetState(
      cdp,
      (target) => target.type === "service_worker" &&
        target.url.startsWith(`chrome-extension://${extensionId}/`),
      false
    );

    const second = await popup.evaluate(async (type) => {
      return chrome.runtime.sendMessage({ type });
    }, messageType);

    assert.equal(second?.ok, true, "a message event must wake the terminated worker");
    assert.equal(typeof second.workerInstanceId, "string");
    assert.notEqual(
      second.workerInstanceId,
      first.workerInstanceId,
      "the restarted worker must have a fresh per-instance identity"
    );

    await waitForTargetState(
      cdp,
      (target) => target.type === "service_worker" &&
        target.url.startsWith(`chrome-extension://${extensionId}/`),
      true
    );

    console.log(JSON.stringify({
      case: "chromium-mv3-service-worker-restart",
      extensionId,
      firstWorkerInstanceId: first.workerInstanceId,
      restartedWorkerInstanceId: second.workerInstanceId,
      workerRestarted: second.workerInstanceId !== first.workerInstanceId
    }));
  } finally {
    if (cdp) await cdp.detach();
    await context.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
