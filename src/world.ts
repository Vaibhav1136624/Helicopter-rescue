import { Buildings } from './buildings';
import { Helicopter } from './helicopter';
import { Rope } from './rope';
import { People } from './people';
import { Weather } from './weather';
import { Effects } from './effects';
import { Camera } from './camera';
import type { Vec } from './math';
import { MISSIONS, type Mission } from './missions';
export class World {
    buildings: Buildings;
    heli = new Helicopter();
    rope: Rope;
    people: People;
    weather: Weather;
    effects = new Effects();
    camera = new Camera();
    time = 0;
    status: 'playing' | 'success' | 'failure' = 'playing';
    message = 'Follow the rooftops. Bring five people home.';
    messageTime = 6;
    onSound: (s: string) => void = () => { };
    mission: Mission;
    storm: boolean;
    failureReason: 'airframe' | 'survivors' | 'timeout' | null = null;
    get remainingTime() { return this.mission.timeLimit === undefined ? null : Math.max(0, this.mission.timeLimit - this.time); }
    constructor(operation: boolean | Mission = false) {
        this.mission = typeof operation === 'boolean' ? MISSIONS[operation ? 3 : 1] : operation;
        this.storm = this.mission.storm;
        this.buildings = new Buildings(this.storm, this.mission.layout);
        this.people = new People(this.buildings);
        this.people.target = this.mission.target;
        this.people.pickupSpeed = this.mission.pickupSpeed;
        this.heli.health = this.mission.health;
        this.heli.damageScale = this.mission.damage;
        this.weather = new Weather(this.storm, this.mission.wind, this.mission.tornado);
        this.message = `Rescue ${this.mission.target} people. ${this.mission.description}`;
        this.rope = new Rope({ x: this.heli.x, y: this.heli.y + 18 });
        this.camera.x = this.heli.x + 90;
        this.camera.y = this.heli.y + 85;
    }
    update(dt: number, axis: Vec, extend: number) {
        if (this.status !== 'playing')
            return;
        this.time += dt;
        this.messageTime = Math.max(0, this.messageTime - dt);
        this.weather.update(dt);
        this.heli.update(dt, axis, this.people.carried.length, this.weather, this.buildings.solids, (speed, r) => { this.camera.shake = speed * .04; this.effects.burst(this.heli.x, this.heli.y, 20, 'dust'); this.onSound('damage'); if (r && speed > 62 && this.buildings.break(r)) {
            this.effects.burst(r.x + r.w / 2, r.y, 7, 'debris');
            this.effects.burst(r.x, r.y, 20, 'dust');
            this.say('That roof had seen better days.');
        } });
        this.rope.update(dt, { x: this.heli.x, y: this.heli.y + 16 }, extend, this.people.carried.length, this.weather, this.buildings.solids);
        this.people.update(dt, this.rope, this.buildings.solids, this.buildings.base, (type, p) => { this.onSound(type); if (type === 'pickup') {
            this.say(['Hold tight. Heading home.', 'One more aboard. Easy on the turns.', 'A full rope. Return to the rescue base.'][this.people.carried.length - 1] || 'Hold tight.');
            this.effects.burst(p.x, p.y, 8, 'pickup');
        } if (type === 'delivery') {
            this.say('Safe on solid ground. ' + this.people.saved + ' / ' + this.people.target + ' rescued.');
            this.effects.burst(p.x, p.y, 15, 'pickup');
        } if (type === 'lost') {
            this.say('A survivor was lost. Keep the others safe.');
            this.effects.burst(p.x, 747, 15, 'splash');
        } }, this.weather);
        if (this.heli.health < 40 && Math.random() < dt * 9)
            this.effects.burst(this.heli.x - 18, this.heli.y, 1, 'dust');
        this.effects.update(dt, this.buildings.solids);
        if (this.people.saved >= this.people.target)
            this.status = 'success';
        else if (this.heli.health <= 0 || this.people.items.length - this.people.lost < this.people.target || this.remainingTime === 0) {
            this.failureReason = this.heli.health <= 0 ? 'airframe' : this.remainingTime === 0 ? 'timeout' : 'survivors';
            this.status = 'failure';
        }
    }
    say(message: string) { this.message = message; this.messageTime = 4; }
}
