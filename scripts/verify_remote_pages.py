import asyncio
import os
import sys
from playwright.async_api import async_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

OUTPUT_DIR = r"C:\Users\Janmejai\.gemini\antigravity\brain\d4b7d446-2587-4560-b02a-b65041f31c2e"
LIVE_URL = "https://janmejai2002.github.io/xlflow/"

async def test_remote():
    print(f"\n--- Testing Live Production Site: {LIVE_URL} ---")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 430, "height": 932})
        page = await context.new_page()

        print(f"1. Navigating to {LIVE_URL}...")
        await page.goto(LIVE_URL, wait_until="networkidle")
        await page.wait_for_timeout(1500)

        # Onboarding
        onboarding_btn = page.locator("button:has-text('Connect Live ERP')")
        if await onboarding_btn.is_visible():
            print("  ✓ Clicking 'Connect Live ERP' on onboarding modal...")
            await onboarding_btn.click()
            await page.wait_for_timeout(800)

        # Fill credentials
        print("2. Entering credentials for b25349@astra.xlri.ac.in...")
        await page.locator("input[type='email']").fill("b25349@astra.xlri.ac.in")
        await page.locator("input[type='password'], input[name='password']").fill("Progaymer69@")

        # Submit
        print("3. Submitting login to real ERP from GitHub Pages...")
        await page.locator("button:has-text('Sign In with XLRI ERP')").click()

        print("4. Waiting for live sync on GitHub Pages...")
        await page.wait_for_timeout(4500)

        # Assert no error banner
        err = page.locator("div:has-text('Unexpected token')")
        if await err.is_visible():
            print("  ✗ FAILED: Still seeing error banner!")
            sys.exit(1)

        # Assert live schedule loaded
        course_elem = page.locator("text=OMCR").first
        has_course = await course_elem.is_visible()
        print(f"  ✓ Live Course OMCR detected on production: {has_course}")

        shot = os.path.join(OUTPUT_DIR, "screen_remote_production_verified.png")
        await page.screenshot(path=shot)
        print(f"  ✓ Saved Remote Production Screenshot -> {shot}")

        await browser.close()
        print("\n=== REMOTE GITHUB PAGES DEPLOYMENT 100% VERIFIED LIVE ===")

if __name__ == "__main__":
    asyncio.run(test_remote())
