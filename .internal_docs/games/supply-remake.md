# Supply Line → Supply the People

Status: proposed design and implementable specification; no gameplay implemented. Planning inspection: 2026-09-07. Slug: `supply-the-people`. Alternatives: **Supply Lie**, **Make Lunch Affordable Again**. Recommended title makes the positive objective immediately legible; subtitle: “Keep the meals moving. Send the markup packing.”

Planning dependency: Flappy’s P-01 planning standard is complete; this plan has now been finalized against it. All five plans/specs must be complete before any game implementation starts. The common foundation must also be implemented and verified (FOUNDATION-READY); see [P-01..03](../status.md).

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

Recommended starting choices are title **Supply the People**, cooperative crew option A, three destinations, and the above three named cameos. Open: whether the food focus should be broadened to medication/books; degree of cartoon likeness versus portrait medallions; whether routing overcomplicates the arcade homage. Start the vertical slice with sleeves only and add routing only after a short playtest proves its readability. This plan can proceed independently of Flappy Files art, but implementation requires completion of all five plans/specs and the verified common foundation, not Flappy implementation.

## P-02 implementation baseline v1

This baseline supersedes conflicting earlier proposal wording. Earlier alternatives remain historical design options, not simultaneous implementation requirements.

Planning complete against [P-01](../specs/game-planning-standard.md); route `/games/supply-the-people/`. All-five-plan plus FOUNDATION-READY gate applies before game code. Title **Supply the People**, three destinations and named cameos remain initial defaults. V1 includes the routing layer, three shifts, untimed practice and all three upgrades; endless and additional goods categories are deferred. The earlier suggestion to decide routing after playtest is a future scope review, not an unresolved implementation branch. Art option A uses independently authored placeholders; final contact sheets remain unapproved.

### Belt, resource and event specification

Logical 320×224 world has lanes y=72/120/168, spawn x=−24 and dispatch x=280. Crates are 24×24, visual effects decorative. Lane gate buttons live at right with DOM equivalents. Starting destinations are lane1 school, lane2 clinic, lane3 pantry; destination order of a crate is immutable. Gate cycle order school→clinic→pantry→school. Pointer selects a crate by visual bounds; ties use largest x then smallest ID. Keyboard Up/Down chooses lane, Left/Right walks stable x-sorted crate targets then gate; 1/2/3 focuses that lane's gate, Space cycles gate or strips selected sleeve. No food-discard action exists. Gate lock is L or a separate DOM Lock button on selected gate, lasts 4s, cooldown 6s, no resource cost; unlike Space it does not cycle. B rings bell; duplicate key repeats ignored for all discrete actions.

Three shifts last 45 active seconds; spawns stop at 36s, leaving nine seconds to flush lanes before results. Speeds 40/48/56 px/s permit any spawn before 36s to dispatch before 45s; fastest transit ≤7.6s. Each shift schedules 18 fresh crates, exactly six per destination, at 2s intervals starting 0s, lanes round-robin with seeded destination permutation. Minimum same-lane spacing 48px; a delayed spawn retains its identity/order and enters next legal slot. Events cannot delay beyond 36s: cancel a freeze that would make the fresh schedule impossible. Seed randomizes arrival destinations and sleeve placement but not guaranteed counts. Six of 18 crates start sleeved; event-created sleeves replace plain overlays and never stack cost. Initial budget=100, cap=100; sleeve removal +5 score once, dispatch +10 once, missed sleeve −8 budget at dispatch even if misrouted, misroute −4 and resets combo. Correct unsleeved dispatch increments combo; combo is displayed, no undocumented multiplier. A balanced set consumes one unpaired correct delivery of each type, adds 20 score and +5 budget clamped to100.

Recovery bin capacity=6; misroutes retain food as pending crates. Overflow goes to an offscreen depot with no extra budget penalty and re-enters next shift after bin items; food is never destroyed. At shift start recovery/depot crates re-enter at most one per 2s between fresh spawn times without exceeding spacing. Remaining recovered items can carry to later shift; after final shift show them as undelivered, not successful deliveries. A misrouted crate retains stripped status and unique ID; each budget penalty applies per dispatch attempt, each delivery score only on first successful delivery. Bell accrual counts correct deliveries across the campaign; every12 grants one up to cap2 and resets progress even at cap. Bell slows belt movement ×0.65 for4s and cancels telegraph or active interference; reactivation refreshes duration, no stacking. Spawn schedule stays on simulation time and respects spacing while slowed.

At end shift: if budget zero earlier, lost immediately; retry restores shift-start snapshot including budget/upgrades/recovered queue/score/RNG (no farming). At45s stop simulation; any legal delayed items still on belts are put in recovery without extra loss. After shifts1/2 enter upgrade; choose one then Continue. Shift3 enters won if total correct deliveries≥36 and each destination≥8; otherwise lost with Retry Shift3. This is a skill requirement, not a promise every player wins. Authored spawn counts admit the required outcome without random scarcity. Fresh crates 54 total leave slack for mistakes; regression fixtures verify a perfect-routing input schedule achieves victory.

