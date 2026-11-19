import { clamp, lerp, resolveCircle, type Vec, type Rect } from './math';
import { CONFIG } from './config';
import type { Weather } from './weather';
export class Helicopter {
    x = 195;
    y = 457;
    vx = 0;
    vy = 0;
    angle = 0;
    health = 100;
    damageScale = 1;
    cooldown = 0;
    thrust = 0;
    landed = true;
    update(dt: number, axis: Vec, load: number, weather: Weather, solids: Rect[], impact: (s: number, r?: Rect) => void) {
        this.cooldown = Math.max(0, this.cooldown - dt);
        const wind = weather.force(this);
        this.thrust = axis.y < 0 ? 1 : axis.y > 0 ? .25 : .57;
        const weight = 1 + load * CONFIG.passengerMassRatio;
        this.vx += (axis.x * CONFIG.horizontalAcceleration / weight + wind.x - this.vx * .65) * dt; // Assisted collective offsets most gravity; passenger load reduces available lift.
        const lift = CONFIG.gravity - 5 - load * 2.2 - axis.y * CONFIG.verticalAcceleration / weight;
        this.vy += (CONFIG.gravity - lift + wind.y - this.vy * .83) * dt;
        this.vx = clamp(this.vx, -CONFIG.maxHorizontalSpeed, CONFIG.maxHorizontalSpeed);
        this.vy = clamp(this.vy, -CONFIG.maxVerticalSpeed, CONFIG.maxVerticalSpeed);
        this.x = clamp(this.x + this.vx * dt, 30, 2780);
        this.y = Math.max(65, this.y + this.vy * dt);
        this.landed = false;
        for (const r of solids) {
            const correction = resolveCircle(this, 22, r);
            if (!correction)
                continue;
            const len = Math.hypot(correction.x, correction.y);
            const nx = correction.x / len, ny = correction.y / len;
            const speed = Math.max(0, -(this.vx * nx + this.vy * ny));
            this.x += correction.x;
            this.y += correction.y;
            if (ny < -.5)
                this.landed = true;
            this.vx += nx * speed * 1.12;
            this.vy += ny * speed * 1.12;
            if (speed > 43 && this.cooldown === 0) {
                this.health = Math.max(0, this.health - (speed - 35) * .48 * this.damageScale);
                this.cooldown = .6;
                impact(speed, r);
            }
        }
        this.angle = lerp(this.angle, clamp(this.vx * .003 + axis.x * .08, -.36, .36), 1 - Math.exp(-dt * 5));
        if (this.y > 735) {
            this.health = 0;
            impact(120);
        }
    }
}
