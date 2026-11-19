import { type Vec, clamp } from './math';
export class Weather {
    time = 0;
    tornado = { x: 1820, y: 685 };
    gust = 0;
    constructor(public storm: boolean, public windScale = 1, public tornadoScale = 1) { }
    update(dt: number) { this.time += dt; this.gust = this.storm ? Math.sin(this.time * .53) * 28 + Math.sin(this.time * 1.37) * 16 : Math.sin(this.time * .4) * 4; this.tornado.x = 1830 + Math.sin(this.time * .14) * 250; }
    force(p: Vec): Vec { let x = this.gust * this.windScale, y = 0; if (this.storm) {
        const dx = this.tornado.x - p.x, dy = 510 - p.y;
        const strength = clamp(1 - Math.abs(dx) / 270, 0, 1) * clamp(1 - Math.abs(dy) / 470, 0, 1) * this.tornadoScale;
        x += dx * strength * .95 + Math.sin(this.time * 4 + p.y * .03) * strength * 80;
        y -= strength * 155;
    } return { x, y }; }
}
