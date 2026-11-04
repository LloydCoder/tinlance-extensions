"""Regression tests for the repository foundation and phase closeout evidence."""

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class RepositoryBaselineTests(unittest.TestCase):
    def test_required_foundation_files_exist(self):
        required = [
            "README.md",
            "LICENSE",
            "SECURITY.md",
            "CONTRIBUTING.md",
            ".github/workflows/quality.yml",
            ".github/dependabot.yml",
            "docs/PHASE-0-1-BASELINE.md",
            "docs/adr/0001-repository-governance.md",
            "docs/adr/0002-mcp-protocol-baseline.md",
            "scripts/validate_repo.py",
        ]
        for relative in required:
            with self.subTest(path=relative):
                self.assertTrue((ROOT / relative).is_file())

    def test_phase_scope_is_explicit_and_sequential(self):
        roadmap = (ROOT / "docs/MASTER-ROADMAP.md").read_text(encoding="utf-8")
        self.assertLess(roadmap.index("Phase 0 — Repository foundation"), roadmap.index("Phase 01 — Repository and baseline forensic audit"))
        self.assertIn("Phase 0 exit", roadmap)
        self.assertIn("Phase 01 exit", roadmap)

    def test_mcp_gateway_remains_gated(self):
        roadmap = (ROOT / "docs/MASTER-ROADMAP.md").read_text(encoding="utf-8")
        self.assertIn("No production MCP gateway work begins before this gate.", roadmap)
        self.assertIn("MCP-03", roadmap)

    def test_quality_workflow_is_least_privilege_and_sha_pinned(self):
        workflow = (ROOT / ".github/workflows/quality.yml").read_text(encoding="utf-8")
        self.assertIn("contents: read", workflow)
        self.assertNotIn("contents: write", workflow)
        self.assertIn("actions/checkout@", workflow)
        self.assertIn("actions/setup-python@", workflow)
        self.assertNotIn("cache: false", workflow)
        for line in workflow.splitlines():
            if line.strip().startswith("uses:"):
                ref = line.strip().split("@", 1)[1]
                self.assertRegex(ref, r"^[0-9a-f]{40}$")

    def test_no_package_or_product_runtime_is_claimed(self):
        readme = (ROOT / "README.md").read_text(encoding="utf-8").lower()
        self.assertIn("not evidence that", readme)
        self.assertFalse((ROOT / "apps").exists())


if __name__ == "__main__":
    unittest.main()
