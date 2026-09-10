# Supply loading review — 2026-09-09

Completed one agreed implementation round using three parallel specialists for model, scene and browser verification, with root integration and review.

## Delivered

Mara, Ellis and Rowan announce materials, walk to the selected supplier, retrieve a matching package, return to their own belt and place it. Front/profile/back head poses and hinged mouths replace the previous portrait overlays. Trucks are Pill & Parcel, Roof & Beam, Care Package Medical and Financial Misappropriations. The last carries gold-coated variants of every material.

Gold removal awards 5 points once; unstripped delivery costs 8 budget. Labels distinguish those values. Existing sorting, campaign, recovery, upgrades and practice controls remain. HTML announcements accompany the visual bubbles. The larger square playfield shares coordinates with pointer hit-testing.

## Review findings and corrections

- A speech bubble crossed a face: moved away from the operator.
- Workers snapped from placement back to staging: arrival, placement and idle now share the belt station; packages lower continuously into position.
- Old preview timing captured no loaded cargo: Supply now captures at 6.5 simulated seconds, showing actual belt packages and a pickup in progress.
- Fullscreen already correctly fits the new square canvas. The test assumed at least 20 pixels of growth, although only 10 were available. It now checks measurable growth, aspect-ratio preservation, screen containment and restoration for every game.

## Evidence and verification

- Production build and TypeScript: pass.
- Unit suite: 158 tests pass in 17 files.
- Targeted Playwright: 15 pass, 1 skip across desktop/mobile. Covers loading phases, pause, actual scaled pointer gold removal, surcharge, labels, portrait-request absence, controls, audio lifecycle and all-game desktop fullscreen.
- Prettier on changed TypeScript: pass.
- [Actual gameplay preview](../../../public/assets/previews/supply-the-people.png).
- [Loading scene evidence](evidence/supply-loading-scene.png).

Visual review accepts this as a stylized cutout warehouse scene for the agreed round, not the earlier PS3-realism target. Cargo announcements are text with mouth motion, not recorded speech. Other games' proposed changes are not part of this delivery.
