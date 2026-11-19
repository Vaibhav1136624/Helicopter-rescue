# Rescue Drift

A complete browser-playable, side-view helicopter rescue game. Original procedural pen-and-paper artwork, synthesized audio, TypeScript, Vite, Canvas 2D, and a custom fixed-step constraint solver. No external fonts, image URLs, accounts, or game services are required.

## Run

Requires Node.js 22.12+ (tested with Node 24).

```sh
npm install
npm run dev
```

Open the Local URL printed by Vite. To make a production build:

```sh
npm run build
npm run preview
```

`npm test` runs deterministic simulation checks, including complete five-person rescue missions in both levels using ordinary flight inputs, three-person chain pickup/delivery, long-duration rope stress tests, collision geometry removal, weather forces, and terminal mission states.

## Play

Choose one of six missions from Easy through Expert, then **Begin Rescue**. Bring the required survivors back to the flagged **RESCUE / 01** platform on the far left. The nearest survivor or home direction is shown at the bottom of the screen.

| Control | Action |
| --- | --- |
| WASD or arrow keys | Fly with inertia and assisted hover |
| Q / E | Retract / extend the rope |
| Space | Release all passengers; use carefully |
| Escape | Pause / resume |
| R | Restart the current mission immediately |
| M or Sound button | Mute / unmute |

Touch devices have a directional pad, rope controls, and a release button. Sound starts only after user interaction. Switching away automatically pauses an active mission.

Lift off before moving sideways. Approach survivors slowly with the rope end near their heads. They grab automatically below the pickup speed limit. Up to three can hang in a chain; each passenger reduces acceleration and adds downward load. Carry them above rooftops, return to the base, and slowly lower them into the dashed delivery zone. Delivery is automatic at safe speeds; pressing Space is not required. A counter increases only after delivery. Losing too many people or destroying the airframe ends the mission.

In Flooded City, sufficiently hard impacts break individual roof sections, remove their collision geometry, and spawn bouncing debris. In Night Storm, gusts and a moving waterspout influence flight, rope, and carried passengers. Fly high to avoid the strongest tornado forces.

## Source map

- `src/main.ts`: app lifecycle, menu, briefing, pause/results, HUD and touch bindings.
- `src/world.ts`: mission orchestration and fixed-step simulation.
- `src/helicopter.ts`: inertia, gravity/lift, assisted stabilization, landing and impact damage.
- `src/rope.ts`: damped Verlet integration, iterative constraints, rope length and collisions.
- `src/people.ts`: pickup, chain constraints, release, falling, loss and safe delivery.
- `src/buildings.ts`: level geometry and localized destructible city roofs.
- `src/weather.ts`: gusts and moving tornado force field.
- `src/effects.ts`: bounded particles and colliding physical debris.
- `src/render.ts`: original procedural art, articulated figures, rotors, water, weather and parallax.
- `src/camera.ts`, `src/input.ts`, `src/audio.ts`: camera, controls and synthesized sound.
- `src/config.ts`: gameplay tuning defaults.
- `tests/physics.test.ts`: headless gameplay and physics regression tests.

## Physics and practical limits

The simulation runs at 60 Hz with a bounded catch-up budget. The rope uses 18 segments and 18 solver passes; circle-versus-AABB contact projection handles static geometry. Rooftops consist of four independently removable sections. Debris uses ballistic motion and terrain contact; smaller dust and splash particles are visual only. Particle counts are bounded. Passenger limbs are procedurally articulated rather than individually simulated ragdoll bones. Collision shapes approximate the helicopter fuselage, people, and illustrated island platforms; rotor blades and decorative laundry do not collide.

Flight has an assisted neutral lift with a slight downward drift, rather than requiring constant throttle balancing. Wind is fully simulated; the rain itself is visual. Individual city roof sections break, while building foundations and storm islands remain solid. There is no fuel system, campaign persistence, or external asset dependency.

## Reference verification

Only the written specification was available as an attachment. The Instagram page loaded its caption but did not expose playable video, and the two referenced video files were not attached. This implementation follows the written atmosphere and mechanics; it is **not a verified frame-for-frame recreation**. Physics values, level geometry, rescue target, pickup limits, handling, and difficulty are original configurable interpretations.

## Mission expansion
Six operations span Easy through Expert: Harbor Patrol, Flooded City, Rooftop Relay, Night Storm, Evacuation Rush (five minutes), and Eye of the Storm. Each configures rescue targets, roof layout, wind, damage and pickup tolerance. The evacuation clock pauses with gameplay and resets on restart. All missions are immediately available.


## App downloads

Download the Windows app from [GitHub Releases](https://github.com/Vaibhav1136624/Helicopter-rescue/releases). Extract the ZIP and run Rescue Drift.exe inside win-unpacked. See [APPS.md](APPS.md) for Windows controls and Android build instructions. The Android project is included; an APK has not yet been compiled.

