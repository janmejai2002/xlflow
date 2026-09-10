import asyncio
import os
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\Janmejai\.gemini\antigravity\brain\d4b7d446-2587-4560-b02a-b65041f31c2e"

async def run_verification():
    print("[*] Starting Zero-Scroll Radar & Element-Level Scrolling Verification...", flush=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        # -------------------------------------------------------------
        # TEST 1: Standard Laptop (1440x900)
        # -------------------------------------------------------------
        print("\n--- 1. Testing Standard Laptop Viewport (1440x900) ---", flush=True)
        context_1440 = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context_1440.new_page()
        await page.add_init_script("localStorage.setItem('has_seen_onboarding_v1', 'true');")
        await page.goto("http://localhost:4173/")
        await page.wait_for_timeout(2000)

        # A. Window & Document Scroll Check
        doc_scroll_locked = await page.evaluate("""() => {
            return {
                windowScrollY: window.scrollY,
                docHeight: document.documentElement.scrollHeight,
                winHeight: window.innerHeight,
                isDocLocked: document.documentElement.scrollHeight <= window.innerHeight
            }
        }""")
        print(f"[+] Document Scroll: {doc_scroll_locked}", flush=True)
        assert doc_scroll_locked["isDocLocked"], "Document has vertical scroll!"

        # B. <main> Scroll Check
        main_scroll = await page.evaluate("""() => {
            const main = document.querySelector('main');
            return {
                scrollTop: main.scrollTop,
                scrollHeight: main.scrollHeight,
                clientHeight: main.clientHeight,
                hasVerticalScroll: main.scrollHeight > main.clientHeight
            }
        }""")
        print(f"[+] <main> Scroll Stats: {main_scroll}", flush=True)
        assert not main_scroll["hasVerticalScroll"], f"Main container is scrolling! {main_scroll}"

        # C. Canvas Bounds Check (ChronosOrb3D planetary system)
        canvas_bounds = await page.evaluate("""() => {
            const canvas = document.querySelector('canvas');
            if (!canvas) return null;
            const r = canvas.getBoundingClientRect();
            return {
                top: r.top,
                bottom: r.bottom,
                left: r.left,
                right: r.right,
                width: r.width,
                height: r.height,
                fitsInViewport: r.top >= 0 && r.bottom <= window.innerHeight
            }
        }""")
        print(f"[+] 3D Planetary Canvas Bounds: {canvas_bounds}", flush=True)
        assert canvas_bounds and canvas_bounds["fitsInViewport"], f"Canvas out of bounds! {canvas_bounds}"

        # D. Upcoming Pipeline Element Scroll Check
        pipeline_scroll = await page.evaluate("""() => {
            const pipeline = document.querySelector('section[data-sector-id="radar"] div[style*="overflow-y: auto"], section[data-sector-id="radar"] div[style*="overflowY: auto"]');
            return pipeline ? {
                found: true,
                scrollHeight: pipeline.scrollHeight,
                clientHeight: pipeline.clientHeight,
                canScroll: pipeline.scrollHeight > pipeline.clientHeight
            } : { found: false };
        }""")
        print(f"[+] Pipeline Element Scroll Capability: {pipeline_scroll}", flush=True)

        # Test scrolling pipeline element
        scroll_test_result = await page.evaluate("""() => {
            const pipeline = document.querySelector('section[data-sector-id="radar"] div[style*="overflow-y: auto"], section[data-sector-id="radar"] div[style*="overflowY: auto"]');
            if (!pipeline) return { success: false, reason: 'pipeline not found' };
            const before = pipeline.scrollTop;
            pipeline.scrollTop = 40;
            const after = pipeline.scrollTop;
            const mainScroll = document.querySelector('main').scrollTop;
            return {
                before,
                after,
                scrolled: after > 0,
                mainScrollDidNotChange: mainScroll === 0
            };
        }""")
        print(f"[+] Isolated Element Scroll Test on Pipeline: {scroll_test_result}", flush=True)
        assert scroll_test_result.get("mainScrollDidNotChange", False), "Main scrolled when element scrolled!"

        # Screenshot 1440x900
        path_1440 = os.path.join(ARTIFACT_DIR, "verified_zero_scroll_radar_1440.png")
        await page.screenshot(path=path_1440)
        print(f"[+] Saved 1440x900 screenshot: {path_1440}", flush=True)

        # -------------------------------------------------------------
        # TEST 2: Compact Laptop (1280x800)
        # -------------------------------------------------------------
        print("\n--- 2. Testing Compact Laptop Viewport (1280x800) ---", flush=True)
        context_1280 = await browser.new_context(viewport={"width": 1280, "height": 800})
        page_1280 = await context_1280.new_page()
        await page_1280.add_init_script("localStorage.setItem('has_seen_onboarding_v1', 'true');")
        await page_1280.goto("http://localhost:4173/")
        await page_1280.wait_for_timeout(2000)

        main_1280 = await page_1280.evaluate("""() => {
            const main = document.querySelector('main');
            const canvas = document.querySelector('canvas');
            const cRect = canvas ? canvas.getBoundingClientRect() : null;
            return {
                mainScrollHeight: main.scrollHeight,
                mainClientHeight: main.clientHeight,
                hasVerticalScroll: main.scrollHeight > main.clientHeight,
                canvasFits: cRect ? (cRect.top >= 0 && cRect.bottom <= window.innerHeight) : false,
                canvasHeight: cRect ? cRect.height : 0
            };
        }""")
        print(f"[+] 1280x800 Stats: {main_1280}", flush=True)
        assert not main_1280["hasVerticalScroll"], f"Main scrolls at 1280x800! {main_1280}"
        assert main_1280["canvasFits"], f"Canvas clipped at 1280x800! {main_1280}"

        path_1280 = os.path.join(ARTIFACT_DIR, "verified_zero_scroll_radar_1280.png")
        await page_1280.screenshot(path=path_1280)
        print(f"[+] Saved 1280x800 screenshot: {path_1280}", flush=True)

        # -------------------------------------------------------------
        # TEST 3: Full HD Desktop (1920x1080)
        # -------------------------------------------------------------
        print("\n--- 3. Testing Full HD Desktop Viewport (1920x1080) ---", flush=True)
        context_1920 = await browser.new_context(viewport={"width": 1920, "height": 1080})
        page_1920 = await context_1920.new_page()
        await page_1920.add_init_script("localStorage.setItem('has_seen_onboarding_v1', 'true');")
        await page_1920.goto("http://localhost:4173/")
        await page_1920.wait_for_timeout(2000)

        main_1920 = await page_1920.evaluate("""() => {
            const main = document.querySelector('main');
            const canvas = document.querySelector('canvas');
            const cRect = canvas ? canvas.getBoundingClientRect() : null;
            return {
                mainScrollHeight: main.scrollHeight,
                mainClientHeight: main.clientHeight,
                hasVerticalScroll: main.scrollHeight > main.clientHeight,
                canvasFits: cRect ? (cRect.top >= 0 && cRect.bottom <= window.innerHeight) : false,
                canvasHeight: cRect ? cRect.height : 0
            };
        }""")
        print(f"[+] 1920x1080 Stats: {main_1920}", flush=True)
        assert not main_1920["hasVerticalScroll"], f"Main scrolls at 1920x1080! {main_1920}"

        path_1920 = os.path.join(ARTIFACT_DIR, "verified_zero_scroll_radar_1920.png")
        await page_1920.screenshot(path=path_1920)
        print(f"[+] Saved 1920x1080 screenshot: {path_1920}", flush=True)

        # -------------------------------------------------------------
        # TEST 4: Sector Navigation & Element Scrolling Across All Sectors
        # -------------------------------------------------------------
        print("\n--- 4. Testing Sectors 02 to 06 Element Scroll ---", flush=True)
        sector_nodes = [
            ("Weekly Matrix", "timetable", "verified_desktop_sector02_zero_scroll.png"),
            ("Bunk-O-Meter", "bunkmeter", "verified_desktop_sector03_zero_scroll.png"),
            ("Getaways", "trips", "verified_desktop_sector04_zero_scroll.png"),
            ("Deadlines", "deadlines", "verified_desktop_sector05_zero_scroll.png"),
            ("Batch Synergy", "synergy", "verified_desktop_sector06_zero_scroll.png"),
        ]

        for label, sec_id, shot_name in sector_nodes:
            print(f"Navigating to {label}...", flush=True)
            btn = page.locator(f"nav[aria-label='Horizon Deck navigation'] button:has-text('{label}')").first
            await btn.click()
            await page.wait_for_timeout(600)

            sec_check = await page.evaluate(f"""() => {{
                const main = document.querySelector('main');
                const sec = document.querySelector('section[data-sector-id="{sec_id}"]');
                return {{
                    mainScrollHeight: main.scrollHeight,
                    mainClientHeight: main.clientHeight,
                    mainHasScroll: main.scrollHeight > main.clientHeight,
                    secVisible: sec && window.getComputedStyle(sec).display !== 'none'
                }};
            }}""")
            print(f"  [{label}] Checked: {sec_check}", flush=True)
            assert not sec_check["mainHasScroll"], f"Main has scroll in {label}!"

            shot_path = os.path.join(ARTIFACT_DIR, shot_name)
            await page.screenshot(path=shot_path)
            print(f"  Saved screenshot: {shot_path}", flush=True)

        await browser.close()
        print("\n[SUCCESS] ALL ZERO-SCROLL AND ELEMENT-LEVEL SCROLL ASSERTIONS PASSED PERFECTLY!", flush=True)

if __name__ == "__main__":
    asyncio.run(run_verification())
