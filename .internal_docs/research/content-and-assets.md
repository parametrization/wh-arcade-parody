# Content and asset research contract

Inspected September 7, 2026. This document records the project's editorial approach and evidence requirements, not legal advice.

## Source inventory

- Landing page: https://www.whitehouse.gov/arcade/
- Flappy Bill: https://www.whitehouse.gov/arcade/flappy-bill/
- Build the Wall: https://www.whitehouse.gov/arcade/build-the-wall/
- Rio Run: https://www.whitehouse.gov/arcade/rio-run/
- Supply Line: https://www.whitehouse.gov/arcade/supply-line/
- Trump Savings Tycoon: https://www.whitehouse.gov/arcade/trump-savings-tycoon/
- Copyright: https://www.whitehouse.gov/copyright/
- Current cabinet source: https://www.whitehouse.gov/administration/cabinet/

Landing-page screenshot and HTML are captured locally but ignored by Git. The compact arcade-inventory.json records reference URLs. Source code reading is analysis, not proof that all gameplay paths have been exercised. Each game plan identifies those limits.

## Real-name satire

The user prefers real GOP/MAGA public names, obvious caricatures and criticism. Keep that direction. Verify any current office title at asset/content production time, using official office rosters, and record checkedAt plus source URL. As an example, the cabinet page inspected today lists Todd Blanche as Attorney General and Jay Clayton as Director of National Intelligence; historical rosters should not be substituted for current ones.

The baseline Flappy premise is fictional obstruction of public access to records. A name plaque identifies a satirical character; it must not assert participation in Epstein's crimes. Do not introduce a 'collaborators' roster or criminal labels by association. If factual historical text is later added, distinguish convictions, charges, allegations and reported associations with precise sources. Invented fourth-wall dialogue is clearly fictional, never presented as a real quotation. Exaggerated body shape, yellow hair, long tie/jacket and padded suit silhouette are cartoon art direction, not assertions of medical facts or exact measurements.

Suggested roster data schema: id, displayName, publicRole (optional), roleSource, checkedAt, satiricalRole, portraitAssetId, fictionalDialogue, factualNotes[] (each note with its own source/status). Keep names and copy in data so corrections do not alter physics.

## Art direction and variants

Match the original's pixel scale, flat shaded sprites, navy/neon arcade framing and readable silhouettes, rather than mixing polished 3D illustration with low-resolution sprites. Each major asset gets two or three labeled concepts before final animation production. Compare options on a single contact sheet with neutral background, asset IDs, intended in-game scale, and palette swatches. Select a coherent family across all games; do not produce every animation for every alternative.

First contact sheet: eagle/document, red elephant senator, named human bust/plaque, Trump obstruction pose left/right, hamburger pickup/throw, crowd delivery target. Deliver transparent PNG sprite sheets and JSON frame metadata, plus editable source when possible. Export at logical pixel scale; verify alpha edges, nearest-neighbor scaling, silhouette/collision alignment and animation loops. Gameplay hitboxes are separate data.

Other game contact sheets are specified in their plans. Accessibility variants should alter contrast or motion without changing the comedic intent. Sound uses original or clearly licensed short effects, with source attribution and volume normalization.

## Provenance work package ART-01

For every proposed reused/generated/original asset, record assetId, file path, source URL or creation method, author if known, retrievedAt, source hash, rights basis, required attribution, modifications, dimensions, frame layout and approval state. White House policy says government-produced materials are not copyright protected; third-party material is under CC BY 3.0 unless otherwise noted. Review per-file notices and credits before shipping. Do not classify external fonts, brand marks or stock media as government-produced automatically.

Acceptance: runtime asset IDs all resolve; every shipped file has a manifest entry; sources and required attribution appear in local credits; no page trackers, signup code, or unknown remote runtime assets are bundled. Unclear assets get an original replacement, with the same visual role. Claims that parody/free speech provide automatic permission for every reuse do not appear in README.

## Production sequence

ART-01 inventory and provenance → ART-02 Flappy concept contact sheet → ART-03 chosen Flappy sprites/animations → ART-04 palette/style guide freeze → ART-05 other game sheets → ART-06 chosen assets and browser-scale review. No concept image has been generated in this planning milestone.
