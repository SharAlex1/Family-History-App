import { MIN_YEAR, MAX_YEAR } from "../config/theme.js";
export function timeBounds(data) {
  const years = [
    MIN_YEAR,
    MAX_YEAR,
    new Date().getFullYear(),
    ...data.people.flatMap((p) => [
      p.birth,
      p.death,
      ...p.residences.map((r) => r.from),
    ]),
    ...data.events.map((e) => e.year),
    ...data.documents.map((d) => d.year),
    ...data.migrations.flatMap((m) => [m.startYear, m.endYear]),
  ].filter(Number.isFinite);
  return { min: Math.min(...years), max: Math.max(...years) };
}
