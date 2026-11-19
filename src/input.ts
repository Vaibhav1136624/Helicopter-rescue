export class Input {
    keys = new Set<string>();
    touch = new Set<string>();
    onAction: (key: string) => void = () => { };
    constructor() { window.addEventListener('keydown', e => { if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code))
        e.preventDefault(); if (!this.keys.has(e.code))
        this.onAction(e.code); this.keys.add(e.code); }); window.addEventListener('keyup', e => this.keys.delete(e.code)); window.addEventListener('blur', () => this.clear()); }
    has(...keys: string[]) { return keys.some(k => this.keys.has(k) || this.touch.has(k)); }
    get axis() { return { x: Number(this.has('KeyD', 'ArrowRight')) - Number(this.has('KeyA', 'ArrowLeft')), y: Number(this.has('KeyS', 'ArrowDown')) - Number(this.has('KeyW', 'ArrowUp')) }; }
    get extend() { return Number(this.has('KeyE')) - Number(this.has('KeyQ')); }
    clear() { this.keys.clear(); this.touch.clear(); }
}
