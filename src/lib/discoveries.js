import { exactAnniversary } from "./dates.js";
import { fullName } from "../utils/people.js";
export function discoveries(data, now = new Date()) {
  const year = now.getFullYear(),
    today = new Date(year, now.getMonth(), now.getDate());
  const occasions = [];
  const add = (date, title, personId, sourceYear, id) => {
    const candidate = new Date(year, date.month - 1, date.day);
    if (candidate.getMonth() !== date.month - 1) return;
    const days = Math.round((candidate - today) / 86400000);
    const next =
      days < 0 ? new Date(year + 1, date.month - 1, date.day) : candidate;
    occasions.push({
      id,
      title,
      personId,
      month: date.month,
      day: date.day,
      days: Math.round((next - today) / 86400000),
      onToday: days === 0,
      years: sourceYear != null ? year - sourceYear : null,
    });
  };
  for (const p of data.people) {
    for (const kind of ["birth", "death"]) {
      const date = exactAnniversary(p[`${kind}Date`]);
      if (date && date.year <= year)
        add(
          date,
          `${fullName(p)} — ${kind === "birth" ? "birthday" : "remembrance"}`,
          p.id,
          date.year,
          `${p.id}-${kind}`,
        );
    }
  }
  for (const e of data.events) {
    const date = exactAnniversary(e.date);
    if (date && date.year <= year)
      add(date, e.title, e.people[0] || "", date.year, e.id);
  }
  for (const r of data.reminders || []) add(r, r.title, r.personId, null, r.id);
  const connections = data.locations
    .map((l) => ({
      ...l,
      people: data.people.filter((p) =>
        p.residences.some((r) => r.at === l.id),
      ),
    }))
    .filter((l) => l.people.length > 1)
    .sort((a, b) => b.people.length - a.people.length);
  const records = [
    ...data.documents.map((d) => ({
      kind: "document",
      id: d.id,
      title: d.title,
      description: d.caption || d.desc,
      personId: d.people[0] || "",
      file: d.files?.[0],
    })),
    ...data.events.map((e) => ({
      kind: "event",
      id: e.id,
      title: `${e.year} · ${e.title}`,
      description: e.desc,
      personId: e.people[0] || "",
    })),
  ];
  const dayKey = Math.floor(
    Date.UTC(year, now.getMonth(), now.getDate()) / 86400000,
  );
  return {
    today: occasions.filter((o) => o.onToday),
    upcoming: occasions
      .filter((o) => o.days > 0 && o.days <= 30)
      .sort((a, b) => a.days - b.days),
    connections,
    spotlight: records.length
      ? records[((dayKey % records.length) + records.length) % records.length]
      : null,
  };
}
