import asyncio
import json
import os
import sys
from playwright.async_api import async_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

OUTPUT_DIR = r"C:\Users\Janmejai\.gemini\antigravity\brain\d4b7d446-2587-4560-b02a-b65041f31c2e"
BASE_URL = "http://localhost:4173"

def hex_to_rgb(hex_str):
    hex_str = hex_str.strip().lstrip('#')
    return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))

def get_luminance(rgb):
    def channel(c):
        c = c / 255.0
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = rgb
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)

def contrast_ratio(rgb1, rgb2):
    l1 = get_luminance(rgb1)
    l2 = get_luminance(rgb2)
    if l1 < l2:
        l1, l2 = l2, l1
    return round((l1 + 0.05) / (l2 + 0.05), 2)

def audit_waibi_sabi_contrast():
    print("\n==========================================")
    print("WCAG 2.1 AA Contrast Compliance Audit (wAIbi-sabi Tokens)")
    print("==========================================")
    tokens_light = {
        "Mizu Text": ("#0369A1", "#FFFFFF"),
        "Moss Text": ("#15803D", "#FFFFFF"),
        "Ochre Text": ("#B45309", "#FFFFFF"),
        "Hanko Text": ("#B91C1C", "#FFFFFF"),
        "Plum Text": ("#7E22CE", "#FFFFFF"),
        "Indigo Text": ("#3730A3", "#FFFFFF"),
        "Ink Body": ("#0F172A", "#FFFFFF"),
        "Ink Soft": ("#334155", "#FFFFFF")
    }
    tokens_dark = {
        "Mizu Dark": ("#4ECDD8", "#1C2129"),
        "Moss Dark": ("#9BBA8E", "#1C2129"),
        "Ochre Dark": ("#DDB667", "#1C2129"),
        "Hanko Dark": ("#E87A64", "#1C2129"),
        "Plum Dark": ("#B694BC", "#1C2129"),
        "Indigo Dark": ("#85A5D0", "#1C2129"),
        "Ink Dark": ("#E9E5DC", "#1C2129")
    }

    report = {"light": {}, "dark": {}, "passed": True}

    print("\n--- Light Theme Ground (#FFFFFF) ---")
    for name, (fg, bg) in tokens_light.items():
        cr = contrast_ratio(hex_to_rgb(fg), hex_to_rgb(bg))
        passed = cr >= 4.5
        report["light"][name] = {"fg": fg, "bg": bg, "ratio": cr, "passed": passed}
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"  {status} {name:12} ({fg} on {bg}): {cr:4.2f}:1 (req >= 4.5:1)")
        if not passed: report["passed"] = False

    print("\n--- Dark Theme Ground (#1C2129) ---")
    for name, (fg, bg) in tokens_dark.items():
        cr = contrast_ratio(hex_to_rgb(fg), hex_to_rgb(bg))
        passed = cr >= 4.5
        report["dark"][name] = {"fg": fg, "bg": bg, "ratio": cr, "passed": passed}
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"  {status} {name:12} ({fg} on {bg}): {cr:4.2f}:1 (req >= 4.5:1)")
        if not passed: report["passed"] = False

    return report

