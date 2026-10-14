# Archive data model

The archive is one JSON object containing six arrays. Records link to other records by string IDs.

| Collection | Main fields |
| --- | --- |
| `people` | `id`, `first`, `last`, `gender`, `branches`, `birth`, nullable `death`, `born`, `avatar`, `bio`, `parents`, `spouses`, `children`, `residences` |
| `locations` | `id`, `name`, `region`, `lat`, `lng`, stylized-map `x`/`y`, `desc` |
| `events` | `id`, `type`, `year`, `people`, location `at`, `title`, `desc`, `docs`, `historical` |
| `documents` | `id`, `title`, `type`, `year`, `people`, `events`, `desc` |
| `migrations` | `id`, `mode` (`person`/`branch`), `personId`, `branch`, `from`, `to`, `startYear`, nullable `endYear`, `description` |
| `branches` | `id`, `name`, `color` |

A residence is `{ at: locationId, from: year }`. People can belong to multiple branches. Siblings are inferred from shared parents. Migration records are initially generated from consecutive seed residences, then edited independently.

## Time semantics

Years are whole-year values. A person is unborn before their birth year and deceased only after their death year. Age stops increasing at death. The latest residence at or before the selected year is used; for deceased people, residence lookup is capped at death. The map clusters living people only. Migration arcs appear once their start year is reached.

## Storage and imports

`lib/storage.js` reads/writes JSON under `familyAtlas.v2`. `normalize()` converts the legacy singular `branch` field into `branches` and supplies collection defaults. It is not a full schema validator. Import replaces the current archive; export downloads `family-atlas-data.json`.

Preserve IDs and the storage format in compatibility changes. Back up an export before replacing data. A future schema change should include explicit validation and migration rather than relying on normalization alone.
