# Delivery plan and status

Updated 2026-09-07. Initial drafts exist; planning completion has not yet been established against the Flappy standard. Implementation has not started.

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
| P-01: Flappy planning | Finalize Flappy design/spec and review decisions | Bounded Flappy research | Flappy asset concepts/spec detail | Flappy acceptance/dependency review | Complete Flappy planning/spec reference |
| P-02: Other game planning | Apply finalized Flappy template and consolidate shared specs | Wall + Rio planning | Supply planning | Tycoon planning | All four plans reach the finalized Flappy level of detail |
| P-03: Planning completeness | Check all five plans and shared specs together | Dependency review | Asset/research work-package review | Acceptance/consistency review | All five plans/specs complete; implementation gate opens |
| Foundation | INF-01/02 shell, registry, launcher | INF-03/04 runtime services | Shared palette/provenance contracts | Browser harness and per-game spec readiness | Shared interfaces stable; no finished game required |
| Concurrent game work | INF-05 tuning panel and rolling integration | Eligible model/render/art task from any game | Eligible task from another game | Eligible task from a third game | All five workstreams advance through rotating bounded tasks |
| Rolling refinement | Integrate feedback and update specs | Per-game fixes/art | Per-game fixes/art | Browser/accessibility checks | Each game independently reaches its acceptance criteria |
| Release | Cross-game integration and documentation | Remaining game work | Remaining art/accessibility | Regression/browser coverage | All five run under the same shell and pass checks |

Authoritative sequence: complete Flappy planning/specification first; then complete the other four plans/specs modeled on it; then verify all five are in hand before starting any implementation. Existing other-game drafts are preliminary until that pass is complete. After this global planning gate and shared-interface readiness, all five implementations may advance concurrently. Four slots limit simultaneous tasks, not which games are eligible. Use a fair ready queue: prioritize dependency-unblocking tasks, then rotate among all five games; do not finish a game before giving the next game a slot. Work on isolated game modules may proceed only after P-03 and once the common contract is stable. Avoid simultaneous edits to registry/package-lock/shared types: game owners request integration there. Root owns version changes and resolves contract conflicts. Existing workers can be reassigned after their bounded task finishes; additional permanent teams do not increase the four-slot throughput.

## Dependency gates

0. P-01 → P-02 → P-03 is mandatory. No game coding, grayboxes, or shared app implementation starts before all five plans/specs are complete. Planning research and concept graphics can support these stages.
1. After P-03, INF-01 precedes app work. INF-03 defines clock/input/lifecycle before game model integration.
2. ART-01 and cast verification precede shipping externally sourced art or factual role labels; grayboxes can use original placeholders.
3. FF-03/04 precede FF-05. Chosen event art can be prepared independently after pose and anchor contracts are fixed.
4. FF-07/08 verify and refine Flappy only. They do not gate AW, RR, SL, ST or other games’ art production. Each game has its own playtest and acceptance checks.
5. Wall's AI, projection and confusion rules are game-local. Rio's occupancy/delivery rules, Supply's resource arithmetic and Tycoon's ledger get independent tests.
6. INF-08 is a release criterion, not a reason to call an unfinished graybox complete.

## Backlog status

| Group | State | Next eligible action |
|---|---|---|
| INF-01..08 | Planned | Complete shared spec review; scaffold only after P-03 |
| ART-01..06 | Planned; initial source URLs recorded | Inventory sprite/font/audio rights, produce first Flappy concept sheet |
| FF-01..08 | Planned; inline source inspected | Browser play observations/cast records, then model only after P-03 and shared contract |
| AW-01..06 | Planned; inline source inspected | Author isometric graybox map specification |
| RR-01..06 | Planned; inline source inspected | Confirm original board/timing and specify pure reducer; implement only after P-03 and contracts |
| SL-01..06 | Planned; inline source inspected | Observe complete original run and validate remake resource schedule |
| ST-01..06 | Planned; inline source inspected | Observe complete original round and validate catch/upgrade arithmetic |

No package is blocked on absent system software. Install Vite/TypeScript/test tools locally during INF-01 and use a lockfile. The cached Playwright library works with installed Chrome, but its default expected browser binary is missing; reproduce browser setup explicitly instead of depending on that cache.

## Review record

Initial review checked Flappy/common lifecycle compatibility and local documentation links. Clarified that obstruction ceases at exactly seven seconds (a decorative exit may follow) and Escape pauses while an explicit Exit control leaves the game. Asset variants are written briefs; actual graphics remain the next art deliverable.

User clarification (2026-09-07): Flappy planning/spec completion precedes finishing the other four plans/specs. Completion of all five plans/specs gates every implementation start. Flappy implementation/playtesting is not a prerequisite for the other games. The shared tuning panel remains accepted.
