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
| Parallel planning | Common infrastructure plan/spec | Finalize Flappy plan/spec | Bounded research/art concepts | Contract/acceptance review | Common specs ready; Flappy reference complete |
| Parallel foundation + game planning | Implement INF-01..05 | Finalize Wall + Rio using Flappy reference | Finalize Supply + Tycoon using Flappy reference | Foundation tests and planning review | Common foundation implemented and verified; all five plans/specs complete |
| Game-start gate | Check foundation and planning evidence | Review per-game dependencies | Review assets/work packages | Review acceptance coverage | Both P-03 and FOUNDATION-READY satisfied |
| Concurrent game implementation | Rolling host integration | Eligible game task | Eligible task from another game | Eligible task from a third game | All five build on the finished common foundation |
| Rolling refinement | Integrate feedback and update specs | Per-game fixes/art | Per-game fixes/art | Browser/accessibility checks | Each game independently reaches its acceptance criteria |
| Release | Cross-game integration and documentation | Remaining game work | Remaining art/accessibility | Regression/browser coverage | All five run under the same shell and pass checks |

Authoritative sequence: plan/spec the common infrastructure alongside Flappy planning. Once Flappy's reference plan/spec is complete, finalize the other four modeled on it. Once common specs are ready, implement and verify the common foundation while game planning continues. Start game implementation only when both the foundation is finished and all five game plans/specs are complete. Existing other-game drafts remain preliminary until that pass is complete.

Four slots limit simultaneous tasks, not game eligibility. During foundation work reserve capacity for infrastructure and its verification while planning workers finish the game specs. After the game-start gate, rotate bounded tasks among all five games, prioritizing dependency-unblocking work. Root owns registry/package-lock/shared types and contract changes. No game waits for Flappy implementation or playtest completion.

## Dependency gates

0. Game planning follows P-01 (Flappy reference) → P-02 (other four at that standard) → P-03 (all five complete). Common planning runs alongside it.
1. Common-spec readiness allows INF-01..05 implementation immediately; it does not wait for P-03. FOUNDATION-READY means INF-01..05 implemented and verified with a diagnostic module. All game coding/grayboxes require both P-03 and FOUNDATION-READY.
2. ART-01 and cast verification precede shipping externally sourced art or factual role labels; grayboxes can use original placeholders.
3. FF-03/04 precede FF-05. Chosen event art can be prepared independently after pose and anchor contracts are fixed.
4. FF-07/08 verify and refine Flappy only. They do not gate AW, RR, SL, ST or other games’ art production. Each game has its own playtest and acceptance checks.
5. Wall's AI, projection and confusion rules are game-local. Rio's occupancy/delivery rules, Supply's resource arithmetic and Tycoon's ledger get independent tests.
6. INF-08 is a release criterion, not a reason to call an unfinished graybox complete.

## Backlog status

| Group | State | Next eligible action |
|---|---|---|
| INF-01..05 | Planned | Finish common spec review, then implement and verify foundation alongside game planning |
| INF-06..08 | Planned | Game integration/release after P-03 and FOUNDATION-READY |
| ART-01..06 | Planned; initial source URLs recorded | Inventory sprite/font/audio rights, produce first Flappy concept sheet |
| FF-01..08 | Planned; inline source inspected | Browser play observations/cast records, then model only after P-03 and FOUNDATION-READY |
| AW-01..06 | Planned; inline source inspected | Author isometric graybox map specification |
| RR-01..06 | Planned; inline source inspected | Confirm original board/timing and specify pure reducer; implement only after P-03 and FOUNDATION-READY |
| SL-01..06 | Planned; inline source inspected | Observe complete original run and validate remake resource schedule |
| ST-01..06 | Planned; inline source inspected | Observe complete original round and validate catch/upgrade arithmetic |

No package is blocked on absent system software. Install Vite/TypeScript/test tools locally during INF-01 and use a lockfile. The cached Playwright library works with installed Chrome, but its default expected browser binary is missing; reproduce browser setup explicitly instead of depending on that cache.

## Review record

Initial review checked Flappy/common lifecycle compatibility and local documentation links. Clarified that obstruction ceases at exactly seven seconds (a decorative exit may follow) and Escape pauses while an explicit Exit control leaves the game. Asset variants are written briefs; actual graphics remain the next art deliverable.

User clarification (2026-09-07): common planning/specification runs alongside game planning. Complete common implementation before starting games. Flappy planning comes first within the game-planning track; finalize the other four from that standard. The game-start gate requires all five plans/specs plus the verified common foundation. The shared tuning panel remains accepted.
