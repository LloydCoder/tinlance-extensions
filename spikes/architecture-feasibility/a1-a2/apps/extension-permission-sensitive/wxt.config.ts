import { defineConfig } from "wxt";

export default defineConfig({
  manifest: {
    name: "Tinlance Permission-sensitive Browser Spike",
    description: "Validates a user-initiated active-tab script capability with no persistent host access.",
    permissions: ["activeTab", "scripting"],
    commands: {
      _execute_action: {
        suggested_key: {
          default: "Ctrl+Shift+Y",
          mac: "Command+Shift+Y"
        }
      }
    },
    icons: {
      16: "icon-16.png",
      32: "icon-32.png",
      48: "icon-48.png",
    }
  }
});
