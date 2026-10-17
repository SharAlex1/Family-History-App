# Current feature boundaries

The 25 findings from the original audit have been corrected; see [verification and fixes](audit/README.md). These remaining boundaries describe features and test coverage, not unresolved claims that the old bugs still exist.

- Data is local to a browser origin. There are no accounts, server database, family permissions, remote backups or cross-device synchronization. Export JSON for durable copies; the automatic backup is one rolling local snapshot.
- Document cards, audio/video categories and avatar fields are metadata/placeholders. They do not upload files, play media or render avatar photos.
- Pins are static SVG markers; linked people open through the cards below the map. Pan/zoom and interactive pin tooltips are not implemented.
- Residence-derived routes are synchronized. Additional historical routes remain explicitly separate records. A route's end year records duration, not an expiry date for its map arc.
- Branch controls affect tree/timeline/map/people. Overview, documents and data management intentionally show the full archive; the filter group has an accessible scope label.
- The tree uses generational cards and spouse grouping rather than a complete edge-based pedigree visualization. Complex adoption, uncertain dates and evidence confidence need a richer data model. Explicit sibling connections preserve unknown/half-parent information without inferring new parents.
- Navigation/year/filter state is not encoded in the URL. Refresh and browser Back do not restore that UI state. Cancel/backdrop closes a form and discards its draft.
- Fonts and detailed map geometry use external CDNs with fallbacks. All CDN failure permutations and offline font delivery have not been tested.
- Validation was exercised in Chromium on Linux, with desktop/tablet/phone viewport widths. Native Windows, other browsers, real mobile touch, screen-reader sessions and large archives remain unverified. Modern browsers with native dialog, structuredClone and Web Locks support are recommended. Revision guards also run when Web Locks are unavailable, but simultaneous writes in that fallback have not been independently validated.
- ESLint 9 remains pinned for React lint-plugin compatibility and can emit a deprecation notice. The dependency audit reports no known vulnerabilities at verification time.
