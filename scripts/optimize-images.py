#!/usr/bin/env python3
"""Genera variantes WebP sin metadatos desde fotografías referenciales existentes."""
from pathlib import Path
from PIL import Image, ImageOps

BASE = Path(__file__).resolve().parents[1] / 'assets' / 'photos'
for name in ('nueva-maipu', 'cipreses'):
    with Image.open(BASE / f'{name}.jpg') as source:
        for width in (480, 960):
            image = ImageOps.exif_transpose(source).convert('RGB')
            image.thumbnail((width, width * 2))
            output = BASE / f'{name}-{width}.webp'
            image.save(output, 'WEBP', quality=78, method=6)
            print(f'{output.name}: {image.width}x{image.height}, {output.stat().st_size} bytes')
