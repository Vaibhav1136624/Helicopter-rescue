import { CONFIG } from './config';
import { resolveCircle, type Rect } from './math';
export type Particle = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    max: number;
    size: number;
    kind: string;
    angle: number;
};
export class Effects {
    particles: Particle[] = [];
    burst(x: number, y: number, count: number, kind: string) { for (let i = 0; i < count; i++) {
        const life = kind === 'debris' ? 5 : .5 + Math.random();
        this.particles.push({ x, y, vx: (Math.random() - .5) * 130, vy: -Math.random() * 100, life, max: life, size: kind === 'debris' ? 4 + Math.random() * 8 : 1 + Math.random() * 3, kind, angle: Math.random() * 6 });
    } if (this.particles.length > CONFIG.particleLimit)
        this.particles.splice(0, this.particles.length - CONFIG.particleLimit); }
    update(dt: number, solids: Rect[]) { for (const p of this.particles) {
        p.life -= dt;
        p.vy += 110 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.angle += p.vx * .01 * dt;
        if (p.kind === 'debris')
            for (const r of solids) {
                const c = resolveCircle(p, p.size / 2, r);
                if (c) {
                    p.x += c.x;
                    p.y += c.y;
                    p.vy *= -.35;
                    p.vx *= .7;
                }
            }
        if (p.y > 755)
            p.life = Math.min(p.life, .1);
    } this.particles = this.particles.filter(p => p.life > 0); }
}
