#!/usr/bin/env python3
"""Exercise Firefox MV3 activeTab through a real user-invoked keyboard shortcut."""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.support.ui import WebDriverWait

FIXTURE_TITLE = "Tinlance A2 Firefox activeTab Permission Fixture"
SHORTCUT = "alt+shift+y"


class FixtureHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler API
        body = (
            "<!doctype html><html><head><title>"
            + FIXTURE_TITLE
            + "</title></head><body><main>Local Firefox permission fixture</main></body></html>"
        ).encode()
        self.send_response(200)
        self.send_header("content-type", "text/html; charset=utf-8")
        self.send_header("content-length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, _format: str, *_args: object) -> None:
        return


def extension_uuid(profile: Path, addon_id: str) -> str:
    prefs_path = profile / "prefs.js"
    deadline = time.monotonic() + 10
    pattern = re.compile(
        r'user_pref\("extensions\.webextensions\.uuids",\s*("(?:\\.|[^"\\])*")\);'
    )
    while time.monotonic() < deadline:
        if prefs_path.exists():
            for line in prefs_path.read_text(encoding="utf-8", errors="replace").splitlines():
                match = pattern.search(line)
                if not match:
                    continue
                mapping = json.loads(json.loads(match.group(1)))
                value = mapping.get(addon_id)
                if value:
                    return value
        time.sleep(0.2)
    raise AssertionError(
        f"Firefox did not persist an extension UUID for temporary add-on {addon_id!r}"
    )


def focus_fixture_window() -> None:
    search = subprocess.run(
        ["xdotool", "search", "--onlyvisible", "--name", FIXTURE_TITLE],
        check=True,
        capture_output=True,
        text=True,
    )
    windows = [value for value in search.stdout.splitlines() if value.strip()]
    if not windows:
        raise AssertionError("Could not locate the headed Firefox fixture window")
    window_id = windows[0]
    subprocess.run(["xdotool", "windowactivate", "--sync", window_id], check=True)
    subprocess.run(["xdotool", "windowraise", window_id], check=True)
    subprocess.run(["xdotool", "windowfocus", "--sync", window_id], check=True)
    focused = subprocess.run(
        ["xdotool", "getwindowfocus", "getwindowname"],
        check=True,
        capture_output=True,
        text=True,
    ).stdout.strip()
    if FIXTURE_TITLE not in focused:
        raise AssertionError(f"Firefox fixture did not receive keyboard focus: {focused!r}")
    subprocess.run(
        ["xdotool", "key", "--clearmodifiers", "--delay", "100", SHORTCUT],
        check=True,
    )


def main() -> int:
    if len(sys.argv) != 2:
        raise SystemExit("usage: verify-firefox-active-tab-action.py <extension.xpi>")
    xpi = Path(sys.argv[1]).resolve()
    if not xpi.is_file():
        raise FileNotFoundError(xpi)

    firefox_binary = os.environ.get("FIREFOX_BINARY")
    if not firefox_binary or not Path(firefox_binary).is_file():
        raise AssertionError("FIREFOX_BINARY must point to the installed Firefox executable")
    geckodriver = shutil.which("geckodriver")
    if not geckodriver:
        raise AssertionError("geckodriver must be installed and available on PATH")

    server = ThreadingHTTPServer(("127.0.0.1", 0), FixtureHandler)
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()
    origin = f"http://127.0.0.1:{server.server_port}"

    driver = None
    try:
        options = Options()
        options.binary_location = firefox_binary
        options.set_preference("browser.shell.checkDefaultBrowser", False)
        options.set_preference("browser.startup.page", 0)
        options.set_preference("browser.startup.homepage", "about:blank")
        service = Service(executable_path=geckodriver)
        driver = webdriver.Firefox(options=options, service=service)
        driver.set_window_size(1280, 900)

        extension = driver.install_web_extension(str(xpi), permanent=False)
        addon_id = extension.id
        profile = Path(driver.capabilities["moz:profile"])
        addon_uuid = extension_uuid(profile, addon_id)
        popup_url = f"moz-extension://{addon_uuid}/popup.html"
        # Firefox/geckodriver blocks direct WebDriver and address-bar navigation
        # to moz-extension:// pages. Open the test tab through Firefox chrome
        # with an explicit system triggering principal, then return to content
        # context for normal WebDriver assertions. This does not grant activeTab:
        # the permission-sensitive action is still invoked later via real X11
        # keyboard input while the loopback fixture tab is focused.
        existing_handles = set(driver.window_handles)
        with driver.context(driver.CONTEXT_CHROME):
            driver.execute_script(
                """
                gBrowser.selectedTab = gBrowser.addTab(arguments[0], {
                    triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
                });
                """,
                popup_url,
            )
        WebDriverWait(driver, 10).until(
            lambda browser: len(set(browser.window_handles) - existing_handles) == 1
        )
        popup_handle = next(iter(set(driver.window_handles) - existing_handles))
        driver.switch_to.window(popup_handle)
        WebDriverWait(driver, 10).until(
            lambda browser: browser.execute_script("return document.readyState") == "complete"
            and browser.current_url == popup_url
        )

        command = driver.execute_async_script(
            "const done = arguments[arguments.length - 1]; "
            "browser.commands.getAll().then(items => "
            "done(items.find(item => item.name === 'inspect-active-tab') || null))"
            ".catch(error => done({ error: String(error) }));"
        )
        if not command or command.get("shortcut") != "Alt+Shift+Y":
            raise AssertionError(f"Firefox did not register the expected shortcut: {command!r}")

        fixture_handle = driver.switch_to.new_window("tab")
        driver.get(origin)
        if driver.title != FIXTURE_TITLE:
            raise AssertionError(f"Unexpected local fixture title: {driver.title!r}")

        focus_fixture_window()
        driver.switch_to.window(popup_handle)

        def received_result(browser: webdriver.Firefox) -> str | bool:
            output = browser.find_element("id", "result")
            value = output.get_attribute("value") or output.text
            return value if FIXTURE_TITLE in value and origin in value else False

        result = WebDriverWait(driver, 10).until(received_result)
        if FIXTURE_TITLE not in result or origin not in result:
            raise AssertionError(f"Firefox returned unexpected inspection data: {result!r}")

        print(
            json.dumps(
                {
                    "case": "firefox-mv3-activeTab-keyboard-shortcut",
                    "firefox_version": driver.capabilities.get("browserVersion"),
                    "geckodriver": subprocess.run(
                        [geckodriver, "--version"],
                        check=True,
                        capture_output=True,
                        text=True,
                    ).stdout.splitlines()[0],
                    "addon_id": addon_id,
                    "shortcut": command["shortcut"],
                    "origin": origin,
                    "result": result,
                    "activeTab_granted_by_user_action": True,
                },
                sort_keys=True,
            )
        )
        return 0
    finally:
        if driver is not None:
            driver.quit()
        server.shutdown()
        server.server_close()
        server_thread.join(timeout=2)


if __name__ == "__main__":
    raise SystemExit(main())
