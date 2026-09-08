# Working on the arcade

Start the local site from the repository root:

```sh
./dev
```

The launcher installs lockfile dependencies on first use and serves `http://localhost:8643`. Node 22.12 or newer is required. After installation, `npm start` is equivalent. Port conflicts are errors so the address never silently changes.

## Shared foundation

The development-only workbench at `/#/workbench` exercises the runtime without implementing any of the five games. Use it for pause/reset, seeded runs, live configuration and JSON tuning exports. Vite updates CSS live; changes to runtime/diagnostic modules remount the diagnostic and reset its active run. Preferences persist.

Runtime contracts live in `src/shared/contracts.ts`. Games export a manifest and `create(host, services)` returning a lifecycle instance. Never attach a game loop or listeners as an import side effect. Set `host.dataset.gameId` before creating services for isolated storage. On leaving a route, destroy the instance and services; both cleanup paths should be safe to repeat. Host visibility/blur handling calls the instance's pause method so UI state matches the suspended clock.

Keep simulation rules independent of rendering. Consume fixed time steps and seeded randomness; do not use wall-clock timers for gameplay events. Pause must freeze all gameplay deadlines. The shared canvas helper maps pointer coordinates into logical world space. Input bindings apply only to focused game elements, not settings fields.

Configuration fields are typed scalar values. Mark restart-required fields explicitly, reject invalid patches, and separate visual-only live changes from changes that reset a run. The tuning panel is development-only and must not ship in the production build.

## Game ownership

Each game owns `src/games/<slug>/` and `public/assets/<slug>/`. Keep its model, configuration, renderer and asset metadata together. No game imports another game's private rules. Registry, package changes and shared APIs are coordinated changes: do not edit them from multiple worker tasks at once.

Before game implementation begins, all five plans must meet `.internal_docs/specs/game-planning-standard.md` and the shared foundation must be verified. Flappy sets the planning standard, not a requirement to complete its game before others.

## Checks

```sh
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Browser tests use installed Google Chrome through project-local Playwright. On a new machine install it with `npx playwright install chrome`; CI installs its dependencies too. Tests cover model/runtime invariants, lifecycle cleanup, keyboard/touch browser journeys and responsive layout. Keep `test-results/` and `dist/` out of Git.

Document original artwork and reused assets in `assets/manifest.json` and the Sources page. The existing SVG card compositions are original project artwork. Raw original-site captures stay in ignored local research storage. Do not import the original page's trackers, forms or notification scripts.
