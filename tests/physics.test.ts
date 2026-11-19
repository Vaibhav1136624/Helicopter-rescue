import { MISSIONS, formatTime } from '../src/missions';
import { World } from '../src/world';
import { Rope } from '../src/rope';
import { Weather } from '../src/weather';
import { Helicopter } from '../src/helicopter';
import { clamp, distance, resolveCircle } from '../src/math';
let passed = 0;
function check(ok: boolean, message: string) { if (!ok)
    throw new Error(message); passed++; console.log('PASS ' + message); }
const dt = 1 / 60;
// Long stress run: rapidly reversing anchor, wind, rope length changes.
for (const storm of [false, true]) {
    const weather = new Weather(storm), rope = new Rope({ x: 1500, y: 240 });
    let maxSegment = 0;
    for (let i = 0; i < 12000; i++) {
        weather.update(dt);
        rope.update(dt, { x: 1500 + Math.sin(i * .009) * 140, y: 240 + Math.sin(i * .018) * 35 }, Math.sin(i * .002), 3, weather, []);
        for (let j = 1; j < rope.nodes.length; j++) {
            const d = distance(rope.nodes[j], rope.nodes[j - 1]);
            maxSegment = Math.max(maxSegment, d / (rope.length / rope.count));
            checkFinite(d);
        }
    }
    check(maxSegment < 1.35, `${storm ? 'Storm' : 'City'} rope stays bounded during 200 seconds of sharp turns (max ${maxSegment.toFixed(2)}× segment)`);
}
function checkFinite(n: number) { if (!Number.isFinite(n))
    throw new Error('Physics became non-finite'); }
// Roof geometry is removed, not merely hidden.
const city = new World();
const section = city.buildings.items[0].sections[1];
check(!!resolveCircle({ x: section.x + 5, y: section.y + 3 }, 5, section), 'Intact roof blocks bodies');
city.buildings.break(section);
check(resolveCircle({ x: section.x + 5, y: section.y + 3 }, 5, section) === null, 'Broken roof no longer collides');
check(city.buildings.items[0].sections[0].alive, 'Destruction stays local');
const storm = new Weather(true);
storm.update(1);
const force = storm.force({ x: storm.tornado.x - 70, y: 490 });
check(force.y < -50 && force.x > 0, 'Tornado pulls objects inward and upward');
// Flight controller uses only ordinary flight input to perform real pickup and delivery.
function pilot(world: World, x: number, y: number, seconds: number) { for (let i = 0; i < seconds * 60; i++) {
    const h = world.heli, wind = world.weather.force(h), load = world.people.carried.length, weight = 1 + load * .13;
    const wantX = clamp((x - h.x) * 1.2, -65, 65), wantY = clamp((y - h.y) * 1.2, -65, 65);
    const axis = { x: clamp(((wantX - h.vx) * 3 + h.vx * .65 - wind.x) * weight / 105, -1, 1), y: clamp(((wantY - h.vy) * 3 + h.vy * .83 - wind.y - 5 - load * 2.2) * weight / 95, -1, 1) };
    world.update(dt, axis, 0);
} }
for (const isStorm of [false, true]) {
    const w = new World(isStorm), p = w.people.items[0];
    pilot(w, 195, 270, 6);
    pilot(w, p.x, 270, 9);
    pilot(w, p.x, p.y - 136, 6);
    check(w.people.carried.length > 0, `${isStorm ? 'Storm' : 'City'} passenger picked up through normal flight`);
    pilot(w, p.x, 270, 5);
    pilot(w, 195, 270, 9);
    pilot(w, 195, 345, 8);
    check(w.people.saved === 1, `${isStorm ? 'Storm' : 'City'} carried passenger safely delivered`);
    check(w.heli.health > 80, 'Careful flight preserves helicopter condition');
}
// Mission terminal conditions and restart construction.
const success = new World();
success.people.saved = 5;
success.update(dt, { x: 0, y: 0 }, 0);
check(success.status === 'success', 'Target triggers mission success');
const failure = new World();
failure.heli.health = 0;
failure.update(dt, { x: 0, y: 0 }, 0);
check(failure.status === 'failure', 'Destroyed airframe triggers mission failure');
const lost = new World();
lost.people.lost = 3;
lost.update(dt, { x: 0, y: 0 }, 0);
check(lost.status === 'failure', 'Insufficient survivors triggers failure');
check(new World().status === 'playing' && new World().people.saved === 0, 'Restart creates clean mission');
const h = new Helicopter();
h.x = 500;
h.y = 200;
h.update(dt, { x: 1, y: -1 }, 0, new Weather(false), [], () => { });
check(h.vx > 0 && h.vx < 10 && h.vy < 0, 'Flight accelerates gradually rather than snapping');
for (const isStorm of [false, true]) {
    const w = new World(isStorm);
    for (let i = 0; i < 5; i++) {
        const p = w.people.items[i];
        pilot(w, w.heli.x, 120, 8);
        pilot(w, p.x, 120, Math.abs(p.x - w.heli.x) / 60 + 8);
        pilot(w, p.x, p.y - 136, 10);
        check(w.people.carried.length === 1, `Full ${isStorm ? 'storm' : 'city'} mission pickup ${i + 1}`);
        pilot(w, p.x, 120, 8);
        pilot(w, 195, 120, Math.abs(p.x - 195) / 60 + 8);
        pilot(w, 195, 345, 12);
        check(w.people.saved === i + 1, `Full ${isStorm ? 'storm' : 'city'} mission delivery ${i + 1}`);
    }
    check(w.status === 'success', `Full ${isStorm ? 'storm' : 'city'} mission completes through flight`);
}
const chainWorld = new World();
for (let i = 0; i < 3; i++) {
    const p = chainWorld.people.items[i];
    pilot(chainWorld, chainWorld.heli.x, 100, 8);
    pilot(chainWorld, p.x, 100, Math.abs(p.x - chainWorld.heli.x) / 60 + 8);
    pilot(chainWorld, p.x, p.y - 136 - i * 25, 12);
}
check(chainWorld.people.carried.length === 3, 'Three people can be collected in a connected chain');
pilot(chainWorld, chainWorld.heli.x, 100, 8);
pilot(chainWorld, 195, 100, 25);
pilot(chainWorld, 195, 345, 16);
check(chainWorld.people.saved === 3, 'A three-person chain can be delivered safely');
const crash = new World();
crash.heli.x = 480;
crash.heli.y = 465;
crash.heli.vy = 120;
for (let i = 0; i < 25; i++) crash.update(dt, {x:0,y:1}, 0);
check(crash.buildings.items[0].sections.some(section => !section.alive), 'A real high-speed helicopter impact destroys its contacted roof section');
check(crash.heli.health < 100, 'High-speed impact damages the helicopter');
check(crash.effects.particles.some(particle => particle.kind === 'debris'), 'Destruction creates physical debris');

