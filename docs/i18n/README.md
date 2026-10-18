# English and Russian

Use **Language / Язык** in the top bar to choose **English** or **Русский**. English is the default. The choice is stored separately from the family archive as `familyAtlas.language` and restored when this browser reopens the app. If browser storage is blocked, the language still changes for the current visit and a visible notice explains that the preference could not be saved.

The selection applies to navigation, all feature workspaces, forms, dialogs, accessibility labels, statuses, date formatting, reminders, generated factual drafts and book headings. Switching languages keeps the current workspace and typed drafts. Existing family names, locations, biographies, event titles, documents, memories, transcripts and saved book prose remain as entered. The English sample archive therefore continues to contain English descriptions in Russian mode. This is interface localization, not automatic translation of family records.

New factual story drafts use the selected language around the existing facts and verbatim archive prose. Book exports declare the selected HTML language and translate section labels, without rewriting the saved narrative. Historical date entry continues to support ISO dates and GEDCOM qualifiers such as ABT/BEF/AFT; the Russian placeholders explain their meaning. Speech recognition uses `ru-RU` or `en-US` when explicitly enabled and supported by the browser.

## Implementation

- `src/i18n/index.js` initializes `i18next` and `react-i18next`, validates the saved choice, supplies `tr`, `countText`, `formatDate` and `locale`, and sets document language/title.
- `src/i18n/ru.json` contains Russian messages. English messages use their readable English key by default; `en.json` supplies named count/plural templates.
- `src/i18n/kinship.js` localizes computed kinship descriptions without modifying family links.
- `src/components/layout/LanguageSelector.jsx` provides the native labeled select, keyboard support and preference-storage feedback.
- The root subscribes to language changes without a keyed remount, so the archive provider and form state survive switching.

Only interface text goes through `tr`. Never pass arbitrary archive prose or names to it. For a sentence containing user data, use a translated template and interpolation parameters, leaving those values untouched. React escapes rendered values; generated book HTML separately escapes interpolated text. Canonical IDs and enum values stay unchanged: a Russian option label for a letter still stores `type: "letter"`.

For counts, use named plural resources with English `one/other` and Russian `one/few/many/other` forms. Format calendar dates with the selected locale. Do not build Russian sentences by translating individual English words when a complete template or explicit action label is available. The translation helper retains recent message keys so shared controls and existing feedback can be rendered again after a language change.

Both languages ship with the application; switching requires no translation service, API key, remote request or network access. React's runtime is split into a reusable vendor chunk to keep the expanded application bundle below Vite's default chunk warning threshold.

## Validation

`tests/unit/i18n.test.js` checks literal message coverage, interpolation placeholders, Russian plural forms (1/2/5/21/22/25), locale dates, kinship, reversible feedback, book language and unchanged archive content. `tests/e2e/language.spec.js` checks selection, reload persistence, exact archive-byte preservation, retained drafts, Cyrillic records, canonical enum values, unavailable preference storage and all 15 Russian workspaces at 1440/768/390/320 pixels. The original English browser workflows remain in the same test run.

```sh
npm run lint
npm test
npm run build
CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e
```

Use Playwright's installed Chromium instead when `CHROMIUM_PATH` is omitted. Translation coverage and automated checks do not replace a native-speaking family's review of terminology or real-device accessibility testing.
