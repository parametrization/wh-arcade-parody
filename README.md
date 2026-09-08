# wh-arcade-parody

Five playable, independent political satires inspired by the public White House arcade. The games use fictional cartoon encounters to explore transparency, immigrant dignity, mutual aid, public nutrition and shared prosperity.

This is expressive political commentary, intended to exercise freedom of speech. It is not affiliated with or endorsed by the White House or any government agency. A character appearing in a game does not establish wrongdoing by the person depicted. This statement does not claim blanket legal immunity or ownership of third-party material.

## Run locally

```sh
./dev
```

The no-argument launcher serves **http://localhost:8643** with hot reload. Dependencies are project-local and lockfile-pinned. The development workbench at `/#/workbench` provides game selection, live tuning, deterministic seeds and tuning export. Restart-required tuning is staged until restart; the workbench is excluded from production builds.

| Game | Play route | Current gameplay |
| --- | --- | --- |
| Flappy Files | `/games/flappy-files/` | Fly the eagle through named political obstacles, deliver files, collect hamburgers and dismiss a screen-covering distraction. |
| Against the Wall | `/games/against-the-wall/` | Navigate three isometric districts, use cover and faction confusion, help companions and reach asylum intake. |
| Rio Rescue: No One Left Behind | `/games/rio-rescue/` | Guide a growing rescue convoy, deliver neighbors to a welcome center, share supplies and evade photo-op hazards. |
| Supply the People | `/games/supply-the-people/` | Strip branded markups, route food to community destinations and balance deliveries over a campaign. |
| Trump Trickle-Down Tycoon | `/games/trickle-down-tycoon/` | Catch resources, reject hollow promises and invest in education, care and housing. |

All five share Start, Pause/Resume, Restart and Exit controls. Play areas scale up to 150% of their logical resolution on desktop and shrink to fit mobile screens. Each provides keyboard and touch controls. Settings store local preferences and remapped actions; no account or backend is required. The sixth arcade tile remains a nonplayable coming-soon placeholder.

## Current stage

The common foundation, five game modules and their host/workbench integration are implemented. The games currently use original procedural pixel artwork. [Concept sheets](assets/concepts/README.md) provide alternatives for visual review; final asset selection, richer animation/audio and human playtesting remain refinement work.

Rule tests include complete campaign fixtures, while browser tests cover routes, lifecycle, tuning and responsive behavior. Full human playthroughs and accessibility review are still needed; a deterministic test controller is not a substitute for those. The coordinator reports 64 unit/model and 38 desktop/mobile browser checks passing, with TypeScript/build checks passing. The detailed run record and remaining refinement are tracked in [.internal_docs/specs/game-verification.md](.internal_docs/specs/game-verification.md).

See [CONTRIBUTING.md](CONTRIBUTING.md) for commands and module contracts, and [.internal_docs/README.md](.internal_docs/README.md) for plans and implementation specs.

## Source and assets

Reference: [White House arcade](https://www.whitehouse.gov/arcade/), inspected September 7, 2026. The remake uses its own code and a visibly unofficial identity; production game pages do not load the original site's trackers or forms.

The White House [copyright policy](https://www.whitehouse.gov/copyright/) distinguishes government-produced material from third-party material and provides a default CC BY 3.0 license for third-party content unless otherwise noted. Reused material requires its own provenance and applicable attribution; government hosting alone does not establish authorship. Current artwork provenance is recorded in [assets/manifest.json](assets/manifest.json). Its source-code paths identify procedural drawing implementations, not image files for runtime preloading.

Built with Vite, TypeScript, Canvas 2D, semantic HTML controls, shared input/audio/storage services, Vitest and Playwright.
