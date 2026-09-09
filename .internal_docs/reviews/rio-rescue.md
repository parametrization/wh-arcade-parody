# Rio Rescue fidelity review

## Attempt 1 — implemented and reviewed

Target: improve character anatomy and materials while preserving the seeded 48×36 landscape, mandatory current movement, convoy interpolation, family variants, camera detection, safe returnable spawns and scoring.

Changes:

- Replaced rectangular body/head meshes with shaded rounded head, cheek, nose, eye/lid, neck and torso surfaces. Arms/legs have tapered joint-to-joint segments and rounded knees/elbows. Boots retain terrain contact. Straw brims/crowns and tied hair are rounded; mother/baby and multi-child entities remain deterministic per seed/index.
- Added soft layered contact shadows and deterministic soil grain. Shared raster materials are projected onto actual ground, cliff, water and clothing mesh faces; soil, sandstone, rock, canvas, denim and straw remain anchored to their geometry.
- Kept Q alongside Space for Share, E alongside X for waiting, and added F for single-step practice. Existing keys remain supported.
- Explained existing arithmetic: 100 per delivered neighbor, 25 per delivered supply, 250 per district. Display personal best per mode/speed, save legitimate point gains immediately and show short +points feedback. No scoring model change or pause/restart award introduced.

Evidence:

- `npm run typecheck` passes.
- `npm test -- src/games/rio-rescue`: 27 tests pass, including the three-district campaign, safe spawn returnability, fence approach, raised-terrain camera occlusion, current and cardinal interpolation.
- `npx playwright test tests/e2e/rio-motion.spec.ts`: all 4 desktop/mobile cases pass (intermediate movement, pause freeze, camera waiting).
- Actual browser E shortcut enters waiting and displays the Continue moving button. Live HUD displays personal best.
- `evidence/rio-attempt1-materials.png`: seeded river/mesa route with farmer, women, mother-baby and child groups, after shared atlas load.
- `evidence/rio-attempt1-live.png`: actual route after keyboard E; minimap and HUD intact.
- `evidence/rio-attempt1-characters.png`: pre-texture anatomy comparison.

Acceptance review:

| Category        | Result                                   | Evidence / remaining issue                                                                                                                                                                            |
| --------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Characters      | Improved; not final acceptance           | Rounded articulated shapes read as people at play size and preserve all family variants. Faces remain very small; skirt/sling surfaces still angular. Not PS3-level realism.                          |
| World/materials | Not accepted yet                         | Photographic soil/stone/water textures improve material distinction. Repeated atlas tiles and stepped, broad cliff strata remain conspicuous. Bridge objects remain largely untextured wood geometry. |
| Gameplay        | Existing regressions pass                | Q/E/F aliases and objective/failure/scoring copy are present. Shared host How to Play/any-key start is root-owned and requires integration review.                                                    |
| Scoring         | Implemented; arithmetic regressions pass | Mode/speed best and immediate delivery/district feedback added without changing model arithmetic. Full browser delivery-feedback persistence check remains for integration.                           |
| Audio           | Pending shared integration               | Existing mute-aware tone remains; distinct soundtrack/ambience and richer effect API are root-owned and were not available at this review.                                                            |
| Quality         | Targeted verification passes             | Four desktop/mobile browser checks and 27 model tests pass. Minimap, seeds, camera/current and pause preserved. Fullscreen and whole-site lifecycle remain root integration checks.                   |

Decision: attempt 1 is complete, but the overall graphical/audio acceptance bar is **not met**. Do not describe the current output as photorealistic or PS3 hardware equivalence. A next reviewed attempt should prioritize less repetitive cliff texturing/geometric silhouettes, natural clothing silhouettes, and integrated audio feedback before claiming completion.

## Attempts 2–10 — completed, visual target exhausted

Each numbered round below includes a concrete implementation change followed by a browser render of the same seed-42 family/river/mesa fixture. Fixtures intentionally place a six-entity convoy on a bridge approach to compare the mother/baby, children and farmer silhouettes; this is visual evidence, not campaign reachability evidence. Screenshot paths are `evidence/rio-attempt2.png` through `evidence/rio-attempt10.png`.

