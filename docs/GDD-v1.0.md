# Squirrel Control — Game Design Document (GDD) v1.0

**Status:** Design baseline for Codex; visual proof of concept requires human approval before full production  
**Date:** 2026-10-24  
**Initial release:** Room 1 — Miss Bunny's Home  
**Platforms:** Desktop and mobile web  
**Languages:** English and Traditional Chinese (zh-TW) from the beginning

## 1. Creative vision

**Premise:** Miss Bunny loves her cozy, carefully kept home. Ten mischievous squirrels have invaded and are hiding behind the furniture, making an ever-growing mess. Find and catch all ten before the 60-second timer expires, or the room will be left in complete disarray.

**Genre:** Lighthearted hidden-character / visual search / time attack.  
**Core appeal:** Adorable expressive characters, readable hiding puzzles, mounting visual chaos, simple direct interaction, short replayable rounds.  
**Audience:** Family-friendly, accessible to children and adults; no violence or distressing imagery.

**Creative principle:** The room is both the puzzle and the story. It should feel like a cohesive illustrated environment, not a generic web interface containing disconnected pictures.

## 2. Scope and release boundaries

### v1.0 must deliver
- One complete, polished room: **Room 1 — Miss Bunny's Home**, a cozy illustrated living room.
- Ten squirrels to find per playthrough.
- A 60-second countdown and a clear caught/remaining counter.
- Desktop click and mobile touch catching.
- Unlimited, penalty-free magnifier that optically enlarges the inspected scene without automatically locating squirrels.
- Curated, randomized hiding configurations, preserving visibility and interaction constraints.
- Progressive, time-driven room deterioration.
- Success and failure sequences with Miss Bunny's emotional reactions.
- Replay/restart, instructions, pause/resume, and bilingual UI.
- Responsive desktop and mobile presentation, accessibility options, and documented tests.

### Explicitly out of scope for v1.0
- Additional rooms, hosts, or character collections.
- Online accounts, leaderboards, payments, advertising, social sharing, or backend.
- Combat, damage to squirrels, moving host during gameplay, squirrel AI, or complicated inventory.
- Unapproved power-ups, punitive magnifier costs, or extra game modes.

Future rooms must be feasible without hard-coding the game to Miss Bunny's particular artwork, but do not build a speculative general-purpose level editor now.

## 3. Character and art direction

**Mood:** Whimsical, cozy, charming, expressive, gently chaotic. The player's reaction should be delight rather than alarm.

**User-supplied references:** The attached Chiikawa scene collection and character close-ups are **mood/style references only**. Translate the broad qualities—rounded shapes, simple expressive faces, pastel colors, soft hand-drawn feeling, cute exaggerated reactions—into **original artwork**. Do not copy, trace, closely recreate, or use Chiikawa/Momonga characters, distinctive accessories, exact facial designs, or copyrighted imagery as game assets.

### Miss Bunny (host)
- Original butter-yellow rabbit character with distinctive long ears, compact rounded proportions, small limbs, rosy cheeks, and a personality of gentle orderliness.
- Positioned on Layer 3, stationary throughout active play.
- Subtle idle expression is acceptable, but no gameplay movement is required.
- **Win:** clear, delightful celebratory pose/animation.
- **Loss:** visibly disappointed or overwhelmed, but never frightening or cruel.
- Must be identifiable and visually separate from squirrels and interactive objects.

### Squirrels (targets)
- Ten small, original fluffy squirrel characters, sharing a recognizable design language but with varied poses and expressions.
- Defining features should include recognizable squirrel ears and tails; avoid relying solely on color to identify them.
- Mischievous, not villainous. Capture means a harmless, cheerful disappearance/retreat, not physical injury.
- Designs must remain identifiable when partially hidden, at normal phone size, and through magnification.

### Room and deterioration
- Warm, pastel illustrated living room: e.g., sofa, side table, shelves, cabinet, lamp, plants, curtains, rug and cushions.
- Furniture must feel naturally placed and provide authored hiding opportunities.
- Over time, add disorder such as scattered cushions, tilted pictures, fallen papers, shifted ornaments and playful mess. Use gentle motion and optional sound cues.
- Deterioration must **not** change a target's minimum visible area, obscure its hittable visible region, create accidental occlusion, or make the room unreadable.
- On failure, finish in a clearly messy state; on success, Miss Bunny celebrates. The scene should communicate outcome without requiring dialogue.

