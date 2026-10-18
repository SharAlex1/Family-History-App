import { tr } from "../../i18n/index.js";
import React, { useState } from "react";
import { X, Trash2, AlertTriangle } from "lucide-react";
import { C } from "../../config/theme.js";
import { useData } from "../../state/DataContext.jsx";
import { Btn } from "./Primitives.jsx";
import { DialogFrame } from "./DialogFrame.jsx";
import { SelectInput } from "./FormFields.jsx";

function Modal({ title, subtitle, onClose, children, footer, wide }) {
  const { notice } = useData();
  return (
    <DialogFrame title={title} onClose={onClose} width={wide ? 720 : 560}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "18px 22px", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: C.panelSolid, zIndex: 2 }}>
          <div>
            <div style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 600, fontSize: 18, color: C.text }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12.5, color: C.sub, marginTop: 3 }}>{subtitle}</div>}
          </div>
          <button aria-label={tr("Close dialog")} onClick={onClose} className="fa-click" style={{ background: "transparent", border: "none", color: C.sub, padding: 4 }}><X size={20} /></button>
        </div>
        <div style={{ padding: 22, overflow: "auto" }}>{notice && <p role="alert" style={{color:C.danger}}>{tr(notice)}</p>}{children}</div>
        {footer && <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 22px", borderTop: `1px solid ${C.border}`, position: "sticky", bottom: 0, background: C.panelSolid }}>{footer}</div>}
    </DialogFrame>
  );
}

function ConfirmDialog({ title, message, confirmLabel = tr("Delete"), onConfirm, onCancel }) {
  const {notice}=useData();
  return (
    <DialogFrame title={title} onClose={onCancel} width={420}>
        <div style={{ padding: 24 }}>
          {notice && <p role="alert" style={{color:C.danger}}>{tr(notice)}</p>}
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `${C.danger}1a`, color: C.danger, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><AlertTriangle size={19} /></div>
            <div>
              <div style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 600, fontSize: 17, color: C.text }}>{title}</div>
              <div style={{ fontSize: 13, color: C.sub, marginTop: 6, lineHeight: 1.5 }}>{tr(message)}</div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
            <Btn kind="soft" onClick={onCancel}>{tr("Cancel")}</Btn>
            <Btn kind="danger" icon={Trash2} onClick={onConfirm}>{confirmLabel}</Btn>
          </div>
        </div>
    </DialogFrame>
  );
}
// Deleting a branch with members assigned: ask what should happen to them.

function BranchDeleteDialog({ info, onConfirm, onCancel }) {
  const { data, notice } = useData();
  const others = data.branches.filter((b) => b.id !== info.id);
  const [mode, setMode] = useState("remove"); // remove | move
  const [target, setTarget] = useState(others[0]?.id || "");
  const hasPeople = info.count > 0;
  const Opt = ({ value, label, desc, disabled }) => (
    <button type="button" aria-pressed={mode === value} disabled={disabled} onClick={() => setMode(value)} className="fa-click" style={{ width: "100%", textAlign: "left", display: "flex", gap: 10, alignItems: "flex-start", background: mode === value ? `${C.amber}12` : C.panel2, border: `1px solid ${mode === value ? C.amber : C.border}`, borderRadius: 11, padding: "11px 13px", opacity: disabled ? 0.45 : 1, marginBottom: 8 }}>
      <span style={{ width: 16, height: 16, borderRadius: "50%", flexShrink: 0, marginTop: 1, border: `2px solid ${mode === value ? C.amber : C.faint}`, background: mode === value ? C.amber : "transparent" }} />
      <span>
        <span style={{ fontSize: 13.5, color: C.text, display: "block" }}>{tr(label)}</span>
        <span style={{ fontSize: 12, color: C.sub }}>{desc}</span>
      </span>
    </button>
  );
  return (
    <DialogFrame title={tr("Delete {{v0}}", {v0: info.name})} onClose={onCancel} width={460}>
        <div style={{ padding: 24 }}>
          {notice && <p role="alert" style={{color:C.danger}}>{tr(notice)}</p>}
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 16 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `${C.danger}1a`, color: C.danger, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><AlertTriangle size={19} /></div>
            <div>
              <div style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 600, fontSize: 17, color: C.text }}>{tr("Delete \"")}{info.name}"?</div>
              <div style={{ fontSize: 13, color: C.sub, marginTop: 6, lineHeight: 1.5 }}>
                {hasPeople ? tr("{{v0}} {{v1}} assigned to this branch. Choose what happens to them.", {v0: info.count, v1: info.count === 1 ? "person is" : "people are"}) : tr("No one is assigned to this branch, so it can be removed safely.")}
              </div>
            </div>
          </div>
          {hasPeople && (
            <div style={{ marginBottom: 6 }}>
              <Opt value="remove" label={tr("Remove the branch from those people")} desc={tr("They keep all their other branches, if any.")} />
              <Opt value="move" label={tr("Move them to another branch")} desc={others.length ? tr("Reassign everyone to the branch you pick.") : tr("No other branch exists to move them to.")} disabled={others.length === 0} />
              {mode === "move" && others.length > 0 && (
                <div style={{ paddingLeft: 26, marginTop: 2, marginBottom: 6 }}>
                  <SelectInput aria-label={tr("Destination branch")} value={target} onChange={setTarget} options={others.map((b) => ({ value: b.id, label: b.name }))} />
                </div>
              )}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
            <Btn kind="soft" onClick={onCancel}>{tr("Cancel")}</Btn>
            <Btn kind="danger" icon={Trash2} disabled={hasPeople && mode === "move" && !target} onClick={() => onConfirm(hasPeople ? mode : "remove", target)}>{tr("Delete branch")}</Btn>
          </div>
        </div>
    </DialogFrame>
  );
}

/* --------------------------- MINI MAP PICKER ----------------------------- */

export { Modal, ConfirmDialog, BranchDeleteDialog };
