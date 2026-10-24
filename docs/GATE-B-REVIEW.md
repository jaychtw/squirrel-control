# Room 1 — Gate B implementation and verification

**Archived implementation review; owner subsequently accepted hands-on playtesting and authorized publication on 2026-10-25 (Asia/Taipei).** See [current publication status](DEPLOYMENT.md). The evidence below describes the Gate B delivery before that approval.

**Original review status: implementation complete for gameplay review; production acceptance pending.** Version `1.0.0-rc.1`. The user approved Gate A at **`8e6c31eb81d7a8438bdfc72b001fac24d866dafc`** and authorized this implementation and source push to `main`. Public deployment remains explicitly unauthorized. See [acceptance record](ACCEPTANCE.md).

## Delivered behavior

- Exactly ten distinct squirrels per round, chosen from thirteen authored hides. Seeded selection provides 286 ten-spot subsets, with stable IDs/variants across layouts. Each replay uses a fresh room code and avoids an immediate identical subset.
- A deliberate start begins **60 seconds of monotonic active time**. Catch events synchronize the deadline themselves; a tenth capture at 59,999 ms wins, while one at or after 60,000 ms loses. End states freeze the clock, captures and subsequent transitions.
- Pause/resume, instructions, settings and restart confirmation suspend time, deterioration and scene input. Backgrounding automatically pauses; visibility return never silently resumes. Restart confirmation also applies when an active round has zero captures.
- Time-driven deterioration at 15/30/45 seconds, then a final noninteractive messy reveal at loss. Catching does not cause mess. Safe foreground decoration never changes a target's visible pixels.
- Original approved Miss Bunny/character art, cottage scene, desktop/portrait compositions and solid lavender page (`#e4cdf4`) retained. A few matching hide props extend the scene. Miss Bunny celebrates success and gently sighs with a disappointed expression on failure.
- Unlimited penalty-free 2.25× optical magnification of the exact composed SVG, preserving furniture occlusion. Pointer, keyboard and offset touch inspection, with drag/tap discrimination. No cooldown, automatic finding, outlining or transparent furniture.
- English/Traditional Chinese live switching without rerolling or resetting time/count. Optional sound, reduced motion (including OS preference), larger text, focus management, keyboard controls, and a timed text-guide alternative. The text alternative is explicitly easier; it is not claimed to have identical visual-search difficulty.
- Validated local preference persistence; corrupt, missing or blocked storage does not prevent play. No accounts, telemetry, backend, external runtime network calls, scores, extra modes or Match3 Core.

## Scene architecture and visibility

The renderer retains the approved architecture: L0 background, L1 squirrels, L2 actual foreground furniture, L3 host, plus a safe foreground decoration sublayer and a separate UI plane. Rendering order is checked in the browser. Actual vector silhouettes drive hit testing, never sprite rectangles or broad invisible touch areas. Captured IDs are rejected by the authoritative state even when a cached mask retains their original pixels.

The two selected-round masks are prepared and validated before time starts, then reused throughout play. A resize selects the cached other-layout mask while preserving the current round/time. The thirteen-spot pool is validated together: there are no overlapping silhouettes, and removing any three cannot make the other ten harder to reach. Exact visible-ink equality is verified across all five deterioration states, including the sad-host final scene.

[Full authoring and proof method](HIDING-SPOTS.md). Counts use actual opaque painted body/head/ear/tail/limb pixels, consistently excluding translucent antialiasing edges. A padded local tile is only a raster optimization, not a hitbox or visibility denominator; its bounds and room crop are checked.

| Native silhouette exposure | Desktop | Portrait |
| --- | ---: | ---: |
| Lowest in full thirteen-spot pool | 42.45% (left sofa) | 41.74% (left arm) |
| Required floor | 30% | 30% |

A separate proof renders the same complete composition at the actual displayed CSS scene resolutions, accounting for antialiasing at narrow phone size:

| Viewport width | Actual scene width | Lowest exposed silhouette |
| --- | ---: | ---: |
| 320 | 296 | 40.98% |
| 390 | 358 | 41.10% |
| 768 | 716 | 43.16% |
| 1440 | 1118 | 43.27% |

