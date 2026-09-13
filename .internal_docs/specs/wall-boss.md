# Against the Wall: GB Smallman encounter

Implemented in the continuation round. Original fictional boss, restricted to the north (Asylum Office) side. Preserve existing combat, patrol, barrier, tunnel, checkpoint, seed and scoring rules.

## Presentation

Half adult height, formal black military/space uniform, brown diagonal leather strap, closely shaved sides with hair on top. Name GB Smallman. A distinct north-side cantina is marked Ice & BP. Exaggerated red face, tears, radio and phone poses distinguish escalation; a triangular wet patch at the front beltline and footstep puddles show his trail. Each puddle lasts 30 simulation seconds. No real-person voice imitation is required; original synthetic sniffle/radio/phone effects follow mute and pause.

ICE actors wear masks and have exaggerated broad silhouettes; BP actors also wear varied masks. Reinforcements have distinguishing tactical gear and are individually identifiable. Keep readable life and attention meters.

## State machine

1. Idle at cantina. Breaching, a noise beacon, alert shouting and gunfire can create a sound target; no omniscient tracking of a silent player.
2. Investigate the last sound position at twice ordinary guard movement speed, using collision-safe paths constrained to the north side. He does not shoot or inflict contact damage. A noise from the south is investigated at a reachable point on the north border.
3. Survey around the point, within 15 tiles, for up to 10 seconds. If nothing is detected, return to cantina. A visible player or active disturbance begins escalation.
4. Move to the cantina to radio for five seconds, visibly alarmed. A fresh sound or player stepping on a fresh trail mark interrupts the uncommitted escalation and prompts a new investigation.
5. Phone for ten seconds. Completion spawns exactly four reinforcements from separate legal north-side cells by the cantina: two BP and two ICE. Each shoots at twice the existing rate (not twice damage). The completed-call return to cantina is uninterruptible; no duplicate spawn per call.
6. A player stepping onto a live trail mark immediately redirects an interruptible boss toward that position. Trail marks expire while playing, freeze when paused, and clear on checkpoint/district reset. One overlap should not retrigger every frame.

Use simulation timers and seeded/ordered route selection. New guards use ordinary faction visibility/combat and non-clustered patrol routes. Avoid unbounded reinforcements, sound queues or trail allocations across long runs; document the encounter rearm rule in the UI.

## Verification

Test pause, timing boundaries, silent investigation timeout, noise retargeting, side confinement, safe spawns, single reinforcement dispatch, exactly two of each faction, doubled firing rate and trail expiry/trigger behavior. Review daytime and nighttime screenshots with boss, cantina, masked guards and alarm poses. Preserve existing complete unit and browser checks.

## Implementation decisions

- One successful four-person dispatch per district; checkpoint/district reload resets the encounter. This bounds actors and avoids runaway reinforcements. A silent return remains interruptible, while a completed-call return is committed.
- Cantina facade and canopy attach to an existing north-side building, selected by a clear, reachable southern forecourt; no new hidden collision footprint.
- Survey uses a compact walking loop inside the 15-tile maximum and lasts ten seconds. Investigation uses 4.4 tiles/sec against ordinary patrol 2.2.
- Trails expire after thirty simulation seconds, cap at 100, and overlapping marks are consumed together to prevent frame-by-frame retriggers.
- Radio, phone and sniffle effects are original synthesis, not sampled speech.
- Tactical responders have named numbered groups, distinct spawn positions and ordinary faction AI; their weapon cadence is 0.4 seconds versus 0.8.
