export type Difficulty = 'Easy' | 'Normal' | 'Hard' | 'Expert';
export type Mission = {
    id: string; name: string; difficulty: Difficulty; storm: boolean;
    description: string; briefing: string; target: number;
    layout: [number, number, number][];
    wind: number; tornado: number; damage: number; health: number;
    pickupSpeed: number; timeLimit?: number;
};

/** Each operation has its own terrain and actual simulation parameters. */
export const MISSIONS: Mission[] = [
    {
        id: 'harbor-training', name: 'Harbor Patrol', difficulty: 'Easy', storm: false,
        description: 'Wide rooftops. Calm air. Room to learn.',
        briefing: 'Bring three people home from the nearby harbor. Wide roofs, light wind and reduced impact damage make this a good first flight.',
        target: 3, layout: [[430,520,200],[720,500,200],[1010,530,210],[1320,490,200]],
        wind: .35, tornado: 0, damage: .6, health: 100, pickupSpeed: 115,
    },
    {
        id: 'flooded-city', name: 'Flooded City', difficulty: 'Normal', storm: false,
        description: 'Rising water. Fragile rooftops.',
        briefing: 'Rescue five people across the flooded district. Watch the changing roof heights and bring passengers back to the flagged rescue base.',
        target: 5, layout: [[460,515,150],[760,425,165],[1085,540,150],[1390,375,180],[1730,470,155],[2070,355,185],[2430,445,200]],
        wind: 1, tornado: 0, damage: 1, health: 100, pickupSpeed: 95,
    },
    {
        id: 'rooftop-relay', name: 'Rooftop Relay', difficulty: 'Hard', storm: false,
        description: 'Narrow towers. Precise approaches.',
        briefing: 'Rescue five people from narrow, staggered towers. Pickups require a slower approach, crosswinds are stronger, and hard impacts cause 25% more damage.',
        target: 5, layout: [[450,455,85],[650,345,80],[860,520,85],[1080,375,75],[1320,440,85],[1580,330,90],[1840,480,90]],
        wind: 4, tornado: 0, damage: 1.25, health: 100, pickupSpeed: 70,
    },
    {
        id: 'night-storm', name: 'Night Storm', difficulty: 'Hard', storm: true,
        description: 'Heavy gusts. A moving waterspout.',
        briefing: 'Bring five people off the islands. Wind affects the helicopter and rope; the waterspout pulls inward and upward. Climb above its strongest forces.',
        target: 5, layout: [[510,525,150],[870,430,150],[1240,560,160],[1610,390,155],[1990,475,170],[2380,390,210]],
        wind: 1, tornado: 1, damage: 1, health: 100, pickupSpeed: 95,
    },
    {
        id: 'evacuation-rush', name: 'Evacuation Rush', difficulty: 'Hard', storm: false,
        description: 'Four rescues. Five minutes. No delays.',
        briefing: 'Rescue four people before the five-minute evacuation window closes. Collecting multiple people per trip saves time. The clock stops when paused.',
        target: 4, layout: [[430,520,165],[680,465,150],[930,535,160],[1200,425,150],[1500,480,155]],
        wind: 2.5, tornado: 0, damage: 1, health: 100, pickupSpeed: 85, timeLimit: 300,
    },
    {
        id: 'eye-of-the-storm', name: 'Eye of the Storm', difficulty: 'Expert', storm: true,
        description: 'Six rescues. Stronger storm. Worn airframe.',
        briefing: 'Extract six survivors with only 75% starting condition. Narrow islands, 20% stronger gusts, a stronger waterspout and slower pickups demand careful flying. Only one survivor can be lost.',
        target: 6, layout: [[480,500,110],[770,410,100],[1070,540,110],[1390,370,100],[1730,465,105],[2070,400,110],[2420,510,115]],
        wind: 1.2, tornado: 1.15, damage: 1.4, health: 75, pickupSpeed: 65,
    },
];

export function formatTime(seconds: number): string {
    const value = Math.max(0, Math.ceil(seconds));
    return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}
