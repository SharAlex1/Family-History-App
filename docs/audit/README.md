# Audit corrections and verification

All **25 grouped findings** in the [original audit](original-report.md) have been addressed. The original sample data and feature screens remain; the changes correct data integrity, validation, accessibility and responsive behavior.

## Verified results

- Full feature audit: **71 passed, 0 failed, 0 skipped** (original baseline: 38 passed / 33 failed).
- Unit tests: **19 passed**.
- Existing workflow plus integrity browser regressions: **7 passed**.
- Lint and production build: passed.
- Production bundle: all seven primary views rendered without uncaught page errors.
- Dependency audit: **0 known vulnerabilities** at verification time.
- Measured muted text contrast: **6.29:1** against the main panel (previously 3.03:1), and at least 5.8:1 against the tested opaque dark surfaces.
- At a 390px viewport, search is 302px wide and the year slider ends within the viewport. At 320px, 768px and 1440px, responsive measurements and screenshots were also captured.

## Corrections

| Finding | Implemented correction |
| --- | --- |
| F01 Imports | Full nested validation and version checks, count preview and replacement confirmation, previous-archive backup/restore, original-data recovery export and a render error boundary. |
| F02 Failed saves | Visible unsaved-work warning, in-memory retention, export/retry, and unload protection. |
| F03 Concurrent tabs | Web Lock serialization, revision guards, storage-event synchronization and stale-record conflict rejection. |
| F04 Tag loss | Removed label wrappers around grouped buttons; opening, closing or cancelling multi-selects preserves tags. |
| F05 Person links | The person form and dedicated editor now reconcile reciprocal relationships. |
| F06 Invalid ancestry | Provider-level self-link, cycle and birth-order guards; changing source clears the relationship target. |
| F07 Event/document links | Edits and removals synchronize both sides; legacy one-sided assertions are reconciled. |
| F08 Movement | Residence changes regenerate derived routes; generated-route edits/deletions update the residence. Additional routes are explicitly independent. Notes and end years survive generated-route edits. |
| F09 Deleted locations | Event location references become explicit unknowns; affected history routes are cleaned/recomputed. |
| F10 Stale filters | Removed branch/person/focus selections are reconciled with the current archive. |
| F11 Tree layout | Spouse depth changes propagate to descendants. |
| F12 Siblings | Reciprocal explicit sibling assertions work even when parents are unknown and can be removed, without merging parentage. |
| F13 Coordinates | Finite, paired coordinates with geographic bounds. |
| F14 Migrations | Distinct endpoints, integer dates, chronological order and personal lifetime validation. |
| F15 Years/residences | Shared integer-year checks, lifetime validation and birth/latest-residence defaults. |
| F16 Time range | Bounds and ticks expand from archive dates and the present year. |
| F17 Place counts | Unknown residences are excluded from distinct-place counts. |
| F18 Search keyboard | Normal activation plus arrow navigation, Enter and Escape. |
| F19 Dialogs | Native labelled modal dialogs with focus containment/restoration, inert background and Escape handling. |
| F20 Control names | Persistent sidebar/control names, current/pressed state and named year/search inputs. |
| F21 Multi-select keyboard | Focusable opener, searchable listbox, arrow/Enter selection, Escape and chip removal. Focus survives selection. |
| F22 Mobile slider | Reflows onto multiple rows and allows its range to shrink within the viewport. |
| F23 Mobile search | Uses a separate, full-width row. |
| F24 No matches | Clear People empty-results message and reset action. |
| F25 Contrast | Raised muted/deceased text colors while retaining the dark theme. |

## Evidence and rerunning

The baseline evidence remains in `results.json`, `responsive.json` and `screenshots/`. Current results are in `verification/`, including per-scenario results, geometry, screenshots, contrast calculations and the production smoke output. Browser scenarios still test the original desired behaviors; selectors were updated for semantic fields/listboxes and tests now wait for asynchronous writes. Import round-trip tests explicitly confirm replacement; invalid/replacement-safety tests do not.

With the dev server running:

```sh
curl --fail --silent --show-error https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json -o /tmp/atlas-audit-land.json
node tests/audit/run-audit.mjs
node tests/audit/responsive.mjs
```

Set `CHROMIUM_PATH` for an existing browser; the audit scripts default to `/usr/bin/chromium`. `AUDIT_URL`, `AUDIT_LAND_PATH`, `AUDIT_OUTPUT` and `AUDIT_IDS` customize the main audit. For production smoke, build and serve with Vite preview, then run `node tests/audit/production-smoke.mjs` (`AUDIT_PRODUCTION_URL` overrides the default preview port).

These are local Linux/Chromium results, including simulated storage failures and real separate browser tabs. Native Windows, other browsers, real mobile devices and screen-reader testing remain unverified. Features such as real media uploads, accounts and remote storage remain outside this correction release; see [current limitations](../known-limitations.md).
