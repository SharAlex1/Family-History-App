# Family Atlas

An interactive family history explorer, organized from the original `FamilyAtlas_4.jsx` prototype. The existing interface, sample archive, editing behavior, time slider, and browser storage format are preserved.

## Develop locally

Use Node.js 24 LTS (Node 22.12 or newer is supported).

```sh
npm ci
npm run dev
```

Vite prints the development server address. The app needs no backend or credentials.

## Validate

```sh
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

To use an existing Chromium installation, set `CHROMIUM_PATH` to its executable path. CI installs Chromium with its Linux dependencies. `npm run preview` serves the production build for local checks.

## Where to work

- `src/features/`: the dashboard, family tree, timeline, map, people, documents, and data-management screens; management forms live alongside their feature.
- `src/components/`: reusable controls, dialogs, navigation, time slider, person cards, profiles, and map picker.
- `src/state/`: the shared archive provider, CRUD actions, relationship operations, and context hook.
- `src/data/`: sample family data and initial migration generation.
- `src/config/`: theme, year bounds, event and document categories.
- `src/lib/`: browser persistence and the external world map loader.
- `src/utils/`: identifiers and historical person calculations.
- `src/styles/`: the original global styles, including responsive behavior.
- `tests/`: unit checks and a browser workflow smoke test.
- `docs/`: architecture, data model, and known limitations.

Read [the architecture guide](docs/architecture.md) before making structural changes and [the data model](docs/data-model.md) before changing stored records. [Known limitations](docs/known-limitations.md) records existing behavior retained during this refactor.

## Data and external resources

Edits are saved under `familyAtlas.v2` in this browser's local storage. Export JSON from **Manage Data** to keep a backup or transfer the archive to another browser. Changing the hosting origin creates a separate browser storage area.

The map fetches Natural Earth land data from jsDelivr, with unpkg as a fallback. If these requests fail, the original stylized map remains available. Google Fonts supplies the display fonts, with local font fallbacks. There are no API keys, authentication services, uploads, or server database in this version.

## Scope

This repository provides a maintainable frontend foundation. The original prototype was separated into modules; existing application defects were documented rather than silently changed. Future backend, real media storage, authentication, and collaboration should be designed when those features are implemented.
