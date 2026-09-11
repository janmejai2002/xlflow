import subprocess
import sys

cmd = [r"C:\Users\Janmejai\AppData\Roaming\npm\clasp.cmd", "--version"]
try:
    res = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
    print("Return code:", res.returncode)
    print("STDOUT:", res.stdout)
    print("STDERR:", res.stderr)
except subprocess.TimeoutExpired as e:
    print("Timed out after 10s!")
    print("STDOUT so far:", e.stdout)
    print("STDERR so far:", e.stderr)
