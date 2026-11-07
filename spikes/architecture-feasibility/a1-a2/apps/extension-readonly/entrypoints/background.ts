import { browser } from "wxt/browser";

const workerInstanceId = crypto.randomUUID();

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (
      typeof message !== "object" ||
      message === null ||
      !("type" in message) ||
      message.type !== "tinlance:a2-lifecycle-probe"
    ) {
      return false;
    }

    sendResponse({
      ok: true,
      workerInstanceId
    });
    return false;
  });
});
