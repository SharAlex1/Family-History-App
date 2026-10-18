import { tr } from "../../i18n/index.js";
import React from "react";
import { downloadArchive, LS_KEY } from "../../lib/storage.js";
export class ErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main style={{ padding: 32, fontFamily: "system-ui" }}>
          <h1>{tr("Could not display the archive")}</h1>
          <p>{tr("Your stored data has not been reset. Export a recovery copy before trying again.")}</p>
          <button
            onClick={() => {
              try {
                downloadArchive(
                  localStorage.getItem(LS_KEY) || "{}",
                  "family-atlas-recovery.json",
                );
              } catch {
                window.alert(
                  tr("Could not export the recovery file. Your saved archive has not been changed."),
                );
              }
            }}
          >{tr("Export recovery copy")}</button>
          <button onClick={() => window.location.reload()}>{tr("Reload")}</button>
        </main>
      );
    return this.props.children;
  }
}
