# Against the Wall

Status: proposed design and implementable backlog; no game or art is implemented. Source inspected 2026-09-07. Slug: `against-the-wall`. Original: **Build the Wall**. Alternatives: **Build a Welcome**, **The Asylum Games**. Recommended title preserves the wall reference and centers the people facing it.

## Original evidence and adaptation

Primary source: https://www.whitehouse.gov/arcade/build-the-wall/ (page and its inline game script). The visible controls expose lateral movement, rotation, soft drop, slam, pause and mute. Source inspection confirms a 10-column, 18-row tetromino board, three breach lives, three zombie archetypes, waves, local best-score storage and programmatically drawn neon graphics. Palette examples are pink `#ff006e`, mint `#06ffa5`, yellow `#ffbe0b` and violet `#8338ec`, with Press Start 2P/VT323 font references. This is a falling-block siege game, not an isometric escape game. Preserve the cabinet, high-contrast arcade typography, block geometry and escalating pressure; intentionally replace its viewpoint and mechanics.

Research deliverable before implementation: capture desktop/mobile start, play and loss states in Playwright; enumerate image/font/audio requests and inline draw routines, hash captured source, and record provenance in the shared asset manifest. The inspected source is evidence, not permission to redistribute every dependency. Reimplement mechanics cleanly; use original replacement art by default. Do not embed production analytics, newsletter forms or tracking.

## Plot and editorial direction

A playable adult asylum seeker crosses three fictional diorama districts to reach an **Asylum Office** intake desk. The player is resourceful and has dialogue, a name and personal goals; people are never faceless score tokens. Optional companions are adults and are rescued through a follow interaction, not mandatory escort fragility. Flee cartel extortion, paramilitary intimidation, Border Patrol searches and ICE pursuit in an overtly fictional arcade geography. Agents and criminals are distinct factions, not implicitly allied.

Donald Trump appears on a giant self-congratulatory wall billboard; JD Vance appears on a fictional TV announcing a new bureaucratic obstacle. Name captions identify caricatures, and all dialogue is written parody without quotation marks suggesting real statements. Further public names require identity/role verification when authored. Never attach cartel affiliation or actual unlawful conduct to a named person without factual sourcing. Satirical events target political rhetoric and policy priorities.

The climax is arriving at a welcoming intake counter while rival pursuers are occupied by their own spectacle. Completion says **“You reached intake. Your story deserves to be heard.”** It does not promise asylum approval. This geography, evasion and intake sequence are fictional game rules, not legal guidance or a map of operational facilities.

## Core loop and rules

1. Inspect the visible route, patrol cones and office marker.
2. Walk between cover, collect water and up to two distraction tokens, and optionally help a companion.
3. Trigger cartoon confusions so two hostile factions converge, leaving an escape window.
4. Pass a district checkpoint, retaining collected journal entries and resetting local patrol state.
5. Reach the intake desk; results prioritize arrival, companions helped and optional supplies delivered over speed.

Use a 32×24 logical tile map rendered as 64×32 isometric diamonds at a 960×640 logical canvas. Four-direction world navigation is projected isometrically; normalized diagonals prevent speed exploits. Screen-relative controls are the default, with world-relative as an option. Walk 2.8 tiles/s; hold Shift to run 4.2 tiles/s, spending stamina from 100 at 20/s; refill 15/s after 1 s without sprinting. Water restores 30 stamina and is optional: every required path is viable with walking and cover.

