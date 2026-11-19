import { type Vec, type Rect, resolveCircle, clamp } from './math';
import { CONFIG } from './config';
import type { Weather } from './weather';
export type Node = Vec & {
    px: number;
    py: number;
};
export class Rope {
    nodes: Node[] = [];
    length = CONFIG.ropeLength;
    count = CONFIG.ropeSegments;
    constructor(anchor: Vec) { for (let i = 0; i <= this.count; i++)
        this.nodes.push({ x: anchor.x, y: anchor.y + i * this.length / this.count, px: anchor.x, py: anchor.y + i * this.length / this.count }); }
    get tip() { return this.nodes[this.count]; }
    update(dt: number, anchor: Vec, extend: number, load: number, weather: Weather, solids: Rect[]) {
        this.length = clamp(this.length + extend * 32 * dt, CONFIG.ropeMinimum, CONFIG.ropeMaximum);
        const segment = this.length / this.count;
        for (let i = 1; i < this.nodes.length; i++) {
            const p = this.nodes[i], wind = weather.force(p);
            let vx = (p.x - p.px) * .986, vy = (p.y - p.py) * .986;
            p.px = p.x;
            p.py = p.y;
            p.x += vx + wind.x * dt * dt;
            p.y += vy + (155 + load * 5 + wind.y) * dt * dt;
        }
        for (let k = 0; k < CONFIG.ropeIterations; k++) {
            this.nodes[0].x = anchor.x;
            this.nodes[0].y = anchor.y;
            for (let i = 1; i < this.nodes.length; i++) {
                const a = this.nodes[i - 1], b = this.nodes[i];
                let dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || .001;
                const diff = (d - segment) / d;
                const share = i === 1 ? 0 : .5;
                a.x += dx * diff * share;
                a.y += dy * diff * share;
                b.x -= dx * diff * (1 - share);
                b.y -= dy * diff * (1 - share);
            }
            if (k % 3 === 0)
                for (let i = 1; i < this.nodes.length; i++)
                    for (const r of solids) {
                        const p = this.nodes[i], c = resolveCircle(p, 2, r);
                        if (c) {
                            p.x += c.x;
                            p.y += c.y;
                        }
                    }
        }
        this.nodes[0].px = anchor.x;
        this.nodes[0].py = anchor.y;
    }
}
