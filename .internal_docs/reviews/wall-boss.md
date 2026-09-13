# Against the Wall — GB Smallman continuation review

Implemented a separate, noncombat fictional boss rather than inserting him into ordinary guard combat. All routes are constrained north of the border and use existing collision/path functions. Breaching, noise beacons, alert acquisition and firing can draw him to a reachable location. Visible players or active nearby disturbances trigger a return to the cantina, five seconds of radio and ten seconds of phone. A new noise interrupts uncommitted escalation. Silent surveys walk a small loop and expire after ten seconds.

A completed call dispatches exactly two BP and two ICE tactical responders from four distinct, clear positions. Their normal combat logic fires every 0.4 seconds instead of 0.8. Dispatch is capped at one per district; this balancing choice is explained in gameplay help. Blocked exits defer the whole group rather than partially spawning or clipping people into walls.

Wet marks last thirty simulation seconds, freeze with pause and reset at checkpoints. Overlapping marks trigger once together, and allocations cap at 100. Original radio, phone and synthetic sniffling effects are called through the existing pause/mute-aware audio service.

## Graphics review

- Added a half-height black-uniformed original character, cropped sides/top hair, brown diagonal strap, alarm redness, procedural tears, radio/phone poses and wet patch/trail.
- Existing ICE geometry now has a broad silhouette; ICE and BP have distinct face masks. Responders have numbered labels, tactical vests/pouches and larger weapon geometry. No raster headshot overlays are involved.
- Initial review found that a freestanding canopy and a nearby foreground building made the boss hard to read. The cantina now uses an existing building facade with a clear southern forecourt and visible door/canopy. Existing building collision remains authoritative.
- Reviewed production-renderer fixture screenshots [day radio](evidence/wall-boss-day.png) and [night phone](evidence/wall-boss-night.png). Masks, half-height silhouette, forecourt, health/attention bars and nighttime flashlights are visible. These are controlled scene fixtures, not a claim that a complete campaign was manually played.
- Limit: the half-height figure is deliberately small at the normal camera distance. Fine tears, clothing patch and fingers are subtle; geometry remains stylized rather than photorealistic. Survey uses a smaller walking loop within the requested 15-tile radius, preserving performance.

## Checks

68 Wall unit tests passed, including six new tests for timing, safe north-side investigation, collisions, dispatch composition/cadence, interruption, bounded rearm, pause, trail expiry and resets. Production build passed. The new browser production-renderer/dispatch scenario passed on desktop Chrome and mobile Chrome. Root integration runs the broader shared regression suite after all game edits stabilize.
