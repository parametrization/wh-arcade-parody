# Tycoon gameplay and roof refinement — 2026-09-09

## Completed criteria

- Catching no longer requires a key or button. Positive cargo touching the back edge or interior of the net is collected once; warning previews and cargo above the net are excluded.
- Promise eligibility uses overlap of the 40 × 40 cargo icon with the visible net opening (y 302–334). Strictly more than 50% is required. Eligible promises can be returned directly, or caught automatically into the existing stored queue. Exactly 50% does not qualify.
- Arrow-key movement pairs with adjacent **J: Audit, K: Umbrella, L: Return**. Existing A/D, F, U/E, Q, Space and numbered lane controls remain compatible. Touch dragging and lane buttons catch automatically too, including untimed practice.
- Upgrade buttons explain both resource costs and gameplay effects. Education slows falling resources by 8 percentage points per level; care restores 2 integrity per level each new round; homes widen the net by 15% per level. The obsolete longer manual catch window would provide no benefit with automatic catching, so education now provides additional travel time. Purchase scoring, one purchase per round, and the requirement for all three services remain unchanged.
- All three people stand on a continuous supported roof terrace with legs, feet, contact shadows and roof-edge name plaques. Removed the portrait boxes. The facade is lightly softened and desaturated for visual coherence.
- Head rendering chooses either the existing image or the procedural fallback. It no longer paints both, preventing underlying ears, hair and faces from protruding around a loaded portrait. Source crops are tightened. No new likeness assets were introduced.
- Existing reactions, yellow overflow liquid, umbrella protection, wetness/friction, bonus growth/cap, scoring formulas and campaigns remain intact.

## Review and corrections

First visual inspection found that the moved roof name plaques overlapped the beginning of falling cargo. Cargo clipping and preview placement now begin below the plaques, and lane labels move down accordingly. Final screenshot shows unobstructed names and grounded figures. This remains stylized composite artwork, not a claim of photorealism.

Evidence: [final canvas](evidence/tycoon-refinement.png).

## Verification

- 22 Tycoon unit tests pass, including strict promise-overlap boundary, unconditional catches, preview exclusion, education fall-speed effect, score/reaction invariants, and three seeded full timed campaigns.
- TypeScript passes.
- Existing desktop browser promise/umbrella/pause/restart test passed. The mobile run was interrupted by a source hot reload (DOM detached and practice reset); it needs a stable integrated rerun after parallel teams finish.
- Added a desktop/mobile browser case exercising automatic practice catches without the Catch button and J/K/L controls. Parent integration will run this alongside the retained legacy Q/U test.

### Binding integration correction

The new default K umbrella key collided with a saved K pause override. The shared binding resolver now gives saved overrides priority; Tycoon consumes that same resolver for its displayed help and action labels. With pause on K, the umbrella button correctly lists U / E. A browser regression checks that K pauses and resumes without changing umbrella state and U remains available. TypeScript passes after this integration change.

## Independent integration review

Cross-review found that the old rectangular catch calculation included empty space beside the drawn tapered basket. Rendering and collision now share `net-geometry.ts`; exact icon/polygon intersection controls automatic catches and strictly-more-than-half promise returns. Added side-offset and back-edge-contact cases. The revised Tycoon model/reaction suite passes 24 tests. Shared input now reserves explicit overrides before default aliases, and Tycoon labels display the resulting keys.
