import React from "react";
import { C } from "../../config/theme.js";
import { useMediaUrl } from "../media/MediaPreview.jsx";
import { initials } from "../../utils/people.js";

function Avatar({ p, size = 38, status = "alive", selected = false }) {
  const {url} = useMediaUrl(p.photoFileId);
  const ring = status === "alive" ? C.teal : status === "deceased" ? C.gray : C.faint;
  const bg = p.gender === "f" ? "#2a2230" : p.gender === "m" ? "#222a32" : C.panel2;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Fraunces, Georgia, serif", fontWeight: 600, fontSize: size * 0.36, color: status === "unborn" ? C.faint : C.text, background: bg, opacity: status === "unborn" ? 0.5 : 1, border: `2px solid ${selected ? C.amber : ring}`, boxShadow: selected ? `0 0 0 3px ${C.amber}33` : "none", transition: "all .25s ease" }}>{url?<img src={url} alt="" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}}/>:initials(p)}</div>
  );
}

function StatusDot({ status }) {
  const m = { unknown: [C.faint, "Dates unknown"], alive: [C.teal, "Living"], deceased: [C.gray, "Deceased"], unborn: [C.faint, "Not yet born"] };
  const [col, label] = m[status];
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.sub }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: col }} />{label}</span>;
}

function Pill({ children, color = C.sub, bg = C.panel2 }) {
  return <span style={{ fontSize: 11, color, background: bg, padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>{children}</span>;
}

function Btn({ children, onClick, kind = "ghost", icon: Icon, small, type = "button", disabled }) {
  const styles = {
    primary: { bg: C.amber, color: "#1a1206", border: C.amber },
    ghost: { bg: "transparent", color: C.sub, border: C.border },
    soft: { bg: C.panel2, color: C.text, border: C.border },
    danger: { bg: `${C.danger}1a`, color: C.danger, border: `${C.danger}55` },
  }[kind];
  return (
    <button type={type} onClick={onClick} disabled={disabled} className="fa-click" style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: small ? 12 : 13, padding: small ? "6px 10px" : "9px 14px", borderRadius: 10, background: styles.bg, color: styles.color, border: `1px solid ${styles.border}`, opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
      {Icon && <Icon size={small ? 14 : 15} />}{children}
    </button>
  );
}

/* ============================== FORM FIELDS ============================== */

function EmptyState({ icon: Icon, title, msg, action, inline }) {
  return (
    <div style={{ padding: inline ? "30px 10px" : 60, textAlign: "center", maxWidth: 460, margin: "20px auto" }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: C.panel2, color: C.faint, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><Icon size={24} /></div>
      <div style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 18, color: C.text }}>{title}</div>
      <div style={{ fontSize: 13, color: C.sub, marginTop: 8, lineHeight: 1.5 }}>{msg}</div>
      {action && <div style={{ marginTop: 18 }}>{action}</div>}
    </div>
  );
}

/* ============================== ENTITY FORMS ========================== */

export { Avatar, StatusDot, Pill, Btn, EmptyState };
