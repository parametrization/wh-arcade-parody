# Flappy Files: held letters and flight upgrades

## Accepted behavior

Each lower-column character holds one visible envelope just inside the traversable gap. Touching it removes it from the hand exactly once and opens a keyboard/pointer upgrade choice. The character, column collision region, seeded layout, hamburgers, obstruction event, scoring, story chapters and endless progression remain intact.

Every choice consumes one collected letter:

- **1 — Slower bounce:** multiply the current vertical simulation speed by 0.95. Gravity and movement use the same scaled time, retaining the flap trajectory height.
- **2 — Smaller flap height:** multiply the peak-to-trough height factor by 0.95. Impulse uses the square root of that factor, because ballistic height is proportional to impulse squared.
- User confirmed **80% remaining**, not an 80% reduction. Five choices on either individual factor produce 77.38% remaining; four produce 81.45%. Either factor at or below 0.80 permanently unlocks the two additional choices during that run.
- **3 — Fly:** eight-second burst, twice the normal world scroll speed, precise WASD/arrow-key movement. Neutral input holds altitude. A streamlined textured eagle wears a fighter helmet. Pointer steering buttons and holding the canvas/Flap button also support flight.
- **4 — Helicopter:** eight-second burst. Holding Space/W/Up or the Flap button rises; release settles smoothly into gentle descent. Down accelerates descent. Sunglasses and a wing rotor blur distinguish it from Fly and normal flight.

Picking another burst refreshes its duration; permanent improvements remain. Burst state carries through chapters, with chapter screens freezing it. Expiry restores normal flight at the current location with neutral vertical velocity, avoiding a position teleport.

## Timing, input and tuning

Letter choices freeze model time, burst duration, obstruction timers and obstacles. Pause independently freezes the game; a paused menu must be resumed before an upgrade can be applied. Choices use semantic buttons, an accessible named group and status announcement. Keys 1–4 work without moving focus. Each pointer owns its held action; release/cancellation clears only that pointer, while blur, pause and reset clear all. Keyboard bindings use the existing rebinding system.

Three restart-applied settings join the existing tuning panel:

| Setting | Default | Range |
| --- | ---: | ---: |
| Burst duration | 8s | 2–20s |
| Helicopter rise speed | 95 units/s | 40–180 |
| Helicopter idle descent | 28 units/s | 5–80 |

HUD shows mode, time remaining and both improvement factors. Upgrade buttons reflect configured burst duration. In-game help reflects applied burst duration; the shared arcade guide describes the default eight seconds.

## Acceptance and verification

- Model collision precedes collection; colliding with a column does not award its letter.
- Rendered envelope position and model pickup position use the same function.
- An envelope cannot be awarded twice or leave the hand visibly after collection.
- Duplicate/rejected choices cannot consume credit or activate a locked mode.
- Normal story-controller regression still reaches all six deliveries.
- Five same-axis choices unlock modes; mixed axes are tracked independently.
- Fly doubles world speed and has immediate directional control; helicopter rises on hold and gently sinks on release.
- Both mode timers freeze under pause and collection choices.
- Seed replay remains deterministic; configuration validation applies to new tuning fields.

Extremely repeated reductions in endless mode can reduce vertical range or response enough that the player should prefer a flight burst. This round preserves the requested multiplicative choice and does not silently clamp the improvement or claim every arbitrarily reduced state can reach every future gap.
