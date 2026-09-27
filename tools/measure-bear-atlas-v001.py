"""Measure the 20 separate painted poses. Writes metadata; never edits artwork."""
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1] / 'assets/bear-arcade-v001'

def simplify(points, epsilon=.55):
    if len(points) < 3:
        return points
    ax, ay = points[0]
    bx, by = points[-1]
    dx, dy = bx - ax, by - ay
    length = (dx * dx + dy * dy) ** .5
    distances = [abs(dy * (x - ax) - dx * (y - ay)) / length if length else ((x - ax)**2 + (y - ay)**2)**.5 for x, y in points]
    at = max(range(len(points)), key=distances.__getitem__)
    if distances[at] <= epsilon:
        return [points[0], points[-1]]
    return simplify(points[:at + 1], epsilon)[:-1] + simplify(points[at:], epsilon)

def outline(pixels, width, origin):
    """Trace the pose's outer mesh boundary so adjacent drawings cannot leak in."""
    edges = {}
    def edge(a, b):
        edges.setdefault(a, []).append(b)
    for p in pixels:
        y, x = divmod(p, width)
        if p - width not in pixels: edge((x, y), (x + 1, y))
        if p + 1 not in pixels: edge((x + 1, y), (x + 1, y + 1))
        if p + width not in pixels: edge((x + 1, y + 1), (x, y + 1))
        if p - 1 not in pixels: edge((x, y + 1), (x, y))
    loops = []
    while edges:
        start = next(iter(edges))
        current, loop = start, []
        while current in edges:
            loop.append(current)
            options = edges[current]
            target = options.pop()
            if not options: del edges[current]
            current = target
            if current == start: break
        loops.append(loop)
    def area(loop):
        return abs(sum(a[0]*b[1] - b[0]*a[1] for a,b in zip(loop, loop[1:] + loop[:1])))
    loop = max(loops, key=area)
    split = max(range(len(loop)), key=lambda i: (loop[i][0]-loop[0][0])**2 + (loop[i][1]-loop[0][1])**2)
    loop = simplify(loop[:split+1])[:-1] + simplify(loop[split:] + loop[:1])[:-1]
    return [[x-origin[0], y-origin[1]] for x,y in loop]

atlas = {}
for name in ['front', 'back']:
    im = Image.open(root / f'{name}.png')
    w, h = im.size
    alpha = bytearray(im.getchannel('A').point(lambda p: 255 if p > 96 else 0).tobytes())
    components = []
    for start in range(len(alpha)):
        if not alpha[start]:
            continue
        alpha[start] = 0
        queue = [start]
        pixels = set()
        count, x0, y0, x1, y1 = 0, w, h, 0, 0
        while queue:
            p = queue.pop()
            pixels.add(p)
            y, x = divmod(p, w)
            count += 1
            x0, y0, x1, y1 = min(x, x0), min(y, y0), max(x, x1), max(y, y1)
            for j in (p - 1 if x else -1, p + 1 if x < w - 1 else -1, p - w, p + w):
                if 0 <= j < len(alpha) and alpha[j]:
                    alpha[j] = 0
                    queue.append(j)
        if count > 3000:
            components.append(([x0, y0, x1 + 1, y1 + 1], outline(pixels, w, (x0, y0))))
    assert len(components) == 20, f'{name}: expected 20 poses, found {len(components)}'
    components.sort(key=lambda item: (item[0][1] + item[0][3]) / 2)
    ordered = []
    for row in range(5):
        ordered.extend(sorted(components[row * 4:row * 4 + 4], key=lambda item: item[0][0]))
    frames = [[x, y, right - x, bottom - y] for (x, y, right, bottom), polygon in ordered]
    # Use one scale for the entire sheet; shorter collapse drawings stay shorter.
    idle_height = sum(frame[3] for frame in frames[:4]) / 4
    atlas[name] = dict(width=w, height=h, unitsPerPixel=2.65 / idle_height, frames=frames, outlines=[polygon for box, polygon in ordered])
(root / 'atlas.json').write_text(json.dumps(atlas, indent=2) + '\n')
print('Measured 40 poses without changing either image.')
