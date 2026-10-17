# Family Atlas

An interactive family history explorer, organized from the original `FamilyAtlas_4.jsx` prototype. The original views and sample archive remain, with a real media archive, connected tree, guided journeys, oral histories, printable family books, kinship search, research evidence, portable family contributions, anniversaries and GEDCOM merging. See the [feature guide](docs/features/README.md).

## Develop locally

Use Node.js 24 LTS (Node 22.12 or newer is supported).

```sh
npm ci
npm run dev
```

Vite prints the development server address. The app needs no backend or credentials.

## Windows installation notes

In Command Prompt, `npm.cmd ci` and `npm.cmd run dev` are equivalent to the commands above. If you downloaded a ZIP, download and extract the latest `main` archive to receive dependency updates; rerunning `npm ci` in an older extracted copy keeps its older lockfile.

An ESLint 9 deprecation warning is currently expected: the React lint plugin has not declared support for ESLint 10. It does not mean installation failed. Vitest is updated separately to resolve the reported security advisories; do not use `npm audit fix --force` as a general setup step.

If your npm version reports that esbuild's install script needs approval, review it with `npm.cmd install-scripts ls`. If startup fails because that script was withheld, approve the listed esbuild package with `npm.cmd install-scripts approve esbuild`, then retry. This command applies only to npm versions exposing the `install-scripts` approval workflow.

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

- `src/features/`: individual workspaces for the original views and all ten feature areas; management forms live alongside their feature.
- `src/components/`: reusable controls, dialogs, navigation, time slider, person cards, profiles, and map picker.
- `src/state/`: the shared archive provider, CRUD actions, relationship operations, and context hook.
- `src/data/`: sample family data and initial migration generation.
- `src/config/`: theme, year bounds, event and document categories.
- `src/lib/`: archive validation, dates, relationships, GEDCOM merging, media storage/ZIPs, factual story generation, discoveries, browser persistence and map loading.
- `src/utils/`: identifiers and historical person calculations.
- `src/styles/`: the original global styles, including responsive behavior.
- `tests/`: unit invariants, browser integrity workflows, and the full feature audit.
- `docs/`: architecture, data model, and known limitations.

Read [the architecture guide](docs/architecture.md) before making structural changes and [the data model](docs/data-model.md) before changing stored records. [Known limitations](docs/known-limitations.md) describes the current feature boundaries. The [audit and fix verification](docs/audit/README.md) tracks the 25 corrected findings.

## Data and external resources

Edits are saved under `familyAtlas.v2` in this browser's local storage. Imports are validated and previewed before replacement. A rolling previous-archive backup is kept under `familyAtlas.backup`; use **Restore previous archive** in Manage Data to restore it. Existing valid archives are upgraded with reciprocal links and backed up before migration. Invalid stored archives remain untouched, with recovery export offered. Save failures are shown visibly. Export JSON from **Manage Data** for written records and metadata. Use **Documents → Export archive with media** for a complete ZIP backup, including original attachments stored in IndexedDB. Import that ZIP to transfer the whole archive to another browser. Changing the hosting origin creates a separate browser storage area.

The map fetches Natural Earth land data from jsDelivr, with unpkg as a fallback. If these requests fail, the original stylized map remains available. Google Fonts supplies the display fonts, with local font fallbacks. No API keys or server database are needed. Attachments are uploaded into browser storage; family contributions travel through explicitly exchanged JSON files. Optional live browser speech recognition can use the browser’s speech service after you enable it.

## Scope

This is a local-first application with modular feature workspaces and tested archive transformations. It includes original-file storage and portable collaboration. Accounts, online sharing, server backups and background services remain future work; see [current boundaries](docs/known-limitations.md).
