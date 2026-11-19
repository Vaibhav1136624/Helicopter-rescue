export type Vec = {
    x: number;
    y: number;
};
export const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const distance = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y);
export function random(seed: number) { let s = seed; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
export type Rect = {
    x: number;
    y: number;
    w: number;
    h: number;
    breakable?: boolean;
    alive: boolean;
};
export function resolveCircle(p: Vec, r: number, rect: Rect): Vec | null {
    if (!rect.alive)
        return null;
    const x = clamp(p.x, rect.x, rect.x + rect.w), y = clamp(p.y, rect.y, rect.y + rect.h);
    let dx = p.x - x, dy = p.y - y;
    const d = Math.hypot(dx, dy);
    if (d >= r)
        return null;
    if (d > 0.001)
        return { x: dx / d * (r - d), y: dy / d * (r - d) };
    const edges = [{ v: p.x - rect.x + r, x: -1, y: 0 }, { v: rect.x + rect.w - p.x + r, x: 1, y: 0 }, { v: p.y - rect.y + r, x: 0, y: -1 }, { v: rect.y + rect.h - p.y + r, x: 0, y: 1 }].sort((a, b) => a.v - b.v);
    return { x: edges[0].x * edges[0].v, y: edges[0].y * edges[0].v };
}
