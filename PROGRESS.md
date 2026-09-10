# Arcade fidelity and playability upgrade

Current round: **Supply loading complete (2026-09-09)**. Animated fictional operators, four supplier trucks, gold-coating scoring and refreshed preview are integrated. See [round review](.internal_docs/reviews/supply-loading.md). The ten-attempt results below describe the earlier fidelity project.

Status: STOPPED AT CAP. All five games completed ten reviewed attempts. Final integration checks pass; none passed the full realistic PS3-era visual criteria. Maximum: 10 reviewed implementation attempts per game. A passing game stops; a game that still fails after attempt 10 is reported as exhausted. Root integrates and reviews three concurrent specialist slots. Existing unrelated README/art-document edits are preserved.

## Acceptance criteria

Each attempt must address/review every category below, record evidence and remaining defects, and preserve the regression checklist. An attempt means an implemented change followed by graphical and gameplay review, not a planning note or repeated test run. The target is a realistic, gritty PS3-era art direction; technical test success alone does not establish graphical acceptance.

- **Characters:** anatomically credible articulated bodies, recognizable faces/features at play size, natural motion and contact with terrain. Preserve existing cast and family variations; no replacement by generic cubes or static portrait cards.
- **World/materials:** visible stone, soil, metal, cloth and water texture; consistent directional lighting, soft contact/cast shadows and depth. Grit must not obscure obstacles, targets or status meters. No stretched atlas panels, obvious texture seams, swimming in solid ground or floating actors.
- **Gameplay:** clear objective and failure/recovery rules; responsive keyboard and pointer controls; nearby left-hand action keys alongside WASD or arrows; old bindings remain available. A How to Play guide and press-any-game-key start are required. Menu/form typing must not trigger play.
- **Scoring:** explain what earns points, show immediate feedback and a personal best, reward game objectives and skill without farming pause/restarts or rewarding civilian injury. Preserve Tycoon's existing bonus arithmetic and other established rules.
- **Audio:** distinct fitting soundtrack/ambience per game, event-specific believable effects; obey browser gesture unlocking, mute, volume, pause/resume and route destruction. No overlapping music after navigation. Preserve default user preferences; do not force sound on.
- **Quality:** desktop/mobile layout, fullscreen scaling, reduced motion, legible plaques/meters, seed replay, tuning and lifecycle regressions pass. Capture actual gameplay previews, review representative action scenes and document limitations honestly.
- **Review bar:** each category must be accepted with specific evidence. An unresolved material visual/gameplay issue requires another attempt, up to 10. A pass must not be called PS3 hardware equivalence or photorealism unless the observed output supports it.

## Regression requirements

- **Flappy Files:** seeded reachable column heights; named animated political cast and unique poses including Vance's couch/upside-down placements; readable plaques; eagle/letter, hamburgers and obstruction dismissal; established HAMBERDERS reaction; difficulty, score and existing collision rules.
- **Against the Wall:** seeded 64×48 map, safe spawns, material runs, patrol/perimeter/roaming routes on each side, rival combat and bodies, accurate wall-clipped detection, facing, health/attention meters, four-second sprint, 60-second day/night and night friendly fire/flashlights; ladder knockdown, 30s wire/4-guard90s tunnel repair; wall-entry/hidden random exit1–10tiles, timed travel, collapse/drowning death/checkpoint and undiscovered exit concealment; Asylum Office.
- **Rio Rescue:** seeded48×36 varied canyon/mesa/plateau/mountain terrain, eastern climb fence, winding moving water with real current and cardinal convoy interpolation; farmer/woman/mother-baby/child-group variants; returnable safe pickups, camera sweeps/occlusion, X wait, supplies, complete three-district campaign and checkpoint rules.
- **Supply the People:** preserve existing pointer hit-testing, supply/resource allocation, delivery/objective rules, accessibility/assist modes and scoring invariants; document exact mechanics from model before changes.
- **Trickle-Down Tycoon:** preserve promise/resource icons, issuer return reaction, visibly yellow soda fill/flood5–15s, crying/anger/steam/capitulation sequence, umbrella and wet friction/speed, automatic award, stacking10%–200% bonus and floor arithmetic, White House layout and compact ledger.

## Game tracker

