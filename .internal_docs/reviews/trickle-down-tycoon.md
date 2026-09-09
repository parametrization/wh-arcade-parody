# Trickle-Down Tycoon fidelity review

## Attempt 1 — implementation and review complete

Plan: improve facial anatomy, mansion/material fidelity and natural hand contact without changing target motion, resource accounting, issuer return reactions or the bonus formula. Preserve readable exaggerated reactions and explain objective/scoring/recovery.

Implemented:

- Replaced faceted facial planes with layered shaded forehead, cheek, nose, jaw and ear volumes; added lids, iris highlights, lips and fine creases. Existing hair, beard, glasses, issuer identities and reaction overlays remain.
- Wool-textured tailoring and limestone facade tiles; asphalt mapped in individual receding plaza cells instead of stretching one atlas panel over the floor. Mesh/wood net textures and cloth umbrella with visible ribs.
- Rounded gripping hands with separate fingers, knuckle creases, nails, thumbs and denim sleeves.
- E toggles umbrella alongside existing U. Q returns promises and F audits; legacy keys and pointer controls remain.
- Personal best stored/displayed by standard/assisted/practice mode, immediate +points feedback, and explicit arithmetic guide. The model remains unchanged: catches base10, investments base50, fulfillment base10×max(1,total resources before fulfillment); floor(base×(1+bonus/100)). Fulfillment increments bonus by10 points capped200 before awarding.
- Optional shared effects wired for flood, capitulation, promise, pickup/score and crash transitions. State tracking prevents repeated sound on every redraw; reset clears tracking.

Evidence:

- Typecheck passes.
- 19 Tycoon model/reaction tests pass, including scoring and cap invariants.
- Both desktop/mobile `tycoon-promises.spec.ts` browser tests pass: catch/return, umbrella, reaction pause/resume.
- Manual real-route E key toggles umbrella to `aria-pressed=true`; personal-best display appears.
- `evidence/tycoon-attempt1-reactions.png`: actual renderer fixture for yellow overflow+umbrella, angry phase, zoom caption, and flying fulfillment. Refreshed after final material/shading refinement.

Review:

| Category | Result | Evidence / limitation |
| --- | --- | --- |
| Characters | Improved, not final acceptance | Shaded faces and gripping hands add anatomy. Faces are still small stylized booth portraits; hair remains polygonal and shoulders static. Does not meet realistic PS3-era character target. |
| World/materials | Improved, not final acceptance | Surface materials now visible and geometry-anchored; facade remains a simplified architectural backdrop and some icon materials are flat. |
| Gameplay | Targeted pass | Existing model untouched; Q/U/F preserved and E works. Shared host How to Play/any-key start remains root integration responsibility. |
| Scoring | Implemented; invariant tests pass | Guide matches actual resource-count fulfillment formula; best and immediate feedback are visible. No altered 10–200% bonus arithmetic or reward farming. |
| Audio | Effects integrated; listening review pending | Optional shared API is called at event transitions. Soundtrack, volume and route lifecycle are shared/root-owned; no independent soundtrack created. |
| Quality | Targeted checks pass | 19 model tests and 2 desktop/mobile event lifecycle cases pass. Yellow liquid, tears, steam, umbrella interception, large caption, resource flight, wet/speed/bonus meters retained. Whole-site fullscreen/audio checks remain root-owned. |

Decision: attempt1 complete; **overall graphical acceptance not met**. Another reviewed attempt should address portrait animation/likeness, more dimensional architectural lighting, and believable audio listening verification. Current output is stylized satire, not photorealism or PS3 hardware equivalence.

## Attempt 2 — realistic scene and recognizable head assets

Integrated the generated White House photograph with its original aspect ratio and clear wet foreground behind all lanes. Atlas cells 0/1/2 match Trump/Vance/Johnson and are contour-clipped onto existing torsos; baked checkerboard outside the silhouette is excluded. All event layers remain in front. Screenshot `evidence/tycoon-attempt2.png` reviewed for overflow, anger, zoom and flight; typecheck passes.

