# Archive data model

The JSON archive contains six arrays linked by string IDs, plus `schemaVersion: 1` and a nonnegative `_revision` used for browser concurrency. Versions without schema metadata are treated as legacy archives and validated before upgrade. IDs and the `familyAtlas.v2` storage key remain compatible.

| Collection | Main fields |
| --- | --- |
| `people` | `id`, `first`, `last`, `gender`, `branches`, `birth`, nullable `death`, `born`, `avatar`, `bio`, `parents`, `spouses`, `children`, optional explicit `siblings`, `residences` |
| `locations` | `id`, `name`, `region`, nullable paired `lat`/`lng`, stylized-map `x`/`y`, `desc` |
| `events` | `id`, `type`, `year`, `people`, optional location `at` (empty means unknown), `title`, `desc`, `docs`, `historical` |
| `documents` | `id`, `title`, `type`, `year`, `people`, `events`, `desc` |
| `migrations` | `id`, `mode` (`person`/`branch`), `personId`, `branch`, `from`, `to`, `startYear`, nullable `endYear`, `description`, optional `source: "residence"` |
| `branches` | `id`, `name`, six-digit hex `color` |

A residence is `{ at: locationId, from: integerYear }`. People can have multiple branches. Parent/child, spouse and explicit sibling links are reciprocal. Siblings can also be inferred from shared parents; adding an explicit sibling does not invent or merge parents. Self-links, ancestor cycles, and a parent born at/after a child's birth are rejected.

Event/document links are reciprocal in both editors. Legacy one-sided assertions are preserved by reconciling their union, rather than dropping a link arbitrarily. Imports reject duplicate IDs and missing references. Deleting a location clears event `at` to unknown and removes or recomputes affected residence routes.

## Movement history

Residences are canonical for living-person pins and routes marked `source: "residence"`. Changes to a person's residences regenerate those routes while retaining matching record IDs and route notes. Editing a generated route's arrival/year updates the corresponding residence. Deleting a generated route removes its destination residence. Change its person or origin through the person's residence editor instead.

Additional person/branch routes are independent historical records, explicitly described that way in the migration form, and do not silently rewrite residence history. Existing routes matching consecutive residences are recognized as generated during migration. Personal migration dates and residence dates must fall within the person's lifetime. Route notes and end years are retained when editing a generated route.

## Time and coordinate semantics

Years must be integers between -9999 and 9999. A person is unborn before birth and deceased after the death year. Age stops at death; residence lookup is capped at death. The map clusters living people only. Slider bounds expand to include archive dates and the present year, retaining the original baseline range. Unknown locations are excluded from place totals.

Latitude must be -90…90 and longitude -180…180, supplied together or both blank. Stored stylized-map positions remain available for the offline map. Historical route arcs remain visible after `startYear`; `endYear` records travel duration rather than expiring the historical route.

## Validation, backups and persistence

`normalize()` is only a legacy adapter. All real imports and stored archives pass `parseArchive()` and full `validateArchive()` checks before rendering or mutation. Valid imports show counts and require explicit replacement confirmation. The prior saved archive is backed up before import/reset and valid legacy upgrades, under `familyAtlas.backup`.

Manage Data offers **Restore previous archive**, which itself preserves the current archive as the next rolling backup. This is one local recovery snapshot, not a remote backup history. Export JSON regularly for additional copies. Corrupt saved data is not overwritten automatically; the original can be exported for recovery.

Web Locks serialize writes across supporting browsers; revision checks prevent stale writes, storage events update other tabs, and stale record edits are rejected. A failed save retains pending changes and displays a warning with export/retry options. Loading the latest archive asks before discarding unsaved work. If a browser lacks Web Locks, revision checks still apply; simultaneous writes in unsupported browsers have not been independently validated.
