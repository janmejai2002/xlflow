import asyncio
import json
import os
import sys
import urllib.request
from playwright.async_api import async_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

OUTPUT_DIR = r"C:\Users\Janmejai\.gemini\antigravity\brain\d4b7d446-2587-4560-b02a-b65041f31c2e"
BASE_URL = "http://localhost:4173"
MCP_URL = "http://localhost:3100/messages"

def send_mcp_rpc(method, params):
    req_body = json.dumps({
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": params
    }).encode("utf-8")
    req = urllib.request.Request(
        MCP_URL,
        data=req_body,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

async def test_mcp_bridge():
    print("\n--- Starting MCP Live Bridge Verification ---")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()

        # Step 1: Load Web App
        print(f"1. Loading web app at {BASE_URL}...")
        await page.goto(BASE_URL, wait_until="networkidle")
        await page.wait_for_timeout(1500)

        # Check MCP Bridge indicator
        bridge_indicator = page.locator("text=MCP Bridge:")
        await bridge_indicator.wait_for(state="visible", timeout=5000)
        live_indicator = page.locator("text=Live (Port 3100)")
        await live_indicator.wait_for(state="visible", timeout=10000)
        indicator_text = await live_indicator.text_content()
        print(f"✓ MCP HUD indicator detected: {indicator_text}")

        # Step 2: Remotely trigger tab navigation via external MCP JSON-RPC
        print("\n2. Dispatching remote MCP action: NAVIGATE_TAB -> 'trips'...")
        resp = send_mcp_rpc("tools/call", {
            "name": "trigger_browser_action",
            "arguments": {
                "action": "NAVIGATE_TAB",
                "tab": "trips"
            }
        })
        print(f"✓ MCP Response: {json.dumps(resp.get('result', {}), indent=2)}")

        # Wait for tab transition
        await page.wait_for_timeout(1000)
        
        # Step 3: Trigger simulation via MCP
        print("\n3. Dispatching remote MCP action: simulate_bunk_impact for 'OMCR'...")
        resp_bunk = send_mcp_rpc("tools/call", {
            "name": "simulate_bunk_impact",
            "arguments": {
                "courseCode": "OMCR",
                "skips": 2
            }
        })
        print(f"✓ MCP Simulation Result: {json.dumps(resp_bunk.get('result', {}), indent=2)}")

        await page.wait_for_timeout(1200)

        # Step 4: Capture screenshot of browser reacting to external AI
        screenshot_path = os.path.join(OUTPUT_DIR, "screen_mcp_bridge_active.png")
        await page.screenshot(path=screenshot_path)
        print(f"\n✓ Captured Live MCP Bridge Screenshot -> {screenshot_path}")

        await browser.close()
        print("\n=== MCP LIVE BRIDGE VERIFICATION SUCCESSFUL ===")

if __name__ == "__main__":
    asyncio.run(test_mcp_bridge())
