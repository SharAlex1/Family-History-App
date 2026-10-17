import React from "react";
import { MapPin } from "lucide-react";
import { C } from "../../config/theme.js";
import { fullName, statusAt, ageAt, residenceAt } from "../../utils/people.js";
import { useData } from "../../state/DataContext.jsx";
import { Avatar, StatusDot } from "../ui/Primitives.jsx";

function PersonCard({ p, year, onClick, selected, dim }) {
  const { getL } = useData();
  const status = statusAt(p, year);
  const age = ageAt(p, year);
  const where = residenceAt(p, year);
  return (
    <button onClick={onClick} className="fa-card fa-click" style={{ textAlign: "left", width: 188, padding: 12, borderRadius: 14, background: C.panelSolid, border: `1px solid ${selected ? C.amber : C.border}`, opacity: dim ? 0.32 : status === "unborn" ? 0.55 : 1, filter: status === "deceased" ? "saturate(0.55)" : "none", boxShadow: selected ? `0 0 0 3px ${C.amber}22` : "none" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Avatar p={p} size={40} status={status} selected={selected} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 600, fontSize: 15, color: C.text, lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fullName(p)}</div>
          <div style={{ fontSize: 11.5, color: C.faint, marginTop: 2 }}>{p.birth ?? "?"}{p.death != null ? ` – ${p.death}` : ""}</div>
        </div>
      </div>
      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
        {status === "alive" && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.text }}>
            <span style={{ color: C.amber, fontWeight: 600 }}>{age}</span><span style={{ color: C.sub }}>years old</span>
            {where && <span style={{ color: C.faint, display: "inline-flex", alignItems: "center", gap: 3, marginLeft: "auto" }}><MapPin size={11} />{getL(where).name}</span>}
          </div>
        )}
        <StatusDot status={status} />
      </div>
    </button>
  );
}

/* ============================== DASHBOARD ============================== */

export { PersonCard };