| Game | Attempts completed /10 | Current work | Result |
| --- | ---: | --- | --- |
| Flappy Files | 10 | Stopped at cap | EXHAUSTED: illustrated bodies differ from realistic heads/world |
| Against the Wall | 10 | Stopped at cap | EXHAUSTED: small stylized bodies/block scenery |
| Rio Rescue | 10 | Stopped at cap | EXHAUSTED: square terrain/repeating materials/small faces |
| Supply the People | 10 | Stopped at cap | EXHAUSTED: characters/world still stylized |
| Trickle-Down Tycoon | 10 | Stopped at cap | EXHAUSTED: illustrated rigs/static world |

## Shared foundation

- Available: Node/TypeScript/Vite, Playwright Chrome, Vitest, ffmpeg, Canvas2D and Web Audio. Blender is not installed. Rendering upgrades should preserve model/collision coordinates and use shared reusable assets/helpers where useful.
- Implemented: raster material/character assets, shared richer sound engine, soundtrack lifecycle, how-to-play/start flow and per-game clustered action aliases. Image generation used the built-in tool; asset specifications and provenance are in `public/assets/fidelity/README.md`, audio provenance/regeneration in `public/assets/audio/README.md`. No external music or celebrity speech was sampled.

## Iteration log

### Planning

Reviewed current rendering and audio. Existing characters are largely cuboid or pixel-oriented; audio is short sine tones without soundtrack. The current visual target therefore requires substantive character/material and audio changes, not merely recoloring. Detailed per-game evidence will be linked below as work completes.

### First reviewed passes

All five games now have more shaped characters, real material atlas integration, clustered action aliases, score explanations and best/award feedback. Root reviewed Wall, Rio and Supply screenshots: texture scale/repetition and simplified character forms remain visible. The graphical bar is **not** passed. Regression tests have remained green in game-local reviews.

Detailed review logs: [Flappy](.internal_docs/reviews/flappy-files.md), [Wall](.internal_docs/reviews/against-the-wall.md), [Rio](.internal_docs/reviews/rio-rescue.md), [Supply](.internal_docs/reviews/supply-the-people.md), [Tycoon](.internal_docs/reviews/trickle-down-tycoon.md).

### Shared assets and sound

Generated material atlas, realistic political heads, Mall environment, eagle flight frames and White House facade are saved under `public/assets/fidelity/`. Head atlas transparency was not delivered by the image generator (checkerboard is baked into RGB); consumers therefore use silhouette clipping rather than exposing rectangular checkerboards. Five original 48-second scores are rendered under `public/assets/audio/`; foley uses shaped noise/resonance rather than a single beep for all actions. Music and effects share mute/volume and clock pause/destruction. How to Play and title-only any-key start are implemented; browser lifecycle/listening-quality validation is still pending.

### Supply and Tycoon reach their caps

Both completed ten implemented, reviewed attempts. Supply improved staff, conveyor construction, texture scale, contact shadows, score feedback and event audio. Tycoon improved facade/head assets, articulated reactions, canopy/resources, yellow fluid/foam, rain and reduced motion. Their unit and focused browser checks passed, but static portrait elements and illustrated bodies still fail the requested realistic character/world standard. They are stopped as **exhausted**, not accepted. Those two specialist slots now refine Wall and Rio. Shared browser validation found live-edit reloads interfering with lifecycle tests; final validation will run with source stable.

### Flappy reaches its cap; Wall/Rio continue

Flappy completed ten reviews: photographic-style Mall/head assets, keyed eight-pose eagle animation, rounded articulated suits/hands/couch, weathered columns, improved hamburger and integrated controls/audio. Its 13 model tests and mounted desktop/mobile plaque/dismissal checks pass. Small rigs and clothing still read as illustrations beside realistic heads; stopped **exhausted**. Root independently reviewed final Supply/Tycoon screenshots and agrees their realism failures remain visible. Wall now has continuous world-space UVs, cloth folds and articulated walking/ladder poses; its remaining world geometry still requires review.

### Shared lifecycle review

Desktop/mobile tests verify all five games start from a gameplay key, How to Play pauses, music stops/resumes, and seed entry does not start play. Tests run on an isolated Vite snapshot to avoid active HMR. Flappy now uses controlled simulation time in that test so the eagle does not crash while audio decoding is checked. Independent unit review found and fixed old effect voices persisting across `setScene`; switching scenes now stops voices and resets effect throttles. Delayed decode, mute, pause offsets and destruction are covered by audio unit tests.

