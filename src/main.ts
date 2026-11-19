import './style.css';
import { MISSIONS, formatTime, type Mission } from './missions';
import { CONFIG } from './config';
import { Rope } from './rope';
import { World } from './world';
import { Renderer } from './render';
import { Input } from './input';
import { Sound } from './audio';
const renderer = new Renderer(document.querySelector<HTMLCanvasElement>('#game')!);
const ui = document.querySelector<HTMLDivElement>('#ui')!;
const input = new Input(), sound = new Sound();
let selected = MISSIONS[0], world = new World(selected), screen: 'menu' | 'briefing' | 'playing' | 'paused' | 'success' | 'failure' = 'menu', previous = 0, accumulator = 0, lastHud = 0;
function connect() { world.onSound = s => sound.tone(s); }
connect();
function reset() { world = new World(selected); connect(); input.clear(); accumulator = 0; screen = 'playing'; drawUI(); }
function header() { return `<header class="mast"><span class="wordmark">RESCUE DRIFT<span style="color:var(--accent)"> +</span></span><div class="mast-right"><span class="edition">FIELD OPERATIONS / 06 MISSIONS</span><button class="icon-button" id="mute" aria-label="${sound.muted ? 'Unmute' : 'Mute'} audio">${sound.muted ? 'SOUND OFF' : 'SOUND ON'}</button>${screen !== 'menu' ? '<button class="icon-button" id="pause" aria-label="Pause game">Ⅱ</button>' : ''}</div></header>`; }
function drawUI() {
    if (screen === 'menu') {
        world.heli.x = 950;
        world.heli.y = 270;
        world.rope = new Rope({ x: 950, y: 286 });
    }
    document.body.classList.toggle('storm', selected.storm);
    ui.innerHTML = header();
    if (screen === 'menu')
        ui.innerHTML += `<main class="menu mission-menu"><div class="eyebrow">CHOOSE YOUR NEXT OPERATION</div><h1>Rescue <em>Drift.</em></h1><p class="intro">Six missions. Steady hands. Bring them home.</p><div class="levels">${MISSIONS.map((m,i)=>`<button class="level ${selected.id===m.id?'selected':''}" data-mission="${i}" aria-pressed="${selected.id===m.id}"><span>0${i+1} / ${m.difficulty.toUpperCase()}</span><strong>${m.name}</strong><small>${m.target} RESCUES · ${m.timeLimit?formatTime(m.timeLimit):'NO TIME LIMIT'}</small></button>`).join('')}</div><div class="operation-detail"><strong>${selected.difficulty} · ${selected.name}</strong><p>${selected.description}</p><small>${selected.health}% AIRFRAME · ${selected.storm?'NIGHT':'DAY'} FLIGHT</small></div><button class="launch" id="launch">BEGIN RESCUE <span>↗</span></button><div class="hint">KEYBOARD OR TOUCH · ALL MISSIONS UNLOCKED</div></main>`;
    else
        ui.innerHTML += `<div class="hud"><div class="stat"><small>RESCUED</small><strong id="rescued">0 <span>/ 5</span></strong></div><div class="stat"><small>AIRFRAME</small><strong id="health">100<span>%</span></strong><div class="health-track"><i id="health-fill" style="width:100%"></i></div></div></div><div class="mission">${selected.name.toUpperCase()} · ${selected.difficulty.toUpperCase()}<br><span id="load">ROPE CLEAR</span></div><div class="mission-clock" id="clock"></div><div class="toast" id="toast"></div><div class="controls-strip"><kbd>W A S D</kbd> FLY &nbsp; <kbd>Q / E</kbd> ROPE &nbsp; <kbd>SPACE</kbd> RELEASE<br><kbd>ESC</kbd> PAUSE &nbsp; <kbd>R</kbd> RESTART</div><div class="touch"><div class="dpad"><button data-key="KeyW" aria-label="Fly up">↑</button><button data-key="KeyA" aria-label="Fly left">←</button><button data-key="KeyS" aria-label="Fly down">↓</button><button data-key="KeyD" aria-label="Fly right">→</button></div><div class="rope-pad"><button data-key="KeyQ" aria-label="Retract rope">Q −</button><button data-key="KeyE" aria-label="Extend rope">E +</button><button id="release">RELEASE</button></div></div>`;
    if (screen === 'briefing')
        overlay('FLIGHT BRIEFING', selected.name, selected.briefing, `<dl class="control-grid"><dt>WASD / ARROWS</dt><dd>Fly · release to stabilize</dd><dt>Q / E</dt><dd>Retract / extend rescue rope</dd><dt>SPACE</dt><dd>Release passengers carefully</dd><dt>ESC / R</dt><dd>Pause / restart mission</dd></dl><p>Hover to let survivors grab the rope. Carry up to three, then lower them into the marked rescue base. Keep pickup and delivery slow.</p><button class="launch" id="start">READY FOR TAKEOFF <span>↗</span></button>`);
    if (screen === 'paused')
        overlay('FLIGHT ON HOLD', 'Take a breath.', 'Your crew can wait a moment.', `<button class="launch" id="resume">RESUME FLIGHT <span>→</span></button><button class="secondary" id="restart">RESTART MISSION</button><br><button class="secondary" id="menu">RETURN TO OPERATIONS</button>`);
    if (screen === 'success' || screen === 'failure')
        overlay(screen === 'success' ? 'MISSION COMPLETE' : 'OPERATION ENDED', screen === 'success' ? 'Home, at last.' : world.failureReason === 'timeout' ? 'Out of time.' : world.heli.health <= 0 ? 'A rough landing.' : 'Too many left behind.', screen === 'success' ? `${world.people.saved} people brought to safety. Mission complete: ${selected.name} (${selected.difficulty}).` : `${world.people.saved} rescued. ${world.failureReason === 'timeout' ? 'The evacuation window has closed.' : world.heli.health <= 0 ? 'The helicopter can’t continue.' : 'There are no longer enough survivors to reach the target.'} A steadier approach can make all the difference.`, `<button class="launch" id="restart">${screen === 'success' ? 'FLY AGAIN' : 'TRY AGAIN'} <span>↗</span></button><button class="secondary" id="menu">CHOOSE OPERATION</button>`);
    bind('mute', () => { sound.start(); sound.muted = !sound.muted; drawUI(); });
    document.querySelectorAll<HTMLButtonElement>('[data-mission]').forEach(b => b.onclick = () => choose(MISSIONS[Number(b.dataset.mission)]));
    bind('launch', () => { sound.start(); screen = 'briefing'; drawUI(); });
    bind('start', () => { sound.start(); reset(); });
    bind('resume', () => { screen = 'playing'; input.clear(); drawUI(); });
    bind('pause', pause);
    bind('restart', reset);
    bind('menu', () => { screen = 'menu'; world = new World(selected); connect(); drawUI(); });
    bind('release', () => world.people.release());
    document.querySelectorAll<HTMLButtonElement>('[data-key]').forEach(b => { const key = b.dataset.key!; b.onpointerdown = e => { e.preventDefault(); b.setPointerCapture(e.pointerId); input.touch.add(key); sound.start(); }; b.onpointerup = () => input.touch.delete(key); b.onpointercancel = () => input.touch.delete(key); });
    updateHud();
}
function overlay(eyebrow: string, title: string, copy: string, buttons: string) { ui.innerHTML += `<div class="overlay"><section class="panel" role="dialog" aria-modal="true" aria-label="${title}"><div class="eyebrow">${eyebrow}</div><h2>${title}</h2><p>${copy}</p>${buttons}</section></div>`; }
function bind(id: string, fn: () => void) { document.getElementById(id)?.addEventListener('click', fn); }
function choose(mission: Mission) { selected = mission; world = new World(mission); connect(); drawUI(); }
function pause() { if (screen === 'playing') {
    screen = 'paused';
    input.clear();
    drawUI();
}
else if (screen === 'paused') {
    screen = 'playing';
    drawUI();
} }
function updateHud() {
    const clock = document.getElementById('clock');
    if (clock) {
        const remaining = screen === 'briefing' ? selected.timeLimit : world.remainingTime;
        clock.textContent = remaining == null ? '' : `TIME LEFT  ${formatTime(remaining)}`;
        clock.classList.toggle('urgent', remaining != null && remaining <= 60);
    }
    const rescued = document.getElementById('rescued'), health = document.getElementById('health'), fill = document.getElementById('health-fill'), load = document.getElementById('load'), toast = document.getElementById('toast'); if (rescued)
    rescued.innerHTML = `${world.people.saved} <span>/ ${world.people.target}</span>`; if (health)
    health.innerHTML = `${Math.ceil(world.heli.health)}<span>%</span>`; if (fill) {
    fill.style.width = world.heli.health + '%';
    fill.style.background = world.heli.health < 40 ? '#a24c3e' : 'var(--ink)';
} if (load)
    load.textContent = world.people.carried.length ? `${world.people.carried.length} ABOARD · RETURN TO BASE` : 'ROPE CLEAR · FIND SURVIVORS'; if (toast)
    toast.innerHTML = world.messageTime > 0 ? `<span>${world.message}</span>` : ''; }
