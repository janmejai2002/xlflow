import re

with open(r"term4_gas_app\webapp.js", "r", encoding="utf-8") as f:
    content = f.read()

lines = content.splitlines()
print(f"Total lines: {len(lines)}")
print(f"Total characters: {len(content)}")

# Find server-side functions (before PAGE_TMPL)
page_tmpl_idx = content.find("var PAGE_TMPL = `")
if page_tmpl_idx == -1:
    page_tmpl_idx = content.find("var PAGE_TMPL")
print(f"PAGE_TMPL starts around character {page_tmpl_idx}")

server_code = content[:page_tmpl_idx]
server_lines = server_code.splitlines()
print(f"Server-side code lines: {len(server_lines)}")

# Extract function names in server code
server_funcs = re.findall(r"function\s+([a-zA-Z0-9_]+)\s*\(", server_code)
print("\n--- SERVER-SIDE FUNCTIONS ---")
for fn in server_funcs:
    print(" -", fn)

# Find doPost actions
dopost_code = re.search(r"function doPost\(e\)\s*\{([\s\S]*?)(function|\Z)", server_code)
if dopost_code:
    actions = re.findall(r'case\s+["\']([^"\']+)["\']', dopost_code.group(1))
    print("\n--- POST ACTIONS SUPPORTED ---")
    for a in actions:
        print(" *", a)

# Inspect client-side code (inside PAGE_TMPL)
client_code = content[page_tmpl_idx:]
print(f"\nClient-side code length: {len(client_code)} characters (~{len(client_code.splitlines())} lines)")

# Check what client features exist: search for script tags, JS functions, CSS classes, UI views
client_scripts = re.findall(r"<script>([\s\S]*?)</script>", client_code)
print(f"Found {len(client_scripts)} inline <script> blocks in PAGE_TMPL")

client_funcs = []
for s in client_scripts:
    fns = re.findall(r"function\s+([a-zA-Z0-9_]+)\s*\(", s)
    client_funcs.extend(fns)

print(f"Found {len(client_funcs)} client JS functions.")
print("\nSample client functions (first 30):")
for fn in client_funcs[:30]:
    print(" -", fn)

# Look for client feature sections or comments
client_comments = re.findall(r"//\s*──+([^\n]+)──+", client_code)
print("\n--- CLIENT-SIDE SECTIONS / MODULES ---")
for c in client_comments:
    print(" >", c.strip())