### Final Wall/Rio reviews

Wall completed ten changes/reviews spanning anatomical bodies, world UVs, walking/climbing poses, night lighting, water, audio/score feedback, readability and surface wear. Rio completed ten spanning terrain texture/light, family garments/slings/hands, wood bridge detail, current highlights, vegetation, event audio and haze. Root inspected final day/night Wall and final Rio family/river scenes: block geometry, repeated surface panels and small stylized characters remain material defects. Both stop **exhausted**. All five games used 10/10 attempts, for 50 reviewed implementation rounds total.

Evidence is archived in `.internal_docs/reviews/evidence/`; see [independent integration review](.internal_docs/reviews/integration.md). Improvements are retained, but none is described as achieving PS3 realism. Synthetic music/foley is technically validated; subjective musical/foley realism has not been accepted.

### Integration regression: tunnel rendering cost

The stable full browser run passed 76 cases and skipped the unsupported mobile fullscreen case, but two long desktop tunnel simulations exceeded their existing 60-second limits. Remaining mobile tunnel work was stopped while the repeated rendering cost was investigated. This is not a simulation-rule failure or a reason to loosen the test limit: repeated stationary texture projection needs caching. A bounded, camera-aware texture cache is being implemented and must pass visual equivalence and tunnel regression checks. The ten art attempts stay closed; this is required regression repair before delivery. A new held-key sprint browser check also resolves an inconclusive post-key-release stamina probe.

### Final integration repairs verified locally

Stationary terrain caching fixes the long Wall timeout without changing simulation or presentation rates. The formerly failing desktop entry/emergence test passed in 26.3s in isolation and 31.2s in the final combined run; desktop drowning/checkpoint passed in 25.2s. Both desktop/mobile held-sprint checks confirm drain, pause freeze and recharge. Same-state before/after images have mean absolute channel difference 0.189/255 and maximum 4/255 from alpha compositing. Cache speed measurements apply to stationary cameras; moving-camera gains are not established. These repairs complete integration of attempt 10 rather than opening another art-design round.

Independent review also fixed Supply's construction sound firing on every pointer button: the cue now requires a valid upgrade. Its new browser check passes on both viewports. TypeScript/production build and all 151 unit tests pass after the final code changes. Full browser completion and preview refresh are recorded below once finished.

### Final verification

- Production build / TypeScript: passed.
- Unit/model/runtime tests: **151 passed in 16 files**.
- Full stable desktop/mobile Playwright run: **85 passed, 1 skipped** in 3.6 minutes. The skipped case is mobile fullscreen, whose API is unsupported by that test environment. Desktop fullscreen passed.
- Coverage includes all five routes, workbench/tuning, keyboard/pointer focus, How to Play, any-key start, score/model rules, music lifecycle, seed replay, construction, day/night, occlusion, held sprint, hidden tunnel exits and drowning/checkpoint recovery.
- No simulation model files were changed by this fidelity work.
- Final disposition: **Flappy 10/10 exhausted; Wall 10/10 exhausted; Rio 10/10 exhausted; Supply 10/10 exhausted; Tycoon 10/10 exhausted**. No game is claimed to meet the requested realistic character/world bar. Subjective musical/foley realism and moving-camera performance remain review limitations.

### Preview and release state

All five main-page cards were recaptured from the running games with `scripts/capture-game-previews.mjs`, after Canvas-owned image requests settled. Root inspected all five final previews: they accurately show the implemented games and retain the documented realism limitations. Generated asset specifications/provenance and original audio regeneration sources are included.

## 2026-09-09: agreed fictional Supply loading round

Status: complete. Production build, 158 unit tests and 15 targeted desktop/mobile browser checks pass (one unsupported mobile fullscreen check skipped). This is a new user-authorized round after the earlier ten-attempt fidelity review. Scope is Supply the People only: fictional operators, supplier trucks, visible loading, and the agreed gold-coating scoring mechanic. Other proposed game changes remain outside this round.

[Implementation specification](.internal_docs/specs/supply-loading.md) records the agreed names, state machine, layout, scoring and acceptance criteria. Three agents split model/tests, rendering, and pointer/browser verification; root integrates controls, accessible announcements, help, documentation and final checks. Earlier review results above remain historical.
