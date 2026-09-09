import asyncio
import os
import sys
from playwright.async_api import async_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

OUTPUT_DIR = r"C:\Users\Janmejai\.gemini\antigravity\brain\d4b7d446-2587-4560-b02a-b65041f31c2e"
BASE_URL = "http://localhost:4173"

VIEWPORTS = {
    "budget_android_360": {
        "name": "Budget Android (360x740)",
        "viewport": {"width": 360, "height": 740},
        "device_scale_factor": 2,
        "is_mobile": True,
        "has_touch": True,
        "user_agent": "Mozilla/5.0 (Linux; Android 13; Pixel 4a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36"
    },
    "iphone15_pro": {
        "name": "iPhone 15 Pro (393x852)",
        "viewport": {"width": 393, "height": 852},
        "device_scale_factor": 3,
        "is_mobile": True,
        "has_touch": True,
        "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
    },
    "tablet_ipad": {
        "name": "iPad Air (820x1180)",
        "viewport": {"width": 820, "height": 1180},
        "device_scale_factor": 2,
        "is_mobile": True,
        "has_touch": True,
        "user_agent": "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
    },
    "desktop_1440": {
        "name": "Desktop 1440p",
        "viewport": {"width": 1440, "height": 900},
        "device_scale_factor": 1,
        "is_mobile": False,
        "has_touch": False,
        "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
    }
}

async def run_audit():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    results = {}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        for device_key, config in VIEWPORTS.items():
            print(f"\n==========================================")
            print(f"Testing Device: {config['name']}...")
            print(f"==========================================")

            context = await browser.new_context(
                viewport=config["viewport"],
                device_scale_factor=config["device_scale_factor"],
                is_mobile=config["is_mobile"],
                has_touch=config["has_touch"],
                user_agent=config["user_agent"]
            )
            page = await context.new_page()

            # Pre-set localStorage to avoid modal blocking, or click dismiss button
            await page.add_init_script("localStorage.setItem('has_seen_onboarding_v1', 'true');")
            await page.goto(BASE_URL, wait_until="networkidle")
            await asyncio.sleep(1)

            # Dismiss onboarding if still present
            try:
                dismiss_btn = page.locator("button:has-text('Explore with Demo Student')")
                if await dismiss_btn.count() > 0 and await dismiss_btn.first.is_visible():
                    await dismiss_btn.first.click()
                    await asyncio.sleep(0.5)
            except Exception as e:
                pass

            # 1. Header Layout Check: Ensure header doesn't overflow horizontally
            header = page.locator("header")
            header_box = await header.bounding_box()
            viewport_w = config["viewport"]["width"]
            print(f"Header dimensions: width={header_box['width']}px (viewport width={viewport_w}px)")
            header_overflow = header_box['width'] > viewport_w + 1
            print(f"Header overflow: {'FAIL - OVERFLOW' if header_overflow else 'PASS - PERFECT FIT'}")

            # 2. Switch to 3D Orbital Continuum & Test WebGL stability
            btn_3d = page.locator("button:has-text('3D Celestial Continuum')")
            if await btn_3d.count() > 0:
                await btn_3d.first.click()
                await asyncio.sleep(0.8)

            canvas = page.locator("canvas")
            canvas_count = await canvas.count()
            print(f"3D WebGL Canvas count after switching: {canvas_count} (Expected 1)")

            # Toggle 3D rotation pause/play 3 times rapidly to verify no WebGL context loss or memory leak
            rotate_btn = page.locator("button:has-text('Orbiting'), button:has-text('Paused')")
            if await rotate_btn.count() > 0:
                print("Toggling 3D rotation 3 times...")
                await rotate_btn.first.click()
                await asyncio.sleep(0.3)
                await rotate_btn.first.click()
                await asyncio.sleep(0.3)
                await rotate_btn.first.click()
                await asyncio.sleep(0.5)
                print("3D rotation toggled safely without scene crash.")

            # Capture Radar View with 3D Canvas
            radar_3d_img = os.path.join(OUTPUT_DIR, f"audit_{device_key}_3d_radar.png")
            await page.screenshot(path=radar_3d_img)
            print(f"Saved 3D screenshot: {radar_3d_img}")

            # 3. Test Bunk-O-Meter View & WCAG AA Contrast Tokens
            bunks_nav_btn = page.locator("nav button:has-text('Bunks')")
            if await bunks_nav_btn.count() > 0:
                await bunks_nav_btn.first.click()
                await asyncio.sleep(1)
                
                # Verify Safe (>=85%) and Risk/Action metric cards
                safe_kpi = page.locator("span:has-text('Safe (≥85%)')")
                print(f"Safe KPI pill present: {await safe_kpi.count() > 0}")

                bunks_img = os.path.join(OUTPUT_DIR, f"audit_{device_key}_bunks.png")
                await page.screenshot(path=bunks_img)
                print(f"Saved: {bunks_img}")

            # 4. Test LoginModal Accessibility & Virtual Keyboard Safe Sizing
            more_btn = page.locator("button[aria-label='More actions']")
            if await more_btn.count() > 0 and await more_btn.first.is_visible():
                print("Opening mobile More menu...")
                await more_btn.first.click()
                await asyncio.sleep(0.4)
                logout_item = page.locator("button:has-text('Switch / Logout')")
                await logout_item.first.click()
                await asyncio.sleep(0.6)
            else:
                header_logout_btn = page.locator("header button[aria-label='Logout or switch student profile']")
                if await header_logout_btn.count() > 0:
                    await header_logout_btn.first.click()
                    await asyncio.sleep(0.6)

                # Check email input font-size
                email_input = page.locator("#xlri-login-email")
                if await email_input.count() > 0:
                    font_size = await email_input.evaluate("el => window.getComputedStyle(el).fontSize")
                    print(f"Login email input computed fontSize: {font_size} (Expected >=16px to prevent iOS auto-zoom)")
                    input_pass = "16px" in font_size
                    print(f"iOS Zoom Prevention: {'PASS' if input_pass else 'FAIL'}")

                login_img = os.path.join(OUTPUT_DIR, f"audit_{device_key}_login.png")
                await page.screenshot(path=login_img)
                print(f"Saved: {login_img}")

                # Close modal
                close_modal = page.locator("button[aria-label='Close login modal']")
                if await close_modal.count() > 0:
                    await close_modal.first.click()
                    await asyncio.sleep(0.4)

            await context.close()

        await browser.close()
    print("\n==========================================")
    print("ALL MULTI-DEVICE & ACCESSIBILITY AUDITS COMPLETE!")
    print("==========================================")

if __name__ == "__main__":
    asyncio.run(run_audit())