for (const [width,height] of [[390,844],[844,390],[1280,720],[1920,1080]]) {
    const w = new World();
    w.camera.update(1, w.heli, width, height);
    const top = w.camera.y-height/w.camera.zoom/2;
    const bottom = w.camera.y+height/w.camera.zoom/2;
    check(top>=-60.001 && bottom<=850.001, `Camera remains within world at ${width}×${height}`);
}
const contactRope = new Rope({x:500,y:390});
const obstacle = {x:460,y:515,w:150,h:300,alive:true};
let maximumContactStretch=0;
for(let i=0;i<3600;i++) {
    contactRope.update(dt,{x:500+Math.sin(i*.009)*90,y:390+Math.sin(i*.013)*20},0,3,new Weather(false),[obstacle]);
    for(let j=1;j<contactRope.nodes.length;j++) {
        const stretch=distance(contactRope.nodes[j],contactRope.nodes[j-1])/(contactRope.length/contactRope.count);
        checkFinite(stretch);
        maximumContactStretch=Math.max(maximumContactStretch,stretch);
    }
}
check(maximumContactStretch<1.5, `Rope stays stable during repeated roof contacts (${maximumContactStretch.toFixed(2)}× segment)`);
for (const mission of MISSIONS.filter(m => !['flooded-city','night-storm'].includes(m.id))) {
    const w = new World(mission);
    for (let i=0;i<mission.target;i++) {
        const p=w.people.items[i];
        pilot(w,w.heli.x,120,6);
        pilot(w,p.x,120,Math.abs(p.x-w.heli.x)/60+5);
        pilot(w,p.x,p.y-136,8);
        pilot(w,p.x,120,6);
        pilot(w,195,120,Math.abs(p.x-195)/60+5);
        pilot(w,195,345,8);
    }
    check(w.status==='success', `${mission.name} completes through normal flight (${w.time.toFixed(0)}s, ${w.people.saved} rescued)`);
}
const timed = new World(MISSIONS[4]);
timed.time=299.99;
timed.update(dt,{x:0,y:0},0);
check(timed.status==='failure' && timed.failureReason==='timeout', 'Evacuation fails when time expires');
const frozen=timed.time;
timed.update(dt,{x:0,y:0},0);
check(timed.time===frozen, 'Terminal mission stops its clock');
const fresh=new World(timed.mission);
check(fresh.remainingTime===300 && fresh.people.saved===0, 'Timed restart resets clock and progress');
check(new World(MISSIONS[5]).heli.health===75, 'Expert begins with damaged airframe');
check(formatTime(.1)==='0:01' && formatTime(-1)==='0:00', 'Timer rounds up and cannot display negative time');
console.log(`${passed} checks passed.`);