Review across categories: character likeness and world material realism improve substantially; characters still feel like static cards and hands/net lighting remains detached from the photographic street. Gameplay/scoring/model unchanged from attempt1; audio effects remain wired, listening not yet verified; same control/lifecycle regression coverage applies until final batch. **Not accepted**: next attempt must animate the people and better connect anatomy/materials to the scene.

## Attempts 3–10 — completed, reviewed, cap reached

Each numbered row is a distinct implemented change followed by screenshot review and typecheck, not a planning step or a rerun. The four event panels are overflow with umbrella, anger, fulfillment zoom, and flight.

| Attempt | Concrete issue addressed and result | Evidence |
| --- | --- | --- |
| 3 | Static heads/shoulders: breathing, slight head articulation, blinking and different idle/cry/anger hand poses. More alive, but the booth composition still reads as a portrait interface. | `evidence/tycoon-attempt3.png` |
| 4 | Flat icons/canopy and hard shadows: leather/page detail, stitched care-case material, metal key glints, curved fabric umbrella ribs and feathered contact shadows. Care-case remains geometrically simple at zoom scale. | `evidence/tycoon-attempt4.png` |
| 5 | Solid yellow ribbon: gradient liquid depth/meniscus, narrower irregular stream and impact/umbrella splash droplets. Yellow remains immediately identifiable; flow timing/interception unchanged. | `evidence/tycoon-attempt5.png` |
| 6 | Hard red face mask/white steam circles: radial face flush, curved translucent tear streaks, diffused curled steam. Better integrated, still deliberately exaggerated. | `evidence/tycoon-attempt6.png` |
| 7 | Static wet street and detached catch lighting: restrained rain, small street ripples and subtle catch glow. Photo-backed scene now has motion but remains a fixed backdrop. | `evidence/tycoon-attempt7.png` |
| 8 | Tiny ledger/airborne shadows: larger round/score/net labels, removed redundant canvas title, grounded target shadows growing as resources approach. HUD remains compact but reads better. | `evidence/tycoon-attempt8.png` |
| 9 | Expensive hidden fallback: skip the entire procedural textured facade once the photographic scene is loaded, avoiding redundant texture work beneath an opaque image. No visual loss in the four event panels. | `evidence/tycoon-attempt9.png` |
| 10 | Reduced-motion leak in reactions: freeze decorative bubble/tear/splash offsets while preserving actual reaction progression, deadlines and awards. Final motion/quality review completed. | `evidence/tycoon-attempt10.png` |

All-category review across attempts3–10: gameplay and scoring model were left unchanged; old controls and issuer/flood/capitulation/umbrella semantics remain. Character/world limitations were inspected after each rendered change and remained unresolved at the overall realism bar. Audio effect wiring and personal-best/feedback from attempt1 remain; shared soundtrack lifecycle and host guide/any-key handling are root-owned. Reduced motion, legible labels and performance were specifically corrected in later attempts, not assumed from unit success.

Final verification:

- Typecheck passes.
- All19 Tycoon model/reaction tests pass after final changes.
- Both desktop/mobile promise-return/umbrella/pause browser tests pass after final changes.
- Browser pixel comparison on a live overflow fixture: reduced-motion time1→1.2 changes **0 channels**, normal motion changes **18,511 channels**. Countdown text was unchanged in that fractional interval, so this measures decorative motion.
- Local Chrome warmed renderer benchmark: about15.4ms/render across30 calls on the tested fixture. This is a measurement on the current machine, not a mobile performance guarantee.
- Final four-phase screenshot inspected: `evidence/tycoon-attempt10.png`.

**Final status: EXHAUSTED, 10/10 attempts.** Gameplay, scoring and targeted browser regressions pass. The requested full realistic PS3-era character/world bar is not met: booth characters remain small photo-headed illustrated rigs, the camera/world is a photographic backdrop, and large fulfillment resources retain stylized geometry. Audio is wired but an end-to-end subjective listening acceptance has not been performed by this specialist. Do not lower the visual bar or claim photorealism/hardware equivalence. No further Tycoon implementation attempts are authorized under this ten-attempt cap without new scope.
