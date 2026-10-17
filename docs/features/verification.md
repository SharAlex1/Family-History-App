# Feature release verification

Verified on October 17, 2026 with Node.js 24, Linux and system Chromium. Checks use isolated browser contexts and synthetic genealogy/files, not real family data.

| Check | Result |
| --- | --- |
| ESLint | Passed |
| Vitest | 54 tests passed across 3 files |
| Playwright | 21 browser workflows passed, including the original 7 regressions |
| Original full audit | 71 scenarios passed, 0 failures |
| Responsive checks | All 15 views at 320, 390, 768 and 1440 pixels: 60 checks passed |
| Production smoke | All 15 views rendered with external requests blocked, 0 uncaught errors |
| Production build | Passed; new workspaces split into separate loading chunks |
| Dependency audit | 0 known vulnerabilities at verification time |
| Git whitespace check | Passed |

The final GEDCOM date-precision adjustment was additionally verified by two policy-specific unit cases and rerunning the GEDCOM browser workflow, full unit suite, lint, build and production smoke.

## Coverage of the new workflows

- Real image upload, decoded preview, record viewer, reload, full ZIP download and restore into a different browser context; bytes and SHA-256 metadata survive the transfer. Unsupported active uploads and missing/tampered ZIP members are rejected.
- Connected tree ancestor/descendant traversal, generation limits, collapsing, zoom, keyboard pan and opening profiles. Domain tests cover ancestors, cousins/removals and connection paths.
- Journey stop navigation and map labels use existing residences. Imported places stay unpositioned until edited.
- Oral history written answers, transcript edits/export, and actual MediaRecorder capture/playback using Chromium’s synthetic microphone device.
- Illustrated book download includes photo data URLs and escaped user text. Saved drafts survive reload. The print button opens the printable document; Chromium produces a valid PDF from it.
- Research citations, differing claims, conflict display, question status/notes and reload persistence. Canonical profile facts remain unchanged.
- Credited memories and replies, invitation export, contribution creation in another browser context, reviewed import, repeat-import deduplication, and malformed preview rejection. Unit tests reject dangling subjects and reply cycles.
- Reminder calendar validation and persistence; exact/approximate historical date rules and upcoming year boundaries.
- GEDCOM people, unknown/qualified dates, adoption, residences, sources, preview, explicit duplicate matching and reimport. Merge tests cover redirected feature references, preserved scalar alternatives, full dates conflicting with year-only records, related-record rejection and invalid mappings.
- Schema v1 upgrade, extension cleanup and portrait detachment. Existing storage corruption, quota failure/retry, backup/restore and cross-tab conflict tests still pass.

The stricter responsive check also found and corrected 320px clipping in original overview grid cards, timeline event headers and management row actions. Existing desktop behavior and sample records are preserved.

## Repeat the checks

```sh
npm run lint
npm test
npm run build
CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e
```

With the development server running, use:

```sh
AUDIT_OUTPUT=docs/features/verification node tests/audit/run-audit.mjs
node tests/audit/features-responsive.mjs
```

The legacy audit’s accurate-map fixture expects `/tmp/atlas-audit-land.json`; see its fixture route in `tests/audit/run-audit.mjs`. Browser tests use Playwright’s installed Chromium when `CHROMIUM_PATH` is omitted. With the production preview on port 5175:

```sh
AUDIT_OUTPUT=docs/features/verification node tests/audit/production-smoke.mjs
npm audit
```

Saved evidence: [71-scenario results](verification/results.json), [responsive measurements](verification/responsive.json), [production smoke](verification/production-smoke.json), and selected [desktop tree](verification/screenshots/1440-Family-Tree.png), [phone journey](verification/screenshots/390-Follow-a-Journey.png) and [phone book editor](verification/screenshots/390-Stories-&-Books.png) screenshots. Earlier release evidence remains under `docs/audit/`.

These checks do not establish Safari/Firefox compatibility, real microphone hardware quality, speech-service availability, real touch/screen-reader behavior or very large archive performance. See [current boundaries](../known-limitations.md).
