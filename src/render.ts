import type { World } from './world';
import { random, clamp } from './math';
export class Renderer {
    ctx: CanvasRenderingContext2D;
    width = 0;
    height = 0;
    grain: HTMLCanvasElement;
    ink = '#333b39';
    paper = '#e6e5dd';
    constructor(public canvas: HTMLCanvasElement) { this.ctx = canvas.getContext('2d')!; this.grain = document.createElement('canvas'); this.grain.width = 256; this.grain.height = 256; const c = this.grain.getContext('2d')!, r = random(18); for (let i = 0; i < 10000; i++) {
        c.fillStyle = `rgba(30,35,30,${r() * .15})`;
        c.fillRect(r() * 256, r() * 256, r() < .8 ? 1 : 2, 1);
    } this.resize(); window.addEventListener('resize', () => this.resize()); }
    resize() { this.width = window.innerWidth; this.height = window.innerHeight; const dpr = Math.min(window.devicePixelRatio || 1, 2); this.canvas.width = this.width * dpr; this.canvas.height = this.height * dpr; this.canvas.style.width = this.width + 'px'; this.canvas.style.height = this.height + 'px'; this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    line(points: number[][], width = 1, color = this.ink) { const c = this.ctx; c.strokeStyle = color; c.lineWidth = width; c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); }
    text(str: string, x: number, y: number, size = 12, color = this.ink, align: CanvasTextAlign = 'left') { const c = this.ctx; c.fillStyle = color; c.font = `${size}px monospace`; c.textAlign = align; c.fillText(str, x, y); }
    draw(world: World, dt: number, menu = false) {
        const c = this.ctx, w = this.width, h = this.height, t = world.time, storm = world.storm;
        this.ink = storm ? '#d6dad1' : '#3b4441';
        this.paper = storm ? '#131b1d' : '#e8e7df';
        c.fillStyle = this.paper;
        c.fillRect(0, 0, w, h);
        world.camera.update(dt, world.heli, w, h);
        const cam = world.camera, z = cam.zoom;
        if (menu) {
            cam.x = 650;
            cam.y = 430;
        }
        // Soft horizon and the sun are screen-space, with slower skyline parallax.
        const gradient = c.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, storm ? '#101719' : '#dfdfd6');
        gradient.addColorStop(1, storm ? '#253033' : '#f1f0e6');
        c.fillStyle = gradient;
        c.fillRect(0, 0, w, h);
        if (!storm) {
            c.fillStyle = '#f7f5e9';
            c.beginPath();
            c.arc(w * .74 - cam.x * .025, h * .25, Math.min(w, h) * .105, 0, Math.PI * 2);
            c.fill();
            c.strokeStyle = '#e4e3d7';
            c.lineWidth = 8;
            c.stroke();
        }
        this.skyline(world, 0.14, storm ? .12 : .18, h * .7);
        this.skyline(world, .3, storm ? .19 : .28, h * .84);
        c.save();
        c.translate(w / 2 + (Math.random() - .5) * cam.shake, h / 2 + (Math.random() - .5) * cam.shake);
        c.scale(z, z);
        c.translate(-cam.x, -cam.y);
        if (storm)
            this.clouds(world);
        for (const b of world.buildings.items) {
            if (b.x + b.w < cam.x - w / z / 2 - 50 || b.x > cam.x + w / z / 2 + 50)
                continue;
            if (storm)
                this.island(b.x, b.y, b.w, t);
            else
                this.building(b.x, b.y, b.w, b.h, b.style, b.sections.map(s => s.alive));
        }
        this.base(world);
        if (storm)
            this.tornado(world);
        this.water(world);
        for (const p of world.people.items) {
            if (p.state === 'lost' || p.state === 'rescued')
                continue;
            this.person(p.x, p.y, p.phase + t, p.state === 'carried', p.x - p.px, p.y - p.py);
            if (p.state === 'waiting' && Math.abs(p.x - world.heli.x) < 280 && Math.floor(t / 7 + p.id) % 3 === 0)
                this.bubble(storm ? 'I CAN’T SWIM!' : 'OVER HERE!', p.x, p.y - 35);
            if (p.state === 'carried' && p.bubble > 0)
                this.bubble(p.id % 2 ? 'EASY WITH THE TURNS!' : 'I TRUST YOU. MOSTLY.', p.x + 12, p.y + 38);
        }
        c.strokeStyle = this.ink;
        c.lineWidth = 1.4;
        c.beginPath();
        world.rope.nodes.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y));
        c.stroke();
        const tip = world.rope.tip;
        c.beginPath();
        c.arc(tip.x, tip.y, 3, 0, Math.PI * 1.6);
        c.stroke();
        this.helicopter(world);
        for (const p of world.effects.particles) {
            c.globalAlpha = Math.min(1, p.life);
            c.fillStyle = p.kind === 'pickup' ? '#8d5145' : this.ink;
            c.save();
            c.translate(p.x, p.y);
            c.rotate(p.angle);
            if (p.kind === 'debris') {
                c.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * .7);
                c.strokeStyle = this.paper;
                c.lineWidth = .5;
                c.strokeRect(-p.size / 2, -p.size / 2, p.size, p.size * .7);
            }
            else {
                c.beginPath();
                c.arc(0, 0, p.size, 0, Math.PI * 2);
                c.fill();
            }
            c.restore();
        }
        c.globalAlpha = 1;
        // Rotor wash around roofs and water.
        if (world.heli.y > 390) {
            c.globalAlpha = .2;
            for (let i = 0; i < 6; i++) {
                const spread = (t * 42 + i * 13) % 85;
                this.line([[world.heli.x - spread - 20, world.heli.y + 48 + i * 3], [world.heli.x - spread, world.heli.y + 47 + i * 3]], .7);
                this.line([[world.heli.x + spread, world.heli.y + 47 + i * 3], [world.heli.x + spread + 20, world.heli.y + 48 + i * 3]], .7);
            }
            c.globalAlpha = 1;
        }
        c.restore();
        if (storm) {
            c.strokeStyle = 'rgba(206,218,211,.24)';
            c.lineWidth = .8;
            c.beginPath();
            for (let i = 0; i < 210; i++) {
                const x = ((i * 137.1 - t * 310) % (w + 100) + w + 100) % (w + 100) - 50;
                const y = (i * 79.7 + t * 610) % (h + 60) - 30;
                c.moveTo(x, y);
                c.lineTo(x - 12 - world.weather.gust * .08, y + 29);
            }
            c.stroke();
        }
        c.save();
        c.globalAlpha = storm ? .22 : .48;
        c.fillStyle = c.createPattern(this.grain, 'repeat')!;
        c.fillRect(0, 0, w, h);
        c.restore();
        if (!menu)
            this.navigation(world);
    }
    skyline(world: World, parallax: number, alpha: number, baseline: number) {
        const c = this.ctx, r = random(parallax * 1000 + 3);
        if (world.storm) {
            c.save();
            c.globalAlpha = alpha * .55;
            c.fillStyle = '#84918c';
            c.beginPath();
            c.moveTo(-100, this.height);
            for (let i = -2; i < 35; i++) {
                const x = i * 115 - world.camera.x * parallax;
                c.lineTo(x, baseline - 40 - r() * 100);
            }
            c.lineTo(this.width + 100, this.height);
            c.closePath();
            c.fill();
            c.restore();
            return;
        }
        c.save();
        c.globalAlpha = alpha;
        c.fillStyle = world.storm ? '#a2b4b1' : '#77837a';
        c.strokeStyle = c.fillStyle;
        for (let i = -2; i < 35; i++) {
            const x = i * 115 - world.camera.x * parallax;
            const bw = 45 + r() * 100, bh = 45 + r() * 150;
            const y = baseline - bh;
            c.fillRect(x, y, bw, bh + 400);
            if (i % 5 === 0) {
                c.beginPath();
                c.arc(x + bw / 2, y, bw * .5, Math.PI, 0);
                c.fill();
                c.fillRect(x + bw / 2 - 1, y - bw * .5 - 22, 2, 30);
            }
            if (i % 4 === 0) {
                c.fillRect(x + 12, y - 75, 8, 80);
                c.beginPath();
                c.moveTo(x + 8, y - 75);
                c.lineTo(x + 16, y - 100);
                c.lineTo(x + 24, y - 75);
                c.fill();
            }
            if (i % 3 === 0)
                for (let row = 0; row < 4; row++)
                    for (let col = 0; col < 4; col++) {
                        c.clearRect(-100, -100, 0, 0);
                        c.fillStyle = world.storm ? '#243033' : '#c5c9be';
                        c.fillRect(x + 10 + col * 20, y + 12 + row * 26, 5, 10);
                        c.fillStyle = world.storm ? '#a2b4b1' : '#77837a';
                    }
        }
        c.restore();
        if (!world.storm) {
            c.save();
            c.globalAlpha = .4;
            for (let i = 0; i < 9; i++) {
                const x = (i * 153 + world.time * (8 + i % 3) - world.camera.x * .2) % this.width, y = this.height * .2 + Math.sin(i * 3) * 35;
                this.line([[x - 4, y + 2], [x, y], [x + 4, y + 2]], .8);
            }
            c.restore();
        }
    }
    building(x: number, y: number, w: number, h: number, style: number, alive: boolean[]) {
        const c = this.ctx, r = random(x);
        c.fillStyle = '#bfc4b8';
        c.fillRect(x, y + 26, w, h);
        c.fillStyle = '#d5d7cb';
        c.fillRect(x + 4, y + 27, w - 10, h);
        this.line([[x, y + 26], [x, y + h], [x + w, y + h], [x + w, y + 26]], 1.5);
        // Etching, water marks, window shutters and balconies.
        c.globalAlpha = .26;
        for (let i = 0; i < 170; i++) {
            const sx = x + r() * w, sy = y + 30 + r() * h;
            this.line([[sx, sy], [sx + r() * 9, sy - 2]], .5);
        }
        c.globalAlpha = 1;
        for (let row = 0; row < Math.floor(h / 65); row++)
            for (let col = 0; col < Math.floor(w / 40); col++) {
                const wx = x + 15 + col * 40, wy = y + 48 + row * 67;
                c.fillStyle = '#66756e';
                c.fillRect(wx, wy, 15, 27);
                c.fillStyle = '#a4aea1';
                c.fillRect(wx + 2, wy + 2, 5, 23);
                this.line([[wx - 2, wy + 29], [wx + 18, wy + 29]], 2);
                this.line([[wx + 8, wy], [wx + 8, wy + 27]], .7);
                if (style === 1 && row % 2 === 0) {
                    this.line([[wx - 7, wy + 22], [wx + 23, wy + 22], [wx + 23, wy + 36], [wx - 7, wy + 36], [wx - 7, wy + 22]], 1);
                    for (let k = 0; k < 6; k++)
                        this.line([[wx - 7 + k * 6, wy + 22], [wx - 7 + k * 6, wy + 36]], .7);
                }
            }
        alive.forEach((yes, i) => { if (!yes)
            return; const sx = x + i * w / 4; c.fillStyle = '#c9cec0'; c.fillRect(sx, y, w / 4, 26); this.line([[sx, y + 26], [sx, y], [sx + w / 4, y], [sx + w / 4, y + 26]], 1.4); this.line([[sx - 2, y + 5], [sx + w / 4 + 1, y + 5]], 2); for (let k = 0; k < 3; k++)
            this.line([[sx + k * 12, y + 12], [sx + k * 12 + 6, y + 12]], .5); });
        if (alive[0] && alive[3]) {
            this.line([[x + 10, y], [x + 10, y - 43]], 1.3);
            this.line([[x + w - 10, y], [x + w - 10, y - 43]], 1.3);
            const cy = y - 31;
            c.strokeStyle = this.ink;
            c.lineWidth = .7;
            c.beginPath();
            c.moveTo(x + 10, y - 39);
            c.quadraticCurveTo(x + w / 2, y - 15, x + w - 10, y - 39);
            c.stroke();
            for (let i = 0; i < 4; i++) {
                const lx = x + 25 + i * (w - 45) / 4;
                c.fillStyle = i % 2 ? '#8a958a' : '#edece1';
                c.fillRect(lx, cy, 13, 18 + i % 2 * 7);
                this.line([[lx, cy], [lx, cy + 19], [lx + 13, cy + 19]], .5);
            }
        }
        if (style === 2)
            this.palm(x + w + 18, y + 75, 95);
    }
    palm(x: number, y: number, height: number) { const c = this.ctx; this.line([[x, y], [x - 4, y - height * .5], [x + 3, y - height]], 4); this.line([[x + 1, y], [x - 2, y - height * .5], [x + 5, y - height]], 1, '#c2c8b8'); for (let i = 0; i < 7; i++) {
        const a = i * Math.PI / 4.7;
        c.strokeStyle = this.ink;
        c.lineWidth = 1.8;
        c.beginPath();
        c.moveTo(x + 3, y - height);
        c.quadraticCurveTo(x + Math.cos(a) * 26, y - height - 24, x + Math.cos(a) * 48, y - height + Math.sin(a) * 26);
        c.stroke();
        for (let j = 1; j < 6; j++) {
            const px = x + 3 + Math.cos(a) * j * 7, py = y - height - 10 + Math.sin(a) * j * 3;
            this.line([[px, py], [px - 4, py + 9]], .65);
        }
    } }
    island(x: number, y: number, w: number, t: number) { const c = this.ctx, r = random(x); c.fillStyle = '#273333'; c.beginPath(); c.moveTo(x - 28, 800); c.lineTo(x - 12, y + 60); c.lineTo(x, y + 26); c.lineTo(x, y); for (let i = 0; i <= 12; i++)
        c.lineTo(x + i * w / 12, y + (i === 0 || i === 12 ? 0 : Math.sin(i * 4) * 3)); c.lineTo(x + w + 20, y + 80); c.lineTo(x + w + 50, 800); c.closePath(); c.fill(); c.strokeStyle = this.ink; c.lineWidth = 1.5; c.stroke(); c.globalAlpha = .45; for (let i = 0; i < 90; i++) {
        const px = x + r() * w, py = y + 30 + r() * (760 - y);
        this.line([[px, py], [px + 3 + r() * 14, py + 7]], .6);
    } c.globalAlpha = 1; this.line([[x + 20, y], [x + 20, y - 25], [x + 20 + Math.sin(t * 3) * 4, y - 38]], 1); }
    base(world: World) {
        const c = this.ctx, b = world.buildings.base;
        c.fillStyle = world.storm ? '#34403d' : '#b4beb0';
        c.fillRect(b.x, b.y, b.w, 360);
        this.line([[b.x, b.y + 360], [b.x, b.y], [b.x + b.w, b.y], [b.x + b.w, b.y + 360]], 1.7);
        c.fillStyle = world.storm ? '#bdc9b9' : '#f0eee1';
        c.fillRect(b.x - 6, b.y - 5, b.w + 12, 8);
        for (let i = 0; i < 16; i++)
            this.line([[b.x + i * 15, b.y + 2], [b.x + i * 15 - 8, b.y + 10]], 1.6);
        c.strokeStyle = this.ink;
        c.lineWidth = 1.2;
        c.strokeRect(b.x + 22, b.y + 30, b.w - 44, 45);
        this.text('RESCUE / 01', b.x + b.w / 2, b.y + 58, 18, this.ink, 'center');
        this.text('SAFE DELIVERY ZONE', b.x + b.w / 2, b.y + 93, 9, this.ink, 'center');
        this.line([[b.x + b.w - 12, b.y], [b.x + b.w - 12, b.y - 90]], 1.5);
        c.fillStyle = '#9b5748';
        c.beginPath();
        c.moveTo(b.x + b.w - 12, b.y - 90);
        c.lineTo(b.x + b.w + 22, b.y - 85 + Math.sin(world.time * 3) * 3);
        c.lineTo(b.x + b.w - 12, b.y - 71);
        c.fill();
        c.setLineDash([4, 6]);
        c.globalAlpha = .35;
        c.strokeRect(b.x + 10, b.y - 65, b.w - 20, 58);
        c.setLineDash([]);
        c.globalAlpha = 1;
        for (let i = 0; i < world.people.saved; i++)
            this.person(b.x + 25 + i * 23, b.y - 16, world.time + i, false, 0, 0);
    }
    person(x: number, y: number, t: number, hanging: boolean, vx: number, vy: number) { const c = this.ctx; c.save(); c.translate(x, y); c.rotate(hanging ? clamp(-vx * .1, -.7, .7) : 0); c.fillStyle = this.ink; c.beginPath(); c.arc(0, -6, 2.9, 0, Math.PI * 2); c.fill(); this.line([[0, -2], [0, 7]], 2.7); const swing = Math.sin(t * 5) * 2; this.line([[-1, 7], [-3 + swing, 12], [-5 + swing, 17]], 1.4); this.line([[1, 7], [4 - swing, 12], [5 - swing, 16]], 1.4); if (hanging) {
        this.line([[-1, 0], [-5, -6], [-2, -14]], 1.3);
        this.line([[1, 0], [4, -7], [1, -14]], 1.3);
    }
    else {
        this.line([[-1, 0], [-6, -3], [-8, -8 - Math.sin(t * 4) * 3]], 1.3);
        this.line([[1, 0], [6, 4], [8, 0]], 1.3);
    } c.restore(); }
    helicopter(world: World) {
        const c = this.ctx, h = world.heli, t = world.time;
        c.save();
        c.translate(h.x, h.y);
        c.rotate(h.angle);
        c.lineJoin = 'round';
        c.fillStyle = world.storm ? '#bbc7bf' : '#748579';
        c.strokeStyle = this.ink;
        c.lineWidth = 1.4;
        c.beginPath();
        c.moveTo(-23, -4);
        c.lineTo(-61, -12);
        c.lineTo(-64, -21);
        c.lineTo(-59, -23);
        c.lineTo(-51, -14);
        c.lineTo(-17, -11);
        c.closePath();
        c.fill();
        c.stroke();
        c.beginPath();
        c.moveTo(-24, -9);
        c.quadraticCurveTo(-13, -22, 10, -18);
        c.quadraticCurveTo(29, -13, 31, 1);
        c.quadraticCurveTo(28, 12, 8, 13);
        c.lineTo(-19, 8);
        c.closePath();
        c.fill();
        c.stroke();
        c.fillStyle = world.storm ? '#223032' : '#e0e5d8';
        c.beginPath();
        c.moveTo(4, -15);
        c.quadraticCurveTo(24, -12, 26, 0);
        c.lineTo(4, 1);
        c.closePath();
        c.fill();
        c.stroke();
        c.strokeRect(-13, -12, 12, 14);
        this.line([[-13, -1], [-1, -1]], .6);
        this.line([[-8, -9], [-8, -3]], .7);
        this.line([[-12, 12], [-15, 20], [22, 20], [27, 17]], 1.8);
        this.line([[14, 13], [17, 20]], 1.4);
        this.line([[-3, -19], [-3, -28]], 2);
        this.line([[-12, -21], [9, -21]], 2);
        const rotor = Math.cos(t * 78);
        this.line([[-3 - 56 * rotor, -29], [-3 + 56 * rotor, -29]], 2.2);
        c.globalAlpha = .22;
        this.line([[-60, -29], [53, -29]], 3);
        c.globalAlpha = 1;
        c.save();
        c.translate(-60, -12);
        c.rotate(t * 90);
        this.line([[-7, 0], [7, 0]], 1.4);
        this.line([[0, -7], [0, 7]], 1.4);
        c.restore();
        this.text('+', -20, 4, 11, world.storm ? '#253331' : '#e9ede3');
        c.fillStyle = '#995244';
        c.fillRect(29, 0, 3, 2);
        if (h.cooldown > 0) {
            c.strokeStyle = '#a4473a';
            c.lineWidth = 2;
            c.beginPath();
            c.arc(0, 0, 35, -1, 1);
            c.stroke();
        }
        c.restore();
    }
    water(world: World) { const c = this.ctx, t = world.time, storm = world.storm; c.fillStyle = storm ? '#1a272a' : '#a8b8af'; c.beginPath(); c.moveTo(-500, 850); for (let x = -500; x <= 3500; x += 12)
        c.lineTo(x, 748 + Math.sin(x * .035 + t * 1.4) * (storm ? 7 : 2) + Math.sin(x * .012 - t) * 3); c.lineTo(3500, 1200); c.lineTo(-500, 1200); c.fill(); c.globalAlpha = .35; for (let i = 0; i < 160; i++) {
        const x = (i * 137) % 3000, y = 760 + (i * 29) % 170, ww = 8 + (i * 7) % 55;
        this.line([[x + Math.sin(t + i) * 6, y], [x + ww + Math.sin(t + i) * 6, y]], i % 4 === 0 ? 1.2 : .55);
    } c.globalAlpha = 1; }
    clouds(world: World) { const c = this.ctx; c.globalAlpha = .15; for (let i = 0; i < 15; i++) {
        const x = i * 220 + (world.time * 8) % 200;
        for (let j = 0; j < 4; j++) {
            c.fillStyle = '#8c9d98';
            c.beginPath();
            c.ellipse(x + j * 30, 100 + i % 3 * 38 + j * 3, 100, 17, 0, 0, Math.PI * 2);
            c.fill();
        }
    } c.globalAlpha = 1; }
    tornado(world: World) { const c = this.ctx, t = world.time, x = world.weather.tornado.x; c.save(); for (let i = 0; i < 42; i++) {
        const y = 745 - i * 11, r = 12 + i * 1.9, offset = Math.sin(t * 2 + i * .12) * 14;
        c.strokeStyle = `rgba(203,213,203,${.12 + (i % 3) * .07})`;
        c.lineWidth = .8;
        c.beginPath();
        c.ellipse(x + offset, y, r, 4 + i * .2, Math.sin(i + t) * .09, t * 3 + i, t * 3 + i + Math.PI * 1.6);
        c.stroke();
    } for (let i = 0; i < 40; i++) {
        const angle = t * 3 + i * 4, y = 745 - (t * 50 + i * 31) % 460, rad = 14 + (745 - y) * .15;
        this.line([[x + Math.cos(angle) * rad, y], [x + Math.cos(angle + .15) * rad, y - 3]], 1);
    } c.restore(); }
    bubble(text: string, x: number, y: number) { const c = this.ctx; c.font = '9px monospace'; const w = c.measureText(text).width; c.fillStyle = this.paper; c.fillRect(x - w / 2 - 7, y - 13, w + 14, 20); c.strokeStyle = this.ink; c.lineWidth = .6; c.strokeRect(x - w / 2 - 7, y - 13, w + 14, 20); this.text(text, x, y, 9, this.ink, 'center'); }
    navigation(world: World) { const h = world.heli, c = this.ctx; const home = 195; const outside = Math.abs(home - h.x) > 350; const nearest = world.people.items.filter(p => p.state === 'waiting').sort((a, b) => Math.abs(a.x - h.x) - Math.abs(b.x - h.x))[0]; const carrying = world.people.carried.length > 0; const target = carrying ? home : nearest?.x; if (target === undefined)
        return; const direction = target < h.x ? '←' : '→'; const label = carrying ? 'RESCUE BASE' : 'SURVIVOR'; if (outside || !carrying) {
        c.globalAlpha = .75;
        this.text(`${direction}  ${label}  ${Math.round(Math.abs(target - h.x))} m`, this.width / 2, this.height - 34, 11, this.ink, 'center');
        c.globalAlpha = 1;
    } }
}