Every spot passes the floor, crop/overlap checks and exact stage invariance at every sampled size. This establishes geometric reachability, not physical finger comfort or fun. The pointer still must hit visible artwork. [Native reports](evidence/catalog-desktop.json) / [portrait report](evidence/catalog-portrait.json) / CSS reports `catalog-css-*.json` retain all counts and representative visible/covered pixels.

## Verification actually performed

Validated **2026-10-25, Asia/Taipei** on Linux, Node.js **24.19.0**, npm **11.9.0**, Playwright **1.64.1**, Chromium **154.0.8037.57**. Development version is pinned in `.node-version`; package/lock versions agree.

| Command | Observed result |
| --- | --- |
| `npm ci --cache /workspace/.npm --no-audit --no-fund` | Passed; frozen lockfile installation. |
| `npm run build` | Passed strict TypeScript and static Vite build; also run by each browser-suite invocation. |
| `npm test` | **51 passed, 0 failed, 0 skipped, 0 flaky**, two workers, **92.0 seconds**. |
| `npm test -- --grep 'actual CSS-resolution'` | **4 passed**, confirming the actual 1118 px desktop scene width after correcting the QA width calculation; no gameplay change. |
| `git diff --check` | Passed after removing template-only trailing whitespace. |

The full run includes **21 core/persistence/localization tests, 24 browser gameplay/accessibility tests, and 6 catalog visibility tests**. A machine-readable [verification summary](evidence/verification-summary.json) records each full-run test status, the targeted CSS confirmation, runtime versions, artifact hash and the unmocked elapsed-time observation. The final static build's JavaScript artifact is `index-BqoC0M3G.js`, SHA-256 **`55403aec683d0bc3e56d8eb356594039e4f242b10f6baff726e492c0b9121871`**. Static output is about **380 KiB**, including locally bundled font subsets/license notices. The final template whitespace cleanup does not change scene geometry or gameplay. The saved development startup command was also executed: HTTP 200, ten-target round start, one visible capture updating the counter to 1/10, and no observed page errors.

**Core tests:** ten/unique target requirements; explicit start; duplicate/unknown rejection; repeated pauses and resumed active time; all deterioration boundaries; mutually exclusive deadline outcomes at 59,999/60,000/60,001 ms in both event orders; ended-state immutability; fresh state on restart; 10,000 seeds exercising all 286 subsets; cross-layout ID/variant stability; safe bounded room-code input; both-language key/clue coverage; corrupt/blocked preference data and reduced-motion precedence.

**Browser play:** complete ten-target hunts at 320/390/768/1440 in both languages; actual visible clicks and covered furniture rejection; duplicate rejection; confirm/cancel/replay and fresh randomized IDs; time/mess pause during menus; loss/final mess/retry in English and Chinese; optical lens composition equality and repeated unlimited use; keyboard capture, lens navigation and pause; real CDP touch drag/lift/tap input with offset preview and a complete ten-target touch win at DPR 2; live language switching; timed nonvisual guide completion and its pause/resume path; automatic background pause and explicit return; resize retaining targets/count/time; persisted comfort settings, larger text without horizontal overflow at 320/390 in both languages; reduced-motion effects; corrupt/blocked storage; and no external runtime requests, console errors or missing assets in monitored contexts.

**Deadline evidence:** deterministic browser-clock tests cover readable stage/outcome screenshots and a tenth valid click with **one active millisecond left**, after which later frames cannot convert the win to a loss. Independently, an **unmocked browser round expired after 60,121 ms of observed wall time**, displaying 00:00 and the loss state. The slight observation overhead is browser scheduling/test polling, not an added game duration; the engine's cutoff is exactly 60,000 active ms.

