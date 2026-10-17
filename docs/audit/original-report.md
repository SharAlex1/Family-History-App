> Historical baseline at `1a194f1`, before the corrections. See [current verification](README.md) for the fixed behavior. Statements about uncommitted work and proposed fixes below describe that earlier audit.

# Family Atlas feature audit

Audited revision: `1a194f1` (the current app on GitHub when the audit started).

This is an audit, not a fix release. Application source, dependency manifests, and lockfiles are unchanged. Audit scripts, evidence, and this report are local and uncommitted. Nothing was pushed.

## Scope and method

The audit inventories every current screen and type of interactive control, then exercises normal workflows, bad inputs, missing data, deletion cleanup, persistence, keyboard behavior, and responsive layouts. Each browser scenario uses an isolated context with disposable sample data; no real family archive is touched.

Tests run in Chromium on Linux. Responsive measurements cover widths 1440, 768, 390, and 320 pixels. This is broad feature coverage, not proof of every possible input or browser combination. Native Windows execution, Edge/Firefox/Safari, real mobile touch, screen-reader sessions, real file-system failures, large archives, and multi-user hosting have not been tested. No account/backend services exist to test.

The full source and every module were inspected. A computed contrast check supplements the browser tests; it is not a full automated WCAG certification.

## Results

**71 browser scenarios: 38 passed, 33 failed, 0 skipped.** The failed checks are consolidated into 24 functional/accessibility findings plus one additional measured contrast finding: **25 grouped problems**, each with a proposed solution below. Repeated checks of the same root cause are not separate bugs. A pass applies only to that scenario; it does not imply the whole feature is defect-free.

## Baseline checks

- ESLint: passed, including the local audit scripts.
- Unit tests: 4 executed, 4 passed.
- Existing Playwright workflow: 1 executed, 1 passed.
- Production build: passed.
- Production bundle smoke: all 7 primary views rendered with no uncaught page errors.
- `npm audit`: 0 reported vulnerabilities at audit time.

The ESLint 9 deprecation notice remains a tool compatibility limitation, separate from runtime defects.

## Feature and control coverage

| Area | Exercised elements | Browser evidence |
| --- | --- | --- |
| Overview | Summary display, all four navigation cards, map shortcut, empty-archive call to action | N01, N02, D04 |
| Navigation | Every sidebar destination, desktop/tablet/phone layouts | N02, B26-390, B26-768, responsive.json |
| Search | Case-insensitive input, mouse selection, people list filtering, keyboard activation, no matches | N03, B21, B28, B30 |
| Branch filters | All, individual, combined, deselection; people filtering/tree dimming/map filtering; deleting selected branch | N04, N07, B19 |
| Year controls | Minimum/maximum, manual change, play, pause, automatic stop; unborn/living/deceased states | N02, N06, B13, B20, B27 |
| Tree | Generations, couples, cards, related-person highlights, profiles, unusual spouse ancestry | N02, N04, N03, B31 |
| Timeline | All 11 event-type buttons, all-events reset, historical context, focused person and clear, year marker and empty matches | N05, N09 |
| Map | Accurate land projection, offline stylized fallback, historical pins/counts, occurred routes, highlighted routes, person buttons, branch filtering | N07, N08 |
| People | All cards, age/status/location, name filtering, profile entry, empty archive and zero results | N02, N03, D04, B30 |
| Documents | Sorted metadata cards, icons, linked-person buttons; all 8 document type choices | N10, C09 |
| Profile | Biography/relationships/branches/places/events/documents, relative navigation, close/backdrop, map/focus/edit actions | N03, N09, N11 |
| Manage tabs | All 7 tabs; searches and no-match displays for all 6 entity collections | C01–C06, D04 |
| Person form | Required fields, name, gender, birth/death, birthplace, biography/avatar text, relationship selectors, residences, save/edit/reload/delete | C01, C07, C08, C12, C13, B01, B12, B32 |
| Location form | Name/region/description, coordinates, both picker modes, create/edit/delete, geographic bounds | C02, N08, B09 |
| Event form | Title/year/type/location/description, historical toggle, links; every type; create/edit/delete | C03, C09, B03, B11 |
| Migration form | Person/branch modes, origin/destination, start/end/description, create/edit/delete, invalid dates/route | C04, C10, B02, B10 |
| Document form | Title/year/type/description, person/event links, create/edit/delete | C05, C09, B04 |
| Branch form | Name, color swatches, create/edit/delete; remove or reassign members | C06, R04–R06 |
| Relationships | Parent/child/spouse add and remove; sibling command; self-link and ancestor-cycle checks | R01, R07, B06–B08 |
| Multi-select | Open, type search/no-match, add choice, remove chip, outside dismissal, keyboard reachability | C12, B25, B33 |
| Dialogs | Save, Cancel, close icon, backdrop, deletion cancel/confirm, Escape, focus behavior | C01–C06, C11, B22, B23, B29 |
| Destructive operations | Person/event/document/location/branch cleanup, delete cancellation, reset cancellation/confirmation | R02–R05, B05, D03 |
| Files and storage | JSON download/content, round trip, malformed JSON, wrong shape/nested data, import replacement, reload, storage failures, concurrent tabs | D01–D03, D06, B14–B18 |
| Empty states | Empty overview, tree, people, timeline, map, documents, management tabs, first person | D04 |
| Input rendering | HTML-like content displayed as plain text without executing | D05 |

