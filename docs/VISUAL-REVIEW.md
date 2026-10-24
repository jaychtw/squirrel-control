# Room 01 — Gate A visual review, revision 02

**Archived Gate A report.** The user subsequently approved the visual baseline at `8e6c31e` and authorized Gate B. The measurements and 17-test report below describe that historical prototype. See [Gate B verification](GATE-B-REVIEW.md) for the current full implementation and [acceptance record](ACCEPTANCE.md) for the approval boundaries.

## Direction to review

Redesigned on 2026-10-25 in response to the supplied movie-still montage and solid lavender swatch. The page uses a solid light purple (`#e4cdf4`) with plum typography and controls; the dotted page texture has been removed. The room is a warm illustrated cottage with timber framing, leafy garden scenery, scalloped pink gingham curtains, a lilac sofa and draped throw, a mint sideboard, a flower-patterned rug, a wall clock, and a tea-and-cookie table. Darker cocoa contours and warmer flat colors give the scene an animation-cel feeling.

Miss Bunny now has a larger, rounded continuous silhouette, asymmetrical ears, tiny expressive eyes, hatched rosy cheeks, a petal-shaped nose, and a sage linen pinafore. The squirrels have plump cream-and-caramel bodies, forehead patches, tufted ears, curled tails, tiny acorns and varied expressions. Normal and celebratory host poses plus all four target variants appear on the character sheet. The references inform broad qualities of shape, warmth and expression; none of their characters, accessories, exact faces or scene layouts were copied or traced. All artwork remains original and individually layered.

The underlying four-target visual-study scope and the optical magnifier interaction remain intact. All hidden placements were revalidated against the new silhouettes.

Four fixed representative hides let you evaluate recognition, occlusion and interaction without racing a clock. The phone composition rearranges the room, rather than cropping/shrinking the desktop illustration. The freely movable magnifier enlarges the same rendered furniture and targets, preserving occlusion. Tidy / Playful / Oh dear! are manual visual comparisons in this study; automatic time-driven progression belongs to the production build.

## Evidence

All captures are from the running production build. Viewport widths are CSS pixels. Touch magnifier evidence uses device pixel ratio 2 (the PNG is 780 physical pixels wide).

| View | Evidence |
| --- | --- |
| Original character study | [Sheet](evidence/character-study.png) / [SVG](evidence/character-study.svg) |
| Desktop, tidy, 1440 | [Screenshot](evidence/room-1440-en-tidy.png) |
| Desktop, messy, 1440 | [Screenshot](evidence/room-1440-en-messy.png) |
| Phone, tidy, 390 | [Screenshot](evidence/room-390-en-tidy.png) |
| Phone, messy, 390 | [Screenshot](evidence/room-390-en-messy.png) |
| Chinese phone, 390 | [Screenshot](evidence/room-390-zh-TW-messy.png) |
| Narrow phone, 320 | [Screenshot](evidence/room-320-en-tidy.png) |
| Tablet, 768 | [Screenshot](evidence/room-768-en-tidy.png) |
| Desktop optical inspection | [Screenshot](evidence/magnifier-1440.png) |
| Offset touch inspection | [Screenshot](evidence/magnifier-390.png) |

Additional bilingual captures and raw pixel-count reports are in `docs/evidence`. The two supplied visual references were inspected in the conversation for this revision. They are not embedded in the application or redistributed as game assets. Previous visual iterations remain available in Git history. Regenerate the character sheet with `node scripts/render-character-study.mjs` on Node.js 24+; the normal browser suite regenerates the room/magnifier screenshots.

## Actual-silhouette validation

The test rasterizes each guest's real SVG silhouette and compares it with the fully occluded foreground rendering. [Authoring and method](HIDING-SPOTS.md).

| Hide | Desktop/tablet visible | Portrait visible |
| --- | ---: | ---: |
| Curtain | 72.21% | 71.04% |
| Sofa | 42.63% | 48.50% |
| Cabinet | 52.75% | 55.55% |
| Basket | 59.46% | 54.15% |

Every result exceeds the 30% floor in all three mess states, both languages, and the four tested widths. The validator counts actual opaque body/head/ear/tail/limb pixels, excluding translucent antialiasing edges from both measurements. It does not count sprite bounding boxes. Visible catches and covered-pixel rejection are separately exercised through browser input. Phone tap comfort is still a human check; a valid pixel fraction alone cannot establish it.

## QA report

Revision revalidated 2026-10-25 (Asia/Taipei), Node.js 24.19.0, npm 11.9.0, Playwright 1.64.1, Chromium 154.0.8037.57 on Linux. The previous review version is commit `813d6f0`; this redesign is provided in its successor on `main`. There is no release tag or deployment. Current production JS SHA-256: `200eb9993013dee0cbd40740928a6c9bc97e916a72c375c4cd4db80e5be6118d`. Static output: approximately 364 KiB, including locally bundled font subsets and their OFL notices. No runtime external requests, keys, backend, tracking, or ads.

Commands actually run:

- `npm ci --cache /workspace/.npm --no-audit --no-fund` — passed during initial setup; the unchanged lockfile and installed dependencies were reused for this revision.
- `npm run build` — passed; TypeScript and Vite static compilation, rerun by the final browser suite.
- `npm test` — **17 passed, 0 failed, 0 skipped**, final complete run, 26.3 seconds with two workers.

