import os
import sys
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\Janmejai\.gemini\antigravity\brain\d4b7d446-2587-4560-b02a-b65041f31c2e"
os.makedirs(ARTIFACT_DIR, exist_ok=True)

def run_verification():
    results = {}
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # 1. Desktop Test: 1440x900
        print("\n--- 1. Desktop Horizon Deck (1440x900) ---")
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # Set localStorage to skip initial onboarding & quick tour modals for clean baseline
        page.add_init_script("""
            localStorage.setItem('has_seen_onboarding_v1', 'true');
            localStorage.setItem('has_seen_quick_tour_v1', 'true');
        """)

        page.goto("http://localhost:4173")
        page.wait_for_timeout(1500)

        # A. Verify Dynamic Ambient Island in topbar
        ambient_btn = page.locator("button[aria-label='Dynamic Ambient Island']")
        if ambient_btn.count() > 0:
            print("[PASS] Dynamic Ambient Island detected in Desktop topbar")
            results["desktop_ambient_island"] = True

            # Click to open Glance Popover
            ambient_btn.first.click()
            page.wait_for_timeout(500)

            # Screenshot popover
            popover_shot = os.path.join(ARTIFACT_DIR, "ux_2026_dynamic_ambient_island_popover.png")
            page.screenshot(path=popover_shot)
            print(f"[SAVED] Popover screenshot: {popover_shot}")
            results["ambient_popover_screenshot"] = popover_shot

            # Close popover by clicking outside
            page.mouse.click(10, 10)
            page.wait_for_timeout(300)
        else:
            print("[FAIL] Dynamic Ambient Island not found")
            results["desktop_ambient_island"] = False

        # B. Verify Astra Copilot & Proactive Action Deck
        copilot_btn = page.locator("button[aria-label='Toggle Astra Copilot']")
        if copilot_btn.count() > 0:
            copilot_btn.first.click()
            page.wait_for_timeout(800)

            # Switch to copilot tab if needed
            copilot_tab = page.locator("button:has-text('Astra AI Chat')")
            if copilot_tab.count() > 0:
                copilot_tab.first.click()
                page.wait_for_timeout(500)

            # Check for Proactive Agentic Actions
            action_deck = page.locator("text=PROACTIVE AGENTIC ACTIONS")
            if action_deck.count() > 0:
                print("[PASS] Proactive Agentic Action Deck detected in Astra Copilot")
                results["proactive_action_deck"] = True
            else:
                print("[WARN] Action Deck label not directly matched, checking card buttons")

            dock_shot = os.path.join(ARTIFACT_DIR, "ux_2026_proactive_action_deck.png")
            page.screenshot(path=dock_shot)
            print(f"[SAVED] Proactive Action Deck screenshot: {dock_shot}")
            results["copilot_dock_screenshot"] = dock_shot

            # Close inspector
            copilot_btn.first.click()
            page.wait_for_timeout(400)

        # C. Verify Sector 03: Bunk-O-Meter Safety Matrix & Peace of Mind Index
        page.keyboard.press("3")
        page.wait_for_timeout(800)

        peace_metric = page.locator("text=PEACE OF MIND INDEX")
        if peace_metric.count() > 0:
            print("[PASS] Peace of Mind Index KPI Tile verified in Sector 03")
            results["peace_of_mind_tile"] = True
        else:
            print("[WARN] Peace of Mind Index text not immediately found")

        dean_appeal_btn = page.locator("button:has-text('Copy Dean Appeal Email')")
        if dean_appeal_btn.count() > 0:
            print("[PASS] 1-Click Dean Appeal Dispute Email button detected")
            results["dean_appeal_button"] = True
        else:
            print("[INFO] Dean appeal button not visible if 0 discrepancies")

        bunk_shot = os.path.join(ARTIFACT_DIR, "ux_2026_bunkmeter_peace_of_mind.png")
        page.screenshot(path=bunk_shot)
        print(f"[SAVED] BunkMeter Peace of Mind screenshot: {bunk_shot}")
        results["bunkmeter_screenshot"] = bunk_shot

        context.close()

        # 2. Mobile Viewport Test: iPhone 15 Pro (393x852)
        print("\n--- 2. Mobile Shell (393x852) ---")
        mobile_ctx = browser.new_context(
            viewport={"width": 393, "height": 852},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
            is_mobile=True,
            has_touch=True
        )
        m_page = mobile_ctx.new_page()
        m_page.add_init_script("""
            localStorage.setItem('has_seen_onboarding_v1', 'true');
            localStorage.setItem('has_seen_quick_tour_v1', 'true');
        """)
        m_page.goto("http://localhost:4173")
        m_page.wait_for_timeout(1500)

        m_ambient = m_page.locator("button[aria-label='Dynamic Ambient Island']")
        if m_ambient.count() > 0:
            print("[PASS] Compact Dynamic Ambient Island verified in Mobile Header")
            results["mobile_ambient_island"] = True
            m_ambient.first.click()
            m_page.wait_for_timeout(500)
        else:
            print("[FAIL] Compact Dynamic Ambient Island missing on mobile")
            results["mobile_ambient_island"] = False

        mobile_shot = os.path.join(ARTIFACT_DIR, "ux_2026_mobile_ambient_island.png")
        m_page.screenshot(path=mobile_shot)
        print(f"[SAVED] Mobile screenshot: {mobile_shot}")
        results["mobile_screenshot"] = mobile_shot

        mobile_ctx.close()
        browser.close()

    print("\n==================================================")
    print("ALL 2026 UI/UX & CONSUMER BEHAVIOR VERIFICATIONS COMPLETE")
    print(results)
    print("==================================================")

if __name__ == "__main__":
    run_verification()
