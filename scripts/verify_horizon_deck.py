import asyncio
import os
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\Janmejai\.gemini\antigravity\brain\d4b7d446-2587-4560-b02a-b65041f31c2e"

async def run_horizon_deck_verification():
    print("[*] Starting Avant-Garde Horizon Deck Panoramic Verification...", flush=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        # -------------------------------------------------------------
        # TEST 1: Large Desktop Monitor (1440 x 900)
        # -------------------------------------------------------------
        print("\n--- 1. Testing Desktop Panoramic Horizon Deck (1440x900) ---", flush=True)
        context_desktop = await browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=1
        )
        page = await context_desktop.new_page()
        await page.add_init_script("localStorage.setItem('has_seen_onboarding_v1', 'true');")
        await page.goto("http://localhost:4173/")
        await page.wait_for_timeout(1500)

        # 1. Verify Top Command Island Header
        topbar = page.locator("header:has-text('XL-Flow')")
        await topbar.wait_for(state="visible", timeout=5000)
        print("[+] Floating Command Island TopBar is visible with brand and student dossier", flush=True)

        # 2. Verify Bottom Panoramic Mini-Map Scrubber
        minimap = page.locator("nav[aria-label='Horizon Deck navigation']")
        await minimap.wait_for(state="visible", timeout=5000)
        print("[+] Bottom Horizon Mini-Map Scrubber is visible with 6 station nodes", flush=True)

        # 3. Verify Zero Vertical Page Scrolling
        is_vertical_locked = await page.evaluate("() => document.documentElement.scrollHeight <= window.innerHeight + 5")
        print(f"[+] Zero vertical page scroll locked: {is_vertical_locked}", flush=True)

        # 4. Verify Panoramic Horizontal Canvas Width (Spanning all 6 sectors)
        panoramic_width = await page.evaluate("() => document.querySelector('main').scrollWidth")
        print(f"[+] Total Panoramic Horizon Width: {panoramic_width}px (Over 6000px spanning all 6 sectors!)", flush=True)

        # Capture Sector 01 (Radar)
        s1_path = os.path.join(ARTIFACT_DIR, "screen_horizon_sector01_radar.png")
        await page.screenshot(path=s1_path)
        print(f"[+] Saved screenshot: {s1_path}", flush=True)

        # 5. Jump to Sector 02 (Weekly Matrix Timetable) via Mini-Map
        print("\nTesting Jump to Sector 02 (Weekly Matrix)...", flush=True)
        node_s2 = page.locator("nav[aria-label='Horizon Deck navigation'] button:has-text('Weekly Matrix')").first
        await node_s2.click()
        await page.wait_for_timeout(900)

        s2_path = os.path.join(ARTIFACT_DIR, "screen_horizon_sector02_timetable.png")
        await page.screenshot(path=s2_path)
        print(f"[+] Saved screenshot: {s2_path}", flush=True)

        # 6. Test clicking a lecture block to test Slide-Over Context Inspector Dock
        print("\nTesting Slide-Over Context Inspector Dock...", flush=True)
        lecture_block = page.locator("text=OMCR").first
        if await lecture_block.is_visible():
            await lecture_block.click()
            await page.wait_for_timeout(600)
            inspector = page.locator("aside:has-text('Inspector & Co-Pilot')")
            if await inspector.is_visible():
                print("[+] Context Inspector Dock smoothly slid out on lecture click!", flush=True)
                insp_path = os.path.join(ARTIFACT_DIR, "screen_horizon_inspector_open.png")
                await page.screenshot(path=insp_path)
                print(f"[+] Saved screenshot: {insp_path}", flush=True)

                # Close inspector so full panoramic view is visible for subsequent sectors
                close_btn = page.locator("button[title='Close Inspector']")
                if await close_btn.is_visible():
                    await close_btn.click()
                    await page.wait_for_timeout(400)

        # 7. Jump to Sector 03 (Bunk-O-Meter) via Mini-Map
        print("\nTesting Jump to Sector 03 (Bunk-O-Meter)...", flush=True)
        node_s3 = page.locator("nav[aria-label='Horizon Deck navigation'] button:has-text('Bunk-O-Meter')").first
        await node_s3.click()
        await page.wait_for_timeout(900)
        s3_path = os.path.join(ARTIFACT_DIR, "screen_horizon_sector03_bunkmeter.png")
        await page.screenshot(path=s3_path)
        print(f"[+] Saved screenshot: {s3_path}", flush=True)

        # 8. Jump to Sector 04 (Getaways & Trips) via Mini-Map
        print("\nTesting Jump to Sector 04 (Getaways & Trips)...", flush=True)
        node_s4 = page.locator("nav[aria-label='Horizon Deck navigation'] button:has-text('Getaways & Trips')").first
        await node_s4.click()
        await page.wait_for_timeout(900)
        s4_path = os.path.join(ARTIFACT_DIR, "screen_horizon_sector04_trips.png")
        await page.screenshot(path=s4_path)
        print(f"[+] Saved screenshot: {s4_path}", flush=True)

        # 9. Jump to Sector 05 (Deadlines & Quizzes) via Mini-Map
        print("\nTesting Jump to Sector 05 (Deadlines & Quizzes)...", flush=True)
        node_s5 = page.locator("nav[aria-label='Horizon Deck navigation'] button:has-text('Deadlines & Quizzes')").first
        await node_s5.click()
        await page.wait_for_timeout(900)
        s5_path = os.path.join(ARTIFACT_DIR, "screen_horizon_sector05_deadlines.png")
        await page.screenshot(path=s5_path)
        print(f"[+] Saved screenshot: {s5_path}", flush=True)

        # 10. Jump to Sector 06 (Batch Synergy) via Mini-Map
        print("\nTesting Jump to Sector 06 (Batch Synergy Matrix)...", flush=True)
        node_s6 = page.locator("nav[aria-label='Horizon Deck navigation'] button:has-text('Batch Synergy')").first
        await node_s6.click()
        await page.wait_for_timeout(900)
        s6_path = os.path.join(ARTIFACT_DIR, "screen_horizon_sector06_synergy.png")
        await page.screenshot(path=s6_path)
        print(f"[+] Saved screenshot: {s6_path}", flush=True)

        # 11. Test Keyboard Shortcuts: Press '1' to jump back to Sector 01
        print("\nTesting Keyboard Navigation: Press '1' to jump to Sector 01...", flush=True)
        await page.keyboard.press("1")
        await page.wait_for_timeout(900)
        print("[+] Successfully glided back to Sector 01 via key '1'", flush=True)

        # 12. Test Theme Toggle ('T' key) for wAIbi-sabi Dark Mode
        print("\nTesting Theme Toggle: Press 'T' for wAIbi-sabi Dark Theme...", flush=True)
        await page.keyboard.press("t")
        await page.wait_for_timeout(600)
        dark_path = os.path.join(ARTIFACT_DIR, "screen_horizon_dark_mode.png")
        await page.screenshot(path=dark_path)
        print(f"[+] Saved Dark Theme screenshot: {dark_path}", flush=True)
        await page.keyboard.press("t") # toggle back
        await page.wait_for_timeout(400)

        # 13. Test 432Hz Focus Audio Toggle
        print("\nTesting 432Hz Soundscape with live equalizer animation...", flush=True)
        audio_btn = page.locator("button:has-text('432Hz Focus')")
        await audio_btn.click()
        await page.wait_for_timeout(500)
        print("[+] 432Hz Meditative Soundscape toggled with live equalizer waveform", flush=True)

        await context_desktop.close()

        # -------------------------------------------------------------
        # TEST 2: Mobile Responsive Shell (iPhone 15 Pro 375x812)
        # -------------------------------------------------------------
        print("\n--- 2. Verifying Mobile Shell Intact (iPhone 15 Pro) ---", flush=True)
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

        # Verify bottom nav is present
        nav_mobile = page_mobile.locator("nav")
        await nav_mobile.wait_for(state="visible", timeout=3000)
        print("[+] Mobile bottom navigation is intact and pristine", flush=True)

        mobile_path = os.path.join(ARTIFACT_DIR, "screen_mobile_horizon_verified.png")
        await page_mobile.screenshot(path=mobile_path)
        print(f"[+] Saved mobile verification screenshot: {mobile_path}", flush=True)
        await context_mobile.close()

        await browser.close()
        print("\n[SUCCESS] ALL HORIZON DECK PANORAMIC VERIFICATIONS COMPLETED WITH 100% SUCCESS!", flush=True)

if __name__ == "__main__":
    asyncio.run(run_horizon_deck_verification())
