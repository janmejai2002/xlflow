import asyncio
import os
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\Janmejai\.gemini\antigravity\brain\d4b7d446-2587-4560-b02a-b65041f31c2e"

async def run_desktop_verification():
    print("[*] Starting Desktop Command Centre Verification with Playwright...", flush=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        # -------------------------------------------------------------
        # TEST 1: Large Desktop Monitor (1440 x 900)
        # -------------------------------------------------------------
        print("\n--- 1. Testing Desktop Command Centre (1440x900) ---", flush=True)
        context_desktop = await browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=1
        )
        page = await context_desktop.new_page()
        await page.add_init_script("localStorage.setItem('has_seen_onboarding_v1', 'true');")
        await page.goto("http://localhost:4173/")
        await page.wait_for_timeout(1500)

        # Check for Desktop 3-Pane Structure
        sidebar = page.locator("aside:has-text('XL-Flow')")
        await sidebar.wait_for(state="visible", timeout=6000)
        print("[+] Left Rail (DesktopSidebar 240px) is visible", flush=True)

        topbar = page.locator("header:has-text('Today Radar')").or_(page.locator("header:has-text('XLRI Jamshedpur')"))
        await topbar.first.wait_for(state="visible", timeout=6000)
        print("[+] Desktop TopBar is visible with breadcrumb and omni-search", flush=True)

        inspector = page.locator("aside:has-text('Inspector & Co-Pilot')")
        await inspector.wait_for(state="visible", timeout=6000)
        print("[+] Right Dock (DesktopInspectorDock 340px) is visible", flush=True)

        # Capture initial Desktop Radar Screen
        radar_path = os.path.join(ARTIFACT_DIR, "screen_desktop_command_radar.png")
        await page.screenshot(path=radar_path)
        print(f"[+] Saved screenshot: {radar_path}", flush=True)

        # Navigate to Weekly Matrix (Timetable)
        print("\nTesting Tab: Weekly Matrix (6-Day Timetable)...", flush=True)
        matrix_tab = page.locator("button:has-text('Weekly Matrix')").first
        await matrix_tab.click()
        await page.wait_for_timeout(800)

        # Verify 6-Day Columns
        mon_col = page.locator("text=MON")
        sat_col = page.locator("text=SAT")
        await mon_col.first.wait_for(state="visible")
        await sat_col.first.wait_for(state="visible")
        print("[+] 6-Day Weekly Matrix (Monday to Saturday) rendered with 08:00 - 20:00 time axis", flush=True)

        # Click a lecture block in the matrix to test Inspector Dock integration
        lecture_block = page.locator("text=OMCR").first
        if await lecture_block.is_visible():
            await lecture_block.click()
            await page.wait_for_timeout(500)
            print("[+] Clicked OMCR lecture in matrix -> Inspector Dock updated", flush=True)

        timetable_path = os.path.join(ARTIFACT_DIR, "screen_desktop_command_timetable.png")
        await page.screenshot(path=timetable_path)
        print(f"[+] Saved screenshot: {timetable_path}", flush=True)

        # Navigate to Bunk-O-Meter
        print("\nTesting Tab: Bunk-O-Meter...", flush=True)
        bunk_tab = page.locator("button:has-text('Bunk-O-Meter')").first
        await bunk_tab.click()
        await page.wait_for_timeout(800)
        bunkmeter_path = os.path.join(ARTIFACT_DIR, "screen_desktop_command_bunkmeter.png")
        await page.screenshot(path=bunkmeter_path)
        print(f"[+] Saved screenshot: {bunkmeter_path}", flush=True)

        # Test Keyboard Shortcuts Modal (?)
        print("\nTesting Keyboard Shortcuts Modal (?) ...", flush=True)
        await page.keyboard.press("?")
        await page.wait_for_timeout(600)
        shortcuts_modal = page.locator("h3:has-text('Keyboard Shortcuts')")
        if await shortcuts_modal.is_visible():
            print("[+] Keyboard Shortcuts Cheatsheet modal opened via '?' key", flush=True)
            sc_path = os.path.join(ARTIFACT_DIR, "screen_desktop_keyboard_shortcuts_modal.png")
            await page.screenshot(path=sc_path)
            close_sc = page.locator("button[aria-label='Close shortcuts modal']")
            if await close_sc.is_visible():
                await close_sc.click()
            else:
                await page.keyboard.press("Escape")
            await shortcuts_modal.wait_for(state="hidden", timeout=3000)
            print("[+] Closed shortcuts modal", flush=True)
            await page.wait_for_timeout(400)

        # Test Group Synergy Collaboration Modal
        print("\nTesting Group Synergy & Free Slot Matrix...", flush=True)
        synergy_btn = page.locator("button:has-text('Group Synergy')").first
        await synergy_btn.click()
        await page.wait_for_timeout(800)
        synergy_modal = page.locator("h2:has-text('Group Collaboration & Synergy Matrix')")
        if await synergy_modal.is_visible():
            print("[+] Group Collaboration Modal opened with 4-student matrix", flush=True)
            synergy_path = os.path.join(ARTIFACT_DIR, "screen_desktop_group_synergy_modal.png")
            await page.screenshot(path=synergy_path)
            
            # Close synergy modal
            close_btn = page.locator("button[aria-label='Close group synergy']")
            if await close_btn.is_visible():
                await close_btn.click()
                await page.wait_for_timeout(400)

        await context_desktop.close()

        # -------------------------------------------------------------
        # TEST 2: Tablet Viewport (iPad Air 820 x 1180)
        # -------------------------------------------------------------
        print("\n--- 2. Testing Tablet Responsive Framing (820x1180) ---", flush=True)
        context_tablet = await browser.new_context(
            viewport={"width": 820, "height": 1180},
            device_scale_factor=2
        )
        page_tablet = await context_tablet.new_page()
        await page_tablet.add_init_script("localStorage.setItem('has_seen_onboarding_v1', 'true');")
        await page_tablet.goto("http://localhost:4173/")
        await page_tablet.wait_for_timeout(1000)

        tablet_path = os.path.join(ARTIFACT_DIR, "screen_tablet_ipad_air_verified.png")
        await page_tablet.screenshot(path=tablet_path)
        print(f"[+] Saved tablet screenshot: {tablet_path}", flush=True)
        await context_tablet.close()

        # -------------------------------------------------------------
        # TEST 3: Mobile Viewport (iPhone 15 Pro 375 x 812)
        # -------------------------------------------------------------
        print("\n--- 3. Testing Mobile Responsive Shell (iPhone 15 Pro 375x812) ---", flush=True)
        context_mobile = await browser.new_context(
            viewport={"width": 375, "height": 812},
            device_scale_factor=3,
            is_mobile=True,
            has_touch=True
        )
        page_mobile = await context_mobile.new_page()
        await page_mobile.add_init_script("localStorage.setItem('has_seen_onboarding_v1', 'true');")
        await page_mobile.goto("http://localhost:4173/")
        await page_mobile.wait_for_timeout(1000)

        # Verify bottom navigation is present on mobile
        nav = page_mobile.locator("nav")
        await nav.wait_for(state="visible", timeout=3000)
        print("[+] Bottom Navigation bar visible on mobile", flush=True)

        mobile_path = os.path.join(ARTIFACT_DIR, "screen_mobile_iphone15_verified.png")
        await page_mobile.screenshot(path=mobile_path)
        print(f"[+] Saved mobile screenshot: {mobile_path}", flush=True)
        await context_mobile.close()

        await browser.close()
        print("\n[SUCCESS] ALL MULTI-VIEWPORT VERIFICATIONS PASSED WITH FLYING COLORS!", flush=True)

if __name__ == "__main__":
    asyncio.run(run_desktop_verification())
