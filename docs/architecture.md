# Architecture

## Rendering and data flow

`src/main.jsx` mounts the React application. `App.jsx` wraps the application shell in `DataProvider`, selects the current feature view, and owns transient UI state: year, playback, selected person, open profile, filters, search, and edit dialog.

`state/DataProvider.jsx` owns the archive, ID lookup tables, and all data mutations. `state/DataContext.jsx` exposes `useData()` to views and forms. Changes trigger React rendering and persist the archive through `lib/storage.js`.

Feature views read the archive through context. Forms collect local draft values and hand them to provider actions on Save. Shared UI components render controls without creating a second archive store.

## Module responsibilities

| Location | Responsibility |
| --- | --- |
| `features/dashboard` | Summary statistics, featured events, navigation cards |
| `features/tree` | Generational layout and spouse grouping |
| `features/timeline` | Chronological events, event-type/branch/person filtering |
| `features/map` | Historical living-person clusters and migration arcs |
| `features/people` | Searchable, branch-filtered people list |
| `features/documents` | Document and media metadata cards |
| `features/manage` | Entity lists, editing dialogs, relationship management |
| `components/ui` | Buttons, badges, fields, dialogs, empty states |
| `components/layout` | Sidebar, search/branch controls, year slider |
| `components/people` | Cards, profile panel, residence editor |
| `components/maps` | Interactive location position picker |
| `config` | Palette, year limits, event/document categories |
| `data` | Demonstration archive and initial migration records |
| `state` | Archive ownership, CRUD, reference cleanup, relationships |
| `lib` | Persistence boundary and map loading/projection |
| `utils` | Historical calculations and identifier helpers |
| `styles` | Original CSS template, using theme constants |

## Preservation decisions

Component render bodies, seed records, styles, storage key, validation rules, and data operations were retained. Application state was moved into a provider without changing its action implementations. Styles remain a JavaScript template because they interpolate the shared theme; inline styles remain in their components.

No router was introduced: navigation still selects a view in React state. No backend, placeholder service layer, authentication scaffolding, or empty directories were added. Documentation establishes the boundaries for future additions without suggesting those features already exist.

## Working incrementally

1. Find the affected feature or shared component.
2. Keep archive mutations in the provider and storage operations in `lib/storage.js`.
3. Preserve old exports when restructuring modules, or update their consumers together.
4. Run the existing tests and production build. Run browser checks for changes to views, forms, storage, or navigation.
5. Document intentional behavior changes and stored-data migrations.

For Codex cloud tasks, use the existing isolated checkout. Do not create a Git worktree unless the user requests one.

## Future boundaries

A remote database would replace or augment the persistence boundary and require conflict handling, migrations, and authorization. Real media would require a storage service plus file metadata and document viewers. Shared access would require server-enforced permissions. Add these modules alongside their implemented features; do not put secrets in frontend code or `VITE_*` variables.
