#!/usr/bin/env python3
"""Exercise Opera MV3 activeTab with Opera's vendor WebDriver and a real keypress."""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

FIXTURE_TITLE = "Tinlance A2 Opera activeTab Permission Fixture"
SHORTCUT = "Alt+Shift+Y"
EXTENSION_NAME = "Tinlance Permission-sensitive Browser Spike"


class FixtureHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler API
        body = (
            "<!doctype html><html><head><title>"
            + FIXTURE_TITLE
            + "</title></head><body><main>Local Opera permission fixture</main></body></html>"
        ).encode()
        self.send_response(200)
        self.send_header("content-type", "text/html; charset=utf-8")
        self.send_header("content-length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, _format: str, *_args: object) -> None:
        return


def main() -> int:
    extension_path = Path(os.environ["EXTENSION_PATH"]).resolve()
    opera_binary = os.environ.get("OPERA_BINARY", "/usr/bin/opera")
    operadriver = os.environ.get("OPERADRIVER_BINARY")
    if not extension_path.is_dir():
        raise FileNotFoundError(extension_path)
    if not Path(opera_binary).is_file():
        raise AssertionError(f"Opera binary not found: {opera_binary}")
    if not operadriver or not Path(operadriver).is_file():
        raise AssertionError("OPERADRIVER_BINARY must point to the pinned OperaDriver executable")
    if not shutil.which("xdotool"):
        raise AssertionError("xdotool must be installed for real keyboard invocation")

    server = ThreadingHTTPServer(("127.0.0.1", 0), FixtureHandler)
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()
    origin = f"http://127.0.0.1:{server.server_port}"

    service = Service(executable_path=operadriver)
    driver = None
    try:
        options = webdriver.ChromeOptions()
        options.binary_location = opera_binary
        options.add_experimental_option("w3c", True)
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument(f"--disable-extensions-except={extension_path}")
        options.add_argument(f"--load-extension={extension_path}")

        service.start()
        driver = webdriver.Remote(command_executor=service.service_url, options=options)
        driver.set_window_size(1280, 900)

        driver.get("chrome://extensions-internals/")
        body = WebDriverWait(driver, 10).until(
            lambda browser: browser.find_element(By.TAG_NAME, "body").text
        )
        records = json.loads(body)
        matching = [record for record in records if record.get("name") == EXTENSION_NAME]
        if len(matching) != 1:
            raise AssertionError(
                f"Opera must expose exactly one loaded permission-sensitive extension; found {len(matching)}"
            )
        extension_id = matching[0]["id"]
        popup_handle = driver.current_window_handle

        driver.get(f"chrome-extension://{extension_id}/popup.html")
        manifest = driver.execute_script("return chrome.runtime.getManifest()")
        if manifest.get("manifest_version") != 3:
            raise AssertionError(f"Unexpected Opera manifest version: {manifest!r}")
        if sorted(manifest.get("permissions", [])) != ["activeTab", "scripting"]:
            raise AssertionError(f"Unexpected Opera permission set: {manifest.get('permissions')!r}")
        commands = driver.execute_async_script(
            "const done = arguments[arguments.length - 1]; "
            "chrome.commands.getAll().then(done).catch(error => done({error: String(error)}));"
        )
        command = next(
            (item for item in commands if item.get("name") == "inspect-active-tab"),
            None,
        )
        if not command or command.get("shortcut") != SHORTCUT:
            raise AssertionError(f"Opera did not register the expected shortcut: {command!r}")

        fixture_handle = driver.switch_to.new_window("tab")
        driver.get(origin)
        if driver.title != FIXTURE_TITLE:
            raise AssertionError(f"Unexpected Opera fixture title: {driver.title!r}")

        windows = subprocess.run(
            ["xdotool", "search", "--onlyvisible", "--name", FIXTURE_TITLE],
            check=True,
            capture_output=True,
            text=True,
        ).stdout.splitlines()
        if not windows:
            raise AssertionError("Could not locate the headed Opera fixture window")
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
            raise AssertionError(f"Opera fixture did not receive keyboard focus: {focused!r}")
        subprocess.run(
            ["xdotool", "key", "--clearmodifiers", "--delay", "100", "alt+shift+y"],
            check=True,
        )

        driver.switch_to.window(popup_handle)

        def received_result(browser: webdriver.Remote) -> str | bool:
            output = browser.find_element(By.ID, "result")
            value = output.get_attribute("value") or output.text
            return value if FIXTURE_TITLE in value and origin in value else False

        result = WebDriverWait(driver, 12).until(received_result)
        if FIXTURE_TITLE not in result or origin not in result:
            raise AssertionError(f"Opera returned unexpected inspection data: {result!r}")

        print(
            json.dumps(
                {
                    "case": "opera-mv3-activeTab-keyboard-shortcut",
                    "browser_version": driver.capabilities.get("browserVersion"),
                    "operadriver_version": subprocess.run(
                        [operadriver, "--version"],
                        check=True,
                        capture_output=True,
                        text=True,
                    ).stdout.strip(),
                    "extension_id": extension_id,
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
        service.stop()
        server.shutdown()
        server.server_close()
        server_thread.join(timeout=2)


if __name__ == "__main__":
    raise SystemExit(main())
