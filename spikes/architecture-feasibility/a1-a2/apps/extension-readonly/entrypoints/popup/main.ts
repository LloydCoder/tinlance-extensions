import { browser } from "wxt/browser";

const output = document.querySelector<HTMLOutputElement>("#tab");

async function showActiveTab(): Promise<void> {
  if (!output) return;
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  output.value = tab?.title ?? "No active tab title is available.";
}

void showActiveTab();
