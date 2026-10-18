import { tr } from "../../../i18n/index.js";
import React from "react";
import { Save } from "lucide-react";
import { Btn } from "../../../components/ui/Primitives.jsx";

function FormFooter({ onCancel, onSave }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
      <Btn kind="soft" onClick={onCancel}>{tr("Cancel")}</Btn>
      <Btn kind="primary" icon={Save} onClick={onSave}>{tr("Save")}</Btn>
    </div>
  );
}

/* ============================= MANAGE DATA ============================ */

export { FormFooter };
