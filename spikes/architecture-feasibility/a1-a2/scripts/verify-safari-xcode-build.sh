#!/usr/bin/env bash
set -Eeuo pipefail

project="${1:?usage: verify-safari-xcode-build.sh <project.xcodeproj> <derived-data-dir>}"
derived_data="${2:?usage: verify-safari-xcode-build.sh <project.xcodeproj> <derived-data-dir>}"
scheme="TinlanceReadOnlySpike"

xcodebuild build \
  -project "$project" \
  -scheme "$scheme" \
  -configuration Release \
  -destination "generic/platform=macOS" \
  -derivedDataPath "$derived_data" \
  CODE_SIGNING_ALLOWED=NO

app="$derived_data/Build/Products/Release/TinlanceReadOnlySpike.app"
test -d "$app"
plutil -lint "$app/Contents/Info.plist"

extension="$(find "$app/Contents/PlugIns" -maxdepth 1 -type d -name '*.appex' -print -quit)"
test -n "$extension"
plutil -lint "$extension/Contents/Info.plist"

app_bundle_id="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$app/Contents/Info.plist")"
extension_bundle_id="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$extension/Contents/Info.plist")"
case "$extension_bundle_id" in
  "$app_bundle_id".*) ;;
  *)
    echo "Safari extension bundle identifier must be prefixed by its containing app identifier." >&2
    echo "App: $app_bundle_id" >&2
    echo "Extension: $extension_bundle_id" >&2
    exit 1
    ;;
esac

extension_point="$(/usr/libexec/PlistBuddy -c 'Print :NSExtension:NSExtensionPointIdentifier' "$extension/Contents/Info.plist")"
test "$extension_point" = "com.apple.Safari.web-extension"

manifest="$(find "$extension" -type f -name manifest.json -print -quit)"
test -n "$manifest"

python3 - "$manifest" <<'PY'
import json
import sys

with open(sys.argv[1], encoding="utf-8") as stream:
    manifest = json.load(stream)

assert manifest.get("manifest_version") == 2, "Safari package must use the expected MV2 compatibility manifest"
assert manifest.get("permissions") == ["activeTab"], "Safari read-only package must request activeTab only"
assert "host_permissions" not in manifest, "Safari package must not declare persistent host permissions"
assert "content_scripts" not in manifest, "Safari package must not inject content scripts"
for forbidden in ("cookies", "history", "webRequest", "debugger", "management"):
    assert forbidden not in manifest.get("permissions", []), f"unexpected Safari permission: {forbidden}"
print(json.dumps({
    "case": "safari-xcode-app-and-extension-build",
    "app": "TinlanceReadOnlySpike.app",
    "extension_point": "com.apple.Safari.web-extension",
    "manifest_version": manifest["manifest_version"],
    "permissions": manifest["permissions"],
    "host_permissions": manifest.get("host_permissions", []),
}, sort_keys=True))
PY
