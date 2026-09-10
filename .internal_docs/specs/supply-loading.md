# Supply the People: fictional supplier loading sequence

Agreed scope, 2026-09-09: three fictional warehouse operators in suits, with head turns and hinged-mouth announcements, visibly collect cargo from supplier trucks and place it on their own conveyor belts. This round does not implement the other games' proposed changes.

## Cast and materials

- Mara operates lane 1, Ellis lane 2, Rowan lane 3. These are original fictional workers, not likenesses of real people.
- Pharmacy cargo: Pill & Parcel.
- Housing cargo: Roof & Beam.
- Medical supplies: Care Package Medical.
- Gold-coated versions of all three: Financial Misappropriations, a fictional supplier. Gold coating carries an in-game surcharge.

## Loading state machine

The model owns each loading job, including its ID, lane/worker, material, supplier truck, gold flag, phase and elapsed time. Phases are announce (0.5s), walk to truck (0.65s), retrieve (0.45s), walk to belt (0.65s), place (0.25s). One job may occupy each worker. Scheduling remains round-robin at 1.45-second intervals. No conveyor crate exists before the place phase completes; it uses the job ID/material/gold flag when created. Pending jobs must drain before a shift can end.

The renderer derives movement, held packages, head direction and mouth animation from this model. The same job must be visible at its selected truck and its own lane. Pausing freezes loading, carried cargo and belt movement. Reduced motion quiets decorative motion while retaining necessary movement and phase information.

The canvas is 640×640 with conveyor centerlines 300, 410 and 520. Existing model X coordinates remain unchanged. Renderer and pointer hit-testing share one layout module. Trucks and walking space must not act as invisible crate/gate hit targets.

## Scoring and controls

- Remove a gold coating: +5 points, once only.
- Deliver gold unstripped: −8 budget, even if routed correctly.
- Correct delivery: +10 points; balanced set: +20 points and +5 budget.
- Misroute: −4 budget, with existing recovery-bin rules.
- Preserve campaign objectives, three shifts, endless unlock, practice stepping, pause/restart, existing keyboard aliases and accessible crate/gate buttons.
- Keep the 8-budget surcharge distinct from the 5-point stripping bonus in every label.

## Acceptance and verification

1. Original headshots and the old underlying face drawings are absent from this game; no head-atlas request occurs.
2. All four trucks and their full supplier names are identifiable. Loading announcements are available as readable HTML as well as scene bubbles.
3. Every belt crate follows a real announce/pickup/place job; no duplicate deposits or prematurely ended shifts.
4. Click alignment remains correct at scaled display sizes. Gold removal can award only once; unstripped cargo incurs its surcharge.
5. Desktop/mobile browser checks exercise the actual game, input and renderer; model tests cover stage boundaries, job draining and winning campaigns.
6. Refresh the Supply arcade preview from actual gameplay after the new renderer settles.