## 4. Rendering and interaction layers

| Layer | Contents | Requirements |
|---|---|---|
| L0 | Room background | Walls, floor, fixed decorative environment and non-occluding scenery |
| L1 | Squirrels | Target sprites, positions, capture state, visible-mask/hit detection |
| L2 | Furniture | Foreground occluders with authored geometry or masks |
| L3 | Host | Miss Bunny and end-of-round reaction; stationary during gameplay |

**Separate overlay/UI plane:** HUD, timer, magnifier lens, pause/instructions dialogs, feedback, focus indicators. UI should not be confused with L0–L3 room depth.

Rendering order must be reliable and testable. Decorative mess elements should be assigned to appropriate scene sublayers and must not violate squirrel visibility/hit rules. The host may visually overlap the scene but must not cover required squirrel interaction regions.

## 5. Core game loop

1. Show Room 1 introduction and concise controls.
2. Generate a valid round by selecting ten squirrel positions from curated hiding spots/configurations.
3. Start the 60-second countdown when the player deliberately begins play.
4. Player searches the room and catches squirrels by clicking/tapping their **visible portions**.
5. Successful catch provides immediate visual/audio feedback, removes or marks the squirrel caught, and updates the counter. A squirrel can be caught only once.
6. At elapsed-time milestones, the room becomes progressively messier without reducing target visibility or changing the rules.
7. If all ten are caught while time remains, stop the clock and show Miss Bunny's celebration and success summary.
8. If the timer reaches zero with any squirrel uncaught, stop play and show the fully messy room, Miss Bunny's disappointed reaction, and a friendly retry option.
9. Allow a fresh randomized replay. The game must never enter an unwinnable state through placement or interface overlap.

**Timer:** 60 seconds of active gameplay. Pause suspends the timer, deterioration, and interaction. Background-tab behavior must be explicit and tested: prefer automatic pause on loss of visibility to avoid unfair time loss. Timer and capture transitions must be race-safe at the deadline.

**Scoring:** The essential measures are caught count and remaining time. Do not add a complicated score economy for v1.0. A simple completion time on success is optional if it does not distract from the primary experience.

## 6. Hiding and placement system

- Exactly **10 squirrels** per round, each assigned to a distinct, authored valid hiding spot; avoid overlapping squirrels or impossible placements.
- Randomize among curated spots/configurations for replayability. Use deterministic seeded selection internally for reproducible bug reports/tests where practical.
- At least **30% of each squirrel's actual body silhouette** (not its rectangular sprite bounding box) must be visible after furniture, host, and decorative occlusion.
- Treat 30% as a **minimum floor**, not the preferred target: favor larger exposed regions for smaller mobile displays and first-time players.
- The visible portion must include enough recognizable features and a practical tap target. A large invisible rectangle behind furniture must **not** register as a catch.
- Prefer alpha-mask or authored visible-region hit testing; if a larger touch-assistance area is needed, constrain it to visible/near-visible regions so taps on solid furniture do not falsely catch hidden squirrels.
- Ensure every generated round is valid across supported viewport sizes, UI overlays, room deterioration states, and magnifier mode.
- If an authored hiding spot is invalid at a particular aspect ratio, select a valid alternative; never silently break the visibility rule.
- Document the hiding-spot authoring format, validation method, and seed/reproduction mechanism.

## 7. Magnifier

**Intent:** A freely available search aid; its natural cost is the player's time and attention.

- Unlimited activations and duration; **no usage cap, cooldown, score deduction, or timer penalty** beyond normal elapsed time.
- Magnifies the underlying room/furniture/squirrel artwork at the inspected position. It **does not highlight, outline, reveal, or automatically find** squirrels.
- Desktop: pointer-controlled lens or explicit magnifier mode, with an intuitive exit.
- Mobile: finger-driven inspection with a magnified preview offset from the finger to avoid covering the inspection area; provide a workable interaction for tapping a squirrel after locating it.
- Clearly distinguish inspection/drag gestures from catch taps to prevent accidental captures.
- Magnifier must not expose normally occluded sprite regions as though furniture were transparent.
- Magnifier may use a dedicated overlay rendering path but must preserve the authoritative scene and hit-test logic.
- Provide clear on/off status and a keyboard-accessible equivalent or alternative accessible inspection method; do not make magnifier-only visual cues mandatory for completing a round.

