# Tycoon: returned promises and issuer reactions

Implemented against the existing three-lane model, September 8, 2026.

## Controls and stored promises

Hollow promises show the book, care kit, home key or coin they promise, with a translucent dashed outline. Catching one stores its resource and original issuer lane in a FIFO queue. Q / Return promise sends the oldest one back. A second return waits until the current reaction finishes. U / Umbrella toggles protection. The default public-audit key moves from Q to F; existing action overrides are retained. Keyboard, touch buttons and untimed practice support these actions.

## Reaction timelines

A seeded random choice selects one of two reactions with equal probability:

- Flood: a return projectile rises to the issuing booth. Over two seconds, yellow Mountain Dew rises to the tie knot while the issuer cries. An overflow then runs down that lane for a randomly selected 5–15 seconds. An open umbrella protects the basket. Every unprotected second in the stream adds 0.01 to the movement-speed multiplier and reduces keyboard braking. Fractional exposure accumulates consistently across frame sizes. Wetness persists through the campaign and resets on restart.
- Capitulation: one second of anger, including red face, steam, squint and frown. The last 0.3 seconds zoom the resource into the large scene panel below the names. The full image holds for three seconds, then shrinks and travels automatically to the basket over 0.8 seconds. No catch input is required. Ordinary targets and the round timer freeze while the zoom/flying scene obscures play.

## Score interpretation

The first fulfilled return gives +10%; each further capitulation adds ten percentage points, capped at +200% (a 3× total multiplier). The bonus applies to every positive scoring event, including catches, investments and capitulation awards.

`points = floor(basePoints * (100 + bonusPercent) / 100)`

On capitulation arrival, increase the bonus, count all stored resource units, add one unit of the promised resource, then award base10 for each previously stored unit (minimum one). The award uses the newly increased multiplier. Stored promises themselves are not useful resource units. Existing scoring remains unchanged until the first capitulation.

## Layout and verification

Booths sit over lane centers140,320,500 on a pale, symmetric White House-style facade. Compact Education/Care/Homes occupy the bottom-left panel; game title, score, bonus, stored-promise count and wet/speed readouts occupy the bottom-right panel.

Tests cover attribution/FIFO returns, concurrent-return blocking, flood timing, frame-independent wetness, umbrella and off-lane protection, all reward phases, automatic arrival, integer bonus awards, the 200% cap, normal/practice round gating, pause, controls and restart. Gameplay preview is recaptured from the updated renderer.
