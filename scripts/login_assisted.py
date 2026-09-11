#!/usr/bin/env python3
"""
Assisted headful login for XLRI ERP.
Opens a visible browser window so you can safely enter your credentials / autofill / 2FA.
Automatically captures the session token and dumps your complete class schedule.
"""

import os
import sys
import time
import json
from pathlib import Path

SRC_DIR = Path(__file__).resolve().parent
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from camoufox.sync_api import Camoufox
from fetch_xlri_classes import fetch_classes, format_schedule_markdown, BASE_DIR


def main():
    print("\n" + "="*60)
    print("  XLRI ERP Assisted Login")
    print("="*60)
    print("[*] Launching visible Camoufox browser...")
    print("[*] Please sign in on the opened browser window.")

    with Camoufox(headless=False) as browser:
        page = browser.new_page()
        page.goto("https://xlerp.xlri.ac.in/login", wait_until="domcontentloaded")

        # Try to pre-fill email if available in .env
        from dotenv import load_dotenv
        load_dotenv(BASE_DIR / ".env")
        email = os.getenv("XLRI_EMAIL", "").strip()
        if email and "your_id" not in email:
            try:
                page.wait_for_selector("#email", timeout=5000)
                page.fill("#email", email)
                print(f"[*] Pre-filled email: {email}")
            except Exception:
                pass

        print("[*] Waiting for you to sign in...")
        token = None
        for _ in range(180):  # Wait up to 3 minutes
            try:
                token = page.evaluate("localStorage.getItem('erp_token')")
                if token:
                    break
            except Exception:
                pass
            time.sleep(1)

        if not token:
            print("[!] Timeout: Login was not completed within 3 minutes.", file=sys.stderr)
            sys.exit(1)

        print("\n[+] Login detected successfully!")
        print("[*] Fetching your class schedule and courses...")
        
        schedule_info = fetch_classes(token)

        # Save JSON
        json_path = BASE_DIR / "xlri_schedule.json"
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(schedule_info, f, indent=2, ensure_ascii=False)
        print(f"[+] Saved raw data to: {json_path}")

        # Save Markdown
        md_content = format_schedule_markdown(schedule_info)
        md_path = BASE_DIR / "xlri_schedule.md"
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(md_content)
        print(f"[+] Saved formatted schedule to: {md_path}")

        print("\n" + "="*60)
        print(md_content)
        print("="*60)


if __name__ == "__main__":
    main()
