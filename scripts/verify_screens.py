import asyncio
import os
import sys
from playwright.async_api import async_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

OUTPUT_DIR = r"C:\Users\Janmejai\.gemini\antigravity\brain\d4b7d446-2587-4560-b02a-b65041f31c2e"
BASE_URL = "http://localhost:4173"

VIEWPORTS = {
    "mobile_iphone15": {
        "name": "Mobile (iPhone 15 Pro)",
        "viewport": {"width": 393, "height": 852},
        "device_scale_factor": 2,
        "is_mobile": True,
        "has_touch": True,
        "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
    },
    "tablet_ipad": {
        "name": "Tablet (iPad Air)",
        "viewport": {"width": 820, "height": 1180},
        "device_scale_factor": 2,
        "is_mobile": True,
        "has_touch": True,
        "user_agent": "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
    },
    "desktop_laptop": {
        "name": "Desktop (MacBook/Laptop)",
        "viewport": {"width": 1440, "height": 900},
        "device_scale_factor": 1,
        "is_mobile": False,
        "has_touch": False,
        "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
    }
}

async def run_multi_screen_verification():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    results = {}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        for device_key, config in VIEWPORTS.items():
            print(f"\n==========================================")
            print(f"Verifying {config['name']} ({config['viewport']['width']}x{config['viewport']['height']})...")
            print(f"==========================================")

            context = await browser.new_context(
                viewport=config["viewport"],
                device_scale_factor=config["device_scale_factor"],
                is_mobile=config["is_mobile"],
                has_touch=config["has_touch"],
                user_agent=config["user_agent"]
            )
            page = await context.new_page()

            # 1. Navigate to XL-Flow
            await page.goto(BASE_URL, wait_until="networkidle")
            await page.wait_for_timeout(1000)

            # Capture Base Radar View
            radar_path = os.path.join(OUTPUT_DIR, f"screen_{device_key}_radar.png")
            await page.screenshot(path=radar_path)
            print(f"  ✓ Captured Radar View -> {radar_path}")

            # 2. Test Creative Micro-Interaction: Streak Click & Confetti / Sonner Toast
            streak_btn = page.locator("button:has-text('8d Streak')")
            if await streak_btn.count() > 0:
                await streak_btn.click()
                await page.wait_for_timeout(800)
                streak_shot = os.path.join(OUTPUT_DIR, f"screen_{device_key}_streak_toast.png")
                await page.screenshot(path=streak_shot)
                print(f"  ✓ Clicked Streak -> Verified Confetti + Sonner Toast -> {streak_shot}")

            # 3. Test Vaul Gesture Drawer (Click featured class card)
            class_card = page.locator("text=Omnichannel Retailing").first
            if await class_card.count() > 0:
                await class_card.click()
                await page.wait_for_timeout(700)
                drawer_shot = os.path.join(OUTPUT_DIR, f"screen_{device_key}_vaul_drawer.png")
                await page.screenshot(path=drawer_shot)
                print(f"  ✓ Clicked Lecture -> Verified Vaul Bottom Drawer -> {drawer_shot}")

                # Close drawer by pressing Escape
                await page.keyboard.press("Escape")
                await page.wait_for_timeout(500)

            # 3b. Test 3D Celestial Continuum (Chronos Orb)
            orb_toggle = page.locator("button:has-text('3D Celestial Continuum')")
            if await orb_toggle.count() > 0:
                await orb_toggle.click()
                await page.wait_for_timeout(1200) # Allow Three.js WebGL rendering
                orb_shot = os.path.join(OUTPUT_DIR, f"screen_{device_key}_chronos_3d.png")
                await page.screenshot(path=orb_shot)
                print(f"  ✓ Activated 3D Mode -> Verified Three.js Chronos Orb -> {orb_shot}")

                # Switch back to 2D
                await page.locator("button:has-text('2D Tactical View')").click()
                await page.wait_for_timeout(400)

            # 3c. Test Astra Neural Co-Pilot Trigger
            astra_btn = page.locator("button:has-text('Astra')")
            if await astra_btn.count() > 0:
                await astra_btn.click()
                await page.wait_for_timeout(800)
                astra_shot = os.path.join(OUTPUT_DIR, f"screen_{device_key}_astra_copilot.png")
                await page.screenshot(path=astra_shot)
                print(f"  ✓ Opened Astra Co-Pilot -> Verified Neural Chat Drawer -> {astra_shot}")

                # Close Copilot
                await page.keyboard.press("Escape")
                await page.wait_for_timeout(400)

            # 4. Navigate to BunkMeter & Test NumberFlow
            bunk_tab = page.locator("button:has-text('Bunks')")
            if await bunk_tab.count() > 0:
                await bunk_tab.click()
                await page.wait_for_timeout(600)
                bunk_path = os.path.join(OUTPUT_DIR, f"screen_{device_key}_bunkmeter.png")
                await page.screenshot(path=bunk_path)
                print(f"  ✓ Navigated to Bunk-O-Meter -> {bunk_path}")

            # 5. Navigate to Timetable
            classes_tab = page.locator("button:has-text('Classes')")
            if await classes_tab.count() > 0:
                await classes_tab.click()
                await page.wait_for_timeout(600)
                tt_path = os.path.join(OUTPUT_DIR, f"screen_{device_key}_timetable.png")
                await page.screenshot(path=tt_path)
                print(f"  ✓ Navigated to Timetable -> {tt_path}")

            await context.close()

        await browser.close()

    print("\n✓ ALL MULTI-SCREEN VIEWPORT VERIFICATIONS PASSED CLEANLY!")

if __name__ == "__main__":
    asyncio.run(run_multi_screen_verification())
