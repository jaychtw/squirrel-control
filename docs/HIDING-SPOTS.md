# Hiding-spot authoring and validation

The Gate A study uses a deterministic set of four representative spots for stable visual review. Seeded random selection of ten targets is intentionally reserved for the post-approval production implementation. No seed parameter or randomness is claimed in this build.

## Format

`makeLayout(mobile)` in `src/room.ts` defines the scene width, height and targets:

```ts
{ id: 'sofa', x: 555, y: 233, scale: 0.94, variant: 1, clue: 'sofa' }
```

`id` identifies the guest and its catch state. `x/y` are scene coordinates; `scale` applies uniformly to its actual SVG artwork. `variant` selects original fur/expression variants, and `clue` selects bilingual room-guide copy. IDs must be distinct. Furniture and host geometry are rendered after the targets. Edits to visible furniture must also appear in the composited scene; there are no independent invisible catch rectangles.

There are separate authored positions at viewBoxes **1120×650** and **640×820**. The portrait layout is selected at 620 CSS px and below. The whole viewBox remains visible (no crop). At the breakpoint the scene re-renders, keeping caught IDs, language, and room mood.

## Authoritative pixels

`HitMap.create` clones the actual SVG, removes the background/texture, and recolors each squirrel to a unique solid ink. Foreground furniture, host, and mess become black, preserving the real drawing order and geometry. The result is rasterized at scene resolution with the browser SVG renderer. A click is inverse-mapped from CSS coordinates into these pixels and succeeds only on a surviving target ink pixel. Anti-aliased edges use a narrow color tolerance and require alpha ≥200/255. Covered furniture, decorative gaps, and transparent target bounding boxes never produce target ink.

The validator separately renders each squirrel **without occluders** and counts its opaque silhouette pixels, then counts those still visible after all foreground layers. The visible ratio is `visiblePixels / silhouettePixels`; it is not a bounding-box fraction. This includes actual ears, tail, head, body and limb silhouettes. Subpixel translucent edges are excluded from both counts. No touch hitbox dilation is applied.

The same native-resolution hit map is sampled on all CSS sizes. Browser tests also perform real CSS-to-viewBox clicks at desktop and touch-emulated portrait sizes. Physical-device accuracy and Safari/Firefox raster edge behavior still need human verification.

## Validation procedure

Run `npm test`. For every supported viewport (320, 390, 768, 1440), both languages, and each of the three mess states, the tests require all four visible ratios ≥0.30. They also check the L0 → L1 → L2 → safe mess → L3 order, unchanged reachability, no horizontal crop, visible catches, and rejection of covered target pixels. A 30% floor is a validity check, not a claim that phone tap comfort is sufficient.

`#scene` exposes a nonvisual `data-visibility` diagnostic: per-guest full/visible pixel counts, ratio, and representative visible/covered points. This is for reproducible QA only; it does not reveal or highlight targets in the interface. The live magnifier is a second copy of the **entire unchanged composited SVG**, so normal occlusion is preserved. All mess props occupy safe wall/floor locations, and the UI sits outside the playable scene except the low floor instruction pill and the offset noninteractive lens.

When authoring another spot, inspect its recognizable exposed features at 320 px, inspect all mess states and host overlap, test visible/covered hit pixels, and rerun validation before adding it to a future production selection pool. Do not fix an invalid spot by reducing the minimum, making furniture transparent, or expanding catch regions through furniture.