Not every cell is a blanket pass. Refer to the findings below and the per-scenario results. Positive data-operation tests use keyboard Save with open multi-selects to isolate the separately reproduced outside-click deletion bug (F04).

## Confirmed problems and proposed solutions

Priority definitions: **High** risks archive integrity, blocks a main interaction, or can lose work. **Medium** produces misleading results or prevents access to a feature. **Low** is a smaller clarity/counting issue. Fixes below are proposed, not implemented.

| ID / Priority | Problem and reproduction | Proposed solution | Evidence / primary code |
| --- | --- | --- | --- |
| F01 / High | Import accepts unrelated JSON and immediately replaces the archive. Importing records with invalid nested data can crash rendering. Even a valid replacement needs no confirmation. | Validate the entire archive with a versioned schema before changing state. Preview changes, ask for replacement confirmation, retain a recoverable pre-import backup, and add an error boundary. | B14–B16; `lib/storage.js`, `ManageView.jsx`, `DataProvider.jsx` |
| F02 / High | Simulated storage quota errors are swallowed; edits appear saved but are not persisted. | Return persistence status, show a persistent unsaved-data warning, offer export/retry, and preserve pending data. | B17; `lib/storage.js:7` |
| F03 / High | Open two tabs, change an archive in one, then save in the other: the stale tab overwrites the first tab's changes. | Add revision checks and cross-tab synchronization using the storage event or BroadcastChannel, with conflict handling. A larger archive can move to transactional IndexedDB. | B18; `DataProvider.jsx`, `lib/storage.js` |
| F04 / High | Open Yosef's branch selector, then click outside it and save: his branch assignment disappears. Multi-select field wrappers are labels containing interactive buttons; label activation can trigger a remove-chip button. | Use `fieldset`/`legend` or non-label wrappers for grouped controls; label only the search input. Keep outside-click dismissal outside the label and test that every selected value survives open/close. | B33; `FormFields.jsx:5`, `FormFields.jsx:52` |
| F05 / High | Add Miriam as Hannah's spouse in the person form. Hannah references Miriam, but Miriam does not reference Hannah. The dedicated relationship editor does update both. | Use one relationship mutation path for both forms and the dedicated editor, reconciling additions and removals on both people. | B01; `DataProvider.jsx:26` |
| F06 / High | Noah can become his ancestor Yosef's parent. Selecting Rivka as target and then changing the source to Rivka also allows her to become her own parent. | Reset the target when the source changes; enforce non-self, acyclic ancestry invariants in the provider as well as the UI; check chronological plausibility. | B06, B07; `RelationshipsTab.jsx`, `DataProvider.jsx:85` |
| F07 / Medium | Editing an event's documents does not update those documents' events, and vice versa. | Centralize relationship updates, or store event/document links once and derive both views from them. Repair existing mismatches during migration. | B03, B04; form save callbacks and `DataProvider.jsx` |
| F08 / Medium | Add a San Francisco residence to Hannah: the residence is saved but no matching migration route appears. Routes and residence history are edited separately. | Define one canonical movement history and derive pins/routes/events from it, or explicitly link independent historical claims and warn about contradictions. | B02; `PersonForm.jsx`, `seed.js`, `MapView.jsx` |
| F09 / Medium | Delete Minsk. Residence and route references are cleaned, but events retain `at: "minsk"` and display Unknown. | Offer replacement or set event location to an explicit unknown value; clean every reference in one deletion transaction. | B05; `DataProvider.jsx:53` |
| F10 / Medium | Filter to Kaminski, delete that branch and move its members to Roth, then open People: no people appear because the hidden deleted filter remains selected. | Reconcile branch selections against current branch IDs after delete/import/reset; clear invalid person/focus selections too. | B19; `App.jsx`, branch deletion action |
| F11 / Medium | Spouse alignment can move a parent into a deeper generation without moving the parent's child; a valid graph fixture displays the child above the parent. | Compute generations with parent/child constraints and spouse alignment together, re-propagating changes until stable; reject cycles first. | B31; `FamilyTreeView.jsx:66` |
| F12 / Medium | Add a sibling relationship between two people who have no parents: the command silently does nothing. | Model an explicit sibling assertion or explain that shared parents must be supplied before accepting the operation. Support half-siblings without blindly merging all parents. | B08; `DataProvider.jsx:92` |
| F13 / Medium | Latitude 999 and longitude 999 are accepted and saved. | Require finite latitude in −90…90 and longitude in −180…180; validate projected/inverted coordinates and handle a missing coordinate pair. | B09; `LocationForm.jsx:11` |
| F14 / Medium | A migration can go from Minsk to Minsk and end before its start year. | Validate different endpoints, chronological order, and finite integer years; provide targeted field errors. | B10; `MigrationForm.jsx:13` |
| F15 / Medium | Fractional event years and a residence 120 years before a person's birth are accepted. New residence rows default to 1896 regardless of the person's birth. | Apply shared integer-year validation and life-span checks. Default a residence to birth or the latest known move; allow explicit uncertainty rather than silently fabricating a year. | B11, B12; form validators and `ResidenceEditor.jsx` |
| F16 / Medium | A person born in 1750 can be added, but the slider cannot go earlier than 1896. The maximum is also fixed to 2026. | Derive time bounds and tick marks from archive data plus a configurable present year. | B13; `config/theme.js`, `TimeSlider.jsx` |
| F17 / Low | A living person with no residences produces "1 places" even though no location is known. | Remove null/empty locations before building the set; optionally show an unknown-location count separately. | B20; `TimeSlider.jsx:10`, dashboard place count |
| F18 / Medium | Focus a global-search result and press Enter: no profile opens. The handler only listens for mouse down. | Use a normal click activation path and implement combobox/listbox keyboard selection, including arrows, Enter, and Escape. | B21; `Navigation.jsx:58` |
| F19 / Medium | Edit dialogs have no dialog role/name, Escape does not close them, and Shift+Tab escapes behind the overlay. | Use an accessible dialog primitive with a labelled dialog role, initial focus, focus trap, Escape handling, inert background, and focus restoration. Apply to profile and confirm dialogs as appropriate. | B22, B23, B29; `Dialogs.jsx` |
| F20 / Medium | Icon-only buttons and the year slider lack adequate accessible names. At widths below 900px, every sidebar text label is hidden without a replacement name. | Add persistent aria-labels, associated input labels, current-page state, and tooltips. Use proper switch/radio semantics for toggles and swatches. | B24, B26-390, B26-768; layout/UI components |
| F21 / Medium | An empty multi-select is a clickable div with no focusable opener, so keyboard users cannot open it. | Use an accessible combobox with a focusable input/button and selection announcements; add keyboard open/close/navigation/removal support. | B25; `FormFields.jsx:52` |
| F22 / Medium | At 390px, the year range reaches x≈433px and is clipped by the 390px viewport; at 320px the overflow is larger. Users cannot reliably reach the range's right end with a pointer. | Reflow the slider on narrow screens, allow flex children to shrink, reduce fixed widths, and simplify ticks. | B27, `responsive.json`, `390-People.png`; `appStyles.js:22` |
| F23 / Medium | At 390px, the family search input collapses to 48px, leaving almost no room for a name. | Put search on its own row or use a mobile expandable search UI; enforce a useful minimum width. | B28, `responsive.json`; top-bar layout |
| F24 / Low | A People search with no matches leaves a blank content area beneath a zero count. | Add a clear no-results state with clear-search/reset-filters actions, consistent with Manage Data. | B30; `PeopleView.jsx` |
| F25 / Medium | Small faint text uses `#5f6678` on `#161a24`, a computed contrast ratio of about 3.03:1, below the 4.5:1 requirement for normal-sized text. Birth years are one example. | Raise muted-text contrast while preserving the palette and audit every text/background pairing, including transparency. | Theme and PersonCard computed styles; manual contrast calculation |