input.onAction = key => { if (key === 'Escape')
    pause(); if (key === 'KeyR' && screen !== 'menu' && screen !== 'briefing')
    reset(); if (key === 'Space' && screen === 'playing') {
    world.people.release();
    world.say('Passengers released. Watch their landing.');
} if (key === 'KeyM') {
    sound.muted = !sound.muted;
    drawUI();
} };
window.addEventListener('blur', () => { if (screen === 'playing')
    pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && screen === 'playing')
    pause(); });
function frame(now: number) {
    const dt = Math.min((now - previous) / 1000, .05);
    previous = now;
    if (screen === 'playing') {
        accumulator += dt;
        let steps = 0;
        while (accumulator >= 1 / CONFIG.physicsHz && steps++ < 5) {
            world.update(1 / CONFIG.physicsHz, input.axis, input.extend);
            accumulator -= 1 / CONFIG.physicsHz;
        }
        if (world.status !== 'playing') {
            screen = world.status;
            drawUI();
        }
    }
    else if (screen === 'menu' || screen === 'briefing') {
        world.time += dt;
        world.weather.update(dt);
        world.heli.x = 950;
        world.heli.y = 270 + Math.sin(world.time * .7) * 9;
        world.heli.angle = Math.sin(world.time * .5) * .07;
        world.rope.update(1 / CONFIG.physicsHz, { x: world.heli.x, y: world.heli.y + 16 }, 0, 0, world.weather, world.buildings.solids);
    }
    renderer.draw(world, dt, screen === 'menu' || screen === 'briefing');
    sound.update(world.heli.thrust, world.storm, screen === 'playing');
    if (now - lastHud > 100) {
        updateHud();
        lastHud = now;
    }
    requestAnimationFrame(frame);
}
drawUI();
requestAnimationFrame(frame);