| Attempt | Concrete change                                                                                                                                            | Critical graphical review                                                                                                                                                                           |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2       | World-coordinate material UVs for soil, stone, wood and water; consistent strata palettes across adjacent tiles.                                           | Less checkerboard shading, but atlas repetition and square silhouettes remain conspicuous.                                                                                                          |
| 3       | Replaced two flat skirt panels with a closed sixteen-panel pleated garment; rounded infant sling and diagonal cloth strap.                                 | Families read more naturally from oblique angles; faces remain small and clothing still polygonal.                                                                                                  |
| 4       | Seven thin, varied river highlights per cell with world-position phase offset, retaining downstream animation and reduced-motion freeze.                   | Current reads more clearly and large identical wave bars are gone; water is still a textured plane rather than a realistic fluid surface.                                                           |
| 5       | World-mapped wooden bridge decks and inset nail heads.                                                                                                     | Grain improves material recognition; bridge silhouette and planks remain simple rectangular construction.                                                                                           |
| 6       | Directional cliff-side lighting shared consistently by adjacent tiles.                                                                                     | Better depth at corners; stepped, vertical wall geometry still dominates the landscape.                                                                                                             |
| 7       | Event-based shared audio calls for walking, water entry/movement, rescue, delivery, crash and sharing. Keyboard and pointer Share use the same pickup cue. | Visual scene unchanged intentionally. Effects run on actual model transitions, not draw calls; pause redraws cannot generate footsteps. Subjective sound quality is not accepted without listening. |
| 8       | Grounded seven-blade dry grass clusters replace isolated triangular leaves. Elevation comes from the terrain surface.                                      | Better sparse vegetation; it remains tiny at play scale. Raised terrain no longer positions this decorative plant at world zero.                                                                    |
| 9       | Articulated thumbs and grouped fingers replace pure mitten silhouettes.                                                                                    | Better close-up anatomy, but normal camera distance makes this a small improvement; head/hand detail is not a substitute for realistic whole-character presentation.                                |
| 10      | Per-material distance haze on distant geometry, leaving status labels, vision overlays and minimap unmodified.                                             | Far cliffs harmonize better with dusty surroundings; the fundamental square geometry and repeating rock texture still fail the requested realism.                                                   |

For every round, controls, scoring arithmetic and seeded topology remained unchanged. The common gameplay/scoring/audio/quality review applies to all rounds: Q/Space Share, E/X Wait and F practice remain; immediate score/best feedback stays in place; graphical fixtures do not prove public-host control behavior; audio remained pending through round 6 and was wired in round 7; final checks below cover the combined implementation. No terrain, model, camera detection, directed current, rescue spawn or convoy collision rules were changed in these rounds.

Final evidence and assessment:

- Typecheck passes after round 10.
- All 27 Rio model/terrain/motion tests pass, including full campaign, current movement, returnable spawns and raised terrain camera occlusion.
- Final family/canyon fixture: `evidence/rio-attempt10.png`, actually inspected after material load. Grass, pleated skirts, baby sling, bridge grain, flowing water and minimap remain visible.
- Character/world acceptance: **not met**. Faces are too small, surfaces still repeat, and the discrete terrain geometry remains conspicuously rectilinear. Camera overlay triangles also remain visually coarse. This output must not be presented as PS3-level realism.
- Gameplay/scoring: arithmetic and campaign regressions pass; no mechanical changes in these visual rounds. Public-host browser result is recorded separately below.
- Audio: event integration uses the shared mute/lifecycle system. Root verifies whole-site technical lifecycle; subjective music/foley listening remains unaccepted.
- Status: **10/10 attempts exhausted**, not accepted. Further substantial visual gains require a different terrain/character asset strategy, not another claim that these incremental changes meet the requested bar.

- Final public-host browser verification: all 4 desktop/mobile `tests/e2e/rio-motion.spec.ts` cases pass (intermediate movement, pause freeze and waiting). Directed river drift is verified by the model/motion tests; a full public-host swim route was not manually completed in this review.
