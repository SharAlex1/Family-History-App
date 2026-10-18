# Architecture

## Rendering and data flow

`src/main.jsx` mounts the React application. `App.jsx` wraps the application shell in `DataProvider`, selects the current feature view, and owns transient UI state: year, playback, selected person, open profile, filters, search, and edit dialog.

`state/DataProvider.jsx` owns archive state and user-facing mutation/persistence feedback. `lib/archive.js` validates records and enforces reciprocal links, ancestry invariants and residence-derived history. `state/DataContext.jsx` exposes these operations to views and forms. Mutations use the latest persisted state under a Web Lock when supported, with revision checks and conflict detection for stale record editors; storage events synchronize other tabs. Failed saves retain pending work in memory with visible recovery/export/retry options. `lib/storage.js` handles parsing, validation, backups, revisions and downloads.

Feature views read the archive through context. Forms collect local draft values and hand them to provider actions on Save. Shared UI components render controls without creating a second archive store.

## Module responsibilities

| Location | Responsibility |
| --- | --- |
| `features/dashboard` | Summary statistics, featured events, navigation cards |
| `features/tree` | Original generation cards plus focusable SVG connected tree, pan/zoom and branch collapse |
| `features/timeline` | Chronological events, event-type/branch/person filtering |
| `features/map` | Historical living-person clusters and migration arcs |
| `features/people` | Searchable, branch-filtered people list |
| `features/documents` | IndexedDB-backed attachment editor, archive search, viewers, media ZIP import/export |
| `features/journeys` | Residence-by-residence guided map playback with linked evidence |
| `features/interviews` | Browser recording, transcript editing and audio archive integration |
| `features/stories` | Factual draft editing, saved books, printable/self-contained HTML |
| `features/relationships` | Kinship labels, shortest connection paths and shared ancestors |
| `features/research` | Evidence claims, citations, conflicts and research tasks |
| `features/memories` | Credited recollections, replies, invitation/contribution files |
| `features/discoveries` | Anniversaries, annual reminders, shared places and archive spotlight |
| `features/import` | GEDCOM preview, matching decisions and duplicate merge |
| `components/media` | Blob URL lifecycle, image/PDF/audio/video viewers and downloads |
| `features/manage` | Entity lists, editing dialogs, relationship management |
| `components/ui` | Buttons, badges, fields, dialogs, empty states |
| `components/layout` | Sidebar, search/branch controls, year slider |
| `components/people` | Cards, profile panel, residence editor |
| `components/maps` | Interactive location position picker |
| `config` | Palette, year limits, event/document categories |
| `data` | Demonstration archive and initial migration records |
| `state` | Archive ownership, CRUD, reference cleanup, relationships |
| `lib` | Archive validation and transformations, recoverable persistence, map loading/projection |
| `utils` | Historical calculations and identifier helpers |
| `styles` | Original CSS template, using theme constants |

## Preservation decisions

The initial refactor retained component bodies and behavior. The audit correction release preserves the familiar layout and sample records while centralizing data operations, tightening validation, synchronizing links and using native modal dialogs. The storage key remains compatible; schema v2 adds optional historical dates, parentage and file metadata plus six feature collections, with backups before upgrading existing valid archives. Styles remain a JavaScript template because they interpolate the shared theme; inline styles remain in their components.

New workspaces load through React lazy imports so they do not all enter the initial bundle. No router was introduced: navigation still selects a view in React state. No backend, placeholder service layer, authentication scaffolding, or empty directories were added. Documentation establishes the boundaries for future additions without suggesting those features already exist.

## Working incrementally

1. Find the affected feature or shared component.
2. Keep archive mutations in the provider and storage operations in `lib/storage.js`.
3. Preserve old exports when restructuring modules, or update their consumers together.
4. Run the existing tests and production build. Run browser checks for changes to views, forms, storage, or navigation.
5. Document intentional behavior changes and stored-data migrations.

For Codex cloud tasks, use the existing isolated checkout. Do not create a Git worktree unless the user requests one.

## Future boundaries

A remote database would replace or augment the persistence boundary and require conflict handling, migrations, and authorization. Local original files are implemented in IndexedDB; remote media sharing would require a storage service and authorization. Shared access would require server-enforced permissions. Add these modules alongside their implemented features; do not put secrets in frontend code or `VITE_*` variables.

## Domain modules

- `lib/extensions.js`: added-record validation and cross-feature deletion cleanup.
- `lib/dates.js`: historical precision, qualified/range dates and exact anniversaries.
- `lib/media.js`: content-addressed blobs, MIME/size checks and checksum-verified ZIPs using `fflate`.
- `lib/relationships.js`: ancestry traversals, shortest paths and kinship calculations.
- `lib/gedcom.js`: bounded genealogy parser, duplicate candidates, explicit person mapping and validated merges.
- `lib/stories.js`: deterministic factual prose and escaped, illustrated print HTML.
- `lib/discoveries.js`: local-calendar occasions and deterministic daily archive selections.

New mutations use the existing provider; no second archive store is introduced. Bulk merges save a rolling metadata backup. Files and metadata use separate browser stores, with files committed first. Content addressing avoids overwriting different bytes; leftover unreferenced files preserve local recovery. Map and story generation never invent coordinates or dates for imported unknown facts.

## Languages

The interface uses i18next/react-i18next with English and Russian catalogs in `src/i18n/`. The language control stores a separate browser preference, updates document language/title, and rerenders without remounting the archive provider. UI strings are explicitly translated; names and archive prose are interpolated or rendered verbatim. See [localization guidance](i18n/README.md).