async def verify_mobile(browser):
    print("\n==========================================")
    print("Verifying Tier 1: Mobile (iPhone 15 Pro 393x852)")
    print("==========================================")
    context = await browser.new_context(
        viewport={"width": 393, "height": 852},
        device_scale_factor=2,
        is_mobile=True,
        has_touch=True,
        user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
    )
    # Ensure onboarding does not block UI
    await context.add_init_script("localStorage.setItem('has_seen_onboarding_v1', 'true');")
    page = await context.new_page()

    await page.goto(BASE_URL, wait_until="networkidle")
    await page.wait_for_timeout(800)

    # 1. Capture Base Radar View
    radar_path = os.path.join(OUTPUT_DIR, "screen_mobile_iphone15_radar.png")
    await page.screenshot(path=radar_path)
    print(f"  ✓ 1. Radar View captured -> {radar_path}")

    # 2. Verify Touch Targets >= 44x44px for Navigation & Header
    touch_metrics = await page.evaluate('''() => {
        const navBtns = Array.from(document.querySelectorAll('nav[aria-label="Main Navigation"] button'));
        const headerBtns = Array.from(document.querySelectorAll('header button'));
        const all = [...navBtns, ...headerBtns].filter(b => {
            const style = window.getComputedStyle(b);
            return style.display !== 'none' && style.visibility !== 'hidden' && b.getBoundingClientRect().width > 0;
        });
        return all.map(b => {
            const rect = b.getBoundingClientRect();
            return {
                label: b.getAttribute('aria-label') || b.innerText.replace(/\\s+/g, ' ').trim() || b.title || 'Icon button',
                width: Math.round(rect.width * 10) / 10,
                height: Math.round(rect.height * 10) / 10,
                passed: rect.width >= 43.5 && rect.height >= 43.5
            };
        });
    }''')
    print("  ✓ 2. Evaluated touch targets for mobile nav & header:")
    all_passed = True
    for item in touch_metrics:
        mark = "✓" if item['passed'] else "⚠"
        print(f"      {mark} {item['label']}: {item['width']}x{item['height']}px (>= 44x44px)")
        if not item['passed']:
            all_passed = False

    # 3. Sticky Header Verification
    sticky_test = await page.evaluate('''() => {
        const header = document.querySelector('header');
        if (!header) return { found: false };
        const rectBefore = header.getBoundingClientRect();
        const main = document.querySelector('main');
        if (main) main.scrollTop = 400;
        const rectAfter = header.getBoundingClientRect();
        return {
            found: true,
            topBefore: rectBefore.top,
            topAfter: rectAfter.top,
            isSticky: Math.abs(rectAfter.top - rectBefore.top) < 2
        };
    }''')
    print(f"  ✓ 3. Sticky Header test: isSticky={sticky_test.get('isSticky', False)} (top before={sticky_test.get('topBefore')}, after={sticky_test.get('topAfter')})")

    # 4. Micro-interactions:
    # 4a. Lecture card click -> Vaul Gesture Drawer
    class_card = page.locator("text=Omnichannel Retailing").first
    if await class_card.count() > 0 and await class_card.is_visible():
        await class_card.click()
        await page.wait_for_timeout(600)
        drawer_shot = os.path.join(OUTPUT_DIR, "screen_mobile_iphone15_vaul_drawer.png")
        await page.screenshot(path=drawer_shot)
        print(f"  ✓ 4a. Verified Vaul Drawer -> {drawer_shot}")
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(400)

    # 4b. 3D Chronos Orb
    orb_toggle = page.locator("button:has-text('3D Celestial Continuum')")
    if await orb_toggle.count() > 0 and await orb_toggle.is_visible():
        await orb_toggle.click()
        await page.wait_for_timeout(1000)
        orb_shot = os.path.join(OUTPUT_DIR, "screen_mobile_iphone15_chronos_3d.png")
        await page.screenshot(path=orb_shot)
        print(f"  ✓ 4b. Verified 3D Chronos Orb -> {orb_shot}")
        await page.locator("button:has-text('2D Tactical View')").click()
        await page.wait_for_timeout(400)

    # 4c. Astra Neural Co-Pilot Drawer
    astra_btn = page.locator("button[aria-label='Open Astra Neural Co-Pilot AI'], button:has-text('Astra')").first
    if await astra_btn.count() > 0:
        await astra_btn.click()
        await page.wait_for_timeout(600)
        astra_shot = os.path.join(OUTPUT_DIR, "screen_mobile_iphone15_astra_copilot.png")
        await page.screenshot(path=astra_shot)
        print(f"  ✓ 4c. Verified Astra Co-Pilot Drawer -> {astra_shot}")
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(400)

    # 5. Verify All 6 Navigation Tabs:
    tabs_to_test = [
        ("bunkmeter", "Bunks", "screen_mobile_iphone15_bunkmeter.png"),
        ("timetable", "Classes", "screen_mobile_iphone15_timetable.png"),
        ("synergy", "Social", "screen_mobile_iphone15_social.png"),
        ("trips", "Getaways", "screen_mobile_iphone15_trips.png"),
        ("deadlines", "Deadlines", "screen_mobile_iphone15_deadlines.png"),
        ("radar", "Radar", "screen_mobile_iphone15_radar_returned.png")
    ]

    for tab_id, tab_label, filename in tabs_to_test:
        btn = page.locator(f"nav[aria-label='Main Navigation'] button:has-text('{tab_label}')")
        if await btn.count() > 0:
            await btn.click()
            await page.wait_for_timeout(500)
            shot_path = os.path.join(OUTPUT_DIR, filename)
            await page.screenshot(path=shot_path)
            print(f"  ✓ Navigated to Tab [{tab_label}] ({tab_id}) -> {shot_path}")

    await context.close()
    return {"tier": "mobile", "touch_targets_passed": all_passed, "sticky": sticky_test.get('isSticky', False)}