**Accessibility evidence:** axe WCAG 2 A/AA and 2.1 AA scans reported **zero violations** across bilingual entry/menus and the active game, pause, confirmation, both outcomes and larger-text settings. The active/outcome scan sequence is in Traditional Chinese; English full-game/outcome behavior is separately exercised in the responsive and loss tests. Native dialogs trap focus; Escape closes/resumes appropriately, focus returns to controls, and toggle focus survives rerendering. The text guide offers descriptive clues and catch actions with an explicitly running clock. Automated scans are supporting evidence, not a complete WCAG or screen-reader usability claim.

One early browser run exposed ambiguous test selectors for the two confirmation close actions; the test now selects the intended cancel action. The first accessibility attempt stalled because axe itself uses browser timers; the harness now resumes its controlled browser clock while audits run. Neither issue was fixed by weakening a game rule, bypassing assertions or hiding violations. The slow first seed-simulation harness was stopped, then replaced with aggregate invariant checking and rerun successfully. No interrupted/failed preliminary run is counted as a passing final check.

## Desktop/mobile evidence

The `review-room-01` seed is used consistently. Screenshots come from the actual static build, with browser time controlled for reproducible stages; they are not measurements of human completion speed. The unmocked timer check is separate.

| View | Capture |
| --- | --- |
| Desktop, start/tidy | [1440 English](evidence/gameplay-1440-en-tidy.png) |
| Desktop, 45-second mess | [1440 English](evidence/gameplay-1440-en-messy.png) |
| Desktop, success | [1440 English](evidence/gameplay-1440-en-win.png) |
| Desktop, final loss | [1440 English](evidence/gameplay-1440-en-loss.png) |
| Phone, start/tidy | [390 English](evidence/gameplay-390-en-tidy.png) |
| Phone, 45-second mess | [390 English](evidence/gameplay-390-en-messy.png) |
| Phone, success | [390 Chinese](evidence/gameplay-390-zh-TW-win.png) |
| Phone, final loss | [390 Chinese](evidence/gameplay-390-zh-TW-loss.png) |
| Narrow phone | [320 Chinese](evidence/gameplay-320-zh-TW-tidy.png) |
| Tablet | [768 English](evidence/gameplay-768-en-tidy.png) |
| Desktop optical lens | [Magnifier](evidence/gameplay-magnifier-1440.png) |
| Offset touch lens | [Magnifier, 390 CSS px / DPR 2](evidence/gameplay-magnifier-390.png) |

Additional bilingual active/win captures are in the same directory. Approved Gate A `room-*.png` and the original character sheet are retained for comparison.

## Decisions and justified implementation details

No core-mechanic, art-direction, release-scope or public-deployment deviations were made. Unspecified details were resolved within the user's delegated authority:

- Thirteen pool locations and 286 subsets provide replay variation with a tractable worst-case proof. Additional letter/sewing props, a second curtain hide, foreground picture/plant hides and more sofa hides reuse the approved style rather than replacing the cottage or characters.
- The approved celebration remains intact; the failure reaction adds gently closed eyes, a small downturned mouth and a brief sigh. No scary expressions, damage or distress.
- Instructions/settings/restart confirmation pause automatically. The nonvisual room guide is an alternate active hunt, so its clock continues and a separate pause button remains available. This is explained in both languages and tested.
- Preferences persist; a 60-second round does not survive a reload. There is no multi-session progression, account or score history to preserve. Reload behavior and the room-code reproduction mechanism are documented.
- Expensive raster preparation happens before start. Cached masks remain authoritative because all foreground stages have exactly identical surviving target pixels. Timed gameplay does not wait for a new mask after each catch or resize.
- The 30% silhouette floor is enforced conservatively using opaque ink and actual narrow-size raster checks. There is no invisible touch rectangle or occlusion-piercing assistance. The magnifier and text alternative provide assistance without changing the visual hit rule.

## Pinned UGDS acceptance checklist

Pass means the scoped implementation/evidence satisfies the requirement stated below, not that unperformed human checks have passed. The original standard at `d5c6696efdd6efc028118600466db44aecae0c9b` and GDD v1.0 are unchanged.