## Existing feature boundaries and decisions

These are not claimed as newly broken features:

- Document cards, audio/video types, and avatar fields are metadata/placeholders. There is no real upload, media playback, file preview, or avatar image rendering. Implement storage plus viewers before representing these as complete media features.
- There are no accounts, server database, shared-family permissions, remote backups, or cross-device synchronization. Browser storage and JSON export are the current persistence model.
- Map pins themselves are static SVG markers; people are opened through the cards below the map. Decide whether clickable pins, pan/zoom, and tooltips are desired.
- Migration `endYear` is stored but map arcs remain after `startYear`. This may be intentional for completed historical journeys; clarify whether the field describes travel duration or route visibility before changing it.
- The global branch controls do not filter every view (overview/documents/management retain all records). Decide their intended scope and make that scope visible.
- Family Tree is a generation-card layout rather than a complete connecting-edge pedigree diagram. Multiple marriages, adoption, half-siblings, uncertain dates, and evidence confidence need product decisions.
- Browser Back/refresh does not preserve the current screen/year/filter because navigation is transient state. URL-based navigation is an enhancement, not an existing promise.
- Form cancellation intentionally discards drafts with no unsaved-change warning. Add draft protection if accidental loss becomes a concern.
- Detailed map data and Google fonts are external resources. Offline map fallback was tested; external font delivery and all CDN failover permutations were not independently tested.

