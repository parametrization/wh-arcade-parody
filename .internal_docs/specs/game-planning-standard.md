# Game planning standard — P-01

Status: planning baseline complete, 2026-09-07. This standard defines an implementation-ready plan, not a claim that a game has been built or that optional art has been approved. Apply to all five game documents. The [infrastructure specification](infrastructure.md) owns the runtime/folder/developer-panel specification; [src/shared/contracts.ts](../../src/shared/contracts.ts) is the implemented TypeScript API authority. Configure patches use flat dotted keys with scalar values, live/restart flags use `TuningField.restart`, and read-only constants appear in inspection rather than editable fields. Loading/error states belong to host/factory handling because shared `GameState` exposes title/running/paused/won/lost only. [Flappy Files](../games/flappy-files.md) is the first detailed reference.

## Execution gate

Complete all five game plans against this checklist and verify the shared foundation before starting any game implementation. Planning, source research, asset provenance inventory and shared foundation implementation may proceed concurrently. Foundation verification means a real root `./dev` launch on localhost:8643, responsive shell routes, lifecycle/input/clock services, working developer panel/HMR disposal and passing relevant build/type/lifecycle/browser checks; a written specification alone does not satisfy it. Integration owner records evidence and clears the gate in the common status document. Production art completion is not part of this gate.

## Completeness checklist

- Identify title, original URL, local route, slug, ownership and status. Separate inspected source facts, inferred behavior and new design choices. Cite primary URLs with inspection dates; keep reproducible source hashes/captures in the common research inventory.
- Explain protagonist, objective, satirical reversal and concrete player actions. Specify loss, victory, score, progression and restart behavior; avoid treating a theme as a mechanic.
- Preserve explicit user mechanics. Resolve ambiguities with labeled initial defaults. Optional art, comedy wording and roster breadth can remain selectable; unresolved core loop, controls or win/loss rules cannot.
- List keyboard and pointer/touch equivalents, input focus rules, pause/exit behavior and gestures that must not propagate. Explain hidden-tab handling and accessible menu/status/assist options without promising untested equivalence.
- Specify complete run state transitions and at least one meaningful scenario for each terminal/paused/error state. Define processing order where collision, scoring, input or timers compete. State which clocks freeze.
- Specify world dimensions, coordinate system, actors/entities, collision rules, camera and difficulty bounds. Define deterministic randomness and generation validity constraints if applicable.
- Give real initial values, units, bounds and cross-field validation for tunable mechanics. Mark each developer configuration field live, restart-required or read-only. State score/save effects of assist mode and difficulty changes.
- Identify data/research needs, authoritative sources, verification timestamps and factual claim handling. Real political names are allowed; distinguish fictional gameplay from factual accusations. Optional evidence-dependent material must have an omission fallback.
- Inventory every major visual/audio asset with dimensions/anchor/frame needs, runtime/editable paths, provenance and two or three visual options. Clearly distinguish briefs, actual created variants and approved selections. Placeholders may unlock implementation once the execution gate clears.
- Match shared `GameModule`/`GameInstance`, directory layout, settings, save versioning, seed/input services and cleanup responsibilities. Keep game-specific rules local; promote shared helpers only with real consumers.
- Break work into IDs with deliverables, dependencies, current status and objective acceptance. Separate research/model/render/content/integration tasks enough to parallelize without conflicting ownership.
- Include meaningful model tests and browser journeys for core mechanics, timing/state boundaries, touch/keyboard behavior, asset failure, resize and repeated destroy/remount. Define performance measurements as targets until measured.
- End with a decision ledger: accepted user requirement, implementation default, optional selection, research dependency and blocking question. A plan is complete only when blocking gameplay questions are resolved or a safe functional default is recorded.

## Reusable document outline

1. **Identity and evidence:** status/date/owner/slug/route, original source observations, captures and uncertainty.
2. **Plot and satire:** protagonist, stakes, target of criticism, opening and ending beats, distinction between fictional depiction and claims.
3. **Core loop:** numbered player loop, score/resources, objectives, progression, losses and retries.
4. **Controls and accessibility:** actions mapped to devices, focus/pause, HUD/status, visual/audio alternatives and assist defaults.
5. **Simulation:** coordinates, entity data, update order, generation/AI/collision rules, exact run and special-event state tables.
6. **Configuration:** field/default/unit/range/application table; cross-field invariants, development export version and score implications.
7. **Assets and research:** inventory, multiple style options, selected implementation placeholder, source rights/fact verification tasks and fallback.
8. **Architecture:** game-local modules, shared interfaces, lifecycle teardown, assets/saves and developer inspect surface.
9. **Implementation packages:** IDs, dependencies, ownership, deliverable and completion evidence.
10. **Acceptance and decision ledger:** deterministic examples, browser journeys, deferred choices and execution gate.

## Review rubric and handoff

Reviewer returns either `planning-complete` or specific missing checklist items. Planning complete means a separate implementer can build a coherent first version without inventing core rules. It does not mean scope is frozen: changes update the plan, affected specs and tests together. The shared foundation gate remains independent of planning completeness.

Keep three readiness states distinct: **planning-complete** (rules/tasks documented), **implementation-unblocked** (all-five-plan plus verified-foundation gate satisfied), **production-ready** (assets/content/testing and agreed user review complete). Do not label planned tests as passing, option A as user-approved, a public website asset as automatically redistributable, or a source-reading inference as a measured browser observation.

For the four remaining games, prioritize gaps in objective/state/timing/configuration first. Contact sheets and final art selection may follow while engineering works after the gate. Complete bounded parallel work on separate files; root integration owner reconciles cross-game contracts and readiness evidence.
