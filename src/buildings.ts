import { type Rect, random } from './math';
export type Building = {
    x: number;
    y: number;
    w: number;
    h: number;
    style: number;
    sections: Rect[];
};
export class Buildings {
    items: Building[] = [];
    solids: Rect[] = [];
    base: Rect = { x: 80, y: 480, w: 230, h: 360, alive: true };
    constructor(public storm: boolean, missionLayout?: [number, number, number][]) {
        this.solids.push(this.base);
        const rnd = random(31);
        const layout = missionLayout ?? (storm ? [[510, 525, 150], [870, 430, 150], [1240, 560, 160], [1610, 390, 155], [1990, 475, 170], [2380, 390, 210]] : [[460, 515, 150], [760, 425, 165], [1085, 540, 150], [1390, 375, 180], [1730, 470, 155], [2070, 355, 185], [2430, 445, 200]]);
        for (const [x, y, w] of layout) {
            const body: Rect = { x, y: y + 26, w, h: 850 - y, alive: true };
            const sections: Rect[] = [];
            for (let sx = x; sx < x + w; sx += w / 4)
                sections.push({ x: sx, y, w: w / 4, h: 26, alive: true, breakable: !storm });
            this.items.push({ x, y, w, h: 850 - y, style: Math.floor(rnd() * 3), sections });
            this.solids.push(body, ...sections);
        }
    }
    break(section: Rect) { if (!section.breakable || !section.alive)
        return false; section.alive = false; return true; }
}
