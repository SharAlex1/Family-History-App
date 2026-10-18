# Language update verification

- **65 unit tests passed**, including message coverage, interpolation tokens, Russian plurals, dates, kinship and Russian books with verbatim archive prose.
- **26 browser workflows passed**, including five language workflows plus all earlier browser regressions. Tests compare exact saved archive bytes before/after switching and reloading; confirm Cyrillic data entry, stable enum values, retained drafts, fallback for unsupported preferences and switching when preference storage is blocked.
- **60 Russian layout checks passed**: all 15 views at 1440, 768, 390 and 320 pixels, with the language control visible and no unintended horizontal overflow outside the original scrollable generation tree.
- **Production smoke passed for all 15 Russian views**, with external requests blocked and no uncaught errors. Screenshots show [desktop](verification/russian-desktop.png) and [phone](verification/russian-phone.png) layouts.
- Lint and production build passed. The dependency audit reported **zero known vulnerabilities**.

The original 71-scenario audit initially passed 64 scenarios. One scenario was interrupted by a development hot reload. Six CRUD scenarios caught a change to the English empty-search wording; the original English wording was restored without changing the assertions. All seven affected scenarios were rerun successfully, giving **71 distinct passing scenarios**. The [initial run](verification/initial-results.json), [targeted rechecks](verification/rechecks.json) and [final combined results](verification/results.json) retain that history.

The browser regression run also exposed an existing save-timing problem in Research & Evidence: a fast second value could be cleared when the first asynchronous save finished. The claim form now disables its fields until the save completes, shows localized progress, and preserves subsequent input. The evidence workflow passed three repeated checks, then passed again in the complete 26-workflow run.

To repeat the checks, use the commands in the [language guide](README.md). For the production smoke, run `npm run preview -- --host 127.0.0.1 --port 5175`, then `node tests/audit/i18n-production.mjs`. `AUDIT_FILTER=N01,C01` selects individual scenarios in the older audit runner; its default still runs the full suite. Structured totals are in [checks.json](verification/checks.json).

Tests use Linux Chromium and synthetic family data. Native devices, other browser engines, real speech-service availability and a native-speaking family's terminology review remain outside this verification. Existing written family records are intentionally not automatically translated.
