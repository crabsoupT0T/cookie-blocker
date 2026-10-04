#!/usr/bin/env python3
"""Write the extension icons. Run once after cloning if icons/ is empty."""
import struct, zlib
from pathlib import Path

def png(size, rgba_fn):
    rows = []
    for y in range(size):
        row = bytearray(b"\x00")
        for x in range(size):
            row.extend(rgba_fn(x, y))
        rows.append(bytes(row))
    raw = b"".join(rows)
    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff)
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")

def icon(size):
    def px(x, y):
        cx = cy = (size - 1) / 2
        dx, dy = x - cx, y - cy
        r = (dx * dx + dy * dy) ** 0.5
        m = size * 0.08
        inside = m <= x < size - m and m <= y < size - m
        if abs(dx - dy) < size * 0.055 and r < size * 0.42 and inside:
            return (220, 60, 55, 255)
        if r < size * 0.32:
            return (214, 164, 90, 255)
        if inside:
            return (28, 32, 40, 255)
        return (0, 0, 0, 0)
    return png(size, px)

out = Path(__file__).resolve().parent / "icons"
out.mkdir(exist_ok=True)
for s in (16, 48, 128):
    (out / f"icon{s}.png").write_bytes(icon(s))
print("wrote", out)
