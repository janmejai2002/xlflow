import asyncio
import os
import sys
from playwright.async_api import async_playwright

OUTPUT_DIR = r"C:\Users\Janmejai\.gemini\antigravity\brain\d4b7d446-2587-4560-b02a-b65041f31c2e"
TARGET_URL = "http://localhost:4173/"

async def capture_timetable():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()
        await page.goto(TARGET_URL, wait_until="networkidle")
        await page.wait_for_timeout(1000)

        demo_btn = page.locator("button:has-text('Enter Student Command Centre')")
        if await demo_btn.is_visible():
            await demo_btn.click()
            await page.wait_for_timeout(1000)

        # Switch to Sector 02 (Timetable)
        await page.keyboard.press("2")
        await page.wait_for_timeout(1000)

        tt_shot = os.path.join(OUTPUT_DIR, "verified_desktop_sector02_timetable_attendance.png")
        await page.screenshot(path=tt_shot)
        print(f"Captured: {tt_shot}")

        # Also capture on mobile Timetable
        m_context = await browser.new_context(viewport={"width": 393, "height": 852})
        m_page = await m_context.new_page()
        await m_page.goto(TARGET_URL, wait_until="networkidle")
        await m_page.wait_for_timeout(1000)

        m_demo = m_page.locator("button:has-text('Enter Student Command Centre')")
        if await m_demo.is_visible():
            await m_demo.click()
            await m_page.wait_for_timeout(1000)

        # Click Classes tab
        classes_nav = m_page.locator("button:has-text('Classes')")
        if await classes_nav.is_visible():
            await classes_nav.click()
            await m_page.wait_for_timeout(1000)
            m_tt_shot = os.path.join(OUTPUT_DIR, "verified_mobile_timetable_attendance.png")
            await m_page.screenshot(path=m_tt_shot)
            print(f"Captured: {m_tt_shot}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(capture_timetable())
