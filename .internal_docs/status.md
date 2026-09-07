# Delivery plan and status

Updated 2026-09-07. Planning milestone complete after document/link review. Implementation has not started.

## Evidence and completed work

- Browser automation verified with installed Chrome: JavaScript button click, arcade HTTP 200, all five links and full-page screenshot.
- Source pages for all five games captured locally and SHA-256 hashed; direct source inspection informed the game plans. Full original playthroughs remain pending.
- Five separate game designs include core loop, narrative, controls, tuning proposals, asset variants, implementation tasks and acceptance criteria.
- Shared runtime/folder/HMR/server plan and provenance/editorial contract written.
- Repository initialized on main, .gitignore and README created. Public publication status is reported by the actual Git remote, not assumed here.
- No playable game, generated art, npm dependency installation, localhost server, or completed gameplay test is claimed.

## Parallel teams and delivery order

There are four simultaneous agent slots including the coordinator. Six dedicated simultaneous teams would exceed that capacity; schedule independent work in waves.

| Wave | Coordinator / slot 1 | Slot 2 | Slot 3 | Slot 4 | Exit evidence |
|---|---|---|---|---|---|
| Planning (done) | Shared infrastructure, inventory, integration | Flappy plan | Wall + Rio plans | Supply + Tycoon plans | Five coherent designs and shared spec |
| Foundation | INF-01/02 shell, registry, launcher | INF-03/04 runtime services | ART-01/02 provenance + Flappy concepts | FF-01/02 source/cast verification, then browser harness | Contracts typecheck; hub at 8643; asset concepts reviewable |
| Flappy slice | Host integration and INF-05 tuning panel | FF-03..06 model/events/progression | Flappy sprites/rendering, bounded file ownership | Pure model tests + browser journeys | Complete playable Flappy; exact event timing; mobile controls |
| Flappy review | Consolidate user feedback/spec updates | Tuning and mechanics fixes | Selected art refinements | Regression/visual verification | User can judge intended tone, difficulty and style |
| Remaining games A | Integration/shared-contract ownership | Wall AW-01..06 | Rio RR-01..06 | Supply SL-01..06 | Each reaches independent graybox then playable milestone |
| Remaining games B | Cross-game integration and release | Tycoon ST-01..06 | Remaining selected art/accessibility | Regression/browser coverage | All five run under same shell and pass checks |

Work on isolated game modules may proceed once the common contract is stable. Avoid simultaneous edits to registry/package-lock/shared types: game owners request integration there. Root owns version changes and resolves contract conflicts. Existing workers can be reassigned after their bounded task finishes; additional permanent teams do not increase the four-slot throughput.

## Dependency gates

1. INF-01 precedes app work. INF-03 defines clock/input/lifecycle before game model integration.
2. ART-01 and cast verification precede shipping externally sourced art or factual role labels; grayboxes can use original placeholders.
3. FF-03/04 precede FF-05. Chosen event art can be prepared independently after pose and anchor contracts are fixed.
4. FF-07/08 establish a satisfactory Flappy slice before mass-producing the remaining game art and full implementations, matching the user's requested sequence.
5. Wall's AI, projection and confusion rules are game-local. Rio's occupancy/delivery rules, Supply's resource arithmetic and Tycoon's ledger get independent tests.
6. INF-08 is a release criterion, not a reason to call an unfinished graybox complete.

## Backlog status

| Group | State | Next eligible action |
|---|---|---|
| INF-01..08 | Planned | Scaffold project-local toolchain and no-argument launcher |
| ART-01..06 | Planned; initial source URLs recorded | Inventory sprite/font/audio rights, produce first Flappy concept sheet |
| FF-01..08 | Planned; inline source inspected | Browser play observations/cast records, then model after shared contract |
| AW-01..06 | Planned; inline source inspected | Author isometric graybox map specification |
| RR-01..06 | Planned; inline source inspected | Confirm original board/timing and implement pure reducer after contracts |
| SL-01..06 | Planned; inline source inspected | Observe complete original run and validate remake resource schedule |
| ST-01..06 | Planned; inline source inspected | Observe complete original round and validate catch/upgrade arithmetic |

No package is blocked on absent system software. Install Vite/TypeScript/test tools locally during INF-01 and use a lockfile. The cached Playwright library works with installed Chrome, but its default expected browser binary is missing; reproduce browser setup explicitly instead of depending on that cache.

## Review record

Initial review checked Flappy/common lifecycle compatibility and local documentation links. Clarified that obstruction ceases at exactly seven seconds (a decorative exit may follow) and Escape pauses while an explicit Exit control leaves the game. Asset variants are written briefs; actual graphics remain the next art deliverable.
