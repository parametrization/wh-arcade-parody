# Shared infrastructure and site specification

Status: proposed implementation contract, 2026-09-07. Owner: integration team.

## Observed reference

Source: https://www.whitehouse.gov/arcade/. Local research: ../research/arcade-inventory.json and untracked arcade-reference.png. A 1440px-wide capture shows a navy institutional masthead, dark purple/black arcade section, cyan/magenta borders, monospaced titles, scanlines, grid horizon, four cards across then two, and a large navy footer. Five game links plus a disabled coming-soon tile were verified. At this viewport the card previews are landscape and cards have generous descriptions and bottom play actions. Mobile behavior still needs direct capture.

The fetched page includes analytics, mailing-list, and notification scripts. Build our own static shell; reference HTML is research input only. Use an original parody masthead and persistent “Unofficial political satire” label, keeping the visual rhythm, colors, and arcade layout. Navigation should lead to local games, About, Sources, and accessibility settings. No fake newsletter submissions or government notification opt-ins.

## Stack and folder contract

Use Vite + TypeScript + Canvas 2D, vanilla semantic HTML/CSS shell, npm lockfile. No framework or large game engine needed initially. Vite documents HMR and static production builds: https://vite.dev/guide/. Install project-local Vite, TypeScript, Vitest, @playwright/test during INF-01; record resolved versions in package-lock.json.

```text
./dev                         executable no-argument launcher
package.json                  start/dev/build/typecheck/test/test:e2e
vite.config.ts                localhost, port 8643, strictPort
src/main.ts                   shell startup and routing
src/site/                     header, cards, game host, footer, credits, CSS
src/games/registry.ts          lazy imports and card metadata
src/games/<slug>/
  index.ts                    manifest and factory only
  game.ts                     lifecycle orchestration
  config.ts                   typed tuning defaults
  model.ts                    pure simulation rules
  render.ts                   Canvas presentation
  assets/                     asset descriptors/atlas metadata
  game.test.ts                meaningful rule tests
src/shared/
  contracts.ts                GameModule and services
  loop.ts                     fixed-step clock
  input.ts                    action mapping and focus
  audio.ts                    consent/unlock, gain and mute
  storage.ts                  versioned settings and scores
  random.ts                   seeded deterministic PRNG
  canvas.ts                   resize and logical coordinates
  ui/                         accessible HUD/menu components
public/assets/common/
public/assets/<slug>/          runtime sprite/audio files
assets/source/<slug>/          editable art sources (when suitable)
assets/manifest.json           provenance and credits
scripts/                      launcher support and source inventory
tests/e2e/                   browser journey tests
.internal_docs/               plans, specs, research, status
```

Slug names are finalized in the master plan. Do not import one game's rules from another game. Promote duplicated helpers only after two consumers need the same behavior. Isometric projection and grid pathfinding belong to Wall until another consumer requires them.

## Runtime contract

`GameModule` exports a manifest `{id,title,description,controls,assetIds}` and `create(host, services): GameInstance`. `GameInstance` provides `start()`, `pause()`, `resume()`, `reset(seed?)`, `destroy()`, and optional development `inspect()`/`configure(patch)`. Services supply input, audio, storage, clock, RNG, and asset lookup. The instance owns its listeners and disposes all timers, RAF work, and audio voices on destroy. Factory may load asynchronously; host displays loading/error/retry.

States: loading → title → running ↔ paused → won/lost; restart and exit supported. Hide-tab and focus loss pause simulation; pause freezes game time, including the seven-second Flappy obstruction. Shared fixed step is 1/60s with capped catch-up after stalls. Resize preserves logical game coordinates; crisp pixel art uses nearest-neighbor scaling, letterboxing when needed, capped DPR, and explicit screen-to-world input mapping.

Shared settings: sound, volume, reduced motion, scanline intensity, high contrast, input bindings. Storage failure falls back to memory; scores and saves have per-game schema versions and a reset UI. No account, telemetry, backend, or remote asset requirement at runtime.

## Developer UI

`./dev` runs from the repository root without flags. First run installs lockfile dependencies if absent, then launches Vite at localhost:8643. Port conflict exits with a useful message instead of silently selecting another port. Browser opening is optional; URL always printed. `npm start` is equivalent after installation.

Development-only panel: game selector, restart/pause, deterministic seed, current state/FPS, tuning sliders defined by each game's config schema, asset variant selector, reset defaults, export tuning JSON. Do not expose arbitrary code execution or a write-anywhere endpoint. HMR disposes/remounts changed game modules; retain settings but reset active run with a visible notice. CSS changes update immediately. Production build excludes debug panels and debug globals.

## Work packages and acceptance

| ID | Work | Dependencies | Acceptance |
|---|---|---|---|
| INF-01 | Scaffold package, launcher, Vite/TS, lockfile | none | clean install; ./dev reaches localhost:8643; occupied port fails clearly; build and typecheck pass |
| INF-02 | Shell, responsive cards, routes, local About/Sources | INF-01 | five routable entries and one noninteractive placeholder; back navigation; 375/768/1440px captures; visible parody identity |
| INF-03 | Lifecycle, clock, input, canvas, RNG | INF-01 | mount/unmount 20 times without duplicate loops/listeners; deterministic rules; paused time cannot advance; touch mapping verified |
| INF-04 | Audio/settings/scores and credits pipeline | INF-03 | sound unlock by gesture; mute persists; blocked/corrupt storage doesn't crash; missing assets have readable errors |
| INF-05 | Developer tuning panel and HMR disposal | INF-02,03 | config edits visibly update; module replacement leaves one loop; production contains no panel |
| INF-06 | Integrate Flappy vertical slice | INF-02..05, Flappy model/art | keyboard and touch full play/restart/exit journey; H counter and obstruction timing tests |
| INF-07 | Add remaining games through same registry | approved game specs | lazy loaded routes; independent saves; every game passes common lifecycle/accessibility checks |
| INF-08 | Release package and documentation | all delivered scopes | npm ci/build/typecheck/test/test:e2e pass; no uncredited assets, unintended remote calls or secrets; README reflects actual state |

Browser checks use installed Chrome initially via Playwright `channel: chrome`; CI installs a matching pinned Chromium. Test pure collision, transitions, resource arithmetic and seeded scenarios with Vitest. Browser tests check gameplay and integration instead of duplicating rendering internals. Visual snapshots document expected layout at desktop/mobile; intentional art changes update baselines after inspection.

## Scope and risks

All performance numbers and tunings are starting targets, not measurements. Aim for 60fps on desktop and stable 30fps on a midrange phone; establish a device baseline before claiming results. Keyboard access to menus and touch equivalents are mandatory. Canvas action games need textual instructions/status and assist modes; do not promise equivalent screen-reader action gameplay without testing.

The current planning milestone does not install dependencies or create a running app. Machine checks: Node 24.14.0, npm 11.9.0, Git 2.43.0, gh 2.45.0, Chrome 149.0.7827.200. Playwright successfully launched Chrome, clicked a JS button, loaded the arcade with HTTP 200, and captured it. Cached Playwright's default bundled browser was absent, so pinning project dependencies is required during implementation.
