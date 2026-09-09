# Planning index

Current fidelity work and verification supersede the historical counts below: see [top-level progress tracker](../PROGRESS.md) and [integration review](reviews/integration.md). All five games reached ten reviewed attempts; full realistic PS3-era fidelity remains unmet.

Updated 2026-09-07. This is the first consolidated design proposal, not a claim of implemented games. The user has accepted real-name GOP/MAGA satire with fictional gameplay and evidence-based factual labels. All titles and new tuning numbers below remain proposed.

## Required sequence

1. Plan/spec the common infrastructure alongside Flappy's planning/specification.
2. Once Flappy's plan/spec is complete, finalize the other four to that standard.
3. Once common specs are ready, implement and verify the shared foundation while game planning continues.
4. When both the common foundation and all five plans/specs are complete, implement the five games concurrently on that foundation.

The foundation includes the localhost server, site shell, shared libraries, uniform module structure, hot reload, tuning panel and verification harness. It is tested using a diagnostic module, not an early Flappy implementation. See [delivery gates](status.md).

## Five game plans

| Original | Proposed remake | Core reversal | Detailed design/spec |
|---|---|---|---|
| Flappy Bill | **Flappy Files** | Eagle delivers Epstein Files past named political obstacles; Trump obscures the screen; collected burgers/H dismiss him | [Flappy](games/flappy-files.md) |
| Build the Wall | **Against the Wall** | Isometric asylum-seeker escape; competing pursuers fall into cartoon confusion fights; reach intake | [Wall](games/against-the-wall.md) |
| Rio Run | **Rio Rescue: No One Left Behind** | Snake-style rescue convoy delivers people to a welcome center while photo ops and red tape obstruct routes | [Rio](games/rio-remake.md) |
| Supply Line | **Supply the People** | Conveyor sorting redirects resources toward community meals despite political packaging and disruption | [Supply](games/supply-remake.md) |
| Trump Savings Tycoon | **Trump Trickle-Down Tycoon** | Catch resources and invest in shared services while satirical distractions threaten the collection loop | [Tycoon](games/savings-remake.md) |

The sixth tile stays a visibly disabled “A new adventure awaits” placeholder. It is not a sixth game.

## Common specifications

- [Infrastructure and uniform runtime/folder contract](specs/infrastructure.md): launch command, localhost:8643, Vite HMR, interactive tuning UI, shared libraries, test strategy and INF-01..08.
- [Content and asset research contract](research/content-and-assets.md): real-name data, provenance, visual contact sheets, art production sequence ART-01..06.
- [Delivery order and current status](status.md): dependency gates, parallel team allocation and definition of done.
- [Landing-page inventory](research/arcade-inventory.json) and [hashed source captures](research/source-captures.json): reproducible research references. Raw captures are local and ignored by Git.

## Design decisions to review through play

Flappy establishes the planning/specification level of detail; it is not an implementation prerequisite for the other games. The shared tuning panel is an accepted feature. Preserve the user's exact seven-second default event and immediate hamburger dismissal. Use real names with clear fictional roles. Review character sheets before producing complete animation families. The Flappy proposal offers 40% opaque coverage as a readability starting point and a Full Distraction option; the user's original screen-covering gag is retained, and the default must be chosen through playtest rather than silently toned down. Literal McDonald's branding versus an original recognizably fast-food burger is an unresolved art/provenance choice.

The other four plans are preliminary drafts to bring to the finalized Flappy standard, but their new jokes, art choices and added campaign mechanics have not yet been user-reviewed. Do not mistake suggested defaults for explicit user decisions. Against the Wall is the largest mechanical departure and highest implementation risk.

## Ongoing working loop

1. Read status and the relevant game plan before selecting a bounded spec.
2. If design changes, update the plan and affected acceptance criteria first; record dependency impact.
3. Assign independent files/specs to available teams, with one shared-contract owner.
4. Implement and run the checks appropriate to the change; attach screenshots or test evidence.
5. Update spec status honestly: planned, in progress, implemented, verified, or awaiting playtest.
6. Review the playable result; record tuning/art choices; select the next eligible work.

Only after all five plans/specs are complete and the common foundation is implemented and verified, all five game implementations may progress concurrently. Schedule bounded tasks across the four available agent slots; no game waits for Flappy completion or playtest approval.
