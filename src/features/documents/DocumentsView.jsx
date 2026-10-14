import React from "react";
import { FileText } from "lucide-react";
import { C } from "../../config/theme.js";
import { DOC_ICON } from "../../config/eventTypes.js";
import { useData } from "../../state/DataContext.jsx";
import { Pill, EmptyState } from "../../components/ui/Primitives.jsx";

function DocumentsView({ openPerson }) {
  const { data, getP } = useData();
  if (data.documents.length === 0) return <EmptyState icon={FileText} title="No documents yet" msg="Add documents and media placeholders in Manage Data." />;
  return (
    <div style={{ padding: "22px 24px 130px" }}>
      <h2 style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 600, fontSize: 22, color: C.text, margin: "0 0 4px" }}>Documents & Media</h2>
      <p style={{ color: C.faint, fontSize: 13, margin: "0 0 18px" }}>Records, photographs, and letters tied to people and events.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 14 }}>
        {[...data.documents].sort((a, b) => a.year - b.year).map((d) => {
          const Dn = DOC_ICON[d.type] || FileText;
          return (
            <div key={d.id} className="fa-card" style={{ borderRadius: 14, background: C.panelSolid, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              <div style={{ height: 92, background: "linear-gradient(135deg,#1c2130,#15182040)", display: "flex", alignItems: "center", justifyContent: "center", borderBottom: `1px solid ${C.border}`, color: C.rose }}><Dn size={30} /></div>
              <div style={{ padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 14.5, color: C.text }}>{d.title}</span><Pill>{d.year}</Pill>
                </div>
                {d.desc && <div style={{ fontSize: 12, color: C.sub, marginTop: 7, lineHeight: 1.5 }}>{d.desc}</div>}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                  {(d.people || []).slice(0, 3).map((id) => <button key={id} onClick={() => openPerson(id)} className="fa-click" style={{ fontSize: 11, color: C.sub, background: C.panel2, border: "none", padding: "3px 8px", borderRadius: 999 }}>{getP(id).first}</button>)}
                  {(d.people || []).length > 3 && <span style={{ fontSize: 11, color: C.faint, alignSelf: "center" }}>+{d.people.length - 3}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================== PROFILE PANEL =========================== */

export { DocumentsView };
