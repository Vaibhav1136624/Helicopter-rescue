import { distance, resolveCircle, type Rect } from './math';
import type { Rope } from './rope';
import type { Buildings } from './buildings';
import { CONFIG } from './config';
import type { Weather } from './weather';
export type Person = {
    id: number;
    x: number;
    y: number;
    px: number;
    py: number;
    state: 'waiting' | 'carried' | 'falling' | 'rescued' | 'lost';
    bubble: number;
    phase: number;
};
export class People {
    items: Person[] = [];
    saved = 0;
    lost = 0;
    target = CONFIG.rescueTarget;
    pickupSpeed = CONFIG.pickupSpeed;
    pickupCooldown = 0;
    constructor(buildings: Buildings) { buildings.items.forEach((b, i) => { this.items.push({ id: i, x: b.x + b.w * .5, y: b.y - 17, px: b.x + b.w * .5, py: b.y - 17, state: 'waiting', bubble: 0, phase: i * 1.7 }); }); }
    get carried() { return this.items.filter(p => p.state === 'carried'); }
    release() { for (const p of this.carried)
        p.state = 'falling'; this.pickupCooldown = 1.5; }
    update(dt: number, rope: Rope, solids: Rect[], base: Rect, onEvent: (type: string, p: Person) => void, weather?: Weather) {
        this.pickupCooldown = Math.max(0, this.pickupCooldown - dt);
        let chain = this.carried;
        let anchor = chain.length ? chain[chain.length - 1] : rope.tip;
        const speed = Math.hypot(rope.tip.x - rope.tip.px, rope.tip.y - rope.tip.py) / dt;
        for (const p of this.items) {
            p.bubble = Math.max(0, p.bubble - dt);
            if (p.state === 'waiting') {
                const supported = solids.some(r => r.alive && p.x >= r.x && p.x <= r.x + r.w && Math.abs(p.y + 17 - r.y) < 5);
                if (!supported) {
                    p.state = 'falling';
                    p.px = p.x;
                    p.py = p.y;
                }
                else if (this.pickupCooldown === 0 && chain.length < CONFIG.maxPassengers && distance({ x: anchor.x, y: anchor.y + (chain.length ? 20 : 0) }, p) < 30 && speed < this.pickupSpeed) {
                    p.state = 'carried';
                    p.px = p.x;
                    p.py = p.y;
                    p.bubble = 3;
                    onEvent('pickup', p);
                    chain = this.carried;
                    anchor = p;
                    this.pickupCooldown = .45;
                }
            }
            if (p.state === 'falling') {
                const vx = (p.x - p.px) * .995, vy = (p.y - p.py) * .995;
                p.px = p.x;
                p.py = p.y;
                p.x += vx;
                p.y += vy + 150 * dt * dt;
                for (const r of solids) {
                    const c = resolveCircle({ x: p.x, y: p.y + 10 }, 7, r);
                    if (c) {
                        p.x += c.x;
                        p.y += c.y;
                        if (c.y < 0) {
                            if (Math.abs(vy / dt) > 115) {
                                p.state = 'lost';
                                this.lost++;
                                onEvent('lost', p);
                            }
                            else {
                                p.state = 'waiting';
                                p.y = r.y - 17;
                                p.px = p.x;
                                p.py = p.y;
                            }
                        }
                    }
                }
            }
            if ((p.state === 'falling' || p.state === 'carried') && p.y > 746) {
                p.state = 'lost';
                this.lost++;
                onEvent('lost', p);
            }
        }
        chain = this.carried;
        for (let i = 0; i < chain.length; i++) {
            const p = chain[i], a = i === 0 ? rope.tip : chain[i - 1];
            const vx = (p.x - p.px) * .97, vy = (p.y - p.py) * .97, wind = weather?.force(p) ?? { x: 0, y: 0 };
            p.px = p.x;
            p.py = p.y;
            p.x += vx + wind.x * dt * dt;
            p.y += vy + (160 + wind.y) * dt * dt;
            const dx = p.x - a.x, dy = p.y - a.y, d = Math.hypot(dx, dy) || 1;
            const len = i === 0 ? 9 : 25;
            p.x = a.x + dx / d * len;
            p.y = a.y + dy / d * len;
            for (const r of solids) {
                const c = resolveCircle(p, 5, r);
                if (c) {
                    p.x += c.x;
                    p.y += c.y;
                }
            }
            const speed = Math.hypot(p.x - p.px, p.y - p.py) / dt;
            if (p.x > base.x + 8 && p.x < base.x + base.w - 8 && p.y > base.y - 62 && p.y < base.y + 5 && speed < CONFIG.deliverySpeed) {
                p.state = 'rescued';
                this.saved++;
                onEvent('delivery', p);
            }
        }
        // Released survivors standing on the base are delivered too.
        for (const p of this.items)
            if (p.state === 'waiting' && p.x > base.x && p.x < base.x + base.w && Math.abs(p.y + 17 - base.y) < 4) {
                p.state = 'rescued';
                this.saved++;
                onEvent('delivery', p);
            }
    }
}
