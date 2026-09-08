# Terrain and constructed crossings

## Rio Rescue

A fixed-heading perspective camera follows the interpolated convoy, with projected 3D geometry drawn through Canvas. The art direction uses low-poly forms, muted terrain shading, larger articulated figures and deep cliff faces inspired by early PlayStation games. This is not a hardware emulator.

All three 24×18 districts have canyon cells 8–9, river cells 15–16, and fence column 20. Bridge rows 4–5,8–9,13–14 connect both water/gap crossings; fence sections 5,9,13 can be climbed automatically at 1.8× the normal tick interval. Plain canyon, river and fence cells block movement/spawning. Later districts add rocks and cameras. X toggles waiting while camera sweeps and exposure continue. Camera alert accumulates over 1.5s and decays over 1s when hidden; a full meter triggers the existing rewind/jam rules. Normal pause freezes both movement and cameras. Rendering and camera detection share their cone/terrain predicate.

## Against the Wall

A continuous barrier spans row 10, from one outside boundary to the other, separating Alex's southern starting region from the northern Asylum Office. ICE and Border Patrol start north. Paramilitary, Sinaloa, CJNG and Gulf cartel opponents start south. These placements and encounters are fictional gameplay. The cartel names are corroborated by this [US Department of Justice source](https://www.justice.gov/opa/pr/attorney-general-pamela-bondi-announces-29-wanted-defendants-mexico-taken-us-custody); the map is not a real geographic or organizational claim.

| Material | B action | Construction | Lifetime | Crossing speed |
| --- | --- | --- | --- | --- |
| Barbed wire | Cut through | 3s | Permanent | 100% |
| Fence | Build ladder over | 5s | 20s | 65% |
| Concrete | Dig tunnel under | 10s | Permanent | 40% |

Start within 1.6 tiles of a closed segment and press B. Stay still while construction proceeds; moving or pressing B again cancels. Threats remain active. Completion opens a physical route through the barrier. Temporary ladder expiration waits for player/enemy collision circles to clear before closing. Checkpoints reset construction and crossings. Four-second sprint and wall-clipped vision remain supported.

The renderer targets a richer console-era perspective presentation, with material-specific structures and visible routes, while retaining the tested simulation. Pointer aiming uses the inverse of that renderer's ground projection. The destination remains labeled ASYLUM OFFICE.
