import { defineConfig } from "wxt";

export default defineConfig({
  manifest: {
    name: "Tinlance Permission-sensitive Browser Spike",
    description: "Validates a user-initiated active-tab script capability with no persistent host access.",
    permissions: ["activeTab", "scripting"]
  }
});
