import { browser } from "wxt/browser";

export default defineBackground(() => {
  browser.commands.onCommand.addListener(async (command) => {
    if (command !== "inspect-active-tab") return;

    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (typeof tab?.id !== "number") {
        throw new Error("No active tab is available.");
      }

      const [result] = await browser.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => ({ title: document.title, origin: location.origin })
      });

      await browser.runtime.sendMessage({
        type: "tinlance:active-tab-result",
        result: result?.result ?? null
      });
    } catch (error) {
      await browser.runtime.sendMessage({
        type: "tinlance:active-tab-result",
        error: error instanceof Error ? error.message : "Active-tab inspection failed."
      });
    }
  });
});
