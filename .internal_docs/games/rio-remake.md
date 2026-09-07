# Rio Rescue: No One Left Behind

Status: proposed design and implementable backlog; no game or art is implemented. Source inspected 2026-09-07. Slug: `rio-rescue`. Original: **Rio Run**. Title alternatives: **Rio Runaround**, **Rio Run: Welcome Wagon**. Recommended title makes the reversal legible while retaining the original name.

Planning dependency: complete Flappy’s plan/spec first, then finalize the other four against that standard. All five plans/specs must be complete before any game implementation starts. The common foundation must also be implemented and verified (FOUNDATION-READY); see [P-01..03](../status.md).

## Verified original and research work

Primary source: https://www.whitehouse.gov/arcade/rio-run/ (page plus inline JavaScript). Page controls identify arrows/WASD steering, mute and restart. The inline game is a Snake-style growing line with grid collision, collection placement, increasing movement speed, self-intersection avoidance, ready/playing/cleared/crashed states and a deportation score. It draws compact pixel sprites from text grids, including multiple human character variations, and uses a canvas presentation layer with integer scaling. This is not an endless runner or boat-racing game. Source inspection supports a rescue-chain remake closely related to its original mechanics.

Before coding, record actual board dimensions/timing from the source and browser play, capture start/midgame/crash/full-board states, inventory fonts and assets, hash research captures and add provenance records. This plan proposes its own dimensions/timing rather than claiming unmeasured original values. Rebuild without production analytics or remote requests. Government hosting alone does not establish rights to every font, sprite or third-party dependency.

## Plot, satire and distinctiveness

An adult local volunteer leads a line of people away from a riverbank to a community welcome center. The longer the group, the harder it is to navigate a landscape crowded with political photo ops, oversized signs and manufactured bureaucratic obstacles. People choose to join; a small wave/speech bubble acknowledges each arrival. Delivering the group shortens the line and opens the next pickup area. Success counts people welcomed and supplies shared, not people detained.

Donald Trump pilots a ridiculous gold-plated photo-op float along the edge of the board; JD Vance appears on a billboard that periodically lowers a cartoon red-tape banner. They are named caricatures in fictional scenarios. Example invented captions: “THE RIVER NOW HAS NAMING RIGHTS” and “PLEASE FORM A LINE TO REQUEST A SHORTER LINE.” Display these as game dialogue, not fabricated historical quotations. Additional names can be selected after contemporaneous identity/role verification; no allegation of hidden criminal conduct is part of these mechanics.

Unlike Against the Wall's stealth and faction AI, this game is a readable grid-routing puzzle about collective care. There is no realistic border geography, legal-process simulation, combat, or reward for attacking anyone. The welcome center represents community support, not asylum approval. Its broad progressive message is delivered by what the player does: make room, share resources, and bring everybody home.

## Core loop and progression

1. Steer the lead volunteer one orthogonal cell per tick; followers occupy the recorded path.
2. Reach a waiting person, who joins the tail after a wave, or collect a supply packet.
3. Read warnings before a red-tape obstacle or parade float occupies a board region.
4. Enter an open welcome-center dock to deliver all followers behind the lead, shorten the line, bank score and restore room to maneuver.
5. Clear the required pickups to finish the district, with a final parade of welcomed neighbors.

Board proposal: 24×18 cells at 24px, plus external HUD, logical surface 640×520. Start with leader plus two helpers. Initial tick 240 ms, decreasing 5 ms per completed pickup to a floor of 140 ms in normal mode. Queue at most two valid turns; reject an immediate reverse into the neck. A move into the current tail cell is valid only when the tail vacates that tick; collecting growth prevents that exception. The leader has no attack action.

Waiting people spawn only in empty, reachable cells; no spawn on a gate, warning region or future reserved hazard. Use seeded RNG and a reachable-space search. If no safe cell exists, open the welcome center early and show its route; never loop forever trying random cells. Normal goal: three districts with 6, 10 and 14 people welcomed, each delivered in groups of at most 6. After delivery, helpers remain and the route restarts from the dock with 600 ms protected departure time.

The center opens after 3 pickups or automatically if viable free space drops below 25%. A player may deliver sooner by collecting a key-shaped “Everyone Welcome” token, but tokens are optional. Exact head overlap with the marked dock delivers, followers animate into it for 600 ms while simulation pauses, then placement is rebuilt from authored safe exit cells. Collected people are never treated as disposable lives.

