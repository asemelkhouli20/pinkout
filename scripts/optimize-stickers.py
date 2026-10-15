"""Regenerate transparent responsive stickers. Requires cwebp on PATH."""
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[1]
for source in sorted((root / "assets/stickers").glob("*.png")):
    for size in (140, 280, 420):
        subprocess.run([
            "cwebp", "-quiet", "-q", "82", "-m", "6",
            "-resize", str(size), str(size), str(source),
            "-o", str(source.with_name(f"{source.stem}-{size}.webp")),
        ], check=True)
