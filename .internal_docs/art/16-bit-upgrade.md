# 16-bit art upgrade

User direction, 2026-09-08: move from coarse Atari-like placeholders to detailed Super Nintendo-era game art. Individual politicians must have recognizable editorial caricatures; Flappy nameplates must be readable during play.

## Production rules

- Preserve simulation dimensions, hitboxes, timing and difficulty. Add visual detail through clustered highlights, shadows, outlines, recognizable silhouettes and scenery depth.
- Keep important information as sharp DOM text, not text baked into generated images. Flappy plaques use high contrast cream/navy, full names and larger responsive typography.
- First raster deliverables: transparent seven-person portrait/eagle atlas and opaque National Mall backdrop. Original generated artwork, no invented factual allegations. Atlas rows are explicit and checked before use.
- Load local assets once per module lifetime, preserve transparent alpha, and retain procedural fallback if a file fails to decode. Ship all required files in public/assets/generated.
- Other games receive original renderer improvements with the same palette discipline, distinct gameplay icons and foreground/background separation.
- Review at actual desktop and phone display sizes, including visible character names, obstruction behavior and pointer-coordinate mapping. Record tool prompts and provenance alongside assets.

## Landing-page direction

The People's House Arcade now follows the reference page's centered masthead, neon title, source screenshot cards and perspective-grid backdrop. Thumbnails are original-game references; the games they link to are the independent remakes. Actual WhiteHouse.gov assets and credits are local under public/assets/reference.

## Implemented checkpoint

- Landing page renamed THE PEOPLE'S HOUSE ARCADE; original source thumbnails/building icon stored locally with URLs, hashes and attribution. Source-style header, neon card borders and perspective-grid background.
- Flappy loads original generated seven-person portrait atlas and National Mall backdrop, uses 15px desktop/11px mobile high-contrast DOM names, renders detailed feathered eagle, fluted columns and textured ground. Atlas backgrounds are opaque navy portrait tiles; source imagery is preserved unchanged.
- Wall/Rio: layered adult sprites, skin/hair/clothing shading, detailed pickup items, sand/river/masonry textures and improved scenery.
- Supply/Tycoon: expressive procedural portraits, dimensional crates/books/medical kits/keys, machinery, city/tower depth, cloth net and beveled information panels.
- Existing rule mechanics and hitboxes retained. Build and38 desktop/mobile browser checks passed; desktop screenshots of all5 and Flappy mobile reviewed. A mobile plaque-overlap issue found in visual review was corrected before publication.

Remaining refinement: additional animation frames and more detailed body/hand sprites can extend this pass; generated portraits are framed bust tiles rather than full character animation sheets. Concept sheets from the earlier checkpoint remain as design references, not the current production art.

## Animated column characters follow-up

Replace framed portrait tiles with full-bodied bobblehead caricatures. Retain original atlas as head textures; render limbs, suits, props and suspension rigs as native Canvas artwork. Each cast member has a distinct timed swipe: Trump's two-handed slap, Vance's lazy couch reach, Johnson's paperwork paddle, Thune's long-arm windmill, Bessent's ledger fan, Blanche's pointing grab and Burgum's overhead arm sweep. JD Vance always reclines on a tufted leather couch; upper couches hang from chains. Other upper characters hang upside down from visible supports. Nameplates are bolted to the stone shafts, independent of the moving people.

Fullscreen must scale the playfield against the actual available viewport, remove normal canvas/container caps, preserve aspect ratio and restore normal sizing/focus on exit. Verify actual before/after canvas bounds, not merely presence of the fullscreen element.

## Tool interception and DOJ vehicle sequence

User follow-up: column bobbleheads use flyswatters, nets, a rifle and a bow/arrow to intercept the envelope at close range. Tool-specific windup/strike visuals precede the detached envelope. An original black Escalade-style SUV marked DOJ in white drives along the lower strip, adjusts speed toward the envelope's landing point, collects it, shows REDACTED!, and leaves the screen.

This is a nonfatal fictional obstruction event. During the sequence the eagle has no visible envelope; another packet appears when the SUV exits. Keep existing flight/collision rules and scoring, record a separate redaction count, gate new interceptions behind a cooldown, and freeze all sequence clocks while paused. A simultaneous Trump screen-obstruction should not conceal the interception sequence. REDACTED! is a small localized blinking label at no more than one cycle per second, static under reduced motion.

Implementation split: Flappy model/controller owns deterministic trigger/phase, envelope trajectory, vehicle interception position/speed and cleanup; character/scene renderers consume that state and own tool silhouettes, strike effects and vehicle art. Tests must cover safe-near-miss trigger, phase order, capture, cooldown and reset/pause behavior.
