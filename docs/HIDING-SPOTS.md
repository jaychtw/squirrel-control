# Curated hiding spots, seeds and visibility proof

Room 1 selects exactly **ten distinct spots from a thirteen-spot pool**. There are 286 possible ten-spot subsets. The pool has separate authored positions in the approved desktop (**1120×650**) and portrait (**640×820**) compositions. There is no crop; portrait is selected at 620 CSS px and below. Target IDs and variants survive viewport changes and language switching.

## Format and reproduction

`HIDING_SPOTS` in `src/placements.ts` contains records like:

```ts
{id:'sofa-left', desktop:[410,233,.94], portrait:[209,285,.88], clue:'sofaLeft'}
```

Each pose is `[x, y, uniformScale]` in scene coordinates. IDs must be distinct. `clue` identifies localized text in both language dictionaries. `makeLayout(mobile, seed)` returns the ten selected placements; its `all` flag is reserved for offline authoring/QA and is not exposed as a player mode. Fur/expression variants share the same external silhouette.

A 32-bit FNV-derived seed feeds a deterministic Mulberry-style generator. Fisher–Yates selection chooses ten IDs without replacement. A second stream chooses variants in stable catalog order, so viewport changes never reroll guests. Fresh room codes use `crypto.getRandomValues`. Replays avoid immediately repeating the same ten-ID subset when choosing their new code. No online service is involved.

Append `?seed=review-room-01` to reproduce the review round. Valid codes have 1–48 ASCII letters, digits, hyphens or underscores. Other inputs are ignored. Comfort settings show/copy the current code; replay intentionally makes a fresh round even if the original URL included a code.

## Layer and occlusion contract

- **L0:** walls, garden, static non-occluding decor, floor and rug.
- **L1:** selected target sprites, removed from the drawing when caught.
- **L2:** actual foreground furniture/curtain surfaces and authored occluders. The approved wall pictures and left flowerpot are useful foreground hides; the letter rack and sewing box extend the same approved visual vocabulary.
- **Safe mess sublayer:** floor/wall disorder outside every squirrel silhouette, before the host.
- **L3:** stationary Miss Bunny during play; approved celebration and a gentle new disappointed reaction at the outcome.
- **UI:** outside the main interaction region, apart from a protected low-floor instruction pill, noninteractive feedback, and offset optical lens.

The room deteriorates at 15, 30 and 45 active seconds, then reveals its final mess on loss at 60 seconds. No hide geometry moves with captures or deterioration. The clock is the decorative picture allowed to tilt; the two target-bearing pictures remain fixed so their occlusion never changes.

## Authoritative pixel masks

`HitMap.create` clones the exact SVG, removes background/texture, gives each target a unique opaque ink, and paints furniture, host and safe mess black. Browser SVG rasterization preserves all real geometry and layer order. A pointer coordinate is mapped into the scene's pixel mask and catches only a surviving target ink pixel. Anti-aliased edges use a narrow color tolerance and alpha ≥200/255. There are no rectangular catch boxes or touch hitbox dilation through furniture.

Each complete squirrel is separately rasterized into a generously padded **local tile**. The validator counts its actual opaque silhouette pixels (ears/head/body/limbs/tail), and counts how many survive the foreground composite. The ratio is `visiblePixels / silhouettePixels`, not a rectangle fraction. Translucent antialiasing edges are excluded consistently. Tiles are only a memory/work optimization: their rectangles are neither hitboxes nor denominators, and edge/crop checks ensure no part of a body was lost outside the tile or room.

The validator also records actual silhouette-pixel overlap between guests. All thirteen can coexist without overlap. Validating the complete pool therefore proves that removing any three targets cannot reduce the reachability of the other ten. The 10,000-seed structural test exercises all 286 subsets and verifies membership, uniqueness and cross-layout stability.

The two current-layout hit maps are prepared before the clock starts and cached. Each sampled selected round must satisfy the count, ≥30% visibility, crop and overlap checks before play is enabled. Catching only marks an ID; the engine rejects caught IDs even though the cached map retains its former pixels. Because automated tests prove exact target-pixel equality at every mess stage, a stage change does not require another expensive mask build during timed play. A breakpoint change selects the already-prepared other-layout map, without losing active time or waiting on a raster operation.

## What the tests prove

`npm test` validates the complete thirteen-spot pool at both native viewBoxes and at the actual CSS scene resolutions for 320, 390, 768 and 1440 CSS px, across all five deterioration states. It requires:

1. Every actual body silhouette has at least 30% exposed ink.
2. No target is cropped and no two body silhouettes overlap.
3. The set of visible target pixels is exactly unchanged by deterioration, including the final sad-host state.
4. A native and CSS-coordinate visible hit succeeds; a covered furniture hit fails; repeated catches cannot count twice.
5. Every generated ten-target round uses valid distinct spots; the complete representative desktop/touch runs reach ten.

The CSS-resolution test uniformly transforms the same vector composition into each actual scene size before measuring. This includes SVG antialiasing at narrow phone size, rather than assuming native-resolution fractions alone are sufficient. The phone touch test also runs at device pixel ratio 2.

Raw counts, representative covered/visible points and invariance results live in `docs/evidence/catalog-*.json`. `#scene` has a nonvisual `data-visibility` diagnostic for the remaining guests and a `data-seed` code. These never highlight, reveal, or move squirrels for players.

When authoring another hide: retain practical recognizable exposed features, add its clue in both languages, check every layer and safe UI zone, run the full catalog proof, inspect it on the narrow phone, and complete a real browser catch. Never fix a bad hide by reducing the floor, exposing normally concealed artwork through the lens, or expanding hit regions into solid furniture. Physical iOS/Android tap comfort and human difficulty remain acceptance checks, not consequences of a passing mask count.
