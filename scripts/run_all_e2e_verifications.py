import subprocess
import time
import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = r"c:\Users\Janmejai\Documents\antigravity\jolly-meitner\xlflow"

TESTS = [
    ("Social Server (Port 3101) REST & WebSocket Suite", ["bun", "scripts/verify_backend_social.js"]),
    ("Mathematical Engines & Bunk-O-Meter Suite", ["bun", "scripts/verify_math_engines.js"]),
    ("MCP Server (Port 3100) Tool Catalog & RPC Suite", ["bun", "scripts/verify_mcp_server.js"]),
    ("Manifest V3 Chrome Extension Integrity Suite", ["python", "scripts/verify_extension_integrity.py"])
]

def main():
    print("=" * 80)
    print("🚀 XL-FLOW MASTER INTEGRATION & SYSTEM VERIFICATION DECK 🚀")
    print("=" * 80)
    print(f"Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Directory: {ROOT_DIR}\n")

    overall_start = time.time()
    results = []

    for name, cmd in TESTS:
        print(f"\n>>> Running: {name}")
        print(f"    Command: {' '.join(cmd)}")
        start_t = time.time()
        proc = subprocess.run(cmd, cwd=ROOT_DIR, capture_output=True, text=True, encoding='utf-8', errors='replace')
        duration = time.time() - start_t
        
        status = "PASSED" if proc.returncode == 0 else "FAILED"
        print(proc.stdout)
        if proc.stderr:
            print("[STDERR]", proc.stderr)
        
        results.append({
            "name": name,
            "status": status,
            "code": proc.returncode,
            "duration": round(duration, 2)
        })

    total_duration = round(time.time() - overall_start, 2)
    print("\n" + "=" * 80)
    print("📊 MASTER VERIFICATION EXECUTIVE SUMMARY")
    print("=" * 80)
    all_passed = True
    for r in results:
        sym = "✅" if r["status"] == "PASSED" else "❌"
        print(f"{sym} {r['name']:<55} | Status: {r['status']} (Code {r['code']}) | {r['duration']}s")
        if r["status"] != "PASSED":
            all_passed = False

    print("-" * 80)
    print(f"Total Execution Time: {total_duration}s")
    if all_passed:
        print("🎉 ALL 4 TEST SUITES PASSED SUCCESSFULLY (100% GREEN)!")
    else:
        print("⚠️ SOME TESTS FAILED!")
    print("=" * 80)

    if not all_passed:
        sys.exit(1)

if __name__ == "__main__":
    main()