Upgrades cost no currency and each can be chosen once: **Handling Window** adds a 2s exit holding pocket per lane for last-moment gate changes (world item waits at dispatch, occupying that lane's queue); **Recovery Capacity** increases bin6→12 (depot remains fallback); **Longer Bell** changes bell4→6s. Exit pocket dispatches when correct gate selected or its timer expires. At45s holding pockets resolve with current gate before victory check; transition timing cannot create an extra free pause. No upgrade is necessary for a mathematically winnable campaign.

Cameos: shift1 Trump at t=8 and24; shift2 alternates Trump/Vance at t=8/24; shift3 Vance/Johnson at8/24. Event scheduler skips if prior interference/cooldown persists. Trump warns1.5s, then sleeves next3 unsleeved spawns; pending effect expires6s after warning. Vance warns selected gate2s then attempts one cycle and shows active portrait2s; lock at attempt or Bell blocks it. Johnson warns1.5s then freezes one lane spawner3s (existing crates keep moving); eight seconds cooldown after exit. Only one event active including warning; no event begins after30s. Gate/actor names remain fictional roles, not assertions of real actions.

Update order: discrete actions/locks/Bell → event transitions → eligible spawns → belt movement → holding-pocket timers/dispatch by ID → accounting/budget-zero → shift completion. Simultaneous budget zero and last qualifying delivery is lost if budget remains zero after balanced-set restoration; restoration is part of dispatch accounting. Pausing, hidden tab and focus loss freeze every clock including locks/pockets.

### State and tuning contract

Factory owns loading/error/retry. title → tutorial → shift; shift ↔ paused; shift → upgrade → next shift; shift → won/lost. Tutorial maps title, upgrade maps paused, shift maps running. Lost offers retry-current-shift or full reset; reset returns title. Practice uses same rules but budget cannot end run, and Next Step advances0.1s including schedules/events; explicit Next Spawn advances until next spawn then pauses. This implements a complete semantic non-timed loop rather than claiming canvas accessibility. Escape pauses/resumes; Exit button leaves. Destroy is terminal/idempotent and clears DOM crate actions as well as Canvas resources.

Use [contracts](../../src/shared/contracts.ts). `configure` flat scalar dotted keys validate atomically and throw readable errors; `TuningField.restart` marks simulation changes, read-only constants appear in `inspect`. Inspection includes shift/time, crates, gate/lock state, budget, counts, recovery, event and seed. Asset descriptors in game assets folder, editable art in `assets/source/supply-the-people/`; no assumed shared roster/settings service until explicitly provided, load cast through local content/manifest and settings through existing storage/UI.

| Key | Default; bounds/units | Apply |
|---|---|---|
| `belt.speed1`, `speed2`, `speed3` | 40/48/56; 36–72px/s; nondecreasing | Restart |
| `budget.start`, `missedSleeveCost`, `misrouteCost` | 100;50–200 / 8;0–20 / 4;0–12 | Restart; cap=start |
| `recovery.capacity` | 6;3–12 crates | Restart |
| `bell.capacity`, `duration`, `speedFactor` | 2;1–3 / 4;2–8s /0.65;0.4–0.9 | Restart |
| `gate.lockSeconds`, `cooldownSeconds` | 4;2–6s /6;4–10s; cooldown≥lock | Restart |
| `assist.speedMultiplier` | 1;0.5–1 | Restart; separate score category |
| `mode` | standard; standard/practice | Restart |
| `presentation.assetVariant`, `showDispatchZones` | A; known variants /false;Boolean | Live; zones dev only |

Shift duration/counts/goals, destination symbols and event schedule are v1 fixed inspect-only. Lower assist speed scales spawn/event/shift clock by same factor as belt movement, retaining route timing; Next Step uses the selected simulation time increment without wall time. Reject speed/window combinations that cannot clear an unheld last spawn; holding pocket exception is resolved as specified. Live presentation never alters crate hitboxes.

### Acceptance additions and remaining work

SL-01 source play/research remains planned; archive source/date/hash, identity references and rights evidence. SL-02..06 retain dependencies; SL-05 final sprite selection can follow placeholder integration and is not a planning blocker. Add fixtures: stripping same crate twice; sleeve and misroute combined penalties; balance refund at zero boundary; bell capped accrual; Vance switch versus L on exact step; frozen spawner deadline; recovery overflow/depot and retry rollback; holding pocket at shift end; 54-crate perfect route satisfies36/8 thresholds; final failure retry does not duplicate prior score; practice completes all upgrades using semantic actions. Browser keyboard/touch focus, 44px controls, hidden-tab freeze, error/retry, HMR and 20 destroy/remount checks are planned. Final food art, jokes and optional expanded goods are deferred; no unresolved core mechanic remains.