Obstacle events:

- **Trump Photo-Op Float:** every 18–24 s, warns a two-cell edge strip for 2.5 s, occupies it for 4 s, then leaves with a camera-flash icon (no actual flashing under reduced motion). It never enters an occupied convoy cell and defers if the reserved route would remove safe access to the dock.
- **Vance Red-Tape Drop:** after the second pickup in district two onward, warns a three-cell barrier for 2.5 s, then lasts 5 s. The generator rejects barriers that isolate the leader from both a pickup and the dock.
- **Mutual Aid Picnic:** collect a supplies packet to gain one **Share** charge (capacity 2). Press Space to spend it on 3 s of slower movement (tick ×1.5) and remove the nearest active red-tape barrier with a friendly community animation. No hazard is dependent on possessing a charge.

Collision with a wall, self or obstacle enters **route-jam**, freezes the board and offers checkpoint retry. Story mode instead rewinds five ticks using a ring buffer and grants 1 s protection; at most one auto-rewind per 8 s. Normal mode preserves already delivered people and restarts the current pickup group. No death/drowning/capture animation. Score: welcomed person 100, supplies delivered 25, full-district bonus 250. Cosmetic speed medals are challenge-only; spending aid never reduces score.

Districts: **The Riverbank** teaches chain routing and delivery; **The Photo-Op Promenade** introduces float warnings; **The Red-Tape Roundabout** adds banners and shared supplies. Finale is a town square with people moving independently and a “ROOM FOR EVERYONE” banner. Finite campaign first; seeded endless mode may follow.

## Input, HUD and lifecycle

Arrows/WASD steer; Space Share; P/Escape pause; M mute; R restart (confirm midrun); Enter starts/continues. Swipe direction or four large touch buttons for steering, plus Share and Pause buttons; input buffers are cleared on resume/retry so stale swipes cannot kill a run. Menus and outcome text are native DOM, keyboard reachable. HUD exposes welcomed/current group/goal, Share charges, center status, next event and accessible timer text.

States: loading, title, tutorial, ready, playing, delivering, paused, route-jam, district-complete, victory, recoverable asset-error. Clock and events freeze during delivery, pause, hidden tab and route-jam. The 600 ms departure protection uses game time. Repeated transitions must not recreate audio contexts or leak inputs.

Accessibility: configurable tick scale 0.6×–1.5× speed, practice single-step mode, left-handed touch layout, reduced motion, high contrast, non-color hazard shapes, clear 2.5 s warnings, independent effects/music controls, large text, and visual Share countdown. Persist settings, label different speed modes in scores, and announce pickup/delivery/state changes through restrained live-region updates. Do not flood screen readers with every tick. A descriptive board summary is useful, but full nonvisual navigation remains a separately estimated feature.

## Asset options and production contracts

Default A best preserves the observed pixel presentation; alternatives are review choices rather than simultaneous production commitments. All image assets need transparent PNG sheets, editable source, frame metadata and provenance. Keep exact silhouettes distinguishable at 24px cells; portrait art can be 96×96 on event cards.

| Major asset | A: original-style pixel arcade | B: civic storybook | C: newspaper satire |
| --- | --- | --- | --- |
| Volunteer leader, 4 directions × 4 walk frames, 24×32 | Bright cyan vest, backpack, open-hand gesture | Warm rounded helper with hand-painted vest | Pixel union-style helper badge as avatar |
| People joining, 8 distinct adults × 4 directions × 2 frames | Different skin tones, body shapes and everyday clothes | Expressive rounded neighbors | Small editorial portrait cutouts rendered in pixels |
| Welcome center, 96×96 + 24px dock tile | Mint awning, gold doorway and welcome board | Community library with flower boxes | Open civic hall emerging from red paperwork |
| Trump float, 144×72 + 3-expression portrait | Gold float, oversized red tie, name plaque | Inflatable gold podium with cartoon portrait | Moving newspaper front page and gold camera |
| Vance billboard/banner, 96×96 + modular 24px tape | Recognizable portrait with labeled blue suit and red tape | Cardboard debate podium in a roadside sign | Self-important editorial stamp machine |
| Riverbank/paths/obstacles, 24px tiles | Teal water, sand, olive reeds, navy pavement | Calm blue river and warm terracotta | Halftone water and bureaucratic ruled-paper paths |
| Aid packet and Share effect, 24px, 6 frames | Water-and-snack bag, expanding mint handshake ring | Picnic basket and heart-shaped speech bubble | Solidarity stamp cancels tape |
| Dock/turn/event indicators, 24px and text | Arrow, house, stripes and countdown pips | Friendly signposts with consistent silhouettes | News ticker and boxed editorial arrows |