Pursuers have `patrol → suspicious → investigate → chase → confused → clash → recover` states. Cones have explicit outlines and striped fill, nominally 5 tiles/70 degrees; solid walls occlude them. Detection accumulates over 0.8 s; cover clears the meter after 1.2 s. A distraction token creates a cartoon noise beacon within 4 tiles, visible to the player before placement. If two different hostile factions investigate the same beacon within 2 s, they misidentify one another and enter a 5 s slapstick dust-cloud fight, then 2 s recovery. Speech bubbles (“Wrong department!” / “That's MY checkpoint!”) signal the joke. Same-faction pairs argue for 2 s instead; a repeat-confusion cooldown of 10 s prevents endless stun-locks. No realistic tactical instructions, gore or real facility layouts.

Contact causes a fade to the district checkpoint, with a brief “Try another route” message. No graphic injury, deportation animation or limited lives. Retry restores a deterministic district seed and enough resources to solve it. A 0.75 s grace interval prevents immediate recapture. Three districts target 2–3 minutes each: **The Toll Road** teaches cover and cartel patrols; **The Photo Opportunity** introduces paramilitary/Border Patrol confusion; **The Moving Goalpost** mixes ICE and political billboard interruptions. Scripted gate movement is telegraphed 2 s ahead and cannot seal every viable route.

Score proposal: arrival 1,000, companion assisted 200, supply delivered 50; no points for faction violence. Optional time medal only in challenge mode. Story mode removes stamina drain and extends confusion to 8 s. Seeded challenge mode supports comparable local runs, with no online leaderboard in the initial release.

## Controls, states and accessibility

Arrows/WASD move; Shift sprint (toggle option); E interact/help; Space place distraction after directional aiming; Escape/P pause; M mute; R restart via confirmation during active play. Touch uses a large movement pad, sprint toggle, interact and distraction buttons; aim-and-confirm prevents accidental resource use. All menu controls are native DOM buttons with keyboard focus. Pause on hidden tab or focus loss.

Game states: loading, title, tutorial, playing, paused, checkpoint-reset, district-complete, victory and recoverable asset-error. Each owns a single input context. HUD: district, office direction, stamina, distractions, companions and detection indicator. Offer large text, remappable controls, high contrast, no-flash and reduced-motion settings. Threat classes use icons/patterns plus labels, not color alone. Audio events have visual equivalents. A turn-assisted accessibility mode advances patrols only while movement is held; document its separate challenge-score category. Avoid claiming full screen-reader playability unless actually implemented and tested.

## Asset selection briefs

Select option A as the default cohesive pixel treatment, retaining B/C for review. These are briefs, not generated images. Export transparent PNG atlases with integer pixel scaling; keep layered editable sources and per-asset manifest entries. Isometric terrain must share the same 2:1 projection. Production preview should show all options against original-source palette samples.

| Asset / scope | A: neon arcade | B: paper satire | C: softer arcade |
| --- | --- | --- | --- |
| Player, 8 directions, idle/walk/run/help, 4–6 frames each, 32×48 | Clear warm silhouette, jacket/backpack, cyan rim | Folded-paper traveler with passport-shaped journal | Rounded pixel adult with expressive face |
| Optional companions, 3 adult variants, same atlas contract | Distinct clothing/body shapes, shared visual dignity | Illustrated personal-story cards become sprites | Friendly low-detail pixel portraits |
| Four pursuer factions, 8 directions, patrol/chase/confused | Cartel maroon, paramilitary gray, Border Patrol olive, ICE navy; independent icon labels | Oversized stamped faction badges | Chunky figures with conspicuously different hats |
| Trump and Vance billboards, 128×128 portraits, 3 expressions | Recognizable pixel caricatures and large real-name plaques | Editorial newspaper cutouts drawn from scratch | Rubber-stamp portrait panels |
| Walls, cover, gates, 64×32 tiles; 24 base variants | Violet blocks with pink edges | Stacked forms and absurdly tall receipts | Sunset masonry with neon markers |
| Office, 192×160; idle/open/welcome | Mint-lit ASYLUM OFFICE and visible accessible entrance | Welcoming library-like desk behind mountains of forms | Warm porch and helpful clerk |
| Distraction, water and fight cloud, 16–64px | Wind-up loudspeaker, blue bottle, stars-and-puffs | Rubber-stamp squeaker, water flask, scribble cloud | Toy squeaker, canteen, comic speech balloons |
| HUD and district cards | Pixel icons, plain readable HUD text | Case-file tabs with pixel numbers | Rounded high-contrast panels |

Original synthesized sound briefs: walking ticks, soft detection rise, single investigation chirp, comic clash percussion and welcoming arrival chord. No gunfire or distress screams. Each cue has mute-respecting mixer routing and a visual counterpart.

## Implementation specs and sequencing

Uniform entry: `src/games/against-the-wall/{index.ts,game.ts,config.ts,assets/}`. Add `model.ts`, `systems/`, `render/`, `levels/` and `tests/` only for this game's complexity. Runtime art: `public/assets/against-the-wall/`. Consume shared lifecycle, fixed-step clock, seeded RNG, input actions, audio mixer, persistence, asset loader, accessibility settings and canvas scaling from `src/shared/`. Vite dev site serves at localhost:8643. No module-global listeners/timers or duplicated shell implementations.

- **AW-01 — Evidence and greybox** (depends shared contract): source inventory, three manually authored JSON maps, tile collision/projection/picking, keyboard/touch movement and camera. Acceptance: correct tile selection at DPR 1/2 and mobile widths; no diagonal boost or wall tunneling; each map has a walkable office path.
- **AW-02 — Threat simulation** (AW-01): pure deterministic AI, line of sight, suspicion, pursuit and checkpoint resets. Acceptance: walls block detection; pausing freezes all AI; reset reproduces seed and grants grace; no enemy spawns overlap safe zones.
- **AW-03 — Confusion mechanic** (AW-02): beacon targeting, faction matrix, dust-cloud encounter and cooldown. Acceptance: different-faction pair meets the 2 s threshold and yields exactly configured escape interval; same-faction case differs; resources cannot go negative; repeated activation respects cooldown.
- **AW-04 — Progression and meaning** (AW-03): three districts, optional help/supplies, arrival outcome, political billboard scripts and scores. Acceptance: no score reward for fighting; all mandatory routes remain possible with zero water; every altered gate has warning and alternate route; victory fires once.
- **AW-05 — Art/audio/accessibility** (approved art, AW-04): import selected atlases, map cues, touch UX, turn-assisted mode, reduced motion and text scaling. Acceptance: factions identifiable in grayscale; no essential cue is audio-only; 200% UI zoom retains every action; reduced motion removes shaking/flashing; asset failure permits retry.
- **AW-06 — Integration** (all): hub card, route, controls panel, persisted settings, Playwright smoke and representative screenshot coverage. Acceptance: repeated enter/exit and HMR leave one animation loop and no old keyboard handlers; unavailable localStorage does not block play; no external runtime requests.

Validation should focus on meaningful model tests for visibility, timing, reachability and reset behavior, plus browser tests for lifecycle/touch/focus; do not snapshot every sprite frame. Performance target: stable 60 fps on ordinary desktop and playable 30 fps on mobile with 20 enemies; cap particle effects independently of AI.

## Decisions for the next design review

Recommended defaults: three districts; adult player/companions; cartoon nonlethal fights; A artwork; real named politicians on authored billboards; story mode first. Open: protagonist names/backstories, exact scripted billboard jokes, whether companions persist between districts, and whether challenge mode ships in the first build. These do not block greybox work after the Flappy prototype and shared contract are stable.

## Shared contract and attribution

The [shared infrastructure specification](../specs/infrastructure.md) is authoritative for `GameModule`, services, host-visible lifecycle, folder layout, HMR and dev UI. Map detailed game substates to host states: active play/delivery/checkpoint transitions are `running`, completion is `won`, and retry outcomes are `lost`; internal state machines remain local. Provide typed tuning fields to the shared development panel rather than building a separate panel.

The [White House copyright policy](https://www.whitehouse.gov/copyright/), inspected 2026-09-07, says government-produced materials are not copyright protected and third-party content is CC BY 3.0 unless otherwise noted. Record authorship, exceptions, attribution and modifications per reused asset; do not equate government hosting with government authorship. All gameplay above is proposed except the explicitly identified original-source observations.