## 8. Controls, feedback and HUD

- **Desktop:** click/tap visible squirrel; mouse/pointer controls for magnifier; keyboard operability for essential controls and an accessible alternative for locating/catching targets.
- **Mobile:** touch visible squirrel; intentional magnifier gesture/control; no hover-dependent interactions.
- **HUD:** time remaining, squirrels caught/remaining, magnifier control, pause/restart, language toggle, audio/settings as appropriate.
- Keep HUD outside the primary squirrel interaction area, or reserve protected zones in scene layout.
- Successful catch: satisfying small animation and optional soft sound; update counter immediately and unambiguously.
- Near deadline: gentle urgency, not flashing or overwhelming sensory effects.
- Win/loss: prominent accessible text plus character reaction, retry action, and no ambiguity about the outcome.
- Avoid accidental destructive restart; confirm if restarting would discard an active run.

## 9. Progressive chaos timeline

A proposed implementation baseline (Codex may tune visual timing without changing the rule):

| Elapsed time | State | Visual direction |
|---|---|---|
| 0–14 s | Tidy | Cozy, mostly orderly room |
| 15–29 s | Mild disorder | A few scattered objects and displaced cushions |
| 30–44 s | Noticeable mess | More scattered papers, tilted decor, disrupted objects |
| 45–59 s | Near-disaster | Comically messy but still legible and fully playable |
| 60 s if not complete | Total mess / failure | Final noninteractive mess reveal and Miss Bunny's disappointed reaction |

The mess is **time-driven**, not caused by catching squirrels. A caught squirrel should not punish the player with additional damage. Avoid jump-scare transitions, excessive visual noise, or obstructive animations.

## 10. Responsive composition

- Desktop: showcase the full cozy room and its furniture arrangement; keep HUD readable and unobtrusive.
- Mobile portrait: preserve an adequately sized playable scene; adapt framing, HUD placement, and magnifier behavior rather than shrinking the entire desktop scene into tiny targets.
- Prefer a cohesive room/page background; no unrelated contrasting webpage container.
- Adapt authored hiding configurations if crops or UI would otherwise hide targets.
- Ensure touch targets, readability, safe-area spacing, and no unintended page scrolling during catch/magnifier gestures.
- Support common widths including approximately 320, 390, 768, and 1440 CSS px; verify actual touch behavior separately on physical devices.

## 11. Accessibility and localization

- English and Traditional Chinese (zh-TW) UI and instructions from day one, with live switching where feasible.
- Do not depend on color alone; visible silhouette and shape matter.
- Include clear focus indicators, keyboard-accessible menus, text equivalents for counters/outcomes, and appropriately labeled controls.
- Offer reduced-motion mode and sound controls; do not rely solely on sound for feedback.
- Support reasonable enlarged display/text options where possible without breaking placement validity.
- A purely visual hunt can be challenging for screen-reader users; document limitations honestly and investigate a meaningful nonvisual alternative rather than claiming accessibility solely from automated audits.
- Validate Chinese typography and avoid overflow or clipped labels on mobile.

## 12. Architecture and technical direction

- **New game, not a match-3 variant:** Do not integrate Match3 Core; its matching/gravity rules are irrelevant here.
- Reuse the **engineering standards and proven practices** from the owner's Universal Game Development Standard (UGDS) and prior released games, where applicable: modular architecture, bilingual state handling, reproducible tests, robust input, persistence discipline, responsive QA, and GitHub Pages publication workflow.
- Reference repositories:
  - UGDS: https://github.com/jaychtw/game-development-standards (v1.0.0 baseline commit `d5c6696efdd6efc028118600466db44aecae0c9b`)
  - Shape Match: https://github.com/jaychtw/shape-match (released functional baseline `857dfe124cbce152b4aa118550f11276cbb7414e`)
  - Cute Animal Match: https://github.com/jaychtw/animal-match (reference commit `372016711574bf216b94b9a3eb1490fa824f0090`)
  - Snacks Match – Raohe: https://github.com/jaychtw/snacks-match-raohe (release v0.1.0, commit `29886ca22efd0cb27b248aecc0415093e38cd4bb`)
