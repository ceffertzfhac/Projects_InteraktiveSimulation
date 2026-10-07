# python3 grid.py out.png a.png b.png c.png d.png — 2×2-Übersicht zum schnellen Durchsehen
import sys
from PIL import Image
W = Image.new('RGB', (1600, 1000), 'white')
for k, f in enumerate(sys.argv[2:6]):
    W.paste(Image.open(f).resize((800, 500)), ((k % 2) * 800, (k // 2) * 500))
W.save(sys.argv[1])
