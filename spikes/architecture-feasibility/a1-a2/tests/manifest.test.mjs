import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const root = new URL("../", import.meta.url).pathname;
const targets = [
  { name: "chrome-mv3", manifestVersion: 3 },
  { name: "firefox-mv3", manifestVersion: 3 }
];
const cases = [
  { name: "read-only", directory: "extension-readonly", expected: ["activeTab"] },
  {
    name: "permission-sensitive",
    directory: "extension-permission-sensitive",
    expected: ["activeTab", "scripting"]
  }
];
const officialIconSizes = ["16", "32", "48"];

async function assertOfficialIcons(manifest, directory, target) {
  assert.deepEqual(Object.keys(manifest.icons).sort(), officialIconSizes);
  for (const size of officialIconSizes) {
    const filename = `icon-${size}.png`;
    const official = await readFile(join(root, "..", "..", "..", "assets", "brand", "tinlance-extensions", "png", filename));
    const built = await readFile(join(root, "apps", directory, ".output", target, filename));
    assert.deepEqual(built, official, `${directory}/${target} must package the original ${filename}`);
  }
}

for (const target of targets) {
  for (const item of cases) {
    test(`${item.name} ${target.name} manifest keeps least privilege and official branding`, async () => {
      const manifestPath = join(root, "apps", item.directory, ".output", target.name, "manifest.json");
      const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

      assert.equal(manifest.manifest_version, target.manifestVersion);
      assert.deepEqual([...manifest.permissions].sort(), [...item.expected].sort());
      if (item.name === "permission-sensitive") {
        assert.equal(manifest.commands?.["inspect-active-tab"]?.suggested_key?.default, "Alt+Shift+Y");
      }
      assert.equal(manifest.host_permissions, undefined);
      assert.equal(manifest.optional_host_permissions, undefined);
      assert.equal(manifest.content_scripts, undefined);
      await assertOfficialIcons(manifest, item.directory, target.name);

      for (const forbidden of ["cookies", "history", "webRequest", "debugger", "management"]) {
        assert.equal(manifest.permissions.includes(forbidden), false, `unexpected ${forbidden} permission`);
      }
    });
  }
}

test("read-only Safari MV2 manifest keeps least privilege and original icon exports", async () => {
  const manifestPath = join(root, "apps", "extension-readonly", ".output", "safari-mv2", "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  assert.equal(manifest.manifest_version, 2);
  assert.deepEqual([...manifest.permissions].sort(), ["activeTab"]);
  assert.equal(manifest.host_permissions, undefined);
  assert.equal(manifest.content_scripts, undefined);
  await assertOfficialIcons(manifest, "extension-readonly", "safari-mv2");
});
