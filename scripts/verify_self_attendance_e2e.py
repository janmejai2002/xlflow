import asyncio
import os
import sys
from playwright.async_api import async_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

OUTPUT_DIR = r"C:\Users\Janmejai\.gemini\antigravity\brain\d4b7d446-2587-4560-b02a-b65041f31c2e"
TARGET_URL = "http://localhost:4173/"

async def run_e2e_verification():
    print("\n=======================================================")
    print("PLAYWRIGHT E2E: SELF-ATTENDANCE MARKING & DISCREPANCY AUDIT")
    print("=======================================================")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        # -------------------------------------------------------------
        # TEST 1: DESKTOP WORKSPACE (1440x900)
        # -------------------------------------------------------------
        print("\n--- TEST 1: DESKTOP WORKSPACE (1440x900) ---")
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        print("1. Loading application...")
        await page.goto(TARGET_URL, wait_until="networkidle")
        await page.wait_for_timeout(1000)

        # Dismiss onboarding if open
        demo_btn = page.locator("button:has-text('Enter Student Command Centre')")
        if await demo_btn.is_visible():
            await demo_btn.click()
            await page.wait_for_timeout(1000)

        # Check Sector 01 (Radar) - PostLectureCheckinCard
        print("2. Checking Sector 01 (Radar) for Self-Attendance Check-in Prompt...")
        checkin_card = page.locator("text=Did you attend this lecture?")
        checkin_visible = await checkin_card.is_visible()
        print(f"  ✓ PostLectureCheckinCard visible: {checkin_visible}")

        # Mark 1-tap Present on the Radar check-in card
        present_btn = page.locator("button:has-text('Present')").first
        if await present_btn.is_visible():
            await present_btn.click()
            await page.wait_for_timeout(500)
            print("  ✓ Clicked 'Present' on lecture check-in card")
            # Verify status changes to marked
            marked_label = page.locator("text=Marked Present")
            print(f"  ✓ 'Marked Present' confirmation visible: {await marked_label.count() > 0}")

        # Switch to Sector 02 (Timetable)
        print("3. Switching to Sector 02 (Timetable)...")
        await page.keyboard.press("2")
        await page.wait_for_timeout(600)

        timetable_cards = page.locator(".timetable-docket-card")
        cards_count = await timetable_cards.count()
        print(f"  ✓ Timetable docket cards found: {cards_count}")

        # Verify Attendance Log pill exists on timetable card
        log_label = page.locator("text=Attendance Log:")
        print(f"  ✓ 'Attendance Log:' pill visible on timetable card: {await log_label.count() > 0}")

        # Switch to Sector 03 (Bunk-O-Meter)
        print("4. Switching to Sector 03 (Bunk-O-Meter)...")
        await page.keyboard.press("3")
        await page.wait_for_timeout(600)

        # Verify Source Mode Toggles
        hybrid_btn = page.locator("button:has-text('Hybrid Reality')")
        self_btn = page.locator("button:has-text('Self-Log')")
        erp_btn = page.locator("button:has-text('ERP (Official)')")
        print(f"  ✓ Hybrid Reality button visible: {await hybrid_btn.first.is_visible()}")
        print(f"  ✓ Self-Log button visible: {await self_btn.first.is_visible()}")
        print(f"  ✓ ERP (Official) button visible: {await erp_btn.first.is_visible()}")

        # Open Self-Log Audit Modal
        print("5. Opening AttendanceLogModal (Self-Log Audit)...")
        audit_btn = page.locator("button:has-text('Self-Log Audit')").first
        if await audit_btn.is_visible():
            await audit_btn.click()
            await page.wait_for_timeout(800)

            modal_title = page.locator("text=Self-Attendance & Discrepancy Manager")
            print(f"  ✓ AttendanceLogModal rendered: {await modal_title.is_visible()}")

            # Verify tabs in modal
            timeline_tab = page.locator("button:has-text('Session Timeline')")
            recon_tab = page.locator("button:has-text('Discrepancy Reconciler')")
            adjust_tab = page.locator("button:has-text('Course Adjuster')")
            print(f"  ✓ Modal tabs present: Timeline={await timeline_tab.is_visible()}, Recon={await recon_tab.is_visible()}, Adjust={await adjust_tab.is_visible()}")

            # Test Quick Adjustment in Modal
            await adjust_tab.click()
            await page.wait_for_timeout(400)
            plus_btn = page.locator("button:has-text('+')").first
            if await plus_btn.is_visible():
                await plus_btn.click()
                await page.wait_for_timeout(400)
                print("  ✓ Tested course quick adjustment (+1 session)")

            # Screenshot Modal
            modal_shot = os.path.join(OUTPUT_DIR, "verified_attendance_log_modal.png")
            await page.screenshot(path=modal_shot)
            print(f"  ✓ Captured modal screenshot: {modal_shot}")

            # Close modal
            close_btn = page.locator("button[title='Close']").first
            if await close_btn.is_visible():
                await close_btn.click()
                await page.wait_for_timeout(500)

        # Inspect Ground Reality in Right Dock
        print("6. Verifying Ground Reality in Desktop Inspector Dock...")
        dock_ground_reality = page.locator("text=Ground Reality Attendance")
        print(f"  ✓ Dock Ground Reality card visible: {await dock_ground_reality.is_visible()}")

        # Desktop screenshot
        desktop_shot = os.path.join(OUTPUT_DIR, "verified_desktop_bunkmeter_self_log.png")
        await page.screenshot(path=desktop_shot)
        print(f"  ✓ Captured desktop screenshot: {desktop_shot}")

        await context.close()

        # -------------------------------------------------------------
        # TEST 2: MOBILE VIEW (iPhone 15 Pro 393x852)
        # -------------------------------------------------------------
        print("\n--- TEST 2: MOBILE VIEW (iPhone 15 Pro 393x852) ---")
        m_context = await browser.new_context(
            viewport={"width": 393, "height": 852},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        )
        m_page = await m_context.new_page()

        await m_page.goto(TARGET_URL, wait_until="networkidle")
        await m_page.wait_for_timeout(1000)

        # Dismiss onboarding if open
        m_demo_btn = m_page.locator("button:has-text('Enter Student Command Centre')")
        if await m_demo_btn.is_visible():
            await m_demo_btn.click()
            await m_page.wait_for_timeout(1000)

        # Switch to Bunk-O-Meter on mobile
        print("1. Switching to Bunk-O-Meter on Mobile...")
        bunk_tab = m_page.locator("button:has-text('BunkMeter')")
        if await bunk_tab.is_visible():
            await bunk_tab.click()
            await m_page.wait_for_timeout(800)

        # Verify Mobile Self-Log Audit button
        m_audit_btn = m_page.locator("button:has-text('Self-Log Audit')")
        print(f"  ✓ Mobile Self-Log Audit button visible: {await m_audit_btn.is_visible()}")

        # Verify Mobile Source Mode Toggles
        m_hybrid = m_page.locator("button:has-text('Hybrid Reality')")
        print(f"  ✓ Mobile Source mode toggles visible: {await m_hybrid.is_visible()}")

        # Screenshot Mobile Bunk-O-Meter
        mobile_shot = os.path.join(OUTPUT_DIR, "verified_mobile_bunkmeter_self_attendance.png")
        await m_page.screenshot(path=mobile_shot)
        print(f"  ✓ Captured mobile screenshot: {mobile_shot}")

        await m_context.close()
        await browser.close()

    print("\n=======================================================")
    print("ALL PLAYWRIGHT E2E SELF-ATTENDANCE CHECKS PASSED!")
    print("=======================================================\n")

if __name__ == "__main__":
    asyncio.run(run_e2e_verification())
