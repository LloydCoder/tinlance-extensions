import { browser } from "wxt/browser";

const button = document.querySelector<HTMLButtonElement>("#inspect");
const output = document.querySelector<HTMLOutputElement>("#result");

browser.runtime.onMessage.addListener((message) => {
  if (message?.type !== "tinlance:active-tab-result" || !output) return;
  output.value = message.error
    ? `Inspection failed: ${message.error}`
    : message.result
      ? `${message.result.title} — ${message.result.origin}`
      : "No page metadata was returned.";
});

button?.addEventListener("click", async () => {
  if (!output) return;
  output.value = "Reading the active tab…";

  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (typeof tab?.id !== "number") {
      throw new Error("No active tab is available.");
    }

    const [result] = await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => ({ title: document.title, origin: location.origin })
    });

    output.value = result?.result
      ? `${result.result.title} — ${result.result.origin}`
      : "No page metadata was returned.";
  } catch (error) {
    output.value = error instanceof Error ? error.message : "Tab inspection failed.";
  }
});
