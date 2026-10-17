# Archive data model

The JSON archive contains twelve arrays linked by string IDs, plus `schemaVersion: 2` and a nonnegative `_revision` used for browser concurrency. Version 1 and versions without schema metadata are treated as legacy archives and validated before upgrade. IDs and the `familyAtlas.v2` storage key remain compatible.

| Collection | Main fields |
| --- | --- |
| `people` | `id`, `first`, `last`, `gender`, `branches`, nullable `birth`/`death`, optional `birthDate`/`deathDate`, `deceased`, `parentTypes`, `photoFileId`, `born`, `avatar`, `bio`, `parents`, `spouses`, `children`, optional explicit `siblings`, `residences` |
| `locations` | `id`, `name`, `region`, nullable paired `lat`/`lng`, stylized-map `x`/`y`, `unmapped`, `desc` |
| `events` | `id`, `type`, `year`, optional `date`, `people`, optional location `at` (empty means unknown), `title`, `desc`, `docs`, `historical` |
| `documents` | `id`, `title`, `type`, `year`, `people`, `events`, `desc`, optional `caption`, `files` |
| `migrations` | `id`, `mode` (`person`/`branch`), `personId`, `branch`, `from`, `to`, `startYear`, nullable `endYear`, `description`, optional `source: "residence"` |
| `branches` | `id`, `name`, six-digit hex `color` |

Additional collections:

| Collection | Main fields |
| --- | --- |
| `interviews` | `id`, `personId`, optional `documentId`, `title`, `prompt`, `transcript`, `createdAt` |
| `claims` | `id`, `personId`, `field`, `value`, optional `documentId`, `page`, `quote`, `notes`, `status` (`unverified`/`supported`/`disputed`) |
| `researchTasks` | `id`, optional `personId`, `title`, `notes`, `status` (`open`/`in-progress`/`done`) |
| `memories` | `id`, `subjectKind` (`people`/`events`/`documents`), `subjectId`, `author`, `text`, `kind` (`memory`/`correction`/`question`), optional `replyTo`, `createdAt` |
| `reminders` | `id`, optional `personId`, `title`, `month`, `day` |
| `books` | `id`, `title`, `people`, `narrative`, `createdAt` |

Legacy archives receive empty additional collections during reconciliation. Their original records and IDs are preserved. Each person’s optional `parentTypes` maps a parent ID to `biological`, `adoptive`, `step` or `unknown`. Full date strings preserve input precision and must agree with the corresponding numeric year. Approximate/range dates supply an anchor year for the existing timeline; they do not establish an exact birthday. Unknown birth is `null`, not a fabricated year. `deceased: true` supports a death with unknown date and therefore unknown historical life status/age.

A residence is `{ at: locationId, from: integerYear }`. People can have multiple branches. Parent/child, spouse and explicit sibling links are reciprocal. Siblings can also be inferred from shared parents; adding an explicit sibling does not invent or merge parents. Self-links, ancestor cycles, and a parent born at/after a child's birth are rejected.

Event/document links are reciprocal in both editors. Legacy one-sided assertions are preserved by reconciling their union, rather than dropping a link arbitrarily. Imports reject duplicate IDs and missing references. Deleting a location clears event `at` to unknown and removes or recomputes affected residence routes.

## Movement history

Residences are canonical for living-person pins and routes marked `source: "residence"`. Changes to a person's residences regenerate those routes while retaining matching record IDs and route notes. Editing a generated route's arrival/year updates the corresponding residence. Deleting a generated route removes its destination residence. Change its person or origin through the person's residence editor instead.

Additional person/branch routes are independent historical records, explicitly described that way in the migration form, and do not silently rewrite residence history. Existing routes matching consecutive residences are recognized as generated during migration. Personal migration dates and residence dates must fall within the person's lifetime. Route notes and end years are retained when editing a generated route.

## Time and coordinate semantics

Years must be integers between -9999 and 9999. A person is unborn before birth and deceased after the death year. Age stops at death; residence lookup is capped at death. The map clusters people with a known living status only. Unpositioned imported places (`unmapped: true`) are excluded from geographic pins/routes until positioned. Slider bounds expand to include archive dates and the present year, retaining the original baseline range. Unknown locations are excluded from place totals.

Latitude must be -90…90 and longitude -180…180, supplied together or both blank. Stored stylized-map positions remain available for the offline map. Historical route arcs remain visible after `startYear`; `endYear` records travel duration rather than expiring the historical route.

## Validation, backups and persistence

`normalize()` is only a legacy adapter. All real imports and stored archives pass `parseArchive()` and full `validateArchive()` checks before rendering or mutation. Valid imports show counts and require explicit replacement confirmation. The prior saved archive is backed up before import/reset and valid legacy upgrades, under `familyAtlas.backup`.

Manage Data offers **Restore previous archive**, which itself preserves the current archive as the next rolling backup. This is one local recovery snapshot, not a remote backup history. Export JSON regularly for additional copies. Corrupt saved data is not overwritten automatically; the original can be exported for recovery.

Web Locks serialize writes across supporting browsers; revision checks prevent stale writes, storage events update other tabs, and stale record edits are rejected. A failed save retains pending changes and displays a warning with export/retry options. Loading the latest archive asks before discarding unsaved work. If a browser lacks Web Locks, revision checks still apply; simultaneous writes in unsupported browsers have not been independently validated.

## Original files and portable formats

Each `documents[].files[]` entry contains `{id, name, type, size, sha256}`. Its ID is `file_` plus the lowercase SHA-256 hash. Metadata validation rejects mismatched IDs, inconsistent sizes/types and oversized descriptors. File bytes are stored as `Blob` values in IndexedDB database `family-atlas-media`, object store `files`, keyed by that ID. Portraits reference an attached image ID. Detached files stay stored for recovery; dangling portrait selections revert to initials when an attachment is removed.

A media ZIP includes `archive.json` and `media/file_<hash>` entries. Imports validate the schema, reference graph, file sizes, accepted MIME types and every checksum before writing metadata. Blob writes use an IndexedDB transaction and finish before metadata replacement. A failed metadata commit can leave unreferenced blobs; it cannot erase previously stored bytes. JSON backups intentionally exclude blobs.

Invitation and contribution JSON files use explicit `format`, `version: 1` and `{kind,id,title}` subject metadata. Contributions contain credited `memories`. Imports add new IDs only, validate matching subjects and reply links, and reject reply cycles. They never replace canonical person facts.

GEDCOM imports generate fresh IDs, preserve input date wording, preview candidate matches and apply an explicit mapping. Person merges redirect people IDs throughout core collections and all feature collections, preserve alternative supported scalar facts as claims, then reconcile and validate the resulting archive. Source catalog years without historical dates are import years. The importer does not fetch external media or infer geographic coordinates.
