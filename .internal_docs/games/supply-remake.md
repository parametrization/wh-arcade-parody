# Supply Line → Supply the People

Status: proposed design and implementable specification; no gameplay implemented. Planning inspection: 2026-09-07. Slug: `supply-the-people`. Alternatives: **Supply Lie**, **Make Lunch Affordable Again**. Recommended title makes the positive objective immediately legible; subtitle: “Keep the meals moving. Send the markup packing.”

Planning dependency: complete Flappy’s plan/spec first, then finalize the other four against that standard. All five plans/specs must be complete before any game implementation starts. Shared-interface readiness alone does not open this gate; see [P-01..03](../status.md).

## Original evidence and interpretation

Primary source: [Supply Line](https://www.whitehouse.gov/arcade/supply-line/). The public page and its inline JavaScript were inspected. Temporary local research copies: `/tmp/supply-line.html` and `/tmp/supply-line.js`; these are reference material, not distributable project assets.

Verified: Canvas pixel sprites are encoded as character grids; the scene includes a conveyor belt and food items. Pointer or arrows plus Space operate the removal action; M mutes and R restarts. Food definitions distinguish items to retain from items to remove. Seven configured shifts increase speed and spawn frequency; score, shipped quantity, combo and a final grade are tracked. Food classes include whole foods, packaged products, oils and additives. Some graphics and sound are generated in code rather than loaded as image/audio files.

Interpretation: This is an escalating food-sorting reflex game. Our remake preserves the readable conveyor action but makes equitable delivery and affordability the objective. We have not yet played a complete original run or verified all collision/scoring thresholds. The original's food classification is game content, not a medical authority; no nutritional claim should be copied into our tutorial. The source inspection does not establish ownership or a reuse license.

## Plot, roles and satire

You run a neighborhood food cooperative on opening day. Lunch boxes must reach schools, clinics and neighbors before a series of absurd branding and markup machines diverts the budget. Every delivered crate visibly stocks the neighborhood instead of filling a presidential trophy cabinet.

Donald Trump is an obvious cartoon “brand inspector” who attempts to cover crates in oversized gold TRUMP sleeves. JD Vance operates a fictional velvet-rope VIP diversion lever. Mike Johnson stamps cartoon spending freezes. These are invented encounters, not representations of actual transactions, quotations, crimes or current official duties. Names appear in readable plaques and the character gallery; dialogue is authored satire, never presented as a sourced quote. A shared dated roster holds any factual biography separately from fictional encounter descriptions.

Three acts: **Grand Rebranding** teaches removal of extra packaging; **VIP Supply** adds route selection and competing queues; **Everybody Eats** combines all mechanics and ends in a neighborhood potluck. The funny failure is “Budget swallowed by packaging”; residents are never humiliated or blamed.

## Loop and rules

1. Read the current destination order above a three-lane belt. Items carry a large destination shape: school triangle, clinic cross, pantry circle.
2. Allow plain provision crates to travel; remove a clearly marked markup sleeve by selecting the crate once. A second click never discards food. Gold sleeves have a receipt icon and visible extra cost, not just a color distinction.
3. At the exit, switch each lane's destination gate to the matching icon. Correct deliveries fill one of three community meters and earn a combo. Misrouted goods enter a recovery bin and can be rerouted next shift.
4. Every 12 successful deliveries earn one “Collective Bargaining” bell, maximum two. Ring it to slow belts and cancel an active interference for four seconds.
5. Between 45-second shifts, pick one of three upgrades: wider handling window, larger recovery bin, or longer bell duration. Three shifts form a roughly four-minute campaign with menus. Endless is unlocked afterward.

The primary challenge is timing plus routing, not memorizing real food labels. Remove sleeves for +5; deliver for +10; a balanced set of all three destinations gives +20 and restores five budget points. Missed sleeves cost eight budget points; misroutes cost four and retain the food. Start at 100 budget. Zero budget ends the shift with retry; campaign completion requires 36 deliveries and at least eight per destination. These are initial fictional tuning values, not real economics.

Trump's branding event telegraphs for 1.5 seconds and sleeves the next three crates. Vance's VIP event points to one gate for two seconds before briefly attempting to switch it; the player can lock the gate with the action key or bell. Johnson's freeze locks one lane's spawner for three seconds while the other lanes remain playable. At most one interference runs at a time; a minimum eight-second recovery follows. No event can strand the last required delivery. The final act introduces no new symbols.

## Controls, states and accessibility

Pointer/touch: tap a crate to strip a sleeve; tap a gate to cycle destinations; large bell button. Keyboard: arrows move focus among active crates and gates, Space acts, 1/2/3 select a lane's gate, B rings bell, Escape pauses, M mutes, R opens restart confirmation during a run. Avoid page scroll suppression unless the game owns focus. All actions also have semantic DOM buttons outside the Canvas.

States: loading → title → tutorial → shift → upgrade → shift → results; pause overlays shift without advancing timers. Fatal asset errors offer retry/back to arcade. A seeded pure simulation owns entities, inventory, events, scoring and transitions; renderer consumes snapshots. Practice has no failure, adjustable 50–100% speed and optional frozen-time step controls. Announce selected item, destination and budget on demand; throttle live-region events. Reduced motion removes conveyor texture scrolling, screen shake and portrait sliding while preserving item motion/telegraphs. High contrast and distinct icons are available; audio is optional and starts after interaction. Touch targets are at least 44 CSS pixels. Full keyboard play and screen-reader practice are acceptance requirements.

## Art direction and asset choices

Match the original's chunky outlined pixel sprites, industrial belt, compact counters and warm highlights. Proposed native game resolution 320×224, integer nearest-neighbor scaling, readable DOM instructions outside. Final palette and screenshot matching depend on the shared visual audit. Every option below needs a contact sheet before final illustration, and provenance records before inclusion. New code-native pixel art may live beside the game; exported sprite sheets go in `public/assets/supply-the-people/`.

| Asset family | Option A (default) | Option B | Option C | Deliverables |
| --- | --- | --- | --- | --- |
| Cooperative crew | Three apron-wearing adult volunteers | Bald eagle in loading vest | Rolling forklift with face panel | 24×32 idle/work/celebrate, 3 frames each |
| Trump branding cameo | Orange cartoon head, gold stamp, red tie | Full-body oversize jacket at packing desk | Cameo in absurd gilt inspection booth | 48×64 idle/telegraph/stamp/retreat, 3 frames each |
| Vance and Johnson cameos | Named cartoon portraits at control panels | Full-body lever and stamp operators | Labeled mechanical booths with portrait medallions | Two 48×64 sheets, same four states |
| Provision crates | Wooden crates with big destination glyphs | Cloth grocery bags | Reusable colored tubs plus shaped lids | Three 24×24 bases; sleeve overlay; recovered state |
| Interference objects | Gold branded sleeve, VIP gate, freeze stamp | Receipt ribbons and red tape | Oversize price guns and velvet ropes | Six 24×24 icons, 2–4 frames each |
| Community destinations | School, clinic, pantry storefronts | Community center counters | Illustrated delivery carts | Three 64×48 buildings, empty/filling/full |
| Bell and upgrade tokens | Union bell and hand tools | Joined hands badge | Megaphone and wrench | Four 24×24 icons, one activation burst |
| Environment and results | Warehouse overlooking neighborhood | Open-air cooperative market | School loading bay | 320×224 background layers, belt tile, potluck vignette |

Audio: original short conveyor tick, sleeve pop, delivery chord, bell and results jingle; no copied speech/music. Provide distinct soft alternatives to the bell and a global volume control. Portrait labels use shared fonts and remain DOM-readable.

Shared runtime and directory contract: [infrastructure specification](../specs/infrastructure.md), authoritative if examples here differ.

## Implementable work packages

| ID | Scope/files | Dependencies | Acceptance evidence |
| --- | --- | --- | --- |
| SL-01 | Record original title/tutorial/playing/results screenshots, mechanic notes and asset manifest with source URL, hash, rights status | Working browser; rights template | Every borrowed/reference asset traced; unresolved ones excluded from distribution; one full observed run |
| SL-02 | `src/games/supply-the-people/{index.ts,game.ts,config.ts,assets/}`; add `simulation.ts`, `types.ts`, `render.ts`, `content.ts` as needed; register arcade route | Shared game lifecycle, input, renderer, seeded RNG | Mount/start/pause/restart/destroy works; hot reload leaves no timers/listeners; route runs at localhost:8643 |
| SL-03 | Implement one belt, sleeves, destination order, budget and results using placeholder art | SL-02 | Fixed-seed replay gives identical state; stripping twice never destroys food; no negative score/budget; complete keyboard practice |
| SL-04 | Three lanes, recovery bin, shifts, upgrades and three scripted cameos | SL-03, shared character roster | Event scheduler respects telegraphs and exclusion window; all campaign seeds in fixture set are winnable; each cameo has documented counterplay |
| SL-05 | Approved sprite choice, animation sheets, sound, community growth and humorous results text | SL-01; shared art approval/provenance; SL-04 | Missing sprites fall back safely; legible mobile labels; no factual claims hidden in fictional dialogue |
| SL-06 | Focus, touch, reduced motion, non-timed practice and performance verification | SL-05; shared accessibility/test harness | Playwright keyboard and touch campaign smoke; pause freezes budget/events; no remote game requests; stable 60fps target on agreed baseline |

Shared imports only from `src/shared/`: clock/lifecycle, pixel viewport, input focus, audio, storage schema, UI, RNG, character roster and provenance. Keep belt rules and destination logic local; do not build a generalized logistics engine before a second consumer exists. Tests belong near simulation modules, with cross-game browser journeys in the common e2e suite. Storage records versioned best/practice settings only, no personal data.

## Decisions for the next review

Recommended starting choices are title **Supply the People**, cooperative crew option A, three destinations, and the above three named cameos. Open: whether the food focus should be broadened to medication/books; degree of cartoon likeness versus portrait medallions; whether routing overcomplicates the arcade homage. Start the vertical slice with sleeves only and add routing only after a short playtest proves its readability. This plan can proceed independently of Flappy Files art, but implementation requires completion of all five plans/specs and the shared lifecycle contract, not Flappy implementation.
