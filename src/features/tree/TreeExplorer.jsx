import { tr } from "../../i18n/index.js";
import React, { useMemo, useRef, useState } from "react";
import { useData } from "../../state/DataContext.jsx";
import { PersonPicker } from "../../components/ui/FeatureUI.jsx";
import { Btn } from "../../components/ui/Primitives.jsx";
import { relativeIds } from "../../lib/relationships.js";
import { fullName, statusAt } from "../../utils/people.js";
import { C } from "../../config/theme.js";
export function TreeExplorer({ year, openPerson, branchSel }) {
  const { data } = useData();
  const [root, setRoot] = useState(data.people[0]?.id || ""),
    [direction, setDirection] = useState("descendants"),
    [depth, setDepth] = useState(5),
    [collapsed, setCollapsed] = useState([]),
    [zoom, setZoom] = useState(1),
    [pan, setPan] = useState({ x: 30, y: 30 });
  const drag = useRef(null);
  const layout = useMemo(() => {
    const byId = new Map(data.people.map((p) => [p.id, p])),
      visible =
        direction === "all"
          ? new Set(byId.keys())
          : relativeIds(data.people, root, direction, depth);
    for (const id of collapsed) {
      const hidden = relativeIds(
        data.people,
        id,
        direction === "ancestors" ? "ancestors" : "descendants",
        depth,
      );
      hidden.delete(id);
      hidden.forEach((x) => visible.delete(x));
    }
    const levels = new Map(),
      queue = [[root, 0]],
      seen = new Set();
    while (queue.length) {
      const [id, level] = queue.shift();
      if (seen.has(id) || !visible.has(id)) continue;
      seen.add(id);
      levels.set(id, level);
      for (const child of byId.get(id)?.[
        direction === "ancestors" ? "parents" : "children"
      ] || [])
        queue.push([child, level + 1]);
    }
    let rest = 0;
    for (const id of visible)
      if (!levels.has(id)) levels.set(id, rest++ % Math.max(1, depth));
    const rows = new Map();
    for (const [id, l] of levels)
      (rows.get(l) || rows.set(l, []).get(l)).push(byId.get(id));
    const positions = new Map();
    for (const [l, ps] of rows)
      ps.forEach((p, i) => positions.set(p.id, { x: i * 224, y: l * 152, p }));
    return { positions, byId };
  }, [data.people, root, direction, depth, collapsed]);
  const positions = [...layout.positions.values()];
  return (
    <section className="tree-explorer">
      <div className="feature-grid">
        <PersonPicker
          label={tr("Focus person")}
          value={root}
          onChange={(id) => {
            setRoot(id);
            setCollapsed([]);
            setPan({ x: 30, y: 30 });
          }}
        />
        <label className="studio-field">{tr("Explore")}<select
            value={direction}
            onChange={(e) => {
              setDirection(e.target.value);
              setCollapsed([]);
            }}
          >
            <option value="descendants">{tr("Descendants")}</option>
            <option value="ancestors">{tr("Ancestors")}</option>
            <option value="all">{tr("Entire archive")}</option>
          </select>
        </label>
        <label className="studio-field">{tr("Generations")}<input
            type="number"
            min="1"
            max="12"
            value={depth}
            onChange={(e) =>
              setDepth(Math.max(1, Math.min(12, Number(e.target.value) || 1)))
            }
          />
        </label>
      </div>
      <div className="feature-actions">
        <Btn onClick={() => setZoom((z) => Math.min(3, z + 0.2))}>{tr("Zoom in")}</Btn>
        <Btn onClick={() => setZoom((z) => Math.max(0.25, z - 0.2))}>{tr("Zoom out")}</Btn>
        <Btn
          onClick={() => {
            setZoom(1);
            setPan({ x: 30, y: 30 });
            setCollapsed([]);
          }}
        >{tr("Reset tree")}</Btn>
        <span>
          {positions.length}{tr(" people · Drag to pan, or focus the canvas and use arrow keys. Blue: parents; pink: spouses.")}</span>
      </div>
      <svg
        aria-label={tr("Interactive family tree")}
        role="group"
        tabIndex={0}
        viewBox="0 0 1000 650"
        className="tree-canvas"
        onKeyDown={(e) => {
          if (
            ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)
          ) {
            e.preventDefault();
            setPan((p) => ({
              x:
                p.x +
                (e.key === "ArrowLeft" ? 40 : e.key === "ArrowRight" ? -40 : 0),
              y:
                p.y +
                (e.key === "ArrowUp" ? 40 : e.key === "ArrowDown" ? -40 : 0),
            }));
          }
        }}
        onPointerDown={(e) => {
          if (e.target.closest("[data-tree-node]")) return;
          drag.current = { x: e.clientX, y: e.clientY, pan };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (drag.current) {
            const rect = e.currentTarget.getBoundingClientRect();
            setPan({
              x:
                drag.current.pan.x +
                ((e.clientX - drag.current.x) * 1000) / rect.width,
              y:
                drag.current.pan.y +
                ((e.clientY - drag.current.y) * 650) / rect.height,
            });
          }
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
          {positions.flatMap(({ p, x, y }) =>
            p.parents.map((id) => {
              const parent = layout.positions.get(id);
              if (!parent) return null;
              return (
                <g key={`${id}-${p.id}`}>
                  <path
                    d={`M${parent.x + 94},${parent.y + 82} V${(parent.y + y + 82) / 2} H${x + 94} V${y}`}
                    fill="none"
                    stroke={C.sky}
                    strokeWidth="2"
                    strokeDasharray={
                      p.parentTypes?.[id] && p.parentTypes[id] !== "biological"
                        ? "6 4"
                        : undefined
                    }
                  />
                  <text x={x + 97} y={y - 6} fill={C.sky} fontSize="10">
                    {tr(p.parentTypes?.[id] || "parent")}
                  </text>
                </g>
              );
            }),
          )}
          {positions.flatMap(({ p, x, y }) =>
            p.spouses
              .filter((id) => id > p.id)
              .map((id) => {
                const sp = layout.positions.get(id);
                return sp ? (
                  <path
                    key={`${p.id}-${id}`}
                    d={`M${x + 188},${y + 38} L${sp.x},${sp.y + 38}`}
                    fill="none"
                    stroke={C.rose}
                    strokeWidth="2"
                  />
                ) : null;
              }),
          )}
          {positions.map(({ p, x, y }) => (
            <g
              key={p.id}
              data-tree-node="true"
              transform={`translate(${x},${y})`}
              opacity={
                branchSel.length &&
                !p.branches.some((b) => branchSel.includes(b))
                  ? 0.3
                  : 1
              }
            >
              <g
                role="button"
                tabIndex={0}
                aria-label={tr("Open {{v0}}", {v0: fullName(p)})}
                onClick={() => openPerson(p.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    openPerson(p.id);
                  }
                }}
              >
                <rect
                  width="188"
                  height="82"
                  rx="12"
                  fill={C.panelSolid}
                  stroke={p.id === root ? C.amber : C.border}
                />
                <text x="12" y="26" fill={C.text} fontSize="14">
                  {fullName(p).slice(0, 23)}
                </text>
                <text x="12" y="46" fill={C.sub} fontSize="12">
                  {p.birth ?? "?"} – {p.death ?? (p.deceased ? "?" : tr("present"))}
                </text>
                <text x="12" y="65" fill={C.teal} fontSize="11">
                  {tr(statusAt(p, year))}{tr(" in ")}{year}
                </text>
              </g>
              <g
                role="button"
                tabIndex={0}
                aria-label={tr("{{v0}} {{v1}}", {v0: tr(collapsed.includes(p.id) ? "Expand" : "Collapse"), v1: fullName(p)})}
                transform="translate(164,88)"
                onClick={() =>
                  setCollapsed((c) =>
                    c.includes(p.id)
                      ? c.filter((id) => id !== p.id)
                      : [...c, p.id],
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                    setCollapsed((c) =>
                      c.includes(p.id)
                        ? c.filter((id) => id !== p.id)
                        : [...c, p.id],
                    );
                  }
                }}
              >
                <rect width="24" height="24" rx="6" fill={C.panel2} />
                <text x="8" y="17" fill={C.amber}>
                  {collapsed.includes(p.id) ? "+" : "−"}
                </text>
              </g>
            </g>
          ))}
        </g>
      </svg>
    </section>
  );
}
