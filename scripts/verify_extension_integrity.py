import json
import os
import sys
import zipfile

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = r"c:\Users\Janmejai\Documents\antigravity\jolly-meitner\xlflow"
BUILD_DIR = os.path.join(ROOT_DIR, "build_extension")
ZIP_PATH = os.path.join(ROOT_DIR, "dist", "xlflow-extension.zip")

def run_extension_suite():
    print("================================================================")
    print("📦 XL-FLOW MANIFEST V3 CHROME EXTENSION VERIFICATION SUITE 📦")
    print("================================================================\n")

    passed = 0
    total = 0

    def test_assert(cond, name, details=""):
        nonlocal passed, total
        total += 1
        if cond:
            passed += 1
            print(f"  ✅ [PASS] {name}")
            if details:
                print(f"     ↳ {details}")
        else:
            print(f"  ❌ [FAIL] {name}")
            if details:
                print(f"     ↳ {details}")
            raise AssertionError(f"Assertion failed: {name}")

    # =========================================================================
    # 1. Inspect build_extension/manifest.json
    # =========================================================================
    print("--- 1. Manifest V3 Schema & Policy Validation ---")
    manifest_path = os.path.join(BUILD_DIR, "manifest.json")
    test_assert(os.path.isfile(manifest_path), "build_extension/manifest.json exists on disk")
    
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    test_assert(manifest.get("manifest_version") == 3, "manifest_version is exactly 3 (Manifest V3 compliant)")
    test_assert(bool(manifest.get("name")), f"Extension name declared: '{manifest.get('name')}'")
    test_assert(bool(manifest.get("version")), f"Extension version declared: '{manifest.get('version')}'")
    test_assert(bool(manifest.get("description")), "Extension description present")

    # Background Service Worker
    bg = manifest.get("background", {})
    test_assert(bg.get("service_worker") == "background.js", "Service worker defined as 'background.js'")
    test_assert(bg.get("type") == "module", "Service worker type is 'module' (ESM support)")

    # Permissions
    permissions = manifest.get("permissions", [])
    test_assert("storage" in permissions, "permissions includes 'storage'")
    test_assert("alarms" in permissions, "permissions includes 'alarms'")

    # Host permissions
    host_perms = manifest.get("host_permissions", [])
    test_assert("https://xlerp.xlri.ac.in/*" in host_perms, "host_permissions grants access to XLRI ERP (https://xlerp.xlri.ac.in/*)")

    # Content Scripts
    content_scripts = manifest.get("content_scripts", [])
    test_assert(len(content_scripts) >= 1, "At least one content script rule defined")
    cs = content_scripts[0]
    test_assert("https://xlerp.xlri.ac.in/*" in cs.get("matches", []), "Content script targets XLRI ERP match pattern")
    test_assert("content.js" in cs.get("js", []), "Content script includes 'content.js'")
    test_assert("content.css" in cs.get("css", []), "Content script includes 'content.css'")
    test_assert(cs.get("run_at") == "document_idle", "Content script run_at is 'document_idle' for optimal page load")

    # Action Popup
    action = manifest.get("action", {})
    test_assert(action.get("default_popup") == "popup.html", "Action popup declared as 'popup.html'")
    test_assert(bool(action.get("default_title")), f"Action default title set: '{action.get('default_title')}'")

    # Icons specification
    icons = manifest.get("icons", {})
    test_assert("16" in icons and "48" in icons and "128" in icons, "Standard icon sizes (16, 48, 128) defined in manifest")

    # CSP
    csp = manifest.get("content_security_policy", {})
    test_assert("script-src 'self'" in csp.get("extension_pages", ""), "CSP conforms to MV3 script-src 'self' isolation")

    # =========================================================================
    # 2. Filesystem Integrity of build_extension/
    # =========================================================================
    print("\n--- 2. Filesystem Asset Verification (build_extension/) ---")
    required_files = [
        ("background.js", 100),
        ("content.js", 1000),
        ("content.css", 500),
        ("popup.html", 200),
        ("icons/icon16.png", 50),
        ("icons/icon48.png", 100),
        ("icons/icon128.png", 200)
    ]

    for rel_path, min_bytes in required_files:
        full_path = os.path.join(BUILD_DIR, rel_path)
        test_assert(os.path.isfile(full_path), f"Asset exists: {rel_path}")
        size = os.path.getsize(full_path)
        test_assert(size >= min_bytes, f"Asset size valid: {rel_path} ({size} bytes >= {min_bytes} bytes)")

    # Verify PNG headers for icons
    png_magic = b"\x89PNG\r\n\x1a\n"
    for icon_file in ["icons/icon16.png", "icons/icon48.png", "icons/icon128.png"]:
        icon_path = os.path.join(BUILD_DIR, icon_file)
        with open(icon_path, "rb") as f:
            header = f.read(8)
            test_assert(header == png_magic, f"Valid PNG magic header for {icon_file}")

    # =========================================================================
    # 3. Zip Package Integrity (dist/xlflow-extension.zip)
    # =========================================================================
    print("\n--- 3. Production Zip Package Validation (dist/xlflow-extension.zip) ---")
    test_assert(os.path.isfile(ZIP_PATH), "dist/xlflow-extension.zip exists on disk")
    test_assert(zipfile.is_zipfile(ZIP_PATH), "xlflow-extension.zip is a valid zip archive")

    zip_size = os.path.getsize(ZIP_PATH)
    test_assert(zip_size > 50000, f"Zip archive is fully bundled (size: {zip_size:,} bytes)")

    with zipfile.ZipFile(ZIP_PATH, "r") as zf:
        # Check CRC / file corruption
        corrupt = zf.testzip()
        test_assert(corrupt is None, "Zip archive passes CRC integrity check (0 corrupt files)")

        entries = zf.namelist()
        print(f"     Archive contains {len(entries)} entries")

        critical_zip_entries = [
            "manifest.json",
            "background.js",
            "content.js",
            "content.css",
            "popup.html",
            "icons/icon16.png",
            "icons/icon48.png",
            "icons/icon128.png",
            "dist/index.html"
        ]
        for entry in critical_zip_entries:
            test_assert(entry in entries, f"Zip entry present: '{entry}'")

        # Compare zip manifest with build manifest
        zip_manifest_raw = zf.read("manifest.json").decode("utf-8")
        zip_manifest = json.loads(zip_manifest_raw)
        test_assert(zip_manifest.get("version") == manifest.get("version"), "Zip manifest matches build manifest version")
        test_assert(zip_manifest.get("manifest_version") == 3, "Zip manifest specifies manifest_version: 3")

    print("\n================================================================")
    print(f"🎉 EXTENSION INTEGRITY RESULTS: {passed}/{total} PASSED (100%)")
    print("================================================================\n")

if __name__ == "__main__":
    run_extension_suite()