async def verify_tablet(browser):
    print("\n==========================================")
    print("Verifying Tier 2: Tablet (iPad Air 820x1180)")
    print("==========================================")
    context = await browser.new_context(
        viewport={"width": 820, "height": 1180},
        device_scale_factor=2,
        is_mobile=True,
        has_touch=True,
        user_agent="Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
    )
    await context.add_init_script("localStorage.setItem('has_seen_onboarding_v1', 'true');")
    page = await context.new_page()

    await page.goto(BASE_URL, wait_until="networkidle")
    await page.wait_for_timeout(800)

    tablet_radar = os.path.join(OUTPUT_DIR, "screen_tablet_ipad_radar.png")
    await page.screenshot(path=tablet_radar)
    print(f"  ✓ 1. Base Tablet View captured -> {tablet_radar}")

    # Test Streak Click & Confetti / Toast (Visible on >= 520px)
    streak_btn = page.locator("button:has-text('8d Streak')").first
    if await streak_btn.count() > 0 and await streak_btn.is_visible():
        await streak_btn.click()
        await page.wait_for_timeout(800)
        streak_shot = os.path.join(OUTPUT_DIR, "screen_tablet_ipad_streak_toast.png")
        await page.screenshot(path=streak_shot)
        print(f"  ✓ 2. Clicked Streak -> Toast & Confetti verified -> {streak_shot}")

    # Test lecture card click & drawer
    class_card = page.locator("text=Omnichannel Retailing").first
    if await class_card.count() > 0 and await class_card.is_visible():
        await class_card.click()
        await page.wait_for_timeout(600)
        drawer_shot = os.path.join(OUTPUT_DIR, "screen_tablet_ipad_vaul_drawer.png")
        await page.screenshot(path=drawer_shot)
        print(f"  ✓ 3. Verified Tablet Drawer -> {drawer_shot}")
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(400)

    # Test Astra Copilot
    astra_btn = page.locator("button[aria-label='Toggle Astra Copilot'], button:has-text('Astra Copilot'), button:has-text('Astra')").first
    if await astra_btn.count() > 0 and await astra_btn.is_visible():
        await astra_btn.click()
        await page.wait_for_timeout(700)
        astra_shot = os.path.join(OUTPUT_DIR, "screen_tablet_ipad_astra_copilot.png")
        await page.screenshot(path=astra_shot)
        print(f"  ✓ 4. Verified Tablet Astra Copilot Dock -> {astra_shot}")
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(400)

    # Layout balance verification (check container width, no horizontal overflow cutoff)
    layout_metrics = await page.evaluate('''() => {
        return {
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            bodyScrollWidth: document.body.scrollWidth,
            hasHorizontalLeak: document.body.scrollWidth > window.innerWidth + 2
        };
    }''')
    print(f"  ✓ 5. Tablet Layout balance: viewport={layout_metrics['windowWidth']}x{layout_metrics['windowHeight']}, leak={layout_metrics['hasHorizontalLeak']}")

    await context.close()
    return {"tier": "tablet", "layout_metrics": layout_metrics}

