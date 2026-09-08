# Flappy Files visuals

The game combines original Canvas pixel-art drawing in ../render.ts with two generated project assets:

- `/assets/generated/flappy-national-mall-v1.png`: detailed National Mall backdrop.
- `/assets/generated/flappy-portraits-v1.png`: navy-backed 4×2 portrait atlas. Row one: Donald Trump, JD Vance, Mike Johnson, John Thune. Row two: Scott Bessent, Todd Blanche, Doug Burgum, eagle. Crop edges derive from actual image dimensions with integer rounding; current atlas is 1774×887.

Column faces use individually framed atlas cells; the large Trump event clips his portrait to an oval. The flying eagle remains a bespoke procedural sprite with three wing poses and layered feathers; the atlas's eagle is not used as a free-standing sprite because its background is opaque. Columns, lawn/path, burgers, hands, costume and paper are original procedural art. If generated images fail to load, individual procedural faces and scenery remain playable.

Generated asset provenance and prompts are maintained in the root asset manifest/research documents. No White House photograph, font or sprite code is embedded by this module. These are original satirical depictions, not photographic evidence or factual allegations. Palette variants remain prototype presentation choices, not user-approved final art.
