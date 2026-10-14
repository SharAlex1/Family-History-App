# Existing limitations retained from the prototype

These observations come from reading the original code. They are intentionally outside the behavior-preserving structural refactor.

- Data is local to a browser origin. There is no server, account system, multi-user synchronization, or automatic remote backup.
- Documents and avatars are placeholders; document records contain metadata, not uploaded files. Avatar cards render initials.
- The time range is fixed to 1896–2026, even when records use other years.
- The dedicated relationship editor updates both participants. Editing parent/spouse/child fields in a person form saves only that person, allowing inconsistent reciprocal links.
- Residence history drives living-person pins. Migration routes are a separate collection and are not regenerated when residences change. Migration `endYear` does not control map visibility.
- Event-to-document and document-to-event links can be edited independently and become inconsistent.
- Deleting a location removes residence and migration references but leaves event `at` references. Safe lookups display `Unknown` for missing records.
- Adding a sibling relation merges parents; a sibling link between two people with no parents has no represented effect. Ancestor cycles and other genealogical constraints are not validated.
- Import normalization checks top-level arrays but does not fully validate individual records. Malformed records can cause rendering errors.
- Browser storage read/write errors are swallowed by the original helpers, so the interface does not report failed persistence.
- The generational tree is a card layout with spouse grouping rather than a complete connecting-edge pedigree visualization.
- Map data and fonts depend on external network requests, with fallbacks. The stylized landmass fallback is approximate.

Handle fixes as explicit subsequent changes with tests and a migration plan where applicable.