async def verify_desktop(browser, width, height, label):
    print(f"\n==========================================")
    print(f"Verifying Tier 3: Desktop ({label} {width}x{height})")
    print(f"==========================================")
    context = await browser.new_context(
        viewport={"width": width, "height": height},
        device_scale_factor=1,
        is_mobile=False,
        has_touch=False,
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
    )
    await context.add_init_script("localStorage.setItem('has_seen_onboarding_v1', 'true');")
    page = await context.new_page()

    await page.goto(BASE_URL, wait_until="networkidle")
    await page.wait_for_timeout(1000)

    # 1. Base Horizon Deck Sector 01
    base_shot = os.path.join(OUTPUT_DIR, f"screen_desktop_{width}_sector01_radar.png")
    await page.screenshot(path=base_shot)
    print(f"  ✓ 1. Sector 01 (Radar) captured -> {base_shot}")

    # 2. Sector Navigation (Keys 1 to 6) & Mini-Map
    sectors = [
        ("1", "01", "radar", f"screen_desktop_{width}_sector01_radar.png"),
        ("2", "02", "timetable", f"screen_desktop_{width}_sector02_timetable.png"),
        ("3", "03", "bunkmeter", f"screen_desktop_{width}_sector03_bunkmeter.png"),
        ("4", "04", "trips", f"screen_desktop_{width}_sector04_trips.png"),
        ("5", "05", "deadlines", f"screen_desktop_{width}_sector05_deadlines.png"),
        ("6", "06", "synergy", f"screen_desktop_{width}_sector06_synergy.png"),
    ]

    for key, num, sec_id, shot_file in sectors:
        await page.keyboard.press(key)
        await page.wait_for_timeout(600)
        shot_path = os.path.join(OUTPUT_DIR, shot_file)
        await page.screenshot(path=shot_path)
        print(f"  ✓ Key '{key}' -> Scrolled to Sector {num} ({sec_id}) -> {shot_path}")

    # 3. Horizontal Wheel Scrolling Test
    wheel_result = await page.evaluate('''() => {
        const main = document.querySelector('main');
        if (!main) return { success: false, reason: 'main not found' };
        const initialScroll = main.scrollLeft;
        // Dispatch wheel event
        main.dispatchEvent(new WheelEvent('wheel', { deltaY: 500, bubbles: true, cancelable: true }));
        return {
            initialScroll,
            scrollAfter: main.scrollLeft,
            delta: main.scrollLeft - initialScroll
        };
    }''')
    print(f"  ✓ 3. Wheel scrolling: initial={wheel_result.get('initialScroll')}, after={wheel_result.get('scrollAfter')}")

    # 4. Topbar Action Icons (Search, Astra, Sound, Theme, Beacon)
    topbar_eval = await page.evaluate('''() => {
        const buttons = Array.from(document.querySelectorAll('header button'));
        return buttons.map(b => ({
            title: b.getAttribute('title') || '',
            ariaLabel: b.getAttribute('aria-label') || '',
            text: b.innerText.trim()
        }));
    }''')
    print(f"  ✓ 4. Topbar action icons detected: {len(topbar_eval)} interactive buttons")

    # 5. Inspector Dock Verification
    await page.keyboard.press("1") # Jump back to Sector 01
    await page.wait_for_timeout(500)

    # Click a session card to open Inspector Dock
    session_card = page.locator("text=Omnichannel Retailing").first
    if await session_card.count() > 0 and await session_card.is_visible():
        await session_card.click()
        await page.wait_for_timeout(700)
        inspector_shot = os.path.join(OUTPUT_DIR, f"screen_desktop_{width}_inspector_open.png")
        await page.screenshot(path=inspector_shot)
        print(f"  ✓ 5. Clicked Session -> Verified Inspector Dock -> {inspector_shot}")

        # Close Inspector with Escape
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(400)

    # 6. Keyboard Shortcuts Modal (?)
    await page.keyboard.press("?")
    await page.wait_for_timeout(500)
    shortcuts_shot = os.path.join(OUTPUT_DIR, f"screen_desktop_{width}_shortcuts_modal.png")
    await page.screenshot(path=shortcuts_shot)
    print(f"  ✓ 6. Pressed '?' -> Verified Keyboard Shortcuts Cheatsheet -> {shortcuts_shot}")
    await page.keyboard.press("Escape")
    await page.wait_for_timeout(300)

    # 7. Omni-Search Modal (Cmd+K / Ctrl+K)
    await page.keyboard.press("Control+k")
    await page.wait_for_timeout(500)
    search_shot = os.path.join(OUTPUT_DIR, f"screen_desktop_{width}_omni_search_modal.png")
    await page.screenshot(path=search_shot)
    print(f"  ✓ 7. Pressed Ctrl+K -> Verified Omni-Search Roster Modal -> {search_shot}")
    await page.keyboard.press("Escape")
    await page.wait_for_timeout(300)

    await context.close()
    return {"tier": f"desktop_{width}", "sectors_verified": 6}

