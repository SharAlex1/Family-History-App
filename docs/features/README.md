# Family Atlas feature release

This release adds all ten planned feature areas to the existing local archive. The sample family, original overview, generation cards, timeline, map and editing tools remain available. No account, API key or server is needed.

| Feature | Where to find it | What works |
| --- | --- | --- |
| Media archive | Documents | Upload images, PDFs, text, audio and video; captions, people/event tags, viewers, downloads, search and media ZIP backups |
| Connected family tree | Family Tree → Explore connected tree | Focus a person, explore ancestors/descendants or the archive, limit generations, collapse branches, zoom, pan and open profiles; parentage and spouse edges |
| Guided journeys | Follow a Journey | Play/pause or step through recorded residences; map follows each stop with events and evidence from those years |
| Oral histories | Oral History | Microphone recording, uploaded audio, interview prompts, written testimony, editable transcripts and transcript export |
| Stories and books | Stories & Books | Generate a draft from recorded facts, edit it, save drafts, download illustrated HTML or print/save as PDF, including chronology, places and citations |
| Kinship search | Relationship Finder | Recorded connection path, ancestors, cousins/removals, shared ancestors and profile links |
| Research notebook | Research & Evidence | Claims, source/page citations, quotations, evidence status, conflict detection, questions, progress and notes |
| Credited family contributions | Family Memories | Recollections, corrections, questions, replies and invitation/contribution files with import review and deduplication |
| Anniversaries and discoveries | On This Day | Exact-date anniversaries, next 30 days, rotating archive discovery, shared places, annual reminders and optional notifications while open |
| GEDCOM and duplicate merge | Import & Merge | UTF-8 genealogy file preview, possible-match decisions, merge field preference, existing duplicate review, reference redirection and retained alternative facts |

## Start with a safe backup

Use **Documents → Export archive with media** after adding attachments. This ZIP contains `archive.json` plus each referenced original file and is the complete portable backup. **Manage Data → Export JSON** contains metadata and written records only. Files live separately in this browser’s IndexedDB; JSON alone cannot transfer the originals.

Choose **Import media ZIP** to validate the archive and every file checksum, inspect counts, and confirm replacement. The previous metadata is backed up first. Its stored files remain available for local recovery. Import validation failures leave archive metadata unchanged. The app does not delete detached/orphaned files automatically, because the previous archive may still reference them. Browser storage clearance or moving to another origin requires restoring a ZIP.

Supported uploads: JPEG, PNG, WebP, GIF, AVIF, PDF, plain text, MP3, WAV, Ogg, WebM, MP4/M4A. Codec playback depends on the browser. HTML and SVG uploads are rejected. Limits: 100 MB per attachment; 500 MB per complete ZIP. Packaging runs in memory; very large archives may need a future streaming/server storage implementation.

## Dates and family links

**Manage Data → People → Edit** accepts optional full birth/death dates, including `1900-05-12`, `12 MAY 1900`, `ABT 1900`, `BEF 1900`, `AFT 1900`, and year ranges such as `BET 1900 AND 1905`. The associated year updates when the date parses. Keep them consistent when editing. Blank birth dates/years stay unknown. Events have an optional date field too. Only exact month/day dates generate anniversaries. February 29 anniversaries occur in leap years.

Choose a profile photograph from uploaded image attachments in the person editor. Removing its attachment returns the portrait to initials. Use **Manage Data → Relationships** to record biological, adoptive, step or unknown parentage when adding a parent/child link. The connected tree distinguishes non-biological links with a dashed line and label. Kinship follows recorded links, including adoption; it makes no genetic claim.

Imported places start unpositioned, without invented coordinates. In **Manage Data → Locations**, edit a place and supply coordinates or click its map position before expecting a pin. Maps use a stylized fallback when detailed external geometry is unavailable.

## Collect an oral history

Select the interview subject and a prompt. Start recording and grant the browser microphone permission, then stop and save. An audio document linked to the subject and an interview record are saved together. You can upload existing audio or save written testimony instead. Saved transcript edits persist on leaving the field; transcript export downloads JSON. Deleting an interview retains its recording in Documents.

Optional **Start live transcription** appears only when the browser exposes speech recognition. It starts only after an explicit click, and the browser may send audio to its speech service. Recognition accuracy/network availability is not guaranteed. Uploaded recordings need a typed/pasted transcript; there is no configured automatic transcription service. Recordings themselves stay in the browser.

## Make a book

Select people, then **Generate draft from records**. Generation replaces edited wording only after confirmation. Drafts describe existing facts and preserve uncertainty; no external AI service fills gaps. Review the wording, title the book and save the draft. **Download illustrated book** produces self-contained HTML with available photos. **Print / Save as PDF** opens a print window; select your browser’s PDF destination. Popup blocking is reported. Missing local photos are omitted; restore their ZIP first to include them.

## Invite a relative without sharing the full archive

1. In Family Memories, choose a person, event or document and create an invitation file.
2. Send that JSON through a channel you choose. The app sends no messages.
3. The relative opens Family Atlas → Family Memories → Open invitation / contribution. They can write a credited reply without having your archive.
4. They export their contribution and return the file to you.
5. Open it in your matching archive, review the preview and import new entries. Reimporting the same IDs does not duplicate or overwrite existing contributions.

Names are self-reported. Contributions are separate recollections or proposed corrections; importing one does not change a person’s canonical facts. Reply references must belong to the same subject. Deleting a parent contribution keeps replies and clears the missing-parent link. This workflow provides portable collaboration, not shared accounts, permissions, automatic synchronization or identity verification.

## Import a genealogy tree

Keep the original GEDCOM export. Choose a UTF-8 `.ged`/`.gedcom` file (up to 10 MB). Review counts and notes. Each possible duplicate defaults to **Create a separate person**; explicitly choose a suggested match if appropriate. Pick which record’s nonempty scalar fields take precedence, then confirm the merge. Changes since the preview require reopening the file. Invalid graphs or dates are rejected. Relationships, residences, sources and feature references are combined. Differing nonempty names/dates/biographies and other supported facts become research claims rather than disappearing.

Common GEDCOM 5.5/5.5.1 and 7 individual/family/source records are supported: names, sex, birth/death dates and places, parent/spouse links, `FAMC/PEDI` adoption hints, dated residences, occupation/education dates, marriage events, source/page/text citations and direct media paths as metadata. This is a deliberately bounded importer, not full GEDCOM conformance or round-trip export. Unsupported tags, pointer notes, alternate calendar formats, many custom facts and linked multimedia objects are not comprehensively preserved. Missing parents/undated residences/unsupported dates may produce notes. No external media paths or URLs are read. GEDCOM source catalog records without an explicit year use the current import year as their catalog year, not a claimed historical date.

Existing duplicate merge is separate and redirects records across the archive. Direct ancestry/spouse/explicit sibling links indicate distinct relatives and must be resolved before merging those two records. Review the field comparison first. The previous archive metadata is backed up before merges; keep a full ZIP for durable recovery.

## Verification

See [release verification](verification.md), the automated unit/browser suites in `tests/`, and the original [audit correction report](../audit/README.md). Browser checks use synthetic family data, files and microphone input, without publishing real family records.
