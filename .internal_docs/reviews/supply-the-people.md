# Supply the People — fidelity and gameplay review

## Mechanics baseline

Three conveyor lanes carry symbol-coded crates. Players remove gold sleeves and cycle lane destinations to school, clinic or pantry. Stripping awards 5 points. A correct dispatch awards 10; each new balanced set across all destinations awards 20 and restores 5 budget. Unremoved sleeves cost 8 budget; wrong destinations cost 4 and send food to the bounded recovery bin. Bells slow belts and clear interference. Three shifts include upgrades; winning unlocks endless mode. Practice advances by explicit steps and preserves a minimum budget. Existing crate/sleeve/gate hit testing is authoritative and unchanged.

## Attempt 1 — implemented and visually reviewed

Plan: replace hard-edged low-poly faces with shaped organic faces and cloth; integrate grounded warehouse materials; retain exact crate and control geometry; make objective/scoring and nearby keyboard actions clearer.

Implementation: smoothly shaded cheek/jaw/ear/nose forms, eyelids, brows, hair strands, beard strokes, glasses, rounded shoulders and textured suit cloth. Facial blinking follows game time and stops with reduced motion. Concrete/plaster warehouse surfaces, wood crate faces and restrained steel conveyor textures use the shared generated material atlas. W/S selects lanes, E strips, Q rings the bell; old arrows/Space/B and number keys remain. HUD-adjacent text explains score arithmetic and shows per-mode personal best. Cached text updates preserve stable DOM controls and existing hit targets. No model/arithmetic changes.

Evidence: all 9 Supply model/hit-test tests and TypeScript passed following the implementation. Actual desktop gameplay preview inspected at evidence/supply-fidelity-attempt1.png. Desktop/mobile lifecycle and practice browser checks run separately; final results below.

Critical graphical review: faces are visibly rounder, differentiated and less faceted, while names and crate symbols remain legible. They still look stylized and appear as the existing header portraits; this does not meet the full anatomical body/natural-performance acceptance criterion. Conveyor machinery retains a simplified silhouette. Some background concrete is obscured by existing scenery layers, so the gritty material change is weaker than intended. This attempt is an improvement, not PS3-era realism acceptance.

Gameplay/scoring: clear objective/failure text, preserved accessible crate buttons and assists, exact points explanation and per-mode best. No civilian injury scoring. Root owns shared how-to/start flow, soundtrack and new effects; audio acceptance remains pending. Fullscreen/seed/tuning shared regression review remains with root.

Next concrete fixes: replace remaining simple destination buildings with more grounded loading-office detail, expose larger correctly scaled warehouse wall materials and lighting, and introduce naturally proportioned visible staff without covering active belt/hit areas. Character composition requires further art direction rather than claiming that smooth portraits alone satisfy realism.

Attempt 1 browser results: all four desktop/mobile Supply lifecycle, tuning, practice and remapped-pause tests passed in 6.1 seconds. Final TypeScript passed.

## Attempt 2 — loading-office and full-body detail

Concrete defect from attempt 1: destination panels were toy-like houses, with no visible receiving staff. Replaced them with recessed loading offices, shaded interiors, shelf stock, plaster and metal surfaces, loading aprons and small anatomically proportioned receiving workers. Workers have separate boots, trouser legs, rounded torso/head, articulated elbows and a carried package; quiet idle movement stops with reduced motion. All additions stay inside the original destination-panel area and do not change pointer hit geometry or obstruct crates.

Reviewed actual gameplay screenshot evidence/supply-fidelity-attempt2.png. Staff and recessed bays add scale and purpose; all three destination labels and symbols remain clear. All 9 unit/hit tests and TypeScript pass. This second attempt still does not satisfy realistic PS3-era character fidelity: main cast remains stylized header portraits and staff faces are too small for detailed recognition. World machinery is still an arcade abstraction. Retain as a genuine incremental improvement, not graphical acceptance. Root review should decide whether the next attempt requires a more fundamental composition/art-asset change.

## Attempts 3–10 — reviewed bounded iterations

Every image below is an actual Canvas rendering of the real Supply model after deterministic simulation. Attempts 4 onward use an isolated model/render fixture because shared-host HMR interrupted live captures. These are graphical evidence, not substitutes for the separate live browser checks. All eight fixtures reported zero browser exceptions.

