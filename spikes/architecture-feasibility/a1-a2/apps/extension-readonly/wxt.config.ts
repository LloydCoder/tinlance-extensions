import { defineConfig } from "wxt";

export default defineConfig({
  manifest: {
    name: "Tinlance Read-only Browser Spike",
    description: "Validates a narrow, user-initiated active-tab read capability.",
    permissions: ["activeTab"],
    icons: {
      16: "icon-16.png",
      32: "icon-32.png",
      48: "icon-48.png",
    }
  }
});
