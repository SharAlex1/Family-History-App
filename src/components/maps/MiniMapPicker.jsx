import React from "react";
import { C } from "../../config/theme.js";
import { LAND_PATHS, useWorldMap } from "../../lib/worldMap.js";

function MiniMapPicker({ x, y, lat, lng, onPick }) {
  const world = useWorldMap();
  function handle(e) {
    const svg = e.currentTarget;
    const r = svg.getBoundingClientRect();
    const cx = Math.max(0, Math.min(1000, ((e.clientX - r.left) / r.width) * 1000));
    const cy = Math.max(0, Math.min(560, ((e.clientY - r.top) / r.height) * 560));
    let ll = null;
    if (world.proj && world.proj.invert) {
      const inv = world.proj.invert([cx, cy]);
      if (inv && Number.isFinite(inv[0]) && Number.isFinite(inv[1])) ll = { lng: inv[0], lat: inv[1] };
    }
    onPick(Math.round(cx), Math.round(cy), ll);
  }
  // Pin position: prefer the accurate projected spot from lat/lng, else stored x/y.
  let px = x, py = y;
  if (world.proj && Number.isFinite(lat) && Number.isFinite(lng)) {
    const p = world.proj([lng, lat]);
    if (p && Number.isFinite(p[0]) && Number.isFinite(p[1])) { px = p[0]; py = p[1]; }
  }
  return (
    <div style={{ borderRadius: 11, overflow: "hidden", border: `1px solid ${C.border}`, background: "#0b0d13" }}>
      <svg viewBox="0 0 1000 560" onClick={handle} style={{ width: "100%", display: "block", cursor: "crosshair" }}>
        <defs>
          <radialGradient id="fa-mini-ocean" cx="50%" cy="40%" r="80%"><stop offset="0%" stopColor="#11151f" /><stop offset="100%" stopColor="#0a0c12" /></radialGradient>
        </defs>
        <rect width="1000" height="560" fill="url(#fa-mini-ocean)" />
        {[120, 200, 280, 360, 440].map((yy) => <line key={"h" + yy} x1="0" y1={yy} x2="1000" y2={yy} stroke={C.borderSoft} strokeWidth="1" opacity="0.5" />)}
        {[160, 320, 480, 640, 800].map((xx) => <line key={"v" + xx} x1={xx} y1="0" x2={xx} y2="560" stroke={C.borderSoft} strokeWidth="1" opacity="0.5" />)}
        {world.landPath
          ? <path d={world.landPath} fill={C.panel2} stroke={C.border} strokeWidth="0.8" opacity="0.95" />
          : LAND_PATHS.map((d, i) => <path key={i} d={d} fill={C.panel2} stroke={C.border} strokeWidth="1.2" />)}
        {Number.isFinite(px) && Number.isFinite(py) && (
          <g>
            <circle cx={px} cy={py} r="16" fill={C.amber} opacity="0.18" />
            <circle cx={px} cy={py} r="8" fill={C.amber} stroke="#0b0d13" strokeWidth="2" />
          </g>
        )}
      </svg>
    </div>
  );
}

/* --------------------------- RESIDENCE EDITOR ---------------------------- */

export { MiniMapPicker };
