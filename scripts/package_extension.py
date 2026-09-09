import os
import shutil
import zipfile
import subprocess
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

def package_extension():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    ext_dir = os.path.join(base_dir, "extension")
    dist_dir = os.path.join(base_dir, "dist")
    stage_dir = os.path.join(base_dir, "build_extension")
    zip_path = os.path.join(dist_dir, "xlflow-extension.zip")

    print("=" * 70)
    print("XL-FLOW CHROME/EDGE MANIFEST V3 PACKAGING ENGINE")
    print("=" * 70)

    # 1. Verify dist exists or run build
    if not os.path.exists(dist_dir):
        print("[*] Running 'npm run build'...")
        subprocess.run(["npm", "run", "build"], cwd=base_dir, check=True)
    else:
        print("[✓] Found existing dist/ build bundle.")

    # 2. Clean & prepare staging directory
    if os.path.exists(stage_dir):
        shutil.rmtree(stage_dir)
    os.makedirs(stage_dir, exist_ok=True)
    os.makedirs(os.path.join(stage_dir, "icons"), exist_ok=True)

    # 3. Copy extension core files
    core_files = ["manifest.json", "content.js", "content.css", "background.js", "popup.html"]
    for f in core_files:
        src = os.path.join(ext_dir, f)
        dst = os.path.join(stage_dir, f)
        if os.path.exists(src):
            shutil.copy2(src, dst)
            print(f"[+] Staged {f}")
        else:
            print(f"[!] Warning: missing {f}")

    # 4. Generate high-fidelity rasterized PNG icons using Pillow
    from PIL import Image, ImageDraw
    for size in [16, 48, 128]:
        img = Image.new("RGBA", (size, size), (15, 23, 42, 255))
        draw = ImageDraw.Draw(img)
        pad = max(1, size // 8)
        draw.ellipse([pad, pad, size - pad, size - pad], outline=(2, 132, 199, 220), width=max(1, size // 16))
        core_pad = max(2, size // 3)
        draw.ellipse([core_pad, core_pad, size - core_pad, size - core_pad], fill=(22, 163, 74, 255))
        png_dest = os.path.join(stage_dir, "icons", f"icon{size}.png")
        img.save(png_dest, "PNG")
    print("[+] Generated high-resolution PNG icons (16px, 48px, 128px).")

    # 5. Copy built webapp into staging
    shutil.copytree(dist_dir, os.path.join(stage_dir, "dist"), dirs_exist_ok=True)
    print("[+] Staged compiled application into build_extension/dist/")

    # 6. Create ZIP bundle
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(stage_dir):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, stage_dir)
                zipf.write(full_path, rel_path)

    zip_size_kb = os.path.getsize(zip_path) / 1024
    print("\n" + "=" * 70)
    print(f"[SUCCESS] Extension Packaged: {zip_path} ({zip_size_kb:.1f} KB)")
    print(f"[SUCCESS] Unpacked Directory: {stage_dir}")
    print("=" * 70)
    print("\nINSTALLATION INSTRUCTIONS:")
    print("1. Open Chrome or Edge and navigate to: chrome://extensions")
    print("2. Toggle 'Developer mode' (top right).")
    print(f"3. Click 'Load unpacked' and select the folder:\n   {stage_dir}")
    print("4. Navigate to https://xlerp.xlri.ac.in and witness the in-page HUD pill!\n")

if __name__ == "__main__":
    package_extension()
