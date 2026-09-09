# Independent integration review

This review separates working regressions from visual acceptance. Passing tests does not satisfy the requested realistic PS3-era character/world bar.

## Archived visual evidence

- [Flappy popup, final attempt](evidence/flappy-realism-attempt10-popup.png)
- [Flappy actual mounted mobile game](evidence/flappy-integrated-390.png)
- [Supply final attempt](evidence/supply-fidelity-attempt10.png)
- [Tycoon final reaction sheet](evidence/tycoon-attempt10.png)

These are copies of the specialists' final local captures. Flappy's mobile image is an actual host/model/render fixture; popup and Tycoon reaction sheets are controlled representative action renders. They do not independently prove every gameplay path.

## Independent observations

**Flappy:** recognizable photographic faces, realistic feathered eagle and stormy Mall are substantial improvements. Mobile names are now fully contained and readable. The large palm remains a smooth vector shape beside photographic skin; lapels, small body rigs and couch still have illustrative geometry. The requested overall realism is not achieved. The ten-attempt budget is exhausted; preserve the improvements without calling the result photorealistic or hardware-equivalent.

**Supply:** conveyor surfaces, bearings and material detail improve depth and destination symbols remain clear. The main cast is still presented as static portrait cards; workers are tiny simplified figures. This fails the natural character and realistic-world criterion despite functional routing/scoring. The specialist records 10/10 exhausted.

**Tycoon:** the White House and pavement have realistic surface detail, and distinct yellow flood, anger, zoom and fulfillment phases remain visible. Small booth bodies and hands contrast sharply with their photographic heads; the prominent care case is still a flat geometric box. The specialist records 10/10 exhausted. The reaction sheet supports phase visibility, not a claim of full visual realism.

Root independently agreed with these findings. Root also reported Rio's remaining rectangular cliff silhouettes and repeated tile panels; that Rio observation is attributed to root, not an independent inspection in this review.

## Shared audio lifecycle tests

Added `src/shared/audio.test.ts` with eight passing cases using a mock AudioContext:

1. No allocation before unlock; effects and legacy tones are blocked while inactive or muted; pause immediately stops existing voices.
2. Pause/mute stop music and resume its accumulated offset without duplicate looping sources; destruction is idempotent.
3. Decode completion after destruction cannot revive audio; outstanding fetch is aborted.
4. A scene change during decoding discards the old track and retries the new scene.
5. Scene changes stop old music and start the new track at zero.
6. Scene changes stop old effect voices. This test found a real cleanup omission; root fixed `setScene` with `stopEffects()` and throttle reset.
7. A track decoded while paused stays silent until resumed.
8. A track decoded while muted stays silent until unmuted.

TypeScript passes. The oscillator-stop test checks the final immediate stop call rather than incorrectly requiring exactly one call: tones already schedule their own future stop.

An actual Flappy Chrome run additionally observed an active effect voice, zero music/voices on pause, music on resume after decode, and no music/voices after route exit. This validates lifecycle routing. No independent subjective listening session established the realism or musical quality of the sounds.

## Scope of conclusions

Flappy's 13 model tests pass. Supply/Tycoon reports respectively record nine model/hit-test tests and nineteen model/reaction tests, with their listed targeted browser checks. Those are specialist-reported results; this review did not rerun the entire suite or all fullscreen/browser projects. Root owns the final isolated-source browser run and consolidated totals.

The current files are useful, improved, runnable work. The realism objective remains unmet where stated; exhausted iteration budgets must not be relabeled as acceptance.

## Final event-feedback audit

A read-only follow-up found Supply's pointer handler played the construction effect after every button click because its upgrade branch lacked braces. Root restricted that cue to a valid upgrade while in the upgrade phase and added a browser regression that clicks ordinary gate/bell/lock controls and verifies they do not emit `build`. This preserves scoring and model rules. Tycoon's initial HTML template also retained obsolete Q-audit wording, but the mounted game already replaced it with the correct F/Q/E/U guide; only the stale template was cleaned up.

## Consolidated final verification

Root completed the stable full run after the integration repairs: **151 unit tests pass; 85 browser cases pass and one unsupported mobile fullscreen case is skipped; TypeScript and production build pass**. Desktop fullscreen, both-viewports tunnel emergence/drowning recovery, held sprint, all game routes, guides/any-key start, seed replay and audio lifecycle are included. This supersedes earlier pending verification notes above. Graphical realism remains exhausted at ten attempts for every game.
