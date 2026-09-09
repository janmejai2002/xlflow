import asyncio
import os
import sys
from playwright.async_api import async_playwright

OUTPUT_DIR = r"C:\Users\Janmejai\.gemini\antigravity\brain\d4b7d446-2587-4560-b02a-b65041f31c2e"
BASE_URL = "http://localhost:4173"

async def test_more_menu():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 360, "height": 740},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True
        )
        page = await context.new_page()
        await page.add_init_script("localStorage.setItem('has_seen_onboarding_v1', 'true');")
        await page.goto(BASE_URL, wait_until="networkidle")
        await asyncio.sleep(1)

        more_btn = page.locator("button[aria-label='More actions']")
        if await more_btn.count() > 0:
            await more_btn.first.click()
            await asyncio.sleep(0.5)

        img_path = os.path.join(OUTPUT_DIR, "audit_mobile_more_menu_open.png")
        await page.screenshot(path=img_path)
        print(f"Saved: {img_path}")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_more_menu())
