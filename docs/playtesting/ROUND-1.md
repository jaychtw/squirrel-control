# Hands-on playtesting — Round 1

**Status: package prepared; awaiting human observations. No human playtest sessions have been recorded.** This milestone follows the user's request to run a hands-on round before deployment. Production acceptance and public deployment authorization remain pending.

Candidate: **1.0.0-rc.1**, game source **`4c1f7886148626b2c9ff3f59d5fa0bdddee4b3de`**. The approved art baseline is `8e6c31e`. This round makes no game-rule, art, target-placement, timer or balance changes before feedback is collected.

## Access the actual game

[Download the playtest ZIP](../../playtest/squirrel-control-room1-4c1f788-playtest.zip), extract it, and follow its **START-HERE.txt**. The package contains the game, all fonts/art, instructions, a blank feedback sheet, font license notices, a small local-server helper and a provenance/integrity manifest.

The verified launch route requires **Python 3** on the tester's computer. In the extracted folder run:

```sh
python3 serve-playtest.py
```

Windows can also use `py serve-playtest.py`. Open the computer address printed by the helper in a regular browser. No Node.js, dependency installation, Internet connection for play, accounts, developer console or public site is needed. Keep the helper running; Ctrl+C stops it. By default it listens only on that computer.

For physical phone testing, keep the phone and computer on the same Wi-Fi and run:

```sh
python3 serve-playtest.py --lan
```

Use the LAN address printed by the helper in the phone's normal browser. The helper serves only the extracted folder, disables directory listings, and supplies no upload/feedback endpoint or public tunnel. If network restrictions or device availability prevent a check, record **Not tested**, rather than inferring a pass from emulation.

The standalone HTML can also be downloaded individually, but **direct file opening is unverified**: the cloud's managed Chromium policy rejected `file:` navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`. Browser policy was not disabled or bypassed. The tested local HTTP helper is the recommended route. GitHub's source viewer, archive previews and mobile Files/Quick Look are not game runtimes.

## Session flow

Allow about **8–12 minutes per device**. Use an ordinary browser at its normal zoom for the first three rounds. Let the tester discover the goal and controls from the game. Do not show target coordinates, mask reports, the hiding-spot authoring document or the text guide beforehand.

1. **Three initial visual attempts:** use fresh replays and the normal timer. Record found/10, outcome, displayed completion time on success, magnifier use, text-guide use, room code and prior familiarity with the scene. Read the code from settings after each round. Do not count text-guide completions as visual-search success.
2. **Magnifier and input comfort:** inspect a guest, drag without catching, lift and tap, try a covered furniture region, and note hard-to-hit exposed features. On phone, note whether the finger or offset lens obstructs useful information. Do not prompt a tester to tap hidden bodies.
3. **Recovery and clarity:** pause and resume, switch tabs/apps and return, change language during a round, and cancel an active restart. Check whether the timer/count and next action are understandable.
4. **Outcomes:** let one round expire and observe mess, Miss Bunny's reaction and retry. If no normal visual win occurred, test success separately with the text guide and label it as assisted. Check clarity and emotional tone, not just whether a screen appears.
5. **Comfort/accessibility:** where available, try keyboard/focus, larger text, reduced motion, sound/mute and a real screen reader. Record browser/OS/reader versions and mark unavailable checks untested.

Use the bilingual [feedback form](FEEDBACK.md), or send the essential observations back in chat. No participant name or contact details are required, and no automatic telemetry is collected.

## Essential feedback to return

- Device, OS, browser/version, input method, language, access route and prior familiarity.
- First three visual results: found/10, outcome, completion time if won, magnifier/guide use and room code.
- Hardest guest to see/catch; any missed taps or accidental drag captures.
- Difficulty and desire to replay, with reasons.
- Whether mess, outcomes, pause/resume and language changes were clear.
- The highest-priority change and precise steps/code for any defect.

For broader balance evidence, repeat with a few independent first-time players, especially on a physical phone. The owner has seen screenshots and may know hiding spots; record that familiarity rather than treating the owner's results as unbiased first-time success data. No pass-rate target is invented for this round: review the actual distribution and qualitative feedback before proposing changes to the approved 60-second rule.

## Triage and milestone exit

Record incoming observations in [RESULTS.md](RESULTS.md). Keep actual human findings separate from previous automated evidence.

- A reproducible crash, unreachable target, incorrect outcome/timer, lost input or blocked primary flow is a blocker to resolve and recheck on the affected device.
- Catch comfort, magnifier obstruction, localization/accessibility issues and confusing controls get a concrete reproduction and targeted fix/validation.
- Difficulty/fun, animation/audio and aesthetic feedback inform a proposal; do not silently change the core rule or approved direction.
- Untested physical devices, Safari/Firefox and screen-reader checks stay explicitly open.
- The owner makes a separate gameplay/production acceptance decision after reviewing results and any fixes. Public deployment requires its own later authorization. Preparing this package or passing automated checks does not close either checkpoint.

## Package verification, not human validation

Run `npm run test:playtest` to rebuild the portable distribution and execute its separate five-test browser/packaging suite. It uses the included Python helper on a local test port. `npm test` remains the existing 51-check game suite; it was not rerun solely for a packaging-only change. No files in `src`, `public`, the game entry point or the dependency lockfile changed.

Observed on 2026-10-25 (Asia/Taipei):

- TypeScript/static build passed.
- **5 package checks passed, 0 failed/skipped/flaky**, 6.6 seconds: ZIP CRC/file hashes and exact baseline JavaScript; desktop visible/covered catches, lens and ten-target win; pause/timeout/sad host/language/retry; touch-emulated drag/lift/tap and ten-target Chinese win; local helper HTTP delivery and a real catch. No observed page/console errors or external runtime requests in these successful contexts.
- Repeated packaging produced byte-identical HTML, manifest and ZIP checksums.
- Embedded JavaScript SHA-256 remains **`55403aec683d0bc3e56d8eb356594039e4f242b10f6baff726e492c0b9121871`**, matching the exact Gate B candidate. Fonts are inlined locally, with their complete OFL notices also embedded; the ZIP includes separate license files.
- Direct file navigation was blocked by managed browser policy and remains **not verified**. Early click checks also revealed a test harness scrolling issue; explicit test viewport/scroll handling corrected the test without changing the game.
- No real human, physical phone, Safari/Firefox or screen-reader observations have been collected in this round. No public site was deployed.

[Machine-readable package results](PACKAGE-VERIFICATION.json) · [Artifact manifest](../../playtest/MANIFEST.json) · [SHA-256 checksums](../../playtest/SHA256SUMS.txt) · [Existing Gate B QA](../GATE-B-REVIEW.md).

## Rebuilding the distribution

Node.js 24, Python 3 and the existing locked development dependencies are required only for maintainers rebuilding the package:

```sh
npm run package:playtest
npm run test:playtest
```

The packager requires game files to match their recorded source commit, inlines local fonts/CSS/JavaScript without changing game code, checks for unresolved local asset references, embeds licenses, and creates a deterministic ZIP. Generated outputs are in `playtest/`. This is a source-review distribution, not a release tag or hosting/deployment workflow.
