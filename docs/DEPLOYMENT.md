# Public publication — Room 1

Owner authorization: **2026-10-25 (Asia/Taipei)**, “Play testing is passed. Proceed to public deployment.” [Acceptance record](ACCEPTANCE.md).

## Status

**Published and verified on 2026-10-25 (Asia/Taipei).** [Play Room 1](https://jaychtw.github.io/squirrel-control/).

Release commit: **`b7ca1dffd55eff650979d5ed828f78b37f4dfd31`**. [Hosted workflow #1](https://github.com/jaychtw/squirrel-control/actions/runs/40126699586) concluded **Success**. Its full test step, approved-bundle guard, static upload, Pages configuration, deployment and public gameplay verification all succeeded. [Machine-readable hosted evidence](evidence/publication-hosted-verification.json).

The live verification checked the exact release manifest and bundle hash, then completed ten-catch wins at 1440px/mouse/English and 390px/emulated touch/Traditional Chinese. It also checked furniture occlusion, the optical magnifier, pause and real countdown, live language switching, host reaction, assets and responsive overflow. No browser errors or external runtime requests were observed by those checks.

[Download public verification and desktop/mobile screenshots](https://github.com/jaychtw/squirrel-control/actions/runs/40126699586/artifacts/12573358018) — `public-gameplay-evidence`, retained for 90 days (GitHub sign-in may be required). Includes `desktop-en.png`, `desktop-win.png`, `mobile-zh-TW.png`, `mobile-win.png`, `verification.json` and `SUMMARY.md`. [Hosted test results](https://github.com/jaychtw/squirrel-control/actions/runs/40126699586/artifacts/12573392931) are retained for 30 days.

Local validation also passed **51/51 gameplay tests**, zero skips/flakes/failures, including an unmocked loss at **60,225ms**, plus all four publication smoke checks against the local production build. [Local evidence](evidence/publication-local-verification.json). Direct access to GitHub's API/Pages domain from this cloud workspace is blocked by its network proxy; the live browser checks ran in GitHub Actions, whose successful job/step status was verified from GitHub's public run pages. No local direct-public browser check is claimed.

Target: **https://jaychtw.github.io/squirrel-control/**, GitHub Pages. Approved game source: `4c1f7886148626b2c9ff3f59d5fa0bdddee4b3de`; approved JavaScript SHA-256: `55403aec683d0bc3e56d8eb356594039e4f242b10f6baff726e492c0b9121871`. No game code, artwork, rules or runtime dependencies change in this publication milestone.

## Publication pipeline

[Workflow](../.github/workflows/pages.yml): push to `main` (excluding documentation/package-only changes) or manual dispatch.

1. Check out the exact commit, use pinned Node 24, install locked dependencies and Chromium, and run the full 51-test suite. This includes the real 60-second deadline, two languages, four responsive widths, hit-mask visibility, keyboard, touch and automated accessibility checks.
2. Build a release manifest and verify that game source and the compiled JavaScript still match the accepted candidate. Upload only `dist/` as the Pages artifact. Source, playtest forms and development files are not part of the website artifact.
3. Use the repository's GitHub Pages configuration and the official Pages deployment action. Deployment has `pages:write` and `id-token:write`; build/test has only read access. Actions are pinned to exact commits. Repository tokens remain in GitHub Actions; none are embedded in the website.
4. Check the published `release.json` against the exact workflow commit, fetch and hash the live bundle, and run actual browser gameplay against the public URL. CDN propagation is retried without accepting a stale release.
5. Complete ten catches at desktop 1440px/mouse and mobile 390px/emulated touch; verify opaque furniture rejection, optical magnifier, pause, real countdown, language switching, assets, host success and no horizontal overflow. Record desktop/mobile screenshots, a machine-readable result and the workflow summary in the `public-gameplay-evidence` artifact.

## Configuration and operation

GitHub repository **Settings → Pages → Build and deployment → Source: GitHub Actions** is required. No custom domain, analytics, external runtime assets or backend is introduced. Vite uses relative asset URLs so the `/squirrel-control/` project path works.

A successful Pages deployment and a failed live smoke check are distinct states: inspect both jobs and the public evidence artifact. The public build exposes `release.json` for exact commit identification; documentation-only commits do not replace the deployed artifact.

To redeploy the same accepted source, use **Actions → Test and publish Room 1 → Run workflow**. To roll back publication, rerun a known-good deployment workflow/artifact. Any gameplay source change requires reviewing the release guard in `scripts/create-release.mjs` and validating the new candidate before deployment; it must not silently bypass the approved-bundle check.

## Evidence limits

The owner's playtest pass is recorded without fabricated scores or devices. Public smoke tests emulate mobile touch in Chromium; they do not establish physical iOS/Android, Safari/Firefox, screen-reader or independent first-time-player coverage. Original detailed Gate B evidence remains in [GATE-B-REVIEW.md](GATE-B-REVIEW.md).
