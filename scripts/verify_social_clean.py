import asyncio
import os
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\Janmejai\.gemini\antigravity\brain\d4b7d446-2587-4560-b02a-b65041f31c2e"

async def verify_clean_social():
    print("[*] Verifying Clean Social Experience (Zero Fake Data & Clear Guidance)...", flush=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        # Clean storage & bypass onboarding
        await page.add_init_script("""
            localStorage.clear();
            localStorage.setItem('has_seen_onboarding_v1', 'true');
        """)

        await page.goto("http://localhost:4173/")
        await page.wait_for_timeout(2000)

        # 1. Navigate to Sector 06 (Batch Synergy)
        print("Navigating to Sector 06 (Social & Synergy)...", flush=True)
        btn = page.locator("nav[aria-label='Horizon Deck navigation'] button:has-text('Batch Synergy')").first
        await btn.click()
        await page.wait_for_timeout(1000)

        # ==========================================
        # VERIFICATION 1: Campus Radar
        # ==========================================
        print("\n--- Testing Campus Radar (No Fake Classmates) ---", flush=True)
        # Check that fake names do NOT exist
        fake_names = ["Aakash Lakhangaonkar", "Devika Tyagi", "Shreya Monga", "Debashish Das", "Kashish Jain", "Satyam Singh"]
        body_text = await page.inner_text("main")
        for fake in fake_names:
            assert fake not in body_text, f"Found fake name '{fake}' in page!"
        print("[+] PASS: Zero fake classmate statuses found on Campus Radar!", flush=True)

        # Check that Explainer Ribbon is visible
        explainer = page.locator("text=How It Works: Tap + Set My Beacon to let batchmates know where you are")
        await explainer.wait_for(state="visible", timeout=3000)
        print("[+] PASS: 'How It Works' explainer ribbon is clearly visible!", flush=True)

        # Check that Zero Active Beacons empty state is visible
        zero_banner = page.locator("text=No active beacons right now")
        await zero_banner.wait_for(state="visible", timeout=3000)
        print("[+] PASS: Zero-beacon empty state banner is clearly visible!", flush=True)

        radar_shot = os.path.join(ARTIFACT_DIR, "verified_clean_campus_radar.png")
        await page.screenshot(path=radar_shot)
        print(f"[+] Saved screenshot: {radar_shot}", flush=True)

        # ==========================================
        # VERIFICATION 2: Study Squads
        # ==========================================
        print("\n--- Testing Study Squads (No Fake Squads & Clear Guidance) ---", flush=True)
        squads_tab = page.locator("button:has-text('Study Squads')").first
        await squads_tab.click()
        await page.wait_for_timeout(800)

        body_text_squads = await page.inner_text("main")
        # Check fake squads are NOT present
        fake_squads = ["Strategy Project Squad", "Omnichannel Retailing Case", "Nescafe Coffee Crew", "XL-STRAT", "XL-OMCR", "XL-COFFEE"]
        for squad in fake_squads:
            assert squad not in body_text_squads, f"Found fake squad '{squad}' in page!"
        print("[+] PASS: Zero hardcoded fake squads found!", flush=True)

        # Check that How Study Squads Work 3-step guide is visible
        guide_title = page.locator("text=HOW STUDY SQUADS WORK")
        await guide_title.wait_for(state="visible", timeout=3000)
        print("[+] PASS: 'HOW STUDY SQUADS WORK' onboarding guide is visible!", flush=True)

        # Check action buttons
        create_btn = page.locator("button:has-text('Create a Squad')").first
        join_btn = page.locator("button:has-text('Join with Code')").first
        assert await create_btn.is_visible(), "Create a Squad button not visible!"
        assert await join_btn.is_visible(), "Join with Code button not visible!"
        print("[+] PASS: 'Create a Squad' and 'Join with Code' action buttons are prominent!", flush=True)

        squads_shot = os.path.join(ARTIFACT_DIR, "verified_clean_study_squads.png")
        await page.screenshot(path=squads_shot)
        print(f"[+] Saved screenshot: {squads_shot}", flush=True)

        # ==========================================
        # VERIFICATION 3: Free Slot Matrix
        # ==========================================
        print("\n--- Testing Free Slot Matrix (Guidance Banner) ---", flush=True)
        matrix_tab = page.locator("button:has-text('Free Slot Matrix')").first
        await matrix_tab.click()
        await page.wait_for_timeout(800)

        matrix_explainer = page.locator("text=How Free Slot Matrix Works:")
        await matrix_explainer.wait_for(state="visible", timeout=3000)
        print("[+] PASS: 'How Free Slot Matrix Works' explainer is visible!", flush=True)

        matrix_shot = os.path.join(ARTIFACT_DIR, "verified_clean_free_slot_matrix.png")
        await page.screenshot(path=matrix_shot)
        print(f"[+] Saved screenshot: {matrix_shot}", flush=True)

        await browser.close()
        print("\n[SUCCESS] ALL CLEAN SOCIAL & GUIDANCE VERIFICATIONS PASSED!", flush=True)

if __name__ == "__main__":
    asyncio.run(verify_clean_social())
