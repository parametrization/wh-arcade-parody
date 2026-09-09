# Flappy Files fidelity review

## Acceptance criteria and preserved rules

Follow [root acceptance and regressions](../../PROGRESS.md). Keep seeded column geometry/collisions, the seven recognizable named characters, unique gestures, Vance's couch, hanging upper characters, plaques, flying eagle and files, burgers/H dismissal and HAMBERDERS sequence. Target materially more natural character anatomy and textured stone/cloth/feathers with consistent light, without reducing readable game silhouettes. Preserve pause, reduced motion, tuning, replay and scoring.

## Attempt 1 — implemented and reviewed

Implemented stable procedural material grain with no frame-to-frame random shimmer, continuous directional lighting across column stone, shaded textured cloth/leather facets, feather surface shading and atmospheric edge depth. Existing individually cropped cast faces, articulated gestures, couch and rig geometry remain. Added Q/E alongside H for the burger action. HUD now explains points and shows the current mode/assist personal best; score events give immediate +1 feedback. Every cleared column is one point; ten columns deliver a packet. Existing end-of-run storage logic remains.

Evidence:

- TypeScript passes; 13 Flappy model tests pass, including obstruction timing and hamburger reactions.
- Actual mounted game with a deterministic burger/obstruction fixture: real Q key dismissed the obstruction, consumed one burger, and retained pause/resume/Space input; no browser errors.
- Controlled representative stage render reviewed at desktop dimensions: `evidence/flappy-realism-attempt1-desktop.png`. The first mobile capture was invalidated by resize repaint restoring the title overlay; a fresh fixed-mobile-viewport capture is required in attempt 2. This isolated render demonstrates the cast/materials, not live DOM plaque placement; existing plaque layout remains unchanged.

Review outcome: **not accepted yet**. Materials have more depth and texture, but the source Mall painting, angular eagle silhouette and pixel-art head atlas still make the result visibly stylized. This does not meet the requested realistic PS3-era character/world bar. Faces remain recognizable and gameplay-critical silhouettes clear. Higher-detail naturally rendered faces/background and a smoother anatomical eagle are the next substantive graphical work; adding grain alone cannot satisfy that requirement.

Shared integration still pending: event-specific audio/ambience service, host How to Play and press-any-game-key start. Existing tone fallback and mute behavior remain. Final fullscreen/mobile lifecycle and audio acceptance must be reviewed after that integration. No claim of hardware equivalence or photorealism is made.

Attempts completed: **1 / 10**. Await root review before another attempt.

## Attempt 2 — implemented and reviewed

Integrated the new realistic seven-person head atlas plus eighth popup face using individualized anatomical clipping paths that exclude its baked checkerboard. Preserved the existing animated rigs, enlarged heads, couch and inverted placements. Replaced the popup's block fingers/palm with rounded shaded anatomy and palm/knuckle creases; removed obsolete yellow hair blocks and mouth bars over the new photographic face. Tiled shared limestone at square proportions on shafts and applied wool/leather surface patches. Eagle silhouettes now use curved contour interpolation. Hooked named flap/pickup/burger/delivery/crash effects into the optional shared audio API, retaining tone fallback until shared integration is ready.

Reviewed `evidence/flappy-realism-attempt2-desktop.png`, `evidence/flappy-realism-attempt2-mobile.png` (fresh fixed-viewport stage capture), and `evidence/flappy-realism-attempt2-popup.png`. The new faces are recognizable at desktop play size and no checkerboard rectangles are visible. Popup hands are materially less blocky. The evidence captures controlled action renders, while the mounted keyboard fixture separately verifies input and dismissal. TypeScript and all 13 Flappy model tests pass.

Outcome: **not accepted yet**. Portrait fidelity improved substantially; overall world/character consistency still fails the realistic art-direction criterion. The Mall remains an explicit pixel-art painting, the eagle retains a simplified layered silhouette, and suit/couch geometry remains stylized. Mobile faces remain small. Remaining work is a coherent high-detail environment and eagle/body treatment, plus final shared audio/lifecycle review. This is a substantive second attempt, not a claim of PS3 hardware equivalence.

Attempts completed: **2 / 10**. Await root review and next focused assignment.

## Attempt 3 — realistic environment and eagle

Replaced the pixel Mall with the new overcast realistic environment and added the eight-pose feathered eagle. Runtime navy-color masking preserves warm dark feathers, removes the rectangular background and anchors every pose at a consistent head position; the packet label remains legible. Reduced motion fixes one pose and game time governs animation. Existing procedural eagle remains a loading/error fallback. Physics and scoring are unchanged.

Reviewed `evidence/flappy-realism-attempt3-desktop.png` and `...attempt3-mobile.png`. The environment and bird now have substantially more natural detail. **Not accepted:** the stone/cloth rigs remain too geometric, the ground texture is visibly stretched, and lighting direction needs harmonizing with the new right-side sunlight. These are concrete next fixes. Existing model/lifecycle rules and audio hooks remain unchanged; final integrated audio/host review remains pending. Attempts: **3/10**.

## Attempt 4 — material proportions and articulated coats

