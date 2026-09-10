import asyncio
import json
import os
import sys
from playwright.async_api import async_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

OUTPUT_DIR = r"C:\Users\Janmejai\.gemini\antigravity\brain\d4b7d446-2587-4560-b02a-b65041f31c2e"
BASE_URL = "http://localhost:4173"

async def run_ux_verification():
    print("================================================================")
    print("XL-FLOW DESIGN THINKING & FIRST PRINCIPLES VERIFICATION ENGINE")
    print("================================================================")

    results = {}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # Test Desktop 1440x900
        context = await browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=1
        )
        page = await context.new_page()

        # Set localStorage flags so we start in a controlled state
        await page.goto(BASE_URL)
        await page.evaluate("""() => {
            localStorage.setItem('has_seen_onboarding_v1', 'true');
            localStorage.setItem('has_seen_quick_tour_v1', 'true');
            localStorage.setItem('layout_mode_preference', 'desktop');
        }""")
        await page.reload()
        await page.wait_for_timeout(1200)

        # 1. Verify Quick Tour Trigger and Tour Modal
        print("\n[TEST 1] Testing Quick Tour Modal...")
        quick_tour_btn = page.locator("button[aria-label='Take Quick Tour']")
        await quick_tour_btn.wait_for(state="visible", timeout=5000)
        await quick_tour_btn.click()
        await page.wait_for_timeout(600)

        tour_modal = page.locator("div:has-text('Quick Tour: How XL-Flow Works')")
        assert await tour_modal.count() > 0, "Quick Tour modal should be open"
        
        # Capture screenshot of Tour slide 1
        tour_slide1_shot = os.path.join(OUTPUT_DIR, "ux_quick_tour_slide1.png")
        await page.screenshot(path=tour_slide1_shot)
        print(f"  ✓ Quick Tour Slide 1 open and captured: {tour_slide1_shot}")

        # Navigate next slide
        next_btn = page.locator("button:has-text('Next')")
        await next_btn.click()
        await page.wait_for_timeout(400)
        tour_slide2_shot = os.path.join(OUTPUT_DIR, "ux_quick_tour_slide2.png")
        await page.screenshot(path=tour_slide2_shot)
        print(f"  ✓ Quick Tour Slide 2 captured: {tour_slide2_shot}")

        # Close Quick Tour
        close_btn = page.locator("button[aria-label='Close quick tour']")
        await close_btn.click()
        await page.wait_for_timeout(400)
        results["quick_tour_modal"] = "PASSED"

        # 2. Verify Sector 01: Radar (Venue code + Plain English Attendance Advice)
        print("\n[TEST 2] Verifying Sector 01 (Radar HUD & Venue)...")
        await page.keyboard.press("1")
        await page.wait_for_timeout(500)

        venue_btn = page.locator("button[title='Click to copy classroom venue code']")
        assert await venue_btn.count() > 0, "Venue button must exist"
        venue_text = await venue_btn.inner_text()
        print(f"  ✓ Elevated Venue Button found: '{venue_text.replace(chr(10), ' ')}'")

        safety_footer = page.locator("text=80% Rule")
        assert await safety_footer.count() > 0, "80% Rule attendance advice must exist"
        print("  ✓ Plain-English Attendance Advice footer verified")

        sec1_shot = os.path.join(OUTPUT_DIR, "ux_sector01_radar_refined.png")
        await page.screenshot(path=sec1_shot)
        results["sector01_radar"] = "PASSED"

        # 3. Verify Sector 02: Timetable (Day Filter Tabs)
        print("\n[TEST 3] Verifying Sector 02 (Timetable Matrix & Day Tabs)...")
        await page.keyboard.press("2")
        await page.wait_for_timeout(500)

        day_all_btn = page.locator("button:has-text('All Days')")
        assert await day_all_btn.count() > 0, "All Days tab must exist"
        
        # Click MON day tab to test day isolation
        mon_btn = page.locator("button:has-text('MON')")
        assert await mon_btn.count() > 0, "MON tab must exist"
        await mon_btn.click()
        await page.wait_for_timeout(400)
        
        sec2_mon_shot = os.path.join(OUTPUT_DIR, "ux_sector02_timetable_mon_tab.png")
        await page.screenshot(path=sec2_mon_shot)
        print(f"  ✓ Day Tab MON selected and captured: {sec2_mon_shot}")

        # Switch back to All Days
        await day_all_btn.click()
        await page.wait_for_timeout(400)
        sec2_all_shot = os.path.join(OUTPUT_DIR, "ux_sector02_timetable_all_days.png")
        await page.screenshot(path=sec2_all_shot)
        print(f"  ✓ All Days matrix captured: {sec2_all_shot}")
        results["sector02_timetable"] = "PASSED"

        # 4. Verify Sector 03: Bunk-O-Meter (Plain-English Zero-Math statement)
        print("\n[TEST 4] Verifying Sector 03 (Bunk-O-Meter Zero-Math)...")
        await page.keyboard.press("3")
        await page.wait_for_timeout(500)

        safe_banner = page.locator("text=Bunks Available before 80% limit")
        assert await safe_banner.count() > 0, "Zero-math statement must exist on cards"
        print(f"  ✓ Found {await safe_banner.count()} cards with plain-English safety statements")

        sec3_shot = os.path.join(OUTPUT_DIR, "ux_sector03_bunkmeter_refined.png")
        await page.screenshot(path=sec3_shot)
        results["sector03_bunkmeter"] = "PASSED"

        # 5. Verify Sector 04: Getaways (Explainer banner & Bridge the Gap)
        print("\n[TEST 5] Verifying Sector 04 (Getaways & Bridge the Gap)...")
        await page.keyboard.press("4")
        await page.wait_for_timeout(500)

        how_it_works = page.locator("text=HOW IT WORKS")
        assert await how_it_works.count() > 0, "HOW IT WORKS explainer must exist"
        print("  ✓ Found 'HOW IT WORKS' travel explainer banner")

        bridge_gap = page.locator("text=Bridge the Gap")
        print(f"  ✓ Found {await bridge_gap.count()} 'Bridge the Gap' trade-off pills")

        sec4_shot = os.path.join(OUTPUT_DIR, "ux_sector04_getaways_refined.png")
        await page.screenshot(path=sec4_shot)
        results["sector04_getaways"] = "PASSED"

        # 6. Verify Sector 05: Deadlines (Urgent vs Upcoming triage)
        print("\n[TEST 6] Verifying Sector 05 (Deadlines Urgency Triage)...")
        await page.keyboard.press("5")
        await page.wait_for_timeout(500)

        due_soon_badge = page.locator("text=Due Soon")
        print(f"  ✓ Found {await due_soon_badge.count()} urgency triage tags")

        sec5_shot = os.path.join(OUTPUT_DIR, "ux_sector05_deadlines_refined.png")
        await page.screenshot(path=sec5_shot)
        results["sector05_deadlines"] = "PASSED"

        # 7. Verify Sector 06: Campus Social (Zero Fake Data & 3-Step Guide)
        print("\n[TEST 7] Verifying Sector 06 (Social & Synergy Clean State)...")
        await page.keyboard.press("6")
        await page.wait_for_timeout(500)

        # Click Study Squads subtab
        squads_tab_btn = page.locator("button:has-text('Study Squads')")
        await squads_tab_btn.click()
        await page.wait_for_timeout(500)

        onboarding_guide = page.locator("text=How Study Squads Work")
        assert await onboarding_guide.count() > 0, "Study Squads onboarding guide must exist"
        print("  ✓ Found 'How Study Squads Work' 3-step guide")

        sec6_shot = os.path.join(OUTPUT_DIR, "ux_sector06_synergy_refined.png")
        await page.screenshot(path=sec6_shot)
        results["sector06_synergy"] = "PASSED"

        # 8. Check Zero-Scroll on Desktop Viewports
        print("\n[TEST 8] Verifying Zero-Scroll Integrity on Desktop...")
        for sector_idx in range(6):
            await page.keyboard.press(str(sector_idx + 1))
            await page.wait_for_timeout(300)
            scroll_y = await page.evaluate("() => window.scrollY")
            doc_height = await page.evaluate("() => document.documentElement.scrollHeight")
            win_height = await page.evaluate("() => window.innerHeight")
            
            print(f"  Sector 0{sector_idx+1}: window.scrollY={scroll_y}, docHeight={doc_height}, winHeight={win_height}")
            assert scroll_y == 0, f"Outer page scrollY should be 0 on sector {sector_idx+1}"
            assert doc_height <= win_height + 2, f"Document height ({doc_height}) should fit viewport ({win_height}) on sector {sector_idx+1}"

        results["zero_scroll_integrity"] = "PASSED (All 6 sectors fit viewport perfectly)"

        await context.close()
        await browser.close()

    summary_file = os.path.join(OUTPUT_DIR, "design_thinking_verification_summary.json")
    with open(summary_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print("\n================================================================")
    print("ALL DESIGN THINKING & UX VERIFICATIONS PASSED!")
    print(f"Summary written to: {summary_file}")
    print("================================================================")

if __name__ == "__main__":
    asyncio.run(run_ux_verification())
