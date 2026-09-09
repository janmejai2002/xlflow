import asyncio
import os
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\Janmejai\.gemini\antigravity\brain\d4b7d446-2587-4560-b02a-b65041f31c2e"

async def debug_desktop():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1440, "height": 900})

        page.on("console", lambda msg: print(f"[CONSOLE {msg.type}]: {msg.text}"))
        page.on("pageerror", lambda err: print(f"[PAGE ERROR]: {err}"))

        await page.goto("http://localhost:4173/")
        await page.wait_for_timeout(2000)

        # Take screenshot of whatever is rendered
        shot_path = os.path.join(ARTIFACT_DIR, "debug_desktop_current_state.png")
        await page.screenshot(path=shot_path)
        print(f"[+] Saved debug screenshot to {shot_path}")

        # Check body inner text length
        body_text = await page.inner_text("body")
        print(f"[+] Body text preview (first 300 chars):\n{body_text[:300]}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(debug_desktop())
