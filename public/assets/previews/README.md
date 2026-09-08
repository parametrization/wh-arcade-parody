# Gameplay previews

These PNGs are browser captures of this repository's running games, not concept art or screenshots of the original White House games. Flappy includes its HTML name plaques. All other captures show the actual game canvas.

Run `./dev`, then `node scripts/capture-game-previews.mjs` from the repository root after changing gameplay visuals. The script uses the installed Chrome browser through Playwright, a fixed viewport and controlled clock, and rejects non-running games. `ARCADE_PREVIEW_ORIGIN` optionally selects another local server.

The homepage contains each full image without cropping so the card accurately represents the playable scene. Source references remain separately stored under `../reference/`.
