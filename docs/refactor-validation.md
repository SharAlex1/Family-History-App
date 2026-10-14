# Refactor validation

Source: uploaded `FamilyAtlas_4.jsx`.

Original file SHA-256: `ea96b41c4c8e2726fe141ac85f7007a33a2e29d73dcd4716b3c833c61f3a6158`.

The source was split into modules, with imports/exports added and archive state moved into a provider. The original source is not duplicated in the runtime repository.

## Direct comparison

The original single-file app and modular app were mounted independently using the same React dependencies in Chromium. Their rendered `#fa-root` HTML matched exactly for these 22 states:

- All seven primary views.
- All seven Manage Data tabs.
- All six add-entity forms.
- People at year 2026.
- Yosef's profile panel.

The comparison was run with external resources blocked to exercise the stylized-map fallback, and repeated with the same fetched Natural Earth land dataset supplied to both apps. The detailed map loaded and all 22 comparisons passed again. External fonts were blocked in these controlled comparisons. This verifies the sampled DOM states, not every possible interaction or visual pixel.

## Repository checks

- Production build with Vite.
- ESLint checks for undefined references and unused imports.
- Four unit tests covering historical status/age, residence selection, branch matching, and legacy/empty import normalization.
- A Chromium workflow test covering every view, management tabs, adding a person, reload persistence, and the year slider; no uncaught page errors.

The parity comparison was a one-time refactor check against the uploaded source. Unit and browser workflow tests remain in the repository, with CI configured to run them and the build/lint checks on pushes and pull requests. Cloud validation does not establish that a GitHub Actions run has completed.