| Attempt | Implemented change and graphical review | Gameplay / scoring / audio / quality review |
| --- | --- | --- |
| 3 | Integrated the provided photographic Trump/Vance/Johnson heads with runtime silhouette clipping and existing dressed bodies. Faces are recognizable; visible edge halos and static portrait composition remain. Preview `evidence/supply-fidelity-attempt3.png`. | Model and hit regions unchanged; aliases and exact points guide retained. Existing shared audio unchanged at this stage. Root host integration pending during HMR. Not accepted. |
| 4 | Replaced angular conveyor ends with smoothly lit cylindrical steel bearings and added housing scratches/rust. Machinery gains material detail but still reads as simplified arcade equipment. Preview `...attempt4.png`. | No collision/control/scoring changes; pickups remain unobscured. No new sound behavior. Static material details respect reduced motion. Not accepted. |
| 5 | Added directional dusty daylight pools and layered soft contact shadows beneath conveyor chassis. Contact is more grounded, but large belts obscure most lighting. Preview `...attempt5.png`. | Pure rendering change; objectives, scoring and audio untouched. No flashing or time-based lighting introduced. Not accepted. |
| 6 | Added a timed immediate point-gain banner and event-specific pickup, delivery, score and failed-dispatch effects through the shared optional audio API. Preview `...attempt6.png` confirms no idle banner clutter. | Existing score arithmetic unchanged; gains are observed rather than awarded by UI. Timer advances only during active play. Audio inherits shared mute/unlock/volume and lifecycle. Final live sound/device evaluation remains a limitation. Characters/world still fail. |
| 7 | Added receiving-worker cloth texture/seams, hands, hair/age/glasses variants and upgrade/build effects. Staff have full articulated silhouettes, but facial details remain too small at play scale. Preview `...attempt7.png`. | Worker decorations stay inside existing gate panels. No extra hit targets or rule changes. Reduced motion still freezes idle gait. Scoring unchanged; build effect triggers on upgrade action. Not accepted. |
| 8 | Replaced stretched wall material with square repeated material patches and exposed restrained warehouse-floor asphalt detail. Texture scale is more credible; the simplified room remains conspicuous. Preview `...attempt8.png`. | Pure rendering change, no gameplay/score/audio changes. Textures do not cover crate symbols. Performance requires final host checks below. Not accepted. |
| 9 | Replaced bulky beveled UI frames with restrained rounded dark surfaces and clearer sans-serif labeling. Names, counts and destination labels remain readable with less visual clutter. Preview `...attempt9.png`. | Original coordinates and hit bounds preserved. No new interactions, score or audio changes. Desktop visual inspection passes readability; mobile lifecycle checks below. Main realism bar still fails. |
| 10 | Tightened photographic-head silhouette masks and crop bounds to remove bright edge halos while preserving recognizable facial features. Preview `evidence/supply-fidelity-attempt10.png`. | No model, controls, scoring or audio changes. Final TypeScript and all 9 model/hit-test tests passed. Main cast remains portrait-based; worker faces and environments remain stylized. Not accepted. |

## Final disposition: exhausted at 10/10

Stop further Supply fidelity attempts under this budget. The game is more detailed and remains playable, but it does **not** meet the requested realistic PS3-era visual bar. Remaining material defects: static main-cast portrait composition, tiny staff faces, simplified machinery/environment geometry and limited physically consistent environmental lighting. No claim of PS3 hardware equivalence or photorealism is made.

Characters and world therefore fail acceptance. Gameplay and scoring retain their validated rules and are more clearly explained. Event-specific audio is connected to the shared service, but a final audible soundtrack/mix assessment and shared how-to/any-key behavior remain root integration responsibilities. Fullscreen/reduced-motion/seed/tuning global checks also remain with root; local browser results are recorded separately below. Repeated test runs were not counted as attempts; each numbered attempt above contains a concrete implementation and an inspected preview.

Final live browser results: all four desktop/mobile Supply playable-route/lifecycle/tuning and practice/remapped-pause checks passed in 8.9 seconds after attempt 10. Artifacts: `/tmp/supply-fidelity-final-results`. TypeScript and all 9 Supply unit/hit-test checks passed after the final implementation. No files outside the Supply folder and this review were edited for these iterations.
