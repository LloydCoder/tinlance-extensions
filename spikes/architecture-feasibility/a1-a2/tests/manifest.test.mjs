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

for (const target of targets) {
  for (const item of cases) {
    test(`${item.name} ${target.name} manifest keeps least privilege`, async () => {
      const manifestPath = join(
        root,
        "apps",
        item.directory,
        ".output",
        target,
        "manifest.json"
      );
      const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

      assert.equal(manifest.manifest_version, target.manifestVersion);
      assert.deepEqual([...manifest.permissions].sort(), [...item.expected].sort());
      assert.equal(manifest.host_permissions, undefined);
      assert.equal(manifest.optional_host_permissions, undefined);
      assert.equal(manifest.content_scripts, undefined);

      for (const forbidden of ["cookies", "history", "webRequest", "debugger", "management"]) {
        assert.equal(
          manifest.permissions.includes(forbidden),
          false,
          `unexpected ${forbidden} permission`
        );
      }
    });
  }
}

test("read-only Safari MV2 manifest keeps least privilege", async () => {
  const manifestPath = join(
    root,
    "apps",
    "extension-readonly",
    ".output",
    "safari-mv2",
    "manifest.json"
  );
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  assert.equal(manifest.manifest_version, 2);
  assert.deepEqual([...manifest.permissions].sort(), ["activeTab"]);
  assert.equal(manifest.host_permissions, undefined);
  assert.equal(manifest.content_scripts, undefined);
});
