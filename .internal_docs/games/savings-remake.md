# Trump Savings Tycoon → Trump Trickle-Down Tycoon

Status: proposed design and implementable specification; no gameplay implemented. Inspection: 2026-09-07. Slug: `trickle-down-tycoon`. Alternatives: **Public Savings Tycoon**, **Catch the Trickle**. Recommended subtitle: “Build the safety net. Catch more than promises.”

Planning dependency: Flappy’s P-01 planning standard is complete; this plan has now been finalized against it. All five plans/specs must be complete before any game implementation starts. The common foundation must also be implemented and verified (FOUNDATION-READY); see [P-01..03](../status.md).

## Original evidence and interpretation

Primary source: [Trump Savings Tycoon](https://www.whitehouse.gov/arcade/trump-savings-tycoon/). Public HTML and inline JavaScript were inspected; temporary copies are `/tmp/trump-savings-tycoon.html` and `/tmp/trump-savings-tycoon.js`, retained outside distributable assets.

Verified: A 256×224 Canvas game uses pixel sprite definitions, procedural sound and a catching/net action. Its tutorial promotes accumulating money for children's accounts and ends runs after three escaped targets. The source tracks rounds, saved money, remaining grabs, bonus objects and phases; target movement varies, a clean round gives a bonus, and pointer position determines catches. M mutes and R restarts. The code includes money, eagle and government-building imagery. We have not observed every original round or verified every tuning constant through play.

Interpretation: Despite the title, the inspected implementation is a target-catching reflex arcade rather than a deep economy simulator. The remake therefore retains short catching rounds and adds a small, legible between-round public-investment choice. All proposed budgets and outcomes below are fictional game rules, not financial forecasts. Asset definitions being publicly downloadable does not by itself establish redistribution rights.

## Plot and named cast

An ornate rooftop machine promises that prosperity will eventually fall down to everyone. You operate the community safety net below it. Catch usable resources, dodge empty gold promises and convert the haul into visible clinics, childcare and housing. The city improves only when the player allocates resources; the tower continues trying to take credit in increasingly ridiculous billboards.

Donald Trump appears at a gold podium as the game's fictional branding tycoon. JD Vance presents an absurd ribbon-cutting camera that temporarily swaps labels for campaign-style confetti. Mike Johnson brings giant cartoon budget scissors. Names are intentionally real and character behavior explicitly fictional. Neither dialogue nor on-screen receipts should imply real criminal acts, theft, or verified quotations. Avoid presenting their presence as an assertion of a specific current office unless the shared roster verifies it for publication.

Acts: **The Promise** teaches one-item catching; **The Fine Print** reveals hollow tokens and scissors; **The Public Dividend** asks players to finish three neighborhood services before the final publicity storm. Success earns a lively block party and a ludicrous tower sign taking credit for the player's work. Failure is a recoverable stalled construction site, never harm to children.

## Core loop, scoring and counterplay

Each campaign has five 35-second catching rounds and short untimed investment screens, roughly five minutes total. Move a net horizontally across the bottom of three drop lanes and activate a brief catch window. Targets are previewed for at least one second at the roofline. Catch three resource types: books (education), medical kits (care), and keys (homes), each worth one matching unit plus ten score. Generic coins add one flexible unit; gold hollow “PROMISE” balloons give zero resources and briefly occupy the net if caught. A receipt symbol and dashed outline distinguish balloons without relying on reading or color.

The action has a 0.4-second catch window and 0.6-second recovery. A success chain of five earns one “Public Audit” charge, maximum two. Q fires it: freeze targets for two seconds, reveal all types and remove one current interference. It is a playful transparency power-up, not a factual accusation. Missing a genuine target costs one net integrity; start at six. Catching a balloon does not cost integrity, just 0.8 seconds to clear it. Three successive good catches repair one integrity, maximum six. Zero integrity ends the round with retry; practice has unlimited repairs.

After each round, including round five before the victory check, invest in three tracks. Education costs three books plus one flexible unit and widens the catch window by 0.08 seconds. Care costs three kits plus one flexible unit and repairs two integrity at round start. Homes cost three keys plus one flexible unit and widens the net by 15%. One purchase per investment screen, and each track has two levels. Victory: one level in every service and completing round five; score rewards second levels and unspent resources. A seeded scheduler guarantees enough reachable targets of each type; final-round fallback offers a 2:1 resource swap. This prevents a random unwinnable run. No compounding currency or realistic dollar-return claims.

Trump event: a gold “NAMING RIGHTS” banner descends over one lane after a two-second outline warning. It blocks the lane's decoration, not visibility of target hitboxes; catch through its transparent letter gaps or Audit it away. Vance event: publicity confetti changes decorative wrappers for four seconds; destination shapes remain visible and no inputs invert. Johnson event: scissors point to a quarter of the net, then narrow it by 20% for four seconds; players shift position or Audit to recover. Events do not overlap, cannot affect the first tutorial round, and always leave one reachable lane. The tower uses no actual campaign fundraising links or calls to vote.

## Controls, state and accessibility

Arrows/A-D move net; Space catches; **Q activates Public Audit**; Escape pauses; M mutes; R opens restart confirmation. Pointer drag/touch drag positions net; a separate large Catch button avoids accidental catches on drag release, with optional tap-to-catch mode. Keyboard arrows plus Space suffice for all menu/investment actions. Show remapping in shared settings; text labels follow the active binding.

States: loading, title, tutorial, round, round-summary, invest, victory, failure, with pause overlay. Simulate net, target trajectories, resource ledgers and events separately from rendering. Deterministic spawn schedules permit fair retries; new run can request a fresh seed. Save only settings and versioned best scores; suspend state is optional after first playable release.

Accessibility: 50/75/100% speed, optional auto-catch while aligned, expanded hit window, reduced-motion confetti substitution, monochrome shape test, large text in DOM, no flash effects. Provide an equivalent untimed practice mode with “next target / select lane / catch” buttons and announced resource/upgrade information so screen-reader users can complete the loop. Do not claim the real-time canvas is fully accessible simply because it has an aria-label. Pause on blur/tab hiding. Use 44px minimum touch targets and distinguish effects via sounds plus visual symbols; mute never removes necessary information.

## Art and audio selection brief

Preserve the compact pixel look, bright pickups, dark outline, government-building silhouettes and celebratory score pops. Default native resolution 256×224; upgrade UI and name labels may live in responsive DOM rather than tiny bitmap text. Art choices must be reviewed as contact sheets before production and recorded with provenance. Final asset ownership is not inferred from original hosting.

| Major asset | Option A (recommended) | Option B | Option C | Production bundle |
| --- | --- | --- | --- | --- |
| Community net | Patchwork net held by two adults | Wheeled community basket | Eagle carrying a rescue hammock | 64×32 idle/catch/recover/damaged, 3 frames each |
| Trump tower portrait | Orange pixel caricature at gold podium | Full-body blue suit/red tie at chute | Oversize animated gilt portrait frame | 48×64 idle/boast/banner/retreat |
| Vance and Johnson | Named podium cartoons with camera/scissors | Rooftop full-body operators | Portraits in fanciful control consoles | Two 48×64 sheets, 4 states |
| Genuine resources | Book, medical kit, key, coin | School bus, clinic box, house blueprint | Labeled community grant envelopes with shapes | Four 16×16 icons; readable 32px variants |
| Hollow promise | Gold balloon with dashed outline | Empty gift box with window | Hollow trophy with paper receipt | 24×24 drift/catch/deflate, 4 frames |
| Interference and Audit | Gold banner, scissors, confetti camera, magnifier | Receipt curtain, shears, flashbulbs, desk lamp | Ribbon, stamp, podium, open ledger | Four 24×24 icons plus 96×32 banner |
| Services | Pixel school, clinic and apartments | Community campus with three wings | Street stalls evolving into buildings | Three 48×48 sets: empty/level1/level2 |
| Backdrop and win screen | Gilt tower over growing neighborhood | Capitol-like fantasy machine over park | Rooftop game show above main street | 256×224 layered scene, five city stages, party vignette |

Create original catch/plop/repair/audit cues and one looping tune with a celebratory variation. Avoid sampled political speech and licensed music. Every cue has a low-intensity version; scoreboard effects respect reduced motion. Small portraits require external name plaques for recognizable identification.

Shared runtime and directory contract: [infrastructure specification](../specs/infrastructure.md), authoritative if examples here differ.

## Phased specifications

| ID | Deliverable | Dependencies | Acceptance |
| --- | --- | --- | --- |
| ST-01 | Browser observation of tutorial, one clean round, one failure; asset/code inventory and rights status | Browser harness, provenance schema | Screenshots and written behavior evidence distinguish observed facts from source inference; unresolved assets excluded from shipping |
| ST-02 | Register `src/games/trickle-down-tycoon/{index.ts,game.ts,config.ts,assets/}` and route; local `simulation.ts`, `render.ts`, `economy.ts`, `content.ts` | Shared host/lifecycle/input/RNG | Launches from common root command at localhost:8643; unmount/HMR clears audio, listeners and RAF |
| ST-03 | One-lane graybox then three lanes, deterministic targets, catch windows, integrity, pause and retry | ST-02 | Edge-of-net collisions and input recovery tested; fixed seed replay identical; no hidden-tab progress; keyboard/touch each finish a round |
| ST-04 | Resource ledger, three upgrades, five-round finite campaign, guaranteed resource schedule and trade fallback | ST-03 | Currency cannot become negative; same purchase cannot apply twice; fixture seeds admit victory; upgrade descriptions match exact effects |
| ST-05 | Named cameos, telegraphs, Q Audit, original art/audio and growing city | ST-01, ST-04, shared roster/provenance | No overlapping hazards; every hazard has reachable counterplay; no invented dialogue marked as quotation/fact; readable labels at mobile scale |
| ST-06 | Untimed/auto-catch modes, semantic upgrade UI, assist settings and browser/performance verification | ST-05, common e2e harness | Screen-reader practice loop verified manually; Playwright full campaign with fixture seed; no remote asset dependency; stable agreed frame budget |

Shared libraries: game host contract, fixed-step clock, input and settings, canvas viewport, audio bus, DOM overlays, local storage, seeded RNG, character roster and provenance. Game-local ownership: target trajectories, investment math, resource guarantee, cameo scheduler and city state. No backend, account integration, real financial information or network scoring is needed. Export immutable debug snapshots in development for browser checks rather than binding tests to drawing coordinates.

## Review decisions and scheduling

Default to **Trump Trickle-Down Tycoon**, patchwork community net, positive resource upgrades, and three named cameos. Confirm whether subtitle and jokes should emphasize public services or household affordability. Keep the investment layer only if first playtest participants can explain each upgrade after one round; otherwise replace it with three automatic milestone unlocks. This game's simulation and asset briefs can be developed in parallel with Supply the People after common lifecycle work, with no dependency on Flappy implementation or playtest completion.

## P-02 implementation baseline v1

This baseline supersedes conflicting earlier proposal wording. Earlier alternatives remain historical design options, not simultaneous implementation requirements.

Planning complete against [P-01](../specs/game-planning-standard.md). Route `/games/trickle-down-tycoon/`; title **Trump Trickle-Down Tycoon**. Implementation requires all-five-plan plus FOUNDATION-READY gate. V1 keeps five catching rounds and manual untimed investments; replacing investments after feedback remains a future revision, not an implementer choice. Include standard, assisted and untimed practice; no suspend save or endless mode. Art A independently authored placeholders are default, not an approved final selection. Services/public investment framing remains the chosen plot; exact captions are deferred.

### Catching and resource rules

Logical256×224 canvas. Net center starts x=128, y=190, width64, catch band y=184..196; clamp center to half-width..256−half-width. Movement speed180px/s, pointer drag clamps identically. Three lane centers x=48/128/208; targets spawn y=36, radius6 and fall at48px/s. Collision uses target circle against active net rectangle, inclusive edge touch, swept between prior/current target y so low render rate cannot skip catches. Base catch window0.4s followed by0.6s recovery; only one catch input is accepted while idle. Window can catch at most one object, earliest collision time then lowest ID, and closes immediately on catch before normal recovery. Space during recovery is ignored, not queued. Gold balloon capture replaces recovery with0.8s jam. Auto-catch opens window when a genuine target first intersects the available net band; does not teleport/reposition net and can still miss.

Each35s round schedules16 targets at t=0,1.8,...27s, leaving8s flush time. Exactly four books, four kits, four keys, two flexible coins and two hollow balloons; seeded shuffle subject to no adjacent far-lane drops less than1.8s apart and at least1s preview at roofline. Preview starts at scheduled time; fall starts1s later, so latest target exits by32.75s. Increasing rounds keep speed/schedule constant initially; difficulty adds cameo events, avoiding hidden changes to budget feasibility. Scheduler checks net travel+recovery reachability for successive genuine targets under current width/scissors and defers/cancels event if it breaks that guarantee. Guarantees mean a feasible skilled schedule exists, not that arbitrary input succeeds.

A genuine catch grants one matching unit (coin is flexible) and10 score. Good-catch streak resets on any missed genuine target or caught balloon; every3 successive good catches repairs1 integrity (max6), every5 grants1 Audit (max2), using separate modulo counters so both rewards can occur in a long streak. Missing balloon is harmless. Genuine target passing y>224+radius decrements integrity once. Audit Q with stock immediately freezes all target movement for2s and cancels active/warning interference; previews/spawn schedule continue but active target count is capped8 and queued spawns wait. Repeated Q refreshes2s and consumes another charge; input repeat ignored. At35s, finish active objects in a drain phase with no new spawn/events, then summarize; round timer never silently discards a genuine miss. Freeze therefore cannot force an end-of-round accounting error.

Resource ledger starts all0; integrity6 and Audit0. Between rounds resources, integrity and Audit persist. Round retry restores exact round-start checkpoint including upgrades, score, resources, integrity, Audit and RNG; no collection farming. Each purchase costs3 of its matching resource plus1 flexible. Education each level adds0.08s to catch window (max0.56); care each level repairs2 integrity at each subsequent round start (cap6); homes each level adds15% of base net width64 (width73.6/83.2, not compounding). One purchase per investment screen, two levels per track; affordable purchase is optional, Continue always exists. Spend atomically; repeated click cannot double-purchase.

Round5 still opens investment screen before final check. Final2:1 swap is optional and repeatable: choose any donor resource (including flexible), spend2 units for1 different target resource; cannot choose same donor/target. This addresses a shortage caused by uneven catches; it does not manufacture resources or guarantee recovery from every poor run. Victory requires all three tracks≥1 after round5. Otherwise show stalled-site lost outcome and Retry Final Round (restores its checkpoint) or New Campaign. Banked best score updates only at run result. Score=10 per genuine catch +100 per purchased level +5 per unspent unit at final result; final remainder bonus applies once. Practice has no integrity loss and separate results; no real currency claims.

Cameos only rounds2–5. Round2 Trump at t=10; round3 Vance at10; round4 Johnson at10; round5 Trump8 then Johnson22. Each warns2s, active4s, exits0.25s, cooldown8s; no overlap includes warning/exit. Trump banner is transparent over all collision-relevant information; Vance swaps decorative wrappers only; Johnson width factor0.8 applies during active phase then restores exact upgrade width. Re-clamp net center on width change. Audit input precedes activation on a tie and cancels event. Events canceled on round end/failure/reset. No flash/strobe or actual input inversion.

### Exact states and tunings

Host owns loading/error. title → tutorial → round → draining → summary → invest → next round or won/lost. Round/draining map running; summary/invest map paused; tutorial maps title. Zero integrity in round/draining produces lost immediately after same-step catches/misses accounting (process catches first, then misses by ID, clamp once); a simultaneous repair can save the run. Pause resumes prior substate and freezes target/window/recovery/event/preview/drain timers. R confirms full campaign reset; lost Retry Round uses checkpoint without wiping earlier rounds. Escape toggles pause, explicit Exit leaves. Summary requires Continue, investment requires choice or Skip, preventing double transitions. Destroy/reset remove gestures, prompts and pending asset/audio work.

Untimed practice supplies semantic Next Target, Select Lane and Catch buttons; Next Target previews the next scheduled object and holds it, Select Lane moves net instantly to chosen lane, Catch resolves that object with the same resource/balloon rules and advances simulation to its catch time. Investment remains identical. Manual keyboard/screen-reader check is required before claiming practice accessibility. Assisted mode defaults75% speed and optional auto-catch; scaling applies target/spawn/round clocks together, not only falls, preserving counts. Scores are separate by mode/speed/auto-catch.

Use [contracts](../../src/shared/contracts.ts), flat scalar dotted `configure` keys and atomic validation that throws readable errors. Set `TuningField.restart` on mechanics, omit inspect-only fields from panel. `inspect` exposes state/time/fps, round phase, catch phase, integrity, ledger/upgrades, seed and event. No settings/roster service assumed: existing storage/assets plus local content references are sufficient. Editable art at `assets/source/trickle-down-tycoon/`; metadata in game assets; model tests local, browser journeys common.

| Key | Default; bounds/units | Apply |
|---|---|---|
| `net.speed`, `net.baseWidth` | 180;120–260px/s /64;48–80px | Restart |
| `catch.window`, `catch.recovery`, `catch.balloonJam` |0.4;0.25–0.6s /0.6;0.3–1s /0.8;0.5–1.2s | Restart |
| `target.fallSpeed`, `target.radius` |48;36–64px/s /6;4–8px | Restart; schedule reachability must pass |
| `integrity.max` |6;3–10 | Restart |
| `audit.capacity`, `audit.freezeSeconds` |2;1–3 /2;1–3s | Restart |
| `assist.speedMultiplier` |1;0.5/0.75/1 | Restart; separate score key |
| `assist.autoCatch` |false;Boolean | Restart |
| `mode` |standard;standard/assisted/practice | Restart |
| `presentation.assetVariant`, `showCatchBand` |A;known variants /false;Boolean | Live; band dev only |

Five rounds,35s spawn phase,16 targets/type mix,costs,upgrade percentages and cameo timing remain fixed inspect-only v1. Validate target travel leaves flush time and reachability under narrowest net; reject invalid developer patches rather than silently breaking guarantees. Live art changes preserve anchors/hitboxes. Volume/reduced motion use shared controls and existing audio methods.

### Work evidence and deferred choices

ST-01 remains research: capture source states/hash/date and portrait identities/provenance; original tuning uncertainty does not block this independently specified model after gate. ST-02..06 remain planned. Final artwork and joke review are ST-05 production choices, not blockers to placeholder engineering. Additional fixtures: swept/edge catch; two objects same step only one caught; Space repeat/recovery; balloon miss harmless; simultaneous repair/miss; fifth catch grants Audit once at cap; Q on cameo activation; end-round freeze drains every object; retry restores ledger/RNG; purchase atomicity; last investment/trade and victory check; sufficient perfect-play resources across fixture seeds; narrowest-net travel validity; five-round keyboard/touch journey and complete untimed semantic loop. No tests are claimed passing. All gameplay defaults are resolved; optional asset selection and final comedy remain deferred.
