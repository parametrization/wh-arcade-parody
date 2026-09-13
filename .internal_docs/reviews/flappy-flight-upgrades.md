# Flappy Files flight-upgrade round — 2026-09-09

## Iteration 1

Implemented one visible held envelope per lower column, collectible upgrade credits, frozen choice menus, two permanent multiplicative improvements, and threshold-unlocked Fly/Helicopter bursts. Retained all existing rules and cast. Baseline thirteen model tests passed including deterministic complete story playthrough.

Review found the first procedural burst eagle was too flat beside the existing textured flight sprite. Reused the existing texture atlas with a compressed flight pose and layered the helmet/rotor/sunglasses over it. Added dedicated pointer steering to preserve usability without a physical keyboard. The existing character face functions already render atlas and procedural fallback as mutually exclusive branches; review did not find a duplicated underlying face in this game's captured scenes, so no speculative atlas crop edits were made.

## Iteration 2

Added tunable burst duration, rise and descent rates. Real-browser fixtures drive the production game through six actual envelope pickups using the real input service and a deterministic clock. They select both burst types, check directional/held control and verify pause freezes duration on desktop and mobile. Screenshots show the normal political-character faces, attached plaques, remaining held envelope, upgraded eagle and HUD together.

Validation: 18 Flappy model tests pass; 4 production-game browser checks pass (two modes × desktop/mobile); TypeScript passes. Evidence: `evidence/flappy-fly-upgrade.png` and `evidence/flappy-helicopter-upgrade.png`.

Limit: the mode poses are stylized overlays on the existing textured eagle, not newly generated photorealistic animation frames. Endless players can intentionally reduce normal-flight response very far; repeated multiplicative choices have no hidden floor. Burst alternatives remain available after either factor reaches the confirmed 80%-remaining threshold.

## Independent integration review

Releasing one finger previously cleared every held pointer control. Holds now belong to individual pointer IDs: lift survives another finger's Burger tap, and diagonal Fly steering retains the unreleased direction. Pause, blur and reset clear all holds. The four desktop/mobile flight tests now cover these simultaneous-pointer cases and a configured three-second duration reflected in help.
