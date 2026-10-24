# Public publication — Room 1

Owner authorization: **2026-10-25 (Asia/Taipei)**, “Play testing is passed. Proceed to public deployment.” [Acceptance record](ACCEPTANCE.md).

## Status

Publication is being prepared. Local validation passed: **51/51 gameplay tests**, zero skips/flakes/failures, including an unmocked loss at **60,225ms**. The publication smoke script also passed all four checks against the local production build. [Machine-readable local evidence](evidence/publication-local-verification.json). No successful hosted run, deployment or public-site check is claimed yet.

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
