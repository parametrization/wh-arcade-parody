# N64-inspired visual pass

Requested September 8, 2026 for all five working games.

## Direction and scope

Use fixed-camera 2.5D, faceted polygon silhouettes, directional face shading, low-resolution material detail, atmospheric scenery and dimensional props. This is a Canvas art upgrade inspired by the console generation, not a conversion to a true 3D engine or an emulation of N64 hardware. Existing logical coordinates, hit areas, simulation rules and input mapping remain authoritative. Smooth display scaling replaces nearest-neighbor enlargement.

- Flappy Files: dimensional scenery, shaded bird and pickups, layered architecture and faceted obstacle presentation.
- Against the Wall: articulated faceted adults, shaded masonry, triangular terrain variation and layered mountain silhouettes.
- Rio Rescue: articulated polygon figures, raised terrain, beveled walls, water facets and dimensional supplies/entrance.
- Supply the People: perspective warehouse, shaded machinery/resources and dimensional catching equipment.
- Trickle Down Tycoon: dimensional tower, atmospheric skyline and faceted resources/figures.

## Wall visibility correction

Previously every character painted over every wall, giving the appearance of standing on an inaccessible roof. Paint walls in tile order, then mask foreground wall silhouettes out of each sprite using its actual ground position relative to the tile footprint. This handles front and side edges without relying on center-depth sorting. Existing circle-versus-wall movement remains authoritative. Browser regression checks compare wall pixels with and without a character behind, in front, and beside a two-tile wall.

## Verification

Run production build, simulation tests and desktop/mobile browser tests. Capture the five running game canvases under `previews/` and inspect them for clipping, label legibility and gameplay obstruction. Procedural artwork introduces no external asset licenses or downloads.

## Captured previews

- [Flappy Files](previews/flappy-files-n64.png)
- [Against the Wall](previews/against-the-wall-n64.png)
- [Rio Rescue](previews/rio-rescue-n64.png)
- [Supply the People](previews/supply-the-people-n64.png)
- [Trickle Down Tycoon](previews/trickle-down-tycoon-n64.png)

Integrated validation: production build, 80 simulation/unit tests and 41 desktop/mobile browser tests passed; the existing mobile-only fullscreen exclusion was skipped. Captures were inspected at enlarged display sizes.
