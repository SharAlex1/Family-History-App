export function relativeIds(people, root, direction = "ancestors", depth = 5) {
  const byId = new Map(people.map((p) => [p.id, p])),
    seen = new Set([root]);
  let queue = [[root, 0]];
  while (queue.length) {
    const [id, n] = queue.shift();
    if (n >= depth) continue;
    for (const next of byId.get(id)?.[
      direction === "ancestors" ? "parents" : "children"
    ] || [])
      if (!seen.has(next)) {
        seen.add(next);
        queue.push([next, n + 1]);
      }
  }
  return seen;
}
export function ancestorDistances(people, id) {
  const byId = new Map(people.map((p) => [p.id, p])),
    dist = new Map([[id, 0]]),
    queue = [id];
  while (queue.length) {
    const current = queue.shift();
    for (const parent of byId.get(current)?.parents || [])
      if (!dist.has(parent)) {
        dist.set(parent, dist.get(current) + 1);
        queue.push(parent);
      }
  }
  return dist;
}
const ordinal = (n) =>
  [
    "",
    "first",
    "second",
    "third",
    "fourth",
    "fifth",
    "sixth",
    "seventh",
    "eighth",
    "ninth",
    "tenth",
  ][n] || `${n}th`;
function ancestorLabel(distance, gender) {
  const parent =
    gender === "f" ? "mother" : gender === "m" ? "father" : "parent";
  return distance === 1
    ? parent
    : distance === 2
      ? `grand${parent}`
      : `${"great-".repeat(Math.min(distance - 2, 12))}grand${parent}`;
}
export function findRelationship(people, from, to) {
  const byId = new Map(people.map((p) => [p.id, p]));
  if (!byId.has(from) || !byId.has(to))
    return { label: "Choose two people", path: [], common: [] };
  const a = byId.get(from),
    b = byId.get(to),
    da = ancestorDistances(people, from),
    db = ancestorDistances(people, to);
  const common = [...da.keys()]
    .filter((id) => db.has(id) && id !== from && id !== to)
    .sort((x, y) => da.get(x) + db.get(x) - da.get(y) - db.get(y));
  const edges = (p) => [
    ...p.parents.map((id) => ({
      id,
      label: `${p.parentTypes?.[id] || "recorded"} parent`,
    })),
    ...p.children.map((id) => ({
      id,
      label: `child (${byId.get(id)?.parentTypes?.[p.id] || "recorded"})`,
    })),
    ...p.spouses.map((id) => ({ id, label: "spouse" })),
    ...(p.siblings || []).map((id) => ({ id, label: "recorded sibling" })),
  ];
  const queue = [from],
    previous = new Map([[from, null]]);
  while (queue.length && !previous.has(to)) {
    const current = queue.shift();
    for (const edge of edges(byId.get(current)))
      if (byId.has(edge.id) && !previous.has(edge.id)) {
        previous.set(edge.id, { id: current, label: edge.label });
        queue.push(edge.id);
      }
  }
  const path = [];
  if (previous.has(to)) {
    let id = to;
    while (id !== from) {
      const prev = previous.get(id);
      path.unshift({ id, label: prev.label });
      id = prev.id;
    }
    path.unshift({ id: from, label: "start" });
  }
  let label = "No recorded connection";
  if (from === to) label = "Same person";
  else if (a.spouses.includes(to)) label = "Spouse";
  else if (da.has(to)) label = ancestorLabel(da.get(to), b.gender);
  else if (db.has(from)) {
    const n = db.get(from);
    label =
      n === 1
        ? b.gender === "f"
          ? "daughter"
          : b.gender === "m"
            ? "son"
            : "child"
        : n === 2
          ? "grandchild"
          : `${"great-".repeat(Math.min(n - 2, 12))}grandchild`;
  } else if (common.length) {
    const x = da.get(common[0]),
      y = db.get(common[0]);
    if (x === 1 && y === 1) {
      const shared = a.parents.filter((id) => b.parents.includes(id)).length;
      label = shared === 1 ? "Sibling (one recorded shared parent)" : "Sibling";
    } else if (y === 1)
      label = `${"great-".repeat(Math.max(0, x - 2))}${b.gender === "f" ? "aunt" : b.gender === "m" ? "uncle" : "aunt/uncle"}`;
    else if (x === 1)
      label = `${"great-".repeat(Math.max(0, y - 2))}${b.gender === "f" ? "niece" : b.gender === "m" ? "nephew" : "niece/nephew"}`;
    else {
      const removed = Math.abs(x - y);
      label = `${ordinal(Math.min(x, y) - 1)} cousin${removed ? ` ${removed === 1 ? "once" : removed === 2 ? "twice" : `${removed} times`} removed` : ""}`;
    }
  } else if ((a.siblings || []).includes(to)) label = "Recorded sibling";
  else if (path.length)
    label = "Connected through marriage or recorded family links";
  return {
    label,
    path,
    common: common.map((id) => ({ id, from: da.get(id), to: db.get(id) })),
    basis:
      "Calculated from recorded family links, including adoptive and step-parent links; this is not a genetic matching result.",
  };
}