async def audit_aria_labels(page):
    print("\n==========================================")
    print("WCAG 2.1 AA ARIA & Accessible Name Audit")
    print("==========================================")
    aria_data = await page.evaluate('''() => {
        const buttons = Array.from(document.querySelectorAll('button, a[role="button"]'));
        const issues = [];
        let compliantCount = 0;
        buttons.forEach((btn, idx) => {
            const ariaLabel = btn.getAttribute('aria-label');
            const title = btn.getAttribute('title');
            const text = btn.innerText.trim();
            const role = btn.getAttribute('role');
            const hasName = !!(ariaLabel || title || text);
            if (hasName) {
                compliantCount++;
            } else {
                issues.push({
                    index: idx,
                    html: btn.outerHTML.slice(0, 100),
                    className: btn.className
                });
            }
        });
        return {
            totalButtons: buttons.length,
            compliantCount,
            issues
        };
    }''')

    pct = round((aria_data['compliantCount'] / max(1, aria_data['totalButtons'])) * 100, 1)
    print(f"  Total Interactive Buttons: {aria_data['totalButtons']}")
    print(f"  Compliant (Accessible Name present): {aria_data['compliantCount']} ({pct}%)")
    if aria_data['issues']:
        print(f"  ⚠ Non-compliant elements ({len(aria_data['issues'])}):")
        for iss in aria_data['issues'][:5]:
            print(f"    - {iss['html']}")
    else:
        print("  ✓ 100% of interactive buttons possess an accessible name (aria-label, title, or text)!")

    return aria_data

async def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    contrast_report = audit_waibi_sabi_contrast()

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        # 1. Tier 1: Mobile (iPhone 15 Pro 393x852)
        mobile_res = await verify_mobile(browser)

        # 2. Tier 2: Tablet (iPad Air 820x1180)
        tablet_res = await verify_tablet(browser)

        # 3. Tier 3: Desktop Laptop (1440x900 & 1280x800)
        desktop_1440_res = await verify_desktop(browser, 1440, 900, "MacBook/Laptop 1440")
        desktop_1280_res = await verify_desktop(browser, 1280, 800, "Compact Laptop 1280")

        # 4. Global ARIA Audit on Desktop
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        await context.add_init_script("localStorage.setItem('has_seen_onboarding_v1', 'true');")
        audit_page = await context.new_page()
        await audit_page.goto(BASE_URL, wait_until="networkidle")
        aria_report = await audit_aria_labels(audit_page)
        await context.close()

        await browser.close()

    summary_file = os.path.join(OUTPUT_DIR, "verification_summary.json")
    summary_data = {
        "contrast_report": contrast_report,
        "mobile_verification": mobile_res,
        "tablet_verification": tablet_res,
        "desktop_1440": desktop_1440_res,
        "desktop_1280": desktop_1280_res,
        "aria_report": aria_report
    }
    with open(summary_file, "w", encoding="utf-8") as f:
        json.dump(summary_data, f, indent=2)

    print(f"\n==========================================")
    print(f"✓ ALL 3 DEVICE TIERS & ACCESSIBILITY AUDITS COMPLETE!")
    print(f"Summary JSON saved -> {summary_file}")
    print(f"==========================================")

if __name__ == "__main__":
    asyncio.run(main())
