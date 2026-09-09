import asyncio
import os
import sys
from playwright.async_api import async_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

OUTPUT_DIR = r"C:\Users\Janmejai\.gemini\antigravity\brain\d4b7d446-2587-4560-b02a-b65041f31c2e"
BASE_URL = "http://localhost:4173"

VIEWPORTS = {
    "mobile_iphone15": {"width": 393, "height": 852},
    "tablet_ipad": {"width": 820, "height": 1180},
    "desktop_laptop": {"width": 1440, "height": 900}
}

async def verify_v1():
    print("\n--- Starting XL-Flow V1 UI & Booklet Verification ---")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        for device, vp in VIEWPORTS.items():
            print(f"\nVerifying {device} ({vp['width']}x{vp['height']})...")
            context = await browser.new_context(viewport=vp)
            page = await context.new_page()

            # Load page
            await page.goto(BASE_URL, wait_until="networkidle")
            await page.wait_for_timeout(1000)

            # Check if Onboarding Modal is visible
            onboarding = page.locator("text=Welcome to XL-Flow V1")
            if await onboarding.is_visible():
                print(f"  ✓ Detected Onboarding Modal on {device}")
                if device == "mobile_iphone15":
                    shot = os.path.join(OUTPUT_DIR, "screen_v1_onboarding.png")
                    await page.screenshot(path=shot)
                    print(f"  ✓ Saved Onboarding Screenshot -> {shot}")

                # Dismiss onboarding
                demo_btn = page.locator("button:has-text('Explore with Demo Student')")
                await demo_btn.click()
                await page.wait_for_timeout(600)

            # Open Instruction Booklet Modal
            booklet_btn = page.locator("button[title*='Instruction Booklet']")
            await booklet_btn.wait_for(state="visible", timeout=3000)
            await booklet_btn.click()
            await page.wait_for_timeout(800)

            booklet_title = page.locator("text=XL-Flow Instruction Booklet & Guide")
            await booklet_title.wait_for(state="visible", timeout=3000)
            print(f"  ✓ Opened Instruction Booklet on {device}")

            # Click "80% Bunk Math" tab
            bunk_math_tab = page.locator("button:has-text('80% Bunk Math')")
            await bunk_math_tab.click()
            await page.wait_for_timeout(500)

            if device == "mobile_iphone15" or device == "desktop_laptop":
                shot = os.path.join(OUTPUT_DIR, f"screen_v1_booklet_{device}.png")
                await page.screenshot(path=shot)
                print(f"  ✓ Saved Booklet Screenshot -> {shot}")

            # Close booklet
            close_btn = page.locator("button:has-text('Got it, Let')")
            if await close_btn.is_visible():
                await close_btn.click()
            else:
                await page.locator("button:has(svg.lucide-x)").first.click()

            await page.wait_for_timeout(500)
            await context.close()

        await browser.close()
        print("\n=== XL-FLOW V1 UI VERIFICATION COMPLETE: ALL PASS ===")

if __name__ == "__main__":
    asyncio.run(verify_v1())