Sound briefs: soft tick, pickup greeting chime, supply rustle, pre-event two-tone warning, gentle jam buzz and multi-note welcome cadence. Produce original synthesized cues; all have visual equivalents. No distress sounds or caricatured accents.

## Implementation backlog

Files: `src/games/rio-rescue/{index.ts,game.ts,config.ts,assets/}` with `model.ts`, `events.ts`, `render.ts`, `levels.ts` and focused `tests/` as needed. Runtime assets: `public/assets/rio-rescue/`. Reuse shared host contract, clock, input, seed RNG, scaler, audio, persistence, resource loading and accessible UI from `src/shared/`; serve through the common Vite site at localhost:8643.

- **RR-01 — Source evidence and Snake model:** record original source mechanics, implement pure tick reducer, turn queue, occupancy, growth and collision. Depends shared contracts. Acceptance: reverse rejected, queued perpendicular turns retained, valid vacating-tail move allowed, growing-tail move rejected, deterministic seed replay.
- **RR-02 — Rescue and delivery:** pickups, reachability, dock availability, safe reset, group/goal scoring. Depends RR-01. Acceptance: no occupied/unreachable spawns; full board terminates placement safely; delivery counts each person once; safe departure path exists; optional supplies never block completion.
- **RR-03 — Satirical obstacles and Share:** warning scheduler, occupancy reservations, float/banner, charge use and collision filtering. Depends RR-02. Acceptance: every event gets full warning time; no event materializes onto a person; unsafe placements defer; Share works at tick boundaries and cannot decrement below zero; reduced motion preserves cue information.
- **RR-04 — District campaign and assist:** authored three-level setup, checkpoint retry, rewind buffer, victory. Depends RR-03. Acceptance: previously delivered score survives jam; rewind restores RNG/queue/resources/event state as well as positions; 8 s cooldown enforced; campaign can complete through all districts using keyboard alone.
- **RR-05 — Art, touch and audio:** approved asset selection, sprite batch renderer, swipe/buttons, DOM overlays and mix levels. Acceptance: crisp integer scaling; 320px viewport retains controls; touch cancel clears gesture; mute persists and first audio starts only after interaction; 200% text zoom has no clipped buttons.
- **RR-06 — Host and browser verification:** route/card, control reference, local score/settings integration, focus/visibility/HMR cleanup. Acceptance: repeated mount/unmount leaves one loop; score persistence failure degrades gracefully; pause freezes warnings and movement; direct route refresh works; no runtime remote assets or production website calls.

Test meaningful reducer invariants, occupancy/reservation edge cases, delivery accounting and rewind correctness. Add Playwright keyboard/touch/pause/navigation checks plus title/play/victory visual references. Avoid coupling tests to incidental pixel coordinates. Performance target: 60 fps render with at most 432 occupied cells; simulation ticks are independent of render frequency.

## Decisions for next review

Recommended defaults: rescue-chain design, finite three-district campaign, A artwork, named Trump/Vance event caricatures, no attacks, optional Share mechanic. Open: exact title; whether helpers count visually as rescued followers; exact adult character stories; event captions; whether single-step practice ships with MVP. Flappy is the planning-detail reference only. Rio implementation, research and art can proceed concurrently with all other games once all five plans/specs are complete and the common foundation is implemented and verified.

## Shared contract and attribution

The [shared infrastructure specification](../specs/infrastructure.md) is authoritative for `GameModule`, services, host-visible lifecycle, folder layout, HMR and dev UI. Map detailed game substates to host states: active play/delivery/checkpoint transitions are `running`, completion is `won`, and retry outcomes are `lost`; internal state machines remain local. Provide typed tuning fields to the shared development panel rather than building a separate panel.

The [White House copyright policy](https://www.whitehouse.gov/copyright/), inspected 2026-09-07, says government-produced materials are not copyright protected and third-party content is CC BY 3.0 unless otherwise noted. Record authorship, exceptions, attribution and modifications per reused asset; do not equate government hosting with government authorship. All gameplay above is proposed except the explicitly identified original-source observations.