Fixed the stretched road material by using square patches, reversed broad lighting to agree with the right-side sun and replaced rectangular standing coats with shaped shoulders/waists and cloth fold strokes. Reviewed `...attempt4-desktop.png` and mobile; all 13 model tests pass. Physics, score, controls and audio hooks unchanged. **Not accepted:** the couch and reclining torso still read as hard boxes and the capitals are overly clean/flat against the gritty background. Next pass targets those visible volumes rather than repeating texture overlays. Attempts: **4/10**.

## Attempt 5 — upholstered couch and reclining torso

Rebuilt Vance's couch as rolled leather arms, rounded back/cushions, inset tufting and shaped feet; replaced the reclining torso block with a curved cloth silhouette. Chain suspension, reclining pose and gestures remain. Reviewed desktop/mobile attempt5 captures; TypeScript passes. **Not accepted:** standing limbs and small hands still use hard geometric clusters, and pristine capitals need material/contact detailing. Gameplay/scoring/audio APIs unchanged; no lifecycle regressions introduced. Attempts: **5/10**.

## Attempt 6 — articulated limbs and hand anatomy

Replaced standing trouser blocks with tapered curved legs, stitched knee creases and rounded shoes. Arm segments now use cylindrical light gradients around the existing elbow trajectories; small hands have rounded fingers, thumbs and palm creases. Reviewed `...attempt6-desktop.png` and mobile. These changes preserve gestures, body attachment and collision coordinates. **Not accepted:** bright smooth capitals and the retro hamburger still clash with the realistic scene. Anatomy is more credible within the intentionally oversized-head style. TypeScript passes; controls/scoring/audio semantics remain unchanged. Attempts: **6/10**.

## Attempt 7 — weathered supports and contact

Added concrete surface detail and hairline cracks to the capitals, softened foot/couch contact shadows and projected columns away from the light onto the road. Reviewed `...attempt7-desktop.png` and mobile; figures remain attached to their existing mounts. **Not accepted:** the remaining pixel hamburger is a conspicuous style break; bird pose/packet stability and integrated keyboard/audio must also be reviewed. No model or scoring changes. Attempts: **7/10**.

## Attempt 8 — coherent food prop

Replaced the imported retro burger sprite with a game-local shaded bun, sesame seeds, lettuce folds, cheese and patty while keeping pickup/dismissal rules. Reviewed `...attempt8-desktop.png` and mobile; 13 model tests and TypeScript pass. An actual mounted-game review then exposed right-edge mobile plaque clipping (`evidence/flappy-integrated-390.png`). **Not accepted:** readable names are a hard criterion; the next attempt fixes this concrete UI defect and checks full action/lifecycle behavior. Audio hooks remain distinct; final audible/host acceptance is still outstanding. Attempts: **8/10**.

## Attempt 9 — mobile plaque containment

Actual host rendering exposed clipped right-edge names. Plaques now skip fully offscreen columns and keep their complete measured boxes inside the stage while columns enter or leave. Reviewed actual mounted desktop/mobile captures `evidence/flappy-integrated-1200.png` and `...390.png`: Donald Trump, JD Vance, John Thune and Doug Burgum remain readable without clipping. Real Q dismissal consumed a burger, pause/resume/Space still worked and browser errors were empty. TypeScript passes. **Not accepted:** the large popup torso still shows conspicuous hard blocks, and integrated audio lifecycle review needs completion. Final allowed attempt targets that dominant visual defect plus final regression evidence. Attempts: **9/10**.

## Attempt 10 — popup outfit and final review

Replaced the dominant rectangular popup coat/belly with a shaped shoulder/waist silhouette, wool surface and belly lighting/folds. Preserved the excessive tie, hands, burger dismissal and HAMBERDERS sequence. Reviewed `evidence/flappy-realism-attempt10-popup.png` alongside actual mounted desktop/mobile plaque captures. All 13 Flappy model tests and TypeScript pass. Actual audio inspection confirms named flap voices while playing, zero voices/music on pause, music after resume once decoded, and no voices/music after exit. Initial asynchronous track loading is allowed; no forced unmute was added (the review explicitly toggled sound).

Final category assessment:

- Characters/world: substantially improved, **not fully accepted** against the requested realistic bar. Real heads/eagle/environment now contrast less with rounded textured rigs, but small bodies, lapels, hands and couch still read as illustrative geometry. The intentionally oversized heads are preserved; their stylized body rendering remains a real limitation.
- Controls/scoring: Q/E/H dismissal, Space, pause/resume, visible points/best and objective explanation verified; no model scoring changes. Existing seeded collision/timing tests pass.
- Audio: event routing and music pause/resume/exit lifecycle verified in the real mounted browser. Subjective sound quality was not independently listened to in this pass.
- Quality: desktop/mobile stage and readable names reviewed; reduced-motion poses still use fixed model time/pose selection. Final cross-game/fullscreen host regression belongs to root integration.

**Attempt budget exhausted: 10 / 10. Overall realism acceptance was not achieved; do not report a pass or PS3 equivalence.** The implemented improvements are retained and runnable. No further Flappy visual attempts are authorized under this cap.
