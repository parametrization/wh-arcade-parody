# Foundation verification record

2026-09-08. FOUNDATION-READY verified by root integration. INF-01..05 complete.

## Verification scope

INF-01..05 can be verified without a game implementation. The diagnostic module is deliberately a moving shape with seed/configuration and lifecycle controls. Five game routes must accurately state that games are in development. FOUNDATION-READY requires the following actual evidence:

- Root `./dev` starts localhost:8643 with strict port handling and a project lockfile.
- Responsive arcade shell, five placeholder routes, disabled sixth tile, About/Sources/settings.
- Shared deterministic loop/input/RNG/canvas/audio/storage/asset services.
- Working diagnostic pause/resume/reset/configuration/export, plus hot module replacement cleanup.
- Typecheck, production build, meaningful runtime unit tests and desktop/mobile browser journeys.
- Repeated service creation/destruction leaves no animation work or input listeners.
- Development workbench code is absent from production output.
- Local card art has provenance; application loads no third-party runtime requests.

## Current evidence

- Project dependencies installed successfully; npm reported no vulnerabilities at install time.
- Original page mobile reference captured at 375px; no horizontal overflow observed on that reference page.
- Runtime implementation and initial 7 unit tests completed. Full integration checks pending site completion.

Record final commands, pass counts, screenshot paths and material limitations here before clearing the gate. Do not count the original remote-site browser test as a local foundation test.

## Completed evidence — 2026-09-08

- `./dev`: Vite serves http://localhost:8643. A second invocation exits 1 with “Port 8643 is already in use.”
- `npm run typecheck`, `npm test`, `npm run build`: pass; 13 runtime tests.
- `npm run test:e2e`: 14 tests pass across desktop Chrome and mobile Chromium emulation. Includes five preview routes, disabled sixth tile, local sources, workbench pause/restart/export, responsive widths/no external requests, 20 repeated runtime mount/dispose cycles, blocked storage, pointer-coordinate mapping, missing-image errors and remapped pause controls.
- Actual diagnostic source edit triggered HMR remount notice; exactly one canvas remained and speed=85 persisted. Source was restored.
- Direct /games/flappy-files/ URL loads and refreshes.
- Production artifacts inspected: diagnostic/workbench UI excluded.
- Desktop/mobile/workbench screenshots captured in local ignored research files `foundation-desktop.png`, `foundation-mobile.png`, `foundation-workbench.png`; desktop and workbench visually inspected.
- Settings expose persisted accessibility/audio options, keyboard overrides and scoped game-progress reset.

P-03 independently complete in planning-completeness.md. Both prerequisites now satisfied: game implementation can begin. This foundation evidence does not claim any game implementation, final game artwork, full real-device testing or verified government asset redistribution. Browser mobile checks use emulation, not a physical handset.
