#!/usr/bin/env python3
"""Dependency-free checks for the Tinlance Extensions repository baseline."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = (
    "README.md",
    "LICENSE",
    "SECURITY.md",
    "CONTRIBUTING.md",
    "docs/SYSTEM-ARCHITECTURE.md",
    "docs/MASTER-ROADMAP.md",
    "docs/PHASE-0-1-BASELINE.md",
    "docs/adr/0001-repository-governance.md",
    "docs/adr/0002-mcp-protocol-baseline.md",
    ".github/workflows/quality.yml",
)


def fail(message: str) -> None:
    print(f"FAIL: {message}", file=sys.stderr)
    raise SystemExit(1)


def main() -> int:
    missing = [name for name in REQUIRED_FILES if not (ROOT / name).is_file()]
    if missing:
        fail("required repository files are missing: " + ", ".join(missing))

    readme = (ROOT / "README.md").read_text(encoding="utf-8")
    roadmap = (ROOT / "docs/MASTER-ROADMAP.md").read_text(encoding="utf-8")
    architecture = (ROOT / "docs/SYSTEM-ARCHITECTURE.md").read_text(encoding="utf-8")
    workflow = (ROOT / ".github/workflows/quality.yml").read_text(encoding="utf-8")

    for relative in ("docs/SYSTEM-ARCHITECTURE.md", "docs/MASTER-ROADMAP.md", "docs/PHASE-0-1-BASELINE.md", "SECURITY.md", "CONTRIBUTING.md"):
        if f"]({relative})" not in readme:
            fail(f"README is missing a project link to {relative}")

    if "Phase 0 — Repository foundation" not in roadmap:
        fail("roadmap does not define Phase 0 repository foundation")
    if "Phase 01 — Repository and baseline forensic audit" not in roadmap:
        fail("roadmap does not define Phase 01 forensic audit")
    if "MCP-03" not in roadmap or "Gate 0" not in roadmap:
        fail("MCP implementation gate is missing from the roadmap")
    if "Tinlance Agent Platform" not in architecture:
        fail("Agent Platform authority boundary is missing from architecture")

    # The workflow must be read-only and actions must be pinned to immutable SHAs.
    if "permissions:\n  contents: read" not in workflow:
        fail("workflow must declare least-privilege contents: read permissions")
    if "cache: false" in workflow:
        fail("setup-python does not accept cache: false; omit cache configuration when unused")
    if "fetch-depth: 0" not in workflow:
        fail("checkout must fetch full history for the commit-diff whitespace check")
    action_refs = re.findall(r"uses:\s*([^\s]+)", workflow)
    if not action_refs or any(not re.search(r"@[0-9a-f]{40}$", ref) for ref in action_refs):
        fail("every GitHub Action must be pinned to a full 40-character commit SHA")

    license_text = (ROOT / "LICENSE").read_text(encoding="utf-8")
    if "Apache License" not in license_text or "Version 2.0" not in license_text:
        fail("the existing Apache-2.0 license file changed unexpectedly; require an explicit legal decision")

    print(f"PASS: {len(REQUIRED_FILES)} required files present")
    print("PASS: README links, roadmap gates, architecture boundary, CI permissions, action pinning, and existing license")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
