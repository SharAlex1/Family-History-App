import i18n, {tr} from "../i18n/index.js";
import { fullName } from "../utils/people.js";
import { dateLabel } from "./dates.js";
import { LAND_PATHS } from "./worldMap.js";
import { getMedia } from "./media.js";
export function biography(data, id) {
  const p = data.people.find((p) => p.id === id);
  if (!p) return "";
  const loc = (id) => data.locations.find(l=>l.id===id)?.name || tr("an unrecorded place");
  const parts = [p.birth!=null?tr("{{name}} was born {{date}}{{place}}.",{name:fullName(p),date:dateLabel(p),place:p.born?tr(" in {{place}}",{place:loc(p.born)}):""}):tr("{{name}}: birth date is not recorded.",{name:fullName(p)})];
  if (p.bio) parts.push(p.bio);
  for (const r of [...p.residences].sort((a, b) => a.from - b.from))
    parts.push(tr("In {{year}}, {{name}} is recorded living in {{place}}.",{year:r.from,name:p.first,place:loc(r.at)}));
  for (const e of data.events
    .filter((e) => e.people.includes(id))
    .sort((a, b) => a.year - b.year))
    parts.push(`${e.date || e.year}: ${e.title}.${e.desc ? ` ${e.desc}` : ""}`);
  if (p.death != null) parts.push(tr("{{name}} died {{date}}.",{name:p.first,date:dateLabel(p,"death")}));
  else if (p.deceased) parts.push(tr("Death is recorded; its date is unknown."));
  return parts.join("\n\n");
}
export const escapeHtml = (text) =>
  String(text ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
async function imageData(file) {
  const record = await getMedia(file.id);
  if (!record) return null;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(record.blob);
  });
}
export async function bookHtml(data, ids, title, narrative) {
  const people = data.people.filter((p) => ids.includes(p.id)),
    selected = new Set(ids),
    docs = data.documents.filter((d) =>
      d.people.some((id) => selected.has(id)),
    ),
    claims = (data.claims || []).filter((c) => selected.has(c.personId));
  let images = "";
  for (const doc of docs) {
    const file = doc.files?.find((f) => f.type.startsWith("image/"));
    if (file) {
      const src = await imageData(file);
      if (src)
        images += `<figure><img src="${src}" alt="${escapeHtml(doc.caption || doc.title)}"><figcaption>${escapeHtml(doc.title)} — ${escapeHtml(doc.caption || doc.desc)}</figcaption></figure>`;
    }
  }
  const points = people
    .flatMap((p) => p.residences)
    .map((r) => data.locations.find((l) => l.id === r.at))
    .filter((l) => l && !l.unmapped);
  const map = `<svg viewBox="0 0 1000 560" role="img" aria-label="${escapeHtml(tr("Recorded family locations (stylized map)"))}"><rect width="1000" height="560" fill="#eff4f6"/>${LAND_PATHS.map((d) => `<path d="${d}" fill="#c9d6dc"/>`).join("")}${points.map((l) => `<circle cx="${l.x}" cy="${l.y}" r="6" fill="#9a5a17"/><text x="${l.x + 8}" y="${l.y - 7}" font-size="13">${escapeHtml(l.name)}</text>`).join("")}</svg>`;
  const rows = people
    .flatMap((p) =>
      data.events
        .filter((e) => e.people.includes(p.id))
        .map((e) => ({ ...e, person: fullName(p) })),
    )
    .sort((a, b) => a.year - b.year);
  return `<!doctype html><html lang="${i18n.language}"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>body{font:15px/1.6 Georgia,serif;color:#202124;max-width:850px;margin:40px auto;padding:24px}h1,h2,h3{line-height:1.2}h1{font-size:38px}section{margin:32px 0}p{white-space:pre-wrap}img{max-width:100%;max-height:480px}figure{break-inside:avoid;margin:24px 0}figcaption,.note{font:12px/1.5 system-ui;color:#555}table{border-collapse:collapse;width:100%}td,th{padding:8px;text-align:left;border-bottom:1px solid #ddd}svg{width:100%}@media print{body{margin:0;padding:0;max-width:none}.page{break-before:page}h2,h3{break-after:avoid}tr{break-inside:avoid}@page{margin:18mm}</style></head><body><header><h1>${escapeHtml(title)}</h1><p>${people.map(fullName).map(escapeHtml).join(" · ")}</p><p class="note">${escapeHtml(tr("Prepared from the Family Atlas archive. User-entered records are not independently verified. Generated narrative uses recorded facts; edited wording remains the editor\u2019s responsibility."))}</p></header><section><h2>${escapeHtml(tr("Family narrative"))}</h2><p>${escapeHtml(narrative)}</p></section><section class="page"><h2>${escapeHtml(tr("Recorded places"))}</h2>${map}</section><section><h2>${escapeHtml(tr("Chronology"))}</h2><table><thead><tr><th>${escapeHtml(tr("Date"))}</th><th>${escapeHtml(tr("Person"))}</th><th>${escapeHtml(tr("Event"))}</th></tr></thead><tbody>${rows.map((e) => `<tr><td>${escapeHtml(e.date || e.year)}</td><td>${escapeHtml(e.person)}</td><td>${escapeHtml(e.title)}</td></tr>`).join("")}</tbody></table></section><section class="page"><h2>${escapeHtml(tr("Photographs"))}</h2>${images || `<p>${escapeHtml(tr("No locally available photographs are attached to these people."))}</p>`}</section><section class="page"><h2>${escapeHtml(tr("Sources and evidence"))}</h2><ol>${docs.map((doc) => `<li><strong>${escapeHtml(doc.title)}</strong> (${doc.year}); ${escapeHtml(doc.desc)}</li>`).join("")}</ol>${claims.map((c) => `<article><h3>${escapeHtml(c.field)}: ${escapeHtml(c.value)}</h3><p>${escapeHtml(tr(c.status))}; ${escapeHtml(data.documents.find((d) => d.id === c.documentId)?.title || tr("No source"))}; ${escapeHtml(c.page)}</p><blockquote>${escapeHtml(c.quote)}</blockquote><p>${escapeHtml(c.notes)}</p></article>`).join("")}</section></body></html>`;
}
