#!/usr/bin/env bash
# Report the largest shipped image assets and estimate WebP savings when cwebp is available.
set -euo pipefail

cd "$(dirname "$0")/.."

LIMIT="${LIMIT:-15}"
MIN_KB="${MIN_KB:-200}"

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required for image auditing"
  exit 1
fi

echo "Largest image assets in repo (>= ${MIN_KB} kB)"
echo

python3 - "$LIMIT" "$MIN_KB" <<'PY'
import os
import subprocess
import sys
import tempfile
from pathlib import Path

limit = int(sys.argv[1])
min_kb = int(sys.argv[2])
root = Path(".")
asset_roots = [root / "public", root / "src" / "app" / "assets"]
extensions = {".png", ".jpg", ".jpeg", ".webp", ".avif"}

files = []
for asset_root in asset_roots:
    if not asset_root.exists():
        continue
    for path in asset_root.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in extensions:
            continue
        size = path.stat().st_size
        if size >= min_kb * 1024:
            files.append((size, path))

files.sort(reverse=True)
files = files[:limit]

has_cwebp = subprocess.run(
    ["bash", "-lc", "command -v cwebp >/dev/null 2>&1"],
    capture_output=True,
).returncode == 0

if not files:
    print("No image assets above the current threshold.")
    sys.exit(0)

for size, path in files:
    rel = path.relative_to(root)
    size_kb = size / 1024
    line = f"{size_kb:8.1f} kB  {rel}"

    if has_cwebp and path.suffix.lower() in {".png", ".jpg", ".jpeg"}:
      with tempfile.NamedTemporaryFile(suffix=".webp") as tmp:
        result = subprocess.run(
            ["cwebp", "-quiet", "-q", "82", str(path), "-o", tmp.name],
            capture_output=True,
        )
        if result.returncode == 0:
            webp_size = Path(tmp.name).stat().st_size
            savings = max(0.0, (1 - (webp_size / size)) * 100)
            line += f"  -> webp {webp_size / 1024:7.1f} kB ({savings:4.0f}% smaller)"

    print(line)
PY
