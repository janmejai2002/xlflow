import subprocess
import os

target_dir = os.path.abspath("term4_gas_app")
os.makedirs(target_dir, exist_ok=True)

script_id = "1JEDoa6442rwIWCmu2VwDSv_M4qBkHh999T0XiVCd8P88xonJ1GozEm5t"
cmd = [
    r"C:\Users\Janmejai\AppData\Roaming\npm\clasp.cmd",
    "clone",
    script_id,
    "--rootDir",
    target_dir
]

print("Cloning project:", script_id)
print("Target dir:", target_dir)

res = subprocess.run(cmd, cwd=target_dir, capture_output=True, text=True)
print("Return code:", res.returncode)
print("STDOUT:\n", res.stdout)
print("STDERR:\n", res.stderr)