## Recommended implementation order

1. Protect the archive: F01–F06, especially multi-select data loss, validated imports, persistence errors, and graph invariants.
2. Reconcile all links and derived history: F07–F17, with regression tests before migrating any saved data.
3. Make all controls usable on keyboard and phones: F18–F25.
4. Then design real uploads, backups, and family sharing around the corrected data model.

## Evidence and reruns

`results.json` contains each browser scenario's observed result and failure assertion. A failure means a desired behavior was not met; it is not a successful test. Several checks describe the same root issue (for example modal semantics, focus, and Escape), so scenario failures are not a count of unique bugs.

`responsive.json` contains measured geometry. `production-smoke.json` records production-view checks. `screenshots/` contains desktop/phone reference images. These contain disposable sample data only.

With dependencies installed and the dev server running, run:

```sh
# Fetch the authoritative map fixture for the accurate-map scenario.
curl --fail --silent --show-error https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json -o /tmp/atlas-audit-land.json
AUDIT_LAND_PATH=/tmp/atlas-audit-land.json node tests/audit/run-audit.mjs
node tests/audit/responsive.mjs
```

Use `CHROMIUM_PATH` when Chromium is not at `/usr/bin/chromium`. The audit runner targets `AUDIT_URL` (default internal port 5173). It deliberately exits nonzero when it reproduces unresolved defects; it is separate from the existing CI smoke suite. Use `AUDIT_IDS=B01,B33` and a separate `AUDIT_OUTPUT` directory for targeted reproductions without replacing the complete result file.

For the production smoke, first build and run `npm run preview -- --host 127.0.0.1 --port 5175`, then run `node tests/audit/production-smoke.mjs`.
