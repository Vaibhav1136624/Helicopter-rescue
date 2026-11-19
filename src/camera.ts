import { lerp, clamp } from './math';
import type { Helicopter } from './helicopter';
export class Camera {
    x = 430;
    y = 400;
    shake = 0;
    zoom = 1;
    update(dt: number, h: Helicopter, w: number, height: number) {
        // Keep tall phone viewports within the illustrated world, while retaining
        // enough vertical room for the longest rope and three passengers.
        this.zoom = Math.max(Math.min(w / 1150, height / 740), height / 900, .57);
        this.x = lerp(this.x, clamp(h.x + h.vx * .8 + 90, w / this.zoom / 2 - 70, 2860 - w / this.zoom / 2), 1 - Math.exp(-dt * 2));
        this.y = lerp(this.y, h.y + 85, 1 - Math.exp(-dt * 2));
        this.y = clamp(this.y, height / this.zoom / 2 - 60, 850 - height / this.zoom / 2);
        this.shake = Math.max(0, this.shake - dt * 10);
    }
}