| Requirement | Status | Evidence / practical limit |
| --- | --- | --- |
| P01 complete loop | Pass | Entry, ten-target search, real countdown, exclusive win/loss, feedback and replay. |
| P02 inputs | Pass | Desktop mouse/keyboard and actual touch-emulated gameplay; physical-device comfort pending. |
| P03 responsive | Pass | Both languages at all four specified widths, separate portrait geometry, larger-text narrow layouts. |
| P04 fair observable rules | Pass | Actual composed masks, visible-only captures, deterministic active-time deadline. |
| P05 recovery | Pass | Confirm/cancel for every active restart; complete state reset and fresh seeded replay. |
| L01 bilingual | Pass | Centralized interface, clues, instructions, errors, counters, settings and outcomes; key coverage tested. |
| L02 live switching | Pass | Targets, elapsed time, count and seed preserved; both full-game flows exercised. |
| A01 accessible interaction | Not Verified | Keyboard, focus, text alternative, larger text and automated audits pass; human screen-reader/comfort review pending. |
| A02 motion/sound | Pass | Optional persistent sound, visual equivalents, reduced motion and OS preference supported. |
| V01 original production artwork | Pass | Individually composited approved original SVG assets; reference imagery not embedded. |
| V02 separate visual gate | Pass | Explicit Gate A acceptance recorded at `8e6c31e`; Gate B gameplay acceptance remains separate. |
| V03 coherent integration | Not Verified | Approved direction retained and geometry verified; final fully composed gameplay aesthetic review pending. |
| V04 representative POC approval | Pass | Gate A evidence accepted before this full implementation. |
| V05 no silent downgrade | Pass | Approved artwork reused; additional original hides/reactions follow the accepted direction. |
| V06 visual evidence | Pass | Actual desktop/mobile active, mess, win/loss and magnifier captures supplied. |
| S01 persistence | Pass | Meaningful preferences validated/persisted with blocked-storage handling; no multi-session progression exists. |
| S02 runtime independence | Pass | Local static assets/fonts, no external runtime services or requests. |
| S03 performance | Not Verified | Responsive Linux browser runs, small build, cached masks; ordinary physical-device frame-time testing pending. |
| S04 family-friendly honesty | Pass | Harmless retreat, gentle outcomes, accurate feature/acceptance/publication claims. |
| Q01 verifiable engine | Pass | Independent state/clock module and core boundaries, seeded selection and data validation tests. |
| Q02 browser gameplay | Pass | Complete desktop/touch runs, both languages, full real timer, failure/retry and preferences. |
| Q03 balance/integrity | Not Verified | Geometric reachability/seed integrity proved; human first-time success rate and difficulty/fun remain unverified. |
| Q04 accessibility validation | Not Verified | Automated scans and keyboard/focus tests pass; manual screen-reader and physical-device assessment pending. |
| Q05 release integrity | Pass | Local checks, source push, hosted CI and deployment distinguished. No public deployment authorized or performed. |
| Q06 evidence and limits | Pass | Commands, counts, artifact hash, raw reports, captures and unverified human checks documented. |
| C01 decision ownership | Pass | Gate A user decision recorded; routine Gate B implementation autonomous; final production acceptance reserved. |
| C02 escalation/scope | Pass | Core rules/art preserved, no external service or public release added. Human acceptance requested only after reviewable implementation. |
| C03 versioned standards | Not Applicable | No standard changes; immutable pinned source retained. |

## Delivery and remaining human review

Source and evidence are prepared for the explicitly requested push to `main`; the exact delivery commit is supplied in the final task response/Git history. No release tag, hosted CI execution, GitHub Pages deployment or public live-game verification is claimed. There is no deployment workflow in this change.

Review still needed: first-time-player 60-second difficulty/fun balance; real iOS/Android tap accuracy, drag/lens comfort and performance; Safari/Firefox; manual keyboard and screen-reader assessment; final animation/audio appeal; native Traditional Chinese typography/copy. Those checks cannot be replaced by emulation or a deterministic automated player.

Cloud startup instructions are also saved for the complete game in the environment configuration draft. Review/save and publish the **cloud environment** in its settings to retain that reusable setup; this is separate from any future public game deployment.
