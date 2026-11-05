import { defineConfig } from "wxt";

export default defineConfig({
  manifest: {
    name: "Tinlance Read-only Browser Spike",
    description: "Validates a narrow, user-initiated active-tab read capability.",
    permissions: ["activeTab"]
  }
});
