# Seeded landscapes, crossings and patrols

## Replay contract

Against the Wall, Rio Rescue and Flappy Files expose a visible unsigned 32-bit seed, Replay Seed, New Seed and Copy Replay Link. Both direct game URLs and hash routes accept `?seed=123`. Restart retains the seed; applying a different seed resets the run. Replaying requires the same game version and settings. The seed controls initial terrain, obstacles, actors and procedural sequences; player decisions still change the course of a run. Flappy already generates bounded, reachable column heights using its seeded random stream; the public replay controls now expose that capability.

## Rio Rescue

Each of three districts covers 48×36 cells, four times the previous 24×18 area. Seeded irregular landforms replace repeated straight strips: canyon basins, mesas, plateaus and mountains. Canyon faces have rock strata; mountain peaks and flat-topped landforms use actual terrain elevation. Elevated landforms block walking until a supported climbing route exists. The eastern fence retains marked climbable sections. Start/dock routes and bridge corridors remain protected during generation.

The river meanders across the map and has animated downstream flow. A horizontal swimming step into water adds one downstream step, producing approximately 45-degree displacement relative to the intended crossing. Each intermediate cell applies collision and collection rules; followers trace the same route. Motion interpolation follows those cardinal segments rather than cutting through terrain. Bridges avoid the current. Reduced motion stops cosmetic flow/gait, while actual current still applies.

A seeded cast of rural workers includes straw hats and work clothing, women, mothers carrying babies, and groups of two or three children represented as one convoy entity. The entity variant is stable while that convoy segment moves. The perspective camera follows the convoy; a minimap identifies terrain, the dock, rescue pickups and cameras. The map seed remains visible.

X toggles waiting while camera sweeps and exposure continue. Camera alert accumulates over 1.5 seconds and decays over one second when hidden. Pause freezes simulation time. Pickups and camera locations must be valid terrain positions; the campaign regression traverses generated routes rather than teleporting between objectives.

## Against the Wall

Each district covers 64×48 cells, four times the previous 32×24 area. A continuous border spans row 23 and meets both outside boundaries. Seeded material run lengths divide it into wire, fencing and concrete. Seeded building footprints retain roads and clear border approaches. Collision checks validate all guard positions and patrol waypoints.

The Asylum Office is north. ICE and Border Patrol start north; Sinaloa, CJNG, Gulf cartel and paramilitary opponents start south. Names are corroborated by this [US Department of Justice source](https://www.justice.gov/opa/pr/attorney-general-pamela-bondi-announces-29-wanted-defendants-mexico-taken-us-custody). Locations and encounters are fictional game rules.

Ten guards include ordinary routes, building perimeters, map-edge patrols, fence patrols and one roaming route on each side. Roaming routes visit waypoints spread over their side; navigation avoids solid buildings. Chase and combat temporarily supersede patrol duties. Returning guards resume their routes. A minimap shows the player, office, border materials and live guards.

| Material | Player construction | Crossing | Guard response |
| --- | --- | --- | --- |
| Barbed wire | B, stay still for 3 seconds | Full walking speed; remains open until repaired | One nearby guard can mend it in 30 seconds |
| Fence | B, build ladder for 5 seconds | 65% speed; ladder lasts 20 seconds | A nearby guard knocks it down immediately; occupants are safely dismounted to clear ground before it becomes solid |
| Concrete | B, select wall-side south entry, build for 10 seconds | Underground travel at 40% walking speed | Requires two guards at each endpoint for 90 seconds to close |

Tunnel selection shows only valid south-side entry tiles against concrete. Arrows or Previous/Next cycle entries; Enter or a pointer click commits one entry and immediately starts construction. The exit is generated from the map seed, district and tunnel index: one to ten tiles beyond the north face, with up to five tiles of lateral drift. Unsafe destinations are deliberately not filtered out. No exit marker or location is revealed before surfacing.

After digging, the first underground journey reveals the outcome. Emerging beneath any raised structure causes a fatal collapse; emerging in water causes drowning. Both set health to zero, display the cause, and return to the district checkpoint after two seconds. Otherwise the exit is revealed and the tunnel becomes a reusable bidirectional route. A living enemy occupying a safe exit delays surfacing until it clears. Pause freezes transit and the checkpoint timer. Seeded ponds are visible on the map and excluded from ordinary walking and guard patrol routes.

B or Cancel Tunnel cancels entry selection. Movement cancels construction. The wall stays solid above a tunnel. Discovered portals retain timed travel and protection against immediate return bouncing. Guards cannot repair an undiscovered exit.

Construction and repair use simulation time, so pause freezes them. Enemies remain active while the player builds or selects endpoints. Closed passages may be rebuilt. A checkpoint/district reset reconstructs the seeded initial map.

## Day/night and actor status

Day and night each last 60 seconds of simulation time. The HUD shows the phase and countdown. At night, living enemies carry flashlights using the same wall-clipped range and heading as detection. Night targeting includes same-faction actors and federal allies. Daylight restores alliances and clears now-allied targets.

Alex and living enemies have readable health meters; each living enemy also has an attention meter. Nameplates and meters remain bright at night. Alex's health also has an accessible HUD progress bar. Four-second sprint, wall collision, suspicion decay and dead bodies remain supported.
