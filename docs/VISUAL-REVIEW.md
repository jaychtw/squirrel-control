# Room 01 — Gate A visual review

**Status: implementation and automated QA complete for the visual study; human visual acceptance pending.** This is not a complete v1.0 game or a public release.

## Direction to review

A warm storybook living room, with cream wallpaper, sunlit timber, a sage sofa, terracotta plants, honey-colored furniture, soft cocoa outlines and paper grain. Original butter-yellow Miss Bunny wears an orderly little apron; warm chestnut squirrels have tufted ears, curled tails and cheerful expressions. The furniture, host and target artwork are independent vectors composed in the game, not a flattened concept image. The UI continues the room's palette with quiet serif headings, small botanical details and restrained controls.

Four fixed representative hides let you evaluate recognition, occlusion and interaction without racing a clock. The phone composition rearranges the room, rather than cropping/shrinking the desktop illustration. The freely movable magnifier enlarges the same rendered furniture and targets, preserving occlusion. Tidy / Playful / Oh dear! are manual visual comparisons in this study; automatic time-driven progression belongs to the production build.

## Evidence

All captures are from the running production build. Viewport widths are CSS pixels. Touch magnifier evidence uses device pixel ratio 2 (the PNG is 780 physical pixels wide).

| View | Evidence |
| --- | --- |
| Desktop, tidy, 1440 | [Screenshot](evidence/room-1440-en-tidy.png) |
| Desktop, messy, 1440 | [Screenshot](evidence/room-1440-en-messy.png) |
| Phone, tidy, 390 | [Screenshot](evidence/room-390-en-tidy.png) |
| Phone, messy, 390 | [Screenshot](evidence/room-390-en-messy.png) |
| Chinese phone, 390 | [Screenshot](evidence/room-390-zh-TW-messy.png) |
| Narrow phone, 320 | [Screenshot](evidence/room-320-en-tidy.png) |
| Tablet, 768 | [Screenshot](evidence/room-768-en-tidy.png) |
| Desktop optical inspection | [Screenshot](evidence/magnifier-1440.png) |
| Offset touch inspection | [Screenshot](evidence/magnifier-390.png) |

Additional bilingual captures and raw pixel-count reports are in `docs/evidence`. The design document mentioned style-reference image attachments, but only the GDD was supplied in this task. No copyrighted reference images or third-party character artwork were used.

## Actual-silhouette validation

The test rasterizes each guest's real SVG silhouette and compares it with the fully occluded foreground rendering. [Authoring and method](HIDING-SPOTS.md).

| Hide | Desktop/tablet visible | Portrait visible |
| --- | ---: | ---: |
| Curtain | 63.50% | 62.76% |
| Sofa | 35.65% | 43.56% |
| Cabinet | 45.07% | 50.87% |
| Basket | 53.13% | 47.83% |

Every result exceeds the 30% floor in all three mess states, both languages, and the four tested widths. The validator counts actual opaque body/head/ear/tail/limb pixels, excluding translucent antialiasing edges from both measurements. It does not count sprite bounding boxes. Visible catches and covered-pixel rejection are separately exercised through browser input. Phone tap comfort is still a human check; a valid pixel fraction alone cannot establish it.

## QA report

Validated 2026-10-24 (Asia/Taipei), Node.js 24.19.0, npm 11.9.0, Playwright 1.64.1, Chromium 154.0.8037.57 on Linux. Validation preceded the initial source commit; see the repository history for the visual-review commit. There is no release tag or deployment. Current production JS SHA-256: `3c297c7884041a75320946045faa7dbcfce76c4a01ef84de664303f26044330c`. Static output: approximately 356 KiB, including locally bundled font subsets and their OFL notices. No runtime external requests, keys, backend, tracking, or ads.

Commands actually run:

- `npm ci --cache /workspace/.npm --no-audit --no-fund` — passed; frozen lockfile installation.
- `npm run build` — passed; TypeScript and Vite static compilation. Also rerun by the final test invocation and after adding the distributed font license notices.
- `npm test` — **17 passed, 0 failed, 0 skipped**, final complete run, 25.1 seconds with two workers.

Coverage: layered composition; all masks at 320/390/768/1440 in English and Traditional Chinese across all three mess states; no horizontal overflow; complete four-target capture at every width/language; duplicate catch rejection; covered furniture rejection; cancel/reset/replay; desktop optical lens and keyboard catch; actual CDP touch drag/tap emulation with offset lens and complete four-target capture; live language/state retention; guide actions; modal focus restoration and toggle focus; persisted, corrupt and blocked preference storage; reduced motion; background visibility pause/resume; no external requests; no observed JavaScript, console or missing-asset errors in the primary page fixtures. The separate touch context is validated through successful actual interaction and lens/composition assertions.

The axe WCAG 2 A/AA and 2.1 AA rule scans passed with **zero violations** for the active phone room plus instructions, text guide and comfort dialogs in both languages. This is automated supporting evidence, not a claim of complete WCAG conformance. The text guide offers a nonvisual alternative, with explicit disclosure that it makes the hunt easier.

After the test run, the development server was restarted from the saved command and independently checked: HTTP 200, scene ready, begin action working, and no observed page errors. Font license files were verified in the final static output.

The earliest validation found insufficient cabinet exposure and low-contrast secondary copy. These were corrected and the affected checks, followed by the complete suite, passed. A test helper initially assumed SVGRect supported `toJSON`; the helper now reads its real width/height. Full-page screenshot capture can move the emulated pointer when the viewport is restored, so the keyboard-catch test explicitly repositions inspection after capturing evidence.

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

## Pending human decision and next stage

GDD §13 Gate A explicitly says: **“Stop for human visual acceptance before producing the complete game.”** Review the original art, squirrel recognizability, phone composition, optical magnifier and comparison mess states. Approve the direction or identify changes. No visual or gameplay acceptance has been recorded.

After visual approval, Gate B will implement the full ten-target, seeded curated placement system; a race-safe 60-second active timer; time-driven deterioration; pause/resume and background behavior; mutually exclusive win/loss; animated host outcomes; randomized replay; and full core-rule, browser and balance QA. Existing study controls for manually selecting mess states will not replace the production timeline. Gate B will then require human gameplay acceptance. Gate C publication is separate and has not been requested.

Still unverified: real iOS/Android touch and lens comfort; Safari/Firefox; human keyboard and screen-reader review; enlarged text/layout review beyond the tested defaults; native Chinese typography/copy review; first-time player success rate and balance; final animation/audio appeal. Browser emulation and axe do not establish these.
