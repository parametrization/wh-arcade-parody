# Flappy Files — game plan and implementation specification

Status: researched proposal; implementation not started. Owner: Flappy game workstream. Research date: 2026-09-07. Original: [Flappy Bill](https://www.whitehouse.gov/arcade/flappy-bill/). Proposed route: `/games/flappy-files/`. Priority: planning/specification reference for all five games; implementation can proceed concurrently with the other four once all five plans/specs are complete and the common foundation is implemented and verified.

Planning dependency: complete Flappy’s plan/spec first, then finalize the other four against that standard. All five plans/specs must be complete before any game implementation starts. The common foundation must also be implemented and verified (FOUNDATION-READY); see [P-01..03](../status.md).

## Observed original and research confidence

Verified by reading the live page and its inline JavaScript: this is a Canvas 2D pixel game, logical resolution 256×224, with a ground line at y=194. Procedural sprites, bitmap text, layered scenery, synthesized audio, particles, seeded randomness and local best scores are embedded in the bundle. The eagle flaps through monument columns. Space/Up/W/pointer flap, M mutes, R restarts. States are ready, playing, falling, dead. Source tuning: gravity 640, impulse −196, terminal speed 268, column width 22, spacing 112; speed rises 60→94 and gap shrinks 72→56 over 20 points. Eagle collision rectangle is narrower than its drawing. A passed column scores once. Reduced-motion handling and live status announcements exist. [Source: original page and inline script](https://www.whitehouse.gov/arcade/flappy-bill/).

This is source inspection, not a measured playtest. Asset authorship, redistribution rights, mobile feel and original difficulty fairness remain unverified. The full source page is archived locally under `.internal_docs/research/raw/flappy-bill.html`, with its hash recorded in `source-captures.json`; raw files are ignored by Git. Scratch extracted JavaScript also resides at `/tmp/flappy-game.js`.

## Premise, satire and player experience

You are a bald eagle carrying a folder visibly titled **EPSTEIN FILES**, trying to deliver public-interest records to the American people. Monumental red tape is staffed by recognizable GOP/MAGA figures. Real names identify satirical political characters; gameplay is expressly fictional and does not establish involvement in Epstein's crimes or a real act of obstructing release.

Preferred title: **Flappy Files**. Alternate card treatments: **Flappy Bill: Release the Files**; **Flap the Files**. Tagline: “Keep the records in the air. Get them to the people.” Opening card: “An unofficial political cartoon. Deliver the files; dodge the distractions.” Do not simulate a genuine government notice.

A 60-column story run has three 20-column chapters: **Committee Limbo**, **Executive Distraction**, **The Public Record**. Every ten columns the eagle passes a public reading stand and drops a copy automatically; a receipt animation makes delivery visible. A final arrival gives a crowd the files and ends in a readable success scene. Score measures deliveries and clearances, not burgers thrown at a person. Endless mode unlocks after the story or is directly available from the menu; difficulty reaches a ceiling.

Collision means “Delivery delayed”: feathers and paper scatter, with no injury depiction. Restart is immediate after a short input guard. Completed chapter bests persist, while an optional practice chapter picker avoids replaying the first chapter for tuning.

## Cast and factual boundary

Use real names as requested. Initial cast groups: Donald Trump (showman), JD Vance, cabinet members, congressional GOP leaders, and named senior advisers once their roles are verified. Leadership roster candidates include John Thune and Mike Johnson; record the live role source before rendering a role label. The [current cabinet page](https://www.whitehouse.gov/administration/cabinet/) was opened during research; it currently lists, among others, Scott Bessent, Todd Blanche and Doug Burgum. Do not reuse a remembered 2025 cabinet roster: the live page has changed. Verify leadership against [Senate leadership](https://www.senate.gov/senators/leadership.htm) and [House leadership](https://www.house.gov/leadership). Verify advisers against an official appointment or biography source.

Store cast records as data: `id`, `displayName`, `shortName`, `satiricalRole`, `officeLabel`, `officeSourceUrl`, `verifiedAt`, `portraitReference`, `assetId`, `claimNotes`. The neutral satirical role can be “Committee obstacle” or “Distraction department”; invented speech must be visibly cartoon dialogue, never a quotation attribution.

The user also requested known Epstein collaborators. Treat that as a separate research backlog, not a synonym for this political roster. Any eventual entry requires a precise supported description, primary judicial evidence where available, and a clear distinction between conviction, allegation and association. No collaborator label is shipped by default. A contextual credits panel states that playing an obstacle is fictional satire, without turning gameplay into a legal disclaimer screen.

## Controls and UI

| Action | Keyboard | Pointer/touch |
|---|---|---|
| Flap/start | Space, Up, W | Tap playfield or large Flap button |
| Throw burger | H, configurable alternate | Separate Burger button, count badge |
| Pause/resume | Escape or P | Pause button |
| Restart | R on result screen; confirm during run | Restart control |
| Mute | M | Persistent sound button |

The game container owns input only while focused. H must never bubble into a flap action; buttons must not trigger playfield taps. Escape pauses the game; Tab reaches an explicit Exit control without trapping keyboard focus. HUD outside the obscuring animation always shows chapter, records delivered, burger stock, pause and mute. All controls work before audio permission is granted.

## Simulation and tuning proposal

Use a 512×448 logical canvas, with source-inspired art drawn on a 256×224 pixel grid at 2× nearest-neighbor scale. Use an independent DOM label layer for legible name plaques; compute positions from world coordinates and clip them to the playfield. Visual caps and character limbs remain decorative and do not secretly enlarge column collision boxes. Plaques sit away from the clear gap; long names wrap on two lines with a full-name cast panel available while paused.

Start tuning at doubled source dimensions/velocities, then adjust for the additional visual demands: gravity 1,280 px/s², flap −392 px/s, terminal 536 px/s, eagle x=132. Proposal: 48 px columns, 240 px spacing, initial 164 px gap, floor 144 px, scroll 110→160 px/s. These are proposed numbers, not measurements of the original. Clamp gap-center movement and validate adjacent gaps using a deterministic reachability simulation. Score difficulty is capped after 40 clearances. Physics uses a fixed 1/60 s step, seeded RNG and collision before scoring; frame rendering cannot alter outcomes.

Burger inventory cap: 3. Spawn one within the first four gaps, then every 4–6 gaps with safe-lane placement. Stock persists between chapters in a run and resets on restart. Pickup costs no score and never requires leaving a reachable corridor. A burger that would overlap an obstacle is moved or omitted; generated hazards do not depend on personal identity.

### Fourth-wall Trump event

Art direction preserves the user's specifics as cartoon exaggeration: orange complexion, yellow swept hair, broad/heavy build using roughly a 6-foot/300-pound design reference, blue suit, oversized waist padding suggesting a diaper beneath clothing, jacket approximately three inches too long and red tie approximately six inches too long in the model sheet. These are fictional visual proportions, not factual medical or measurement assertions.

Use `idle → telegraph → entering → obscuring → dismissed/exiting → cooldown`. Trigger after the tutorial burger and at least eight columns; repeat every 18–26 seconds of active play, with one event at a time. Alternate sides deterministically. Left entrance: sideways shuffle followed by both palms spreading; right entrance: lean into frame, pivot, then fan hands outward. Do not simply mirror the same animation. A 0.8-second visual/audio cue precedes entry. Hands visibly attempt to cover the scene, but HUD/input remain operational. Start the **seven-second** active obstruction clock when the entering animation ends; if no burger is thrown, make the hands non-obstructing at exactly seven seconds of simulation time; a short decorative exit may follow without covering gameplay. Pause/hidden-tab time does not consume that clock.

H with stock during entry/obscuring consumes exactly one burger, auto-targets the mouth, immediately clears the obstructing hands and changes the character to an exit animation. A ≤200 ms decorative burger arc can continue after visibility is restored; no aiming or wait for a projectile collision is required. H without stock gives a quiet empty indicator and does not lock input. Ignore key repeat; one press cannot consume multiple burgers. No active event: leave stock unchanged and show “Save it for the distraction.” End the event on death, restart, chapter result or unmount.

Standard mode limits the opaque coverage to roughly 40% and keeps a visible flight corridor; silhouette outlines show nearby columns behind hands. An optional “Full Distraction” setting increases coverage for the user's intended gag, without changing the seven-second duration. Assist mode uses translucent hands, wider gaps and 80% speed. Playtest coverage before adopting a default: completely obscured real-time collisions can feel arbitrary.

## Visual selection brief and asset deliverables

All options are proposals awaiting actual contact sheets. No generated art is claimed to exist. Match the observed low-resolution arcade language: crisp stepped edges, small palettes, chunky outline, cream stone, sky blues, navy/red accents and restrained three-frame motion. Avoid smooth vector gradients inside the pixel game. Original source sprites are references until provenance is documented; new pixel sprites can be authored as row data and exported as PNG, keeping both editable source and runtime asset.

| Major asset | Option A — proposed default | Option B | Option C | Deliverables |
|---|---|---|---|---|
| Eagle courier | Familiar compact eagle, folder in talons | Aviator eagle with satchel | Stern eagle clutching an oversized folder | 3 flap frames, glide/crash frame, 24×24 source pixels, transparent PNG |
| Files folder | Manilla folder with red EPSTEIN FILES tab | Thick white packet with redactions | Red string case folder | 3 sizes; full text in HUD and intro so tiny text need not be legible |
| GOP column figures | Elephant heads, red jackets, individualized hair/glasses | Human caricatures with elephant lapel emblems | Elephant busts on red-tape wrapped stone | 24×32 source-pixel figures; top/bottom variants, name data separate |
| Top-column pose | Hanging by hands, torso facing viewer | Upside-down bust anchored to monument | Seated upside-down committee desk | Separate silhouette/hitbox previews; no nooses or implied execution |
| Name plaques | Brass institutional plate | Red hearing-room name card | Black classified-file label | Resizable background, readable DOM text, two-line long-name example |
| Trump distraction | Chunky pixel body and huge open palms | Accordion-like arms and podium slide | Close-up head and hands through theatrical curtains | Left/right entrance, idle palms, mouth, fed/exit; layered arms/body; 128×144 source-pixel atlas |
| Hamburger | Recognizable McDonald's-style wrapped burger | Plain sesame burger with red carton | Exaggerated stacked arcade burger | Pickup idle/bob, HUD icon, throw frame; source/provenance for any literal branding |
| Public recipients | Library crowd and reading table | Town-square bulletin board | Press/public-record kiosk | 3 receipt scenes plus final tableau, diverse fictional adults |
| Background | Capitol skyline and paper clouds | Hearing-room arches opening into daylight | City street of public libraries | 3 parallax layers, tiled seamlessly |
| Card/key art | Eagle through red elephant columns | Giant hands behind tiny eagle | Folder breaking through red tape | Arcade card and title treatment, same palette and composition family |

Produce two contact-sheet variants for eagle, obstacle family and Trump first; select a coherent palette before finishing the rest. Supply neutral/action silhouettes, exact dimensions, frame durations, anchor points and a palette file. Every asset manifest entry needs origin, author/generator, reference URL, license/status and transformation notes. Sound brief: newly synthesized flap, paper flutter, pickup chime, low comedic entrance sting, cartoon gulp and delivery bell; no voice cloning or sampled campaign audio.

## Architecture and lifecycle

The [shared infrastructure specification](../specs/infrastructure.md) is authoritative for folders and lifecycle. Use its `GameModule` manifest and `create(host, services)` factory, returning `start`, `pause`, `resume`, `reset(seed?)`, `destroy`, and optional development inspection/configuration methods. Internal ready/playing/dead states map to shared title/running/lost states. Use shared Vite/TypeScript shell at localhost:8643. Uniform root: `src/games/flappy-files/{index.ts,game.ts,config.ts,assets/}`. Add game-local `model.ts`, `render.ts`, `cast.ts`, `events.ts` and `game.test.ts` as needed; runtime art lives in `public/assets/flappy-files/`, editable art in `assets/source/flappy-files/` and atlas metadata in `src/games/flappy-files/assets/`. `index.ts` exposes the common create/destroy contract rather than installing global listeners on import.

Consume `src/shared/` contracts for fixed-step scheduling, seeded RNG, input focus, audio unlocking/mute, pixel canvas scaling, storage versioning, asset manifests and DOM accessibility controls. Keep eagle physics, obstacle reachability, spawn policy, cast selection and Trump-event transitions game-local until another game genuinely needs them. No game imports another game's private files. Avoid adding a large game framework merely for this Canvas 2D slice.

Model contains run phase, simulation time, eagle position/velocity, columns, pickups, seed, score, delivery counters, inventory, event state, difficulty, accessibility options and pending effects. Effects are drained into audio/render/UI handlers; model tests do not require a browser. Restart resets all transient state. Destroy cancels RAF/timers/audio and removes listeners, canvas and label DOM. Hot replacement must call destroy before remount. Pausing captures the previous active phase; it does not restart events.

## Phased implementation specifications

| ID | Work and completion evidence | Depends on | Status |
|---|---|---|---|
| FF-01 | Archive source URL/hash/date and mechanics notes; browser screenshots at ready/playing/dead; inventory script-defined sprites and provenance without importing site trackers | Common research storage policy/browser runner | Planned; source inspection complete |
| FF-02 | Define cast JSON/data schema; verify names/roles and portrait references; flag all factual dialogue separately; produce first art contact sheets with dimensions/palette | FF-01; shared asset manifest | Planned |
| FF-03 | Implement pure model, seeded columns, reachability guard, flap/collision/score; debug controls for seed and collider display | Common game contract and fixed-step/input interfaces | Planned |
| FF-04 | Render eagle, columns, accessible plaques, parallax and controls; ready/pause/dead/restart and route/HMR cleanup | FF-03; placeholder assets allowed | Planned |
| FF-05 | Burger pickup/inventory and deterministic Trump-event model; both entrances, seven-second behavior, immediate H dismissal, touch parity | FF-03, FF-04; layered Trump assets | Planned |
| FF-06 | Delivery chapters, final crowd scene, endless mode, assist/reduced-motion/audio and local best storage | FF-04, FF-05 | Planned |
| FF-07 | Finish chosen sprites/card/audio; meaningful unit tests plus Playwright desktop/mobile/keyboard smoke; performance and offline asset pass | FF-02, FF-06; shared browser harness | Planned |
| FF-08 | User playtest with tuning report and side-by-side art options; update this plan/specs; record Flappy readiness independently of the other game implementations | FF-07 | Planned |

Parallel work after contracts land: one model/input implementer, one art/cast researcher, one renderer/integration implementer. FF-05 joins model and art only after FF-03's state contract is stable. With four total agent slots shared across the project, use one Flappy implementation owner plus bounded help rather than occupying every slot with this game.

## Acceptance criteria and verification

- Fresh root launch command serves the arcade and direct Flappy route at localhost:8643; refresh and hot reload preserve routing and create no duplicate game loops.
- Intro, ordinary flight, a visible records delivery, burger collection, both distinct Trump entrances, H dismissal, full seven-second timeout, death/restart and final delivery are browser-demonstrable.
- Same seed and input schedule yield the same model result at 30/60/120 Hz render rates. Fixed-step tests assert a single score per pair, inventory cap and reset, collision precedence, pickup reachability and event timing within one simulation step.
- Active obstruction without H expires after seven active-play seconds; pausing for ten real seconds does not shorten it. H with one burger leaves zero, clears obstructing hands immediately and cannot consume again from key repeat.
- All named columns have readable plaques; names do not enlarge collision geometry or block the corridor. Cast data includes verification metadata; no unverified collaborator allegation appears.
- Keyboard-only start/play/throw/pause/restart/exit works. Touch has dedicated reachable flap and burger controls. Reduced motion disables camera shake and optional parallax; assist opacity is visible in settings.
- Status announcements cover start, pickups, imminent distraction, deliveries and game end without announcing every frame or every score. Sound remains optional; essential cues have visual equivalents.
- 360px-wide mobile and desktop layouts have no clipped controls. Container resize changes presentation only. Hidden tab auto-pauses. Navigating away tears down listeners and audio; returning starts one instance.
- New assets load locally with manifest provenance, no production tracking/push/newsletter scripts, and no external runtime game dependency.

## Decisions to revisit with the first playable build

Default to Flappy Files, story plus endless, elephant-headed named obstacles and partial obstruction. User review is useful for choosing contact sheets, deciding how far the opaque hands should cover the scene, approving final comedy lines, and selecting the researched cast breadth. None blocks placeholder implementation. Finalize this planning/specification standard before finalizing the other game plans; implement all five after the common foundation and all game plans are ready; update accepted tuning and content decisions here rather than leaving contradictory instructions in scattered tasks.

## Implementation baseline v1 — resolved defaults

This section resolves earlier proposals where an implementer needs a single initial value. Defaults are implementation choices for a reviewable build, not user approval of optional art. Plan completeness does not require finished sprites. Follow the [game planning standard](../specs/game-planning-standard.md). **Execution gate:** do not implement game code until all five game plans are complete and the common foundation has been verified; shared foundation work and planning research can proceed before that gate.

### Inputs, scoring and timing

Escape toggles pause/resume while the game owns focus; it never directly exits the route. The paused menu has a keyboard-accessible Exit button, and Tab can move focus to surrounding navigation. P is an alternate pause key. Restart during running/paused opens a confirmation menu and freezes simulation; title/results R starts a fresh seed without confirmation. Touch Burger never triggers Flap.

Story is exactly 60 column pairs, with a delivery after pairs 10, 20, 30, 40, 50 and 60. Passing a pair increases `clearances` once. Passing the next reading stand automatically increases `deliveries` once; it does not require aiming or inventory. Final score is `{deliveries, clearances}` displayed as “6 deliveries · 60 cleared”, not an invented composite score. A chapter ends after its second delivery, with a frozen intermission and Continue button; victory follows delivery six. Endless mode is available from title from the beginning, with a delivery every ten pairs and no chapter pauses. Story and endless keep separate bests. No chapter checkpoint persistence in v1; practice picker remains a development tool. Loss preserves only already completed deliveries.

All event durations below are active simulation time. Entry takes 0.5s following a 0.8s telegraph. At entry completion set `obscuringRemaining=7`. Exactly when that timer reaches zero, hands become non-obstructing; a 0.25s decorative exit may follow. Burger dismissal removes obstructing hands in the same model step as H, regardless of whether the optional ≤0.2s projectile animation has finished. H is accepted during entering/obscuring, not telegraph/cooldown. Inventory is unchanged for other event states. Event next-trigger cooldown is sampled once on exit completion from 18–26s; cooldown progresses only while running and only one event may exist. First trigger occurs on the first step with eight clearances and at least one prior burger spawn opportunity; the player need not have successfully collected it. Successive entrances strictly alternate left/right, starting left. Chapter transition cancels an active event, retains inventory and schedules a fresh cooldown on Continue. A missed pickup scrolls away normally.

Initial art selection for implementation: asset option A in each row, with original independently authored pixel placeholders. Literal McDonald's branding remains an asset research choice; initial burger uses a sesame bun and red wrapper without imported logos. Preserve a manifest slot for a researched branded variant. Initial event coverage is 40% opaque with the eagle flight corridor visible; the Full Distraction preset is 70%, also retaining the HUD. These are unapproved tuning defaults to review, not a change to the requested seven-second gag. Layers never intercept pointer input.

### Exact run and event state contract

| Run state | Allowed transitions | Required behavior |
|---|---|---|
| loading | title, load-error | No simulation/input action consumption; shell shows retry on asset failure |
| title | running, destroyed | First Flap begins and applies one impulse in that step; seed initialized once |
| running | paused, falling, chapter-result, won, destroyed | Physics/events advance; collision checked before clearance and delivery |
| falling | lost, paused, destroyed | Only fall/landing progresses; Trump overlay is already cleared; no pickups or scoring |
| paused | remembered prior phase, title on confirmed reset, destroyed | All simulation clocks frozen; settings/menu remain usable |
| chapter-result | running via Continue, title via reset, destroyed | World/event clocks frozen, inventory retained; next chapter begins with a safe approach |
| lost / won | title via reset, destroyed | Result stable; score saved once; no world/event updates |
| load-error | loading via Retry, destroyed | Error text and exit usable; no orphaned partially created listeners |
| destroyed | none | No listeners, active sounds, timers or RAF work owned by the instance |

Shell mapping: falling remains `running` until landing; chapter-result maps to `paused` with reason `chapter`; won/lost use the common terminal states. Pause preserves both run phase and event state; resume restores them. Direct reset produces title, clears all transient entities and reconstructs RNG from the provided seed. Start after reset is explicit. An accessibility setting change never advances simulation.

Event states: `idle` waits for initial eligibility; `telegraph` waits 0.8s; `entering` waits 0.5s or accepts H; `obscuring` waits 7s or accepts H; `exiting` has zero blocking opacity and waits 0.25s; `cooldown` waits its sampled duration. A boolean exit cause (`burger`/`timeout`) selects presentation only. This supersedes the earlier combined dismissed/exiting shorthand. Death, chapter result and destroy cancel the event immediately without granting or consuming burgers.

### Typed tuning schema and development behavior

Expose only validated fields through `inspect/configure`, using the shared developer panel. Units are logical 512×448 world pixels and seconds. Store selected mode separately from tunings. Seed is an unsigned 32-bit integer. Invalid configuration leaves prior configuration intact and throws a readable validation error for the host panel to catch; `configure` retains the shared void return type.

| Field | Default | Valid bounds | Application |
|---|---:|---|---|
| `physics.gravity` | 1280 | 600–1800 | Restart required |
| `physics.flapVelocity` | -392 | -600 to -200 | Restart required |
| `physics.terminalVelocity` | 536 | 300–800 | Restart required |
| `columns.width` | 48 | 32–64 | Restart required |
| `columns.spacing` | 240 | 200–320 | Restart required |
| `columns.gapStart` / `gapMin` | 164 / 144 | 128–224; min ≤ start | Restart required |
| `columns.maxCenterDelta` | 64 | 0–96; reachability guard still applies | Restart required |
| `scroll.start` / `max` | 110 / 160 | 70–220; start ≤ max | Restart required |
| `difficulty.capClearances` | 40 | 1–100 | Restart required |
| `burger.capacity` | 3 | 1–5 | Restart required |
| `burger.firstPair` | 3 | 1–4 | Restart required |
| `burger.intervalMin` / `intervalMax` | 4 / 6 | 2–10; min ≤ max | Restart required |
| `distraction.firstClearance` | 8 | 5–20 | Restart required |
| `distraction.cooldownMin` / `cooldownMax` | 18 / 26 | 10–40; min ≤ max | Restart required |
| `distraction.telegraphSeconds` / `entrySeconds` | 0.8 / 0.5 | Fixed v1 constants | Read-only |
| `distraction.obscureSeconds` | 7 | Fixed user requirement | Read-only |
| `distraction.exitSeconds` | 0.25 | Fixed v1 constant | Read-only |
| `presentation.coverage` | 0.4 | 0.2–0.7 | Live; safe corridor/HUD constraints enforced |
| `presentation.assetVariant` | A | Known manifest variants | Live once preloaded; old variant until ready |
| `presentation.showColliders` | false | Boolean, development only | Live |
| `assist.enabled` | false | Boolean | Restart required; separate score bucket |
| `audio.volume` / `audio.muted` | Shared defaults | Shared service schema | Live |
| `presentation.reducedMotion` | OS/shared preference | Boolean | Live |

Assist applies gap +24px and scroll ×0.8 with maximum coverage 0.2. Geometry invariants are validated after assist transforms. Any change affecting simulation queues a visible “Restart to apply” action; it must not silently modify a current run. Applying restarts at title with the displayed seed. Pure presentation changes apply immediately; switching asset variants preserves hitboxes. Tunings persist only in development preferences, and exported JSON carries schema version and game ID. Production uses shipped config plus player accessibility settings; do not expose arbitrary difficulty sliders as ordinary controls.

### Blocking research versus deferred production tasks

No unresolved gameplay choice blocks the planning milestone. Before game implementation, all-five-plan and verified-foundation gates remain blocking. At FF-01 archive the inspected source date/hash, screenshots and mechanics inventory; verify source claims before copying constants or code. At FF-02 obtain cast office/reference sources and store verification date; use names without office labels until confirmed. These research tasks can run while the foundation is built. Default starter identities are Trump and JD Vance plus verified current GOP leadership; optional roster breadth must not block physics work after the gate.

Before redistributing any imported original asset/code, record provenance and applicable copyright status; otherwise use independently created placeholders. Before presenting a named person as an Epstein collaborator, complete the separate evidence review described above; without it omit that classification and optional character. Art contacts, extra portraits, literal burger branding, finished music and final gag copy are deferred production selections, not prerequisites for model/spec completeness. Asset acceptance requires readable eagle/obstacle silhouettes, distinguishable entrances, consistent anchors and supplied frame metadata, regardless of whether the user later picks another art variant.

Additional acceptance fixtures: saved deterministic seed with a pickup before first event; seeded left then right events; H during entry; H exactly on the timeout step (define input processing first, so one burger consumed and exit cause burger); collision and clearance on the same step (collision wins, no clearance); death during obstruction; pause during falling and obstruction; chapter completion while event active; double reset/destroy idempotency; asset load failure then retry; assist scores isolated from standard. Configure tests validate every bounds/cross-field rule and that restart-only edits cannot affect the active run. Rendering/browser acceptance demonstrates each fixture through developer controls without shipping test globals to production.

Contract alignment: [src/shared/contracts.ts](../../src/shared/contracts.ts) is the implemented API authority. Expose dotted tuning keys as a flat `Record<string, TuningValue>` patch; use `TuningField.restart=true` for restart-required fields and `false` for live fields. Fixed/read-only timing constants are shown through `inspect()` rather than editable tuning fields, because `TuningField` has no read-only flag. Loading/load-error belong to the host factory flow, not `GameState`; internal falling/chapter states map as above. `inspect()` returns the shared state/time/fps fields plus game-specific counters/event/debug metadata. Store game-specific settings/configuration through namespaced `storage` keys; do not assume the services contract supplies a direct settings property. Audio volume/mute use the provided audio methods.
