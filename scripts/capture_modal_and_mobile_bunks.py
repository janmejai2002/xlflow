import asyncio
import os
import sys
from playwright.async_api import async_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

OUTPUT_DIR = r"C:\Users\Janmejai\.gemini\antigravity\brain\d4b7d446-2587-4560-b02a-b65041f31c2e"
TARGET_URL = "http://localhost:4173/"

async def capture():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        # 1. Open AttendanceLogModal on Desktop
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()
        await page.goto(TARGET_URL, wait_until="networkidle")
        await page.wait_for_timeout(1000)

        demo_btn = page.locator("button:has-text('Enter Student Command Centre')")
        if await demo_btn.is_visible():
            await demo_btn.click()
            await page.wait_for_timeout(1000)

        # Go to Sector 03 (Bunk-O-Meter)
        await page.keyboard.press("3")
        await page.wait_for_timeout(600)

        # Click "Reconcile & Audit"
        recon_btn = page.locator("button:has-text('Reconcile & Audit')")
        if await recon_btn.is_visible():
            await recon_btn.click()
            await page.wait_for_timeout(1000)
            modal_shot = os.path.join(OUTPUT_DIR, "verified_attendance_log_modal.png")
            await page.screenshot(path=modal_shot)
            print(f"Captured: {modal_shot}")

        await context.close()

        # 2. Mobile Bunk-O-Meter View
        m_context = await browser.new_context(
            viewport={"width": 393, "height": 852},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
        )
        m_page = await m_context.new_page()
        await m_page.goto(TARGET_URL, wait_until="networkidle")
        await m_page.wait_for_timeout(1000)

        m_demo = m_page.locator("button:has-text('Enter Student Command Centre')")
        if await m_demo.is_visible():
            await m_demo.click()
            await m_page.wait_for_timeout(1000)

        # Click "Bunks" in bottom nav
        bunk_nav = m_page.locator("button:has-text('Bunks')")
        if await bunk_nav.is_visible():
            await bunk_nav.click()
            await m_page.wait_for_timeout(1000)
            m_shot = os.path.join(OUTPUT_DIR, "verified_mobile_bunkmeter_view.png")
            await m_page.screenshot(path=m_shot)
            print(f"Captured: {m_shot}")

        await m_context.close()
        await browser.close()

if __name__ == "__main__":
    asyncio.run(capture())
