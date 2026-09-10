import os
import sys
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\Janmejai\.gemini\antigravity\brain\d4b7d446-2587-4560-b02a-b65041f31c2e"

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        # 1. Test standard laptop: 1280x800
        print("\n--- Testing 1280x800 ---")
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()
        page.add_init_script("""
            localStorage.setItem('has_seen_onboarding_v1', 'true');
            localStorage.setItem('has_seen_quick_tour_v1', 'true');
        """)
        page.goto("http://localhost:4173")
        page.wait_for_timeout(1500)

        header = page.locator("header").first
        header_path_1280 = os.path.join(ARTIFACT_DIR, "verified_decluttered_topbar_1280.png")
        header.screenshot(path=header_path_1280)
        print(f"[SAVED] 1280 topbar: {header_path_1280}")

        # Test More Menu (•••) open state
        more_btn = page.locator("button[aria-label='More Options Menu']")
        if more_btn.count() > 0 and more_btn.is_visible():
            more_btn.click()
            page.wait_for_timeout(400)
            dropdown_path = os.path.join(ARTIFACT_DIR, "verified_more_menu_dropdown.png")
            page.screenshot(path=dropdown_path)
            print(f"[SAVED] More Menu dropdown screenshot: {dropdown_path}")
            
            # Close by clicking away
            page.mouse.click(10, 10)
            page.wait_for_timeout(300)

        # 2. Test 1440x900
        print("\n--- Testing 1440x900 ---")
        page.set_viewport_size({"width": 1440, "height": 900})
        page.wait_for_timeout(1000)
        
        header_path_1440 = os.path.join(ARTIFACT_DIR, "verified_decluttered_topbar_1440.png")
        header.screenshot(path=header_path_1440)
        print(f"[SAVED] 1440 topbar: {header_path_1440}")

        full_deck_path = os.path.join(ARTIFACT_DIR, "verified_decluttered_full_deck.png")
        page.screenshot(path=full_deck_path)
        print(f"[SAVED] Full deck screenshot: {full_deck_path}")

        browser.close()
        print("\nAll topbar declutter verification screenshots successfully captured!")

if __name__ == '__main__':
    verify()