- These are **process/quality references**, not mandates to copy their layouts, art, or unrelated gameplay code.
- Separate scene rendering, placement/visibility validation, authoritative game state, input/hit testing, timer, magnifier, animation, and localization.
- Prefer original layered/vector/illustrated assets that can be individually animated and inspected. A single flattened background image must not replace interactive depth and hit logic.
- Make the room data-driven enough for future rooms and hosts, but keep v1.0 focused on one room.
- No network dependencies or third-party runtime services required for play. Avoid unnecessary external packages.

## 13. Production workflow and approval gates

### Gate A — Concept and visual POC (requires human review)
1. Inspect this GDD, supplied character/style references, and UGDS.
2. Propose an original visual direction and implement or render a **representative Room 1 POC** with Miss Bunny, furniture, several visibly concealed squirrels, HUD, magnifier treatment, and examples of tidy/messy states.
3. Provide desktop and mobile evidence at real target sizes. Show a magnifier inspection example and explain how the 30% visible-body rule is validated.
4. Stop for **human visual acceptance** before producing the complete game.

### Gate B — Full playable implementation (after Gate A approval)
1. Implement the full ten-squirrel, 60-second loop and curated randomized placements.
2. Add time-driven deterioration, magnifier, bilingual UI, success/failure reactions, and replay.
3. Run automated tests and browser tests; produce evidence and a QA report.
4. Seek human gameplay acceptance for the experience and balance, not just screenshot approval.

### Gate C — Publication (only when separately authorized)
1. Validate exact release commit, hosted CI, static build and GitHub Pages configuration.
2. Deploy and verify public gameplay, assets, language switching and responsive behavior.
3. Report live URL, commit/tag, observed test results, and unverified manual checks.

**Delegated authority:** Codex may freely make ordinary technical and aesthetic implementation choices consistent with this GDD and the approved visual POC. Escalate material changes to core mechanics, art direction, accessibility guarantees, scope, or public release authorization.

## 14. Verification and acceptance criteria

**Core rules**
- Exactly ten squirrels spawn in every valid round.
- Each squirrel can be caught once; counter reaches ten only after ten valid catches.
- Timer runs for 60 seconds of active play and pauses correctly.
- Win/loss transitions are mutually exclusive and deterministic at boundary conditions.
- Restart resets the run without stale sprites, listeners, or timers.

**Placement and hit detection**
- Automated visibility-mask checks confirm ≥30% actual silhouette exposed for each selected squirrel at supported sizes and all mess stages.
- No squirrel is hidden behind an inaccessible crop, host, or HUD overlay.
- Tapping opaque furniture over a squirrel does not register as a catch.
- Every generated round has ten reachable targets.

**Magnifier**
- Unlimited use, no extra penalties or altered timer speed.
- Enlarges the actual composited scene without revealing concealed regions or target locations.
- Functional on mouse and touch; touch finger does not obscure the useful preview.

**Visual and UX**
- Original character designs; cozy, emotionally expressive, coherent room.
- Tidy-to-messy progression is obvious but does not sabotage visibility.
- Desktop and mobile screenshots reviewed at representative widths.
- Both languages usable; reduced-motion/audio controls respected.
- No critical console errors, missing assets, or broken interactions.

**Human validation still required**
- Real iOS/Android touch accuracy and magnifier comfort.
- Manual Safari/Firefox, keyboard and screen-reader assessment.
- First-time-player success rate and 60-second difficulty/fun balance.
- Subjective animation, sound, and bilingual copy review.

## 15. Open implementation choices (not blockers)

Codex may propose: specific living-room furniture arrangement, squirrel expressions/poses, number of curated candidate hiding spots (must support ten valid targets), exact animation durations, magnifier zoom factor and lens geometry, specific deterioration props, and original audio treatment. These are delegated choices **subject to Gate A visual approval and the mandatory mechanics above**.

---

**Design intent in one sentence:** *Find ten adorable troublemakers in sixty seconds while Miss Bunny's cozy room slips into delightful chaos—without sacrificing fair visibility, intuitive touch interaction, or the charm of original storybook characters.*
