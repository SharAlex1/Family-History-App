

const fullName = (p) => `${p.first} ${p.last}`.trim();

const initials = (p) => `${(p.first || "?")[0]}${(p.last || "")[0] || ""}`.toUpperCase();

function statusAt(p, year) {
  if (p.birth != null && year < p.birth) return "unborn";
  if (p.death != null && year > p.death) return "deceased";
  if (p.birth == null || (p.deceased && p.death == null)) return "unknown";
  return "alive";
}

function ageAt(p, year) {
  if (p.birth == null || year < p.birth || (p.deceased && p.death == null)) return null;
  const cap = p.death != null ? Math.min(year, p.death) : year;
  return cap - p.birth;
}

function residenceAt(p, year) {
  if (p.birth != null && year < p.birth) return null;
  const ref = p.death != null ? Math.min(year, p.death) : year;
  let cur = null;
  const sorted = [...(p.residences || [])].sort((a, b) => a.from - b.from);
  for (const r of sorted) if (r.from <= ref) cur = r;
  return cur ? cur.at : null;
}
// Branch filter: empty selection means "all branches". A person matches if any of
// their branches is in the selected set.

const personBranches = (p) => p.branches || [];

const matchBranch = (p, sel) => !sel || sel.length === 0 || personBranches(p).some((b) => sel.includes(b));

/* ============================ DATA CONTEXT =============================== */

export { fullName, initials, statusAt, ageAt, residenceAt, personBranches, matchBranch };
