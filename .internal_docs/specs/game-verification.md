# Game implementation verification coverage

Inspected 2026-09-08. This is a factual map of implemented tests and observed checks. The coordinator reports 64 unit/model tests and 38 desktop/mobile browser cases passing, with typecheck and build passing. The final production rebuild also passed after checkbox synchronization, with no workbench/debug UI found in the bundle scan; art/playtesting refinements remain separate.

## Suite inventory

At inspection, the repository contains **64 unit/model cases**: 13 shared runtime, 13 Flappy, 13 Wall, 12 Rio, 6 Supply and 7 Tycoon. Browser sources define the foundation journeys, a parameterized journey for each of five games, and additional integration checks: 15 definitions, expanded to 30 cases across the configured desktop and Pixel 7 projects.

| Source | Implemented coverage |
| --- | --- |
| [Shared runtime tests](../../src/shared/runtime.test.ts) | Seed replay/state restoration; integer bounds; corrupt/versioned/blocked storage; deletion fallback; clock pause/reset/catch-up/reentrant resume; asset identities/failures; scoped game reset; persisted binding validation. |
| [Flappy tests](../../src/games/flappy-files/game.test.ts) | Exactly seven-second obstruction with pause; immediate hamburger dismissal and inventory rules; entrance alternation; collision before scoring; unique clearance/delivery; chapters/endless; seeded columns; atomic tuning; deterministic flight controller reaching six deliveries; capped pickups; death cleanup. |
| [Wall tests](../../src/games/against-the-wall/game.test.ts) | Distinct district paths, cover visibility, normalized movement, rival/same-faction encounters, invalid targeting/cooldown, pause, checkpoint resources, single banking, capture-before-arrival, gate timing/alternate route and a walking controller reaching all three offices without supplies or sprinting. |
| [Rio tests](../../src/games/rio-rescue/game.test.ts) | Seeded placement/turn queue; rescue growth versus helpers; vacating-tail collision rule; final small delivery and banking once; Share; exact single-step; atomic tuning; three-district legal routing/delivery fixture; hazard warning/activation cancellation; Share tick-fraction preservation; checkpoint ledger restoration; rewind cooldown. |
| [Supply tests](../../src/games/supply-the-people/model.test.ts) | Strip once without destroying food; misroute recovery/budget; balanced goals; single upgrade; practice/config validation; full campaign routing strategy; endless continuation. |
| [Tycoon tests](../../src/games/trickle-down-tycoon/model.test.ts) | Aligned timed catches; affordable single investment; final goals/exchanges; integrity repair and hollow-promise behavior; full untimed campaign; config/practice protection; timed campaigns with speed-limited movement and catch windows. |
| [Foundation browser journeys](../../tests/e2e/foundation.spec.ts) | Collection/routes/placeholder; diagnostic pause/reset/export; responsive/no-external-request checks; twenty service mounts with RAF/listener cleanup; preferences with blocked storage; canvas pointer mapping and image failure; remapped pause and frozen/resumed simulation. |
| [Game browser journeys](../../tests/e2e/games.spec.ts) | Each game's direct route, initial title, start, pause, resume, restart, workbench selection/canvas/tuning fields, viewport width, return to hub and absence of page errors; additional integration cases cover global sound/motion, practice options and remapped pause. |

## Observed checks before final integration run

- Foundation verification was recorded separately in [foundation-verification.md](foundation-verification.md).
- Rio's worker ran its 12 model tests successfully, including the complete three-district fixture, and ran TypeScript checks successfully at that revision.
- Independent Playwright mobile review used installed Chrome at 412px viewport width: all five games entered running and paused states; no horizontal overflow or page errors were observed in that review.
- Rio's Up touch button moved the leader from column 4/row 8 to column 4/row 7. Its workbench single-step mode advanced exactly one cell after the Next step button.
- A reviewed local screenshot was saved at `/tmp/rio-mobile-review.png`; it is an ephemeral observation, not a committed visual-regression baseline.
- Asset-manifest paths were checked against the workspace. Rio's procedural renderer lives in `src/games/rio-rescue/game.ts`; the manifest now names that real file.

## Coverage limits and outstanding review

Campaign model fixtures prove the particular deterministic strategies/scenarios in their code. Rio's campaign fixture routes directly through model ticks, while its hazard behavior is covered separately; it is not a complete human run under every timed hazard. Wall's walking controller proves an authored route, not every stealth tactic or difficulty preset. Flappy's flight controller proves feasibility for its seed and control strategy, not broad difficulty balance.

The browser game journeys are integration smoke tests; they do not complete every campaign through actual keyboard/touch input. They also do not substitute for human review of humor, visual resemblance, naming accuracy, readability or comfort. Full mobile playthroughs, gameplay accessibility, selected final graphics and audio polish remain refinement work.

Read-only QA identified global reduced-motion propagation and production access to assist/practice modes as integration items. The coordinator reports these fixed and included in the expanded browser checks: player-facing options, saved pause bindings, and global sound/reduced-motion propagation now have integrated coverage. The browser suite runs against Vite development serving; production inclusion is established separately by the build and production smoke review.

HMR disposal is implemented, and repeated runtime mount cleanup is tested. The listed browser tests do not themselves edit source files to demonstrate every HMR replacement path. Production builds should be checked for absence of workbench/debug UI and unintended remote requests. Existing production bundle inspection found no workbench UI chunk, but that observation must be repeated if the build changes materially.

## Final run record

Coordinator-reported results on 2026-09-08:

- `npm run typecheck` — passed
- `npm test` — 64 unit/model cases passed
- `npm run test:e2e` — 38 desktop/mobile cases passed
- `npm run build` — passed, including the final rebuild after checkbox synchronization
- Player-facing options smoke checks included in browser coverage; asset-manifest paths verified locally

These are reported run results, not merely test inventory. Record the final checked revision in the coordinator report. They do not claim final user approval of artwork or complete human playtesting.

## Larger play areas and keyboard regression follow-up

Desktop canvases now scale to 150% where space permits, with responsive mobile sizing and fullscreen controls. Shared pointer-button focus recovery, overlay Start focus, initial workbench focus and Rio keyboard shortcuts were fixed. The additional `tests/e2e/keyboard.spec.ts` covers real keys after mouse actions, Flappy flight, workbench pause/resume and desktop/mobile sizing. The final integrated browser run passed all 38 cases; typecheck and production build passed.