Coverage: layered composition; all masks at 320/390/768/1440 in English and Traditional Chinese across all three mess states; no horizontal overflow; complete four-target capture at every width/language; duplicate catch rejection; covered furniture rejection; cancel/reset/replay; desktop optical lens and keyboard catch; actual CDP touch drag/tap emulation with offset lens and complete four-target capture; live language/state retention; guide actions; modal focus restoration and toggle focus; persisted, corrupt and blocked preference storage; reduced motion; background visibility pause/resume; no external requests; no observed JavaScript, console or missing-asset errors in the primary page fixtures. The separate touch context is validated through successful actual interaction and lens/composition assertions.

The axe WCAG 2 A/AA and 2.1 AA rule scans passed with **zero violations** for the active phone room plus instructions, text guide and comfort dialogs in both languages. This is automated supporting evidence, not a claim of complete WCAG conformance. The text guide offers a nonvisual alternative, with explicit disclosure that it makes the hunt easier.

The current revision was tested against a fresh production build served by the test runner. The initial environment setup separately verified development-server startup; no server-start changes or dependency changes were needed for this visual revision. Font license files remain in the static output.

The first redesign run passed visibility and interaction checks but found insufficient contrast for secondary text on lavender. The text and link colors were darkened; the affected audit and then the complete suite passed. The minimum current exposure is 42.63%, exceeding the 30% floor. The original alpha-mask hit testing and touch drag/tap distinction remain authoritative.

## Acceptance checklist against pinned UGDS

Statuses apply to this Gate A artifact; production requirements remain open where marked. No exceptions to the full-game standards are claimed.

| Requirement | Status | Evidence or remaining work |
| --- | --- | --- |
| P01 complete loop | Not Verified | Four-target study completion/replay passes; full ten-target win/loss and timer deferred to Gate B. |
| P02 inputs | Pass | Mouse, keyboard, touch-emulated catches and drag separation; physical touch comfort not verified. |
| P03 responsive | Pass | Four specified widths, both languages, adapted portrait scene; physical-device QA pending. |
| P04 fair/observable rules | Pass | Actual composited pixel hit masks, visible-only catches, explicit study/timer labeling. |
| P05 recovery | Pass | Active partial reset requires confirmation; cancel/replay tested. |
| L01 bilingual | Pass | Centralized English/zh-TW UI, instructions and accessibility copy. |
| L02 live switching | Pass | State and caught targets retained across language changes. |
| A01 accessible interaction | Not Verified | Keyboard, text-clue alternative, focus and axe pass; human screen-reader/comfort assessment pending. |
| A02 motion/sound | Pass | Reduced-motion preference and user toggle; sound optional/off initially, persistent mute and visual feedback. |
| V01 reference/production distinction | Pass | Original individual vector elements; artifact clearly identified as a visual study. |
| V02 visual quality gate | Not Verified | Gate A evidence complete; explicit human acceptance pending. |
| V03 consistent integration | Not Verified | Coherent palette/geometry and tested hit behavior; aesthetic acceptance remains human. |
| V04 representative visual POC | Not Verified | Representative scene complete, awaiting acceptance before production scales. |
| V05 no silent downgrade | Pass | Original vector direction and current scope explicitly shown for review, no production-quality claim. |
| V06 visual evidence | Pass | Desktop/mobile, tidy/messy, bilingual and magnifier captures linked above. |
| S01 persistence | Pass | Preference validation and blocked/corrupt-storage handling tested; no persistent progress in this study. |
| S02 runtime independence | Pass | Bundled local assets and no external runtime requests. |
| S03 performance | Not Verified | Responsive automated runs and small bundle; physical-device frame-time testing not performed. |
| S04 age-appropriate honesty | Pass | Harmless catches, gentle reactions, no distress, no false release/gameplay claim. |
| Q01 verifiable engine | Pass | Independent hit-mask module and browser assertions; production timer/random engine not implemented yet. |
| Q02 browser gameplay | Not Verified | Complete four-target desktop/touch playthrough passes; full-game loss/retry awaits Gate B. |
| Q03 balance/integrity | Not Verified | Fixed authored hides validated; seeded random solvability and human difficulty/fun balance await Gate B. |
| Q04 accessibility validation | Not Verified | Automated scan/keyboard checks pass; manual screen-reader/physical-device tests pending. |
| Q05 release integrity | Pass | Source review on `main` was authorized on 2026-10-25 (Asia/Taipei). Local build/test results are reported separately; hosted CI, deployment and live-game verification have not been performed. |
| Q06 evidence/limits | Pass | Commands, counts, artifact identifier, captures and explicit gaps recorded here. |
| C01 decision ownership | Pass | Routine implementation choices made; art acceptance left to creative director. |
| C02 escalation | Pass | Full production held at explicit GDD visual gate; public release separate. |
| C03 versioned standards | Not Applicable | Pinned UGDS retained unchanged; no standard changes proposed. |

## Gate A decision and handoff

The GDD required visual acceptance before full production. The user explicitly approved the revision at commit `8e6c31e`, including its characters, cottage, responsive layouts and light-purple background. Gate B implementation is now documented separately in [GATE-B-REVIEW.md](GATE-B-REVIEW.md). The checklist above records the earlier prototype's scope and verification, not the current game's feature coverage. The GDD and pinned UGDS source copies remain unchanged.
