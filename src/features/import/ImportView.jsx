import React, { useState } from "react";
import { useData } from "../../state/DataContext.jsx";
import {
  FeaturePage,
  Panel,
  PersonPicker,
  ErrorNotice,
} from "../../components/ui/FeatureUI.jsx";
import { Btn } from "../../components/ui/Primitives.jsx";
import { Modal } from "../../components/ui/Dialogs.jsx";
import {
  parseGedcom,
  duplicateCandidates,
  mergeImported,
  mergeExisting,
} from "../../lib/gedcom.js";
import { fullName } from "../../utils/people.js";
export function ImportView() {
  const { data, actions } = useData();
  const [pending, setPending] = useState(null),
    [choices, setChoices] = useState({}),
    [policy, setPolicy] = useState("keep"),
    [error, setError] = useState(""),
    [primary, setPrimary] = useState(data.people[0]?.id || ""),
    [secondary, setSecondary] = useState(data.people[1]?.id || ""),
    [confirm, setConfirm] = useState(false),
    [message, setMessage] = useState("");
  async function read(e) {
    setError("");
    setMessage("");
    try {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024)
        throw new Error("GEDCOM files must be under 10 MB.");
      const text = new TextDecoder("utf-8", { fatal: true }).decode(
        await file.arrayBuffer(),
      );
      setPending({ ...parseGedcom(text, file.name), revision: data._revision });
      setChoices({});
    } catch (err) {
      setError(`Could not import GEDCOM: ${err.message}`);
    }
    e.target.value = "";
  }
  return (
    <FeaturePage
      title="Import & merge"
      description="Preview a GEDCOM tree, map possible duplicates, and merge only after review."
    >
      <ErrorNotice message={error} />
      {message && <p role="status">{message}</p>}
      <Panel title="Bring a tree from another genealogy tool">
        <p>
          Import UTF-8 GEDCOM 5.5/5.5.1 or common GEDCOM 7 records. People,
          parent/spouse links, adoption hints, dated residences,
          birth/death/marriage events and source citations are previewed.
          Unknown dates remain unknown; approximate dates keep their wording.
        </p>
        <label className="file-button">
          Choose GEDCOM file
          <input type="file" accept=".ged,.gedcom,text/plain" onChange={read} />
        </label>
        <p className="feature-muted">
          Media references do not upload the referenced files. Imported places
          are not geocoded; add coordinates before map placement. Unrecognized
          tags are not a full lossless GEDCOM round trip—keep the original
          export.
        </p>
      </Panel>
      {pending && (
        <Panel title="GEDCOM preview">
          <p>
            {pending.data.people.length} people, {pending.data.locations.length}{" "}
            places, {pending.data.events.length} events and{" "}
            {pending.data.documents.length} sources/media references.
          </p>
          {pending.warnings.length > 0 && (
            <details>
              <summary>{pending.warnings.length} import notes</summary>
              <ul>
                {pending.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </details>
          )}
          <label className="studio-field">
            When merging fields
            <select value={policy} onChange={(e) => setPolicy(e.target.value)}>
              <option value="keep">Keep existing nonempty values</option>
              <option value="incoming">Prefer imported nonempty values</option>
            </select>
          </label>
          <p>
            Relationships and sources are combined. Review conflicting dates
            before merging; invalid family graphs will be rejected.
          </p>
          <div className="import-table">
            <table>
              <thead>
                <tr>
                  <th>Incoming person</th>
                  <th>Possible matches and decision</th>
                </tr>
              </thead>
              <tbody>
                {pending.data.people.map((p) => {
                  const candidates = duplicateCandidates(data.people, p);
                  return (
                    <tr key={p.id}>
                      <td>
                        {fullName(p)}
                        <br />
                        <small>
                          {p.birthDate || p.birth || "Birth unknown"} —{" "}
                          {p.deathDate || p.death || "Death not recorded"}
                        </small>
                      </td>
                      <td>
                        <label className="studio-field">
                          Match for {fullName(p)}
                          <select
                            value={choices[p.id] || ""}
                            onChange={(e) =>
                              setChoices((c) => ({
                                ...c,
                                [p.id]: e.target.value,
                              }))
                            }
                          >
                            <option value="">Create a separate person</option>
                            {candidates.map((x) => (
                              <option key={x.id} value={x.id}>
                                {fullName(x)} · {x.birth ?? "?"} (possible
                                match)
                              </option>
                            ))}
                          </select>
                        </label>
                        {candidates.length === 0 && (
                          <small>
                            No close name/year match. Existing duplicate merging
                            is available below.
                          </small>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="feature-actions">
            <Btn onClick={() => setPending(null)}>Cancel GEDCOM import</Btn>
            <Btn
              kind="primary"
              onClick={async () => {
                setError("");
                const ok = await actions.mergeData((d) => {
                  if (d._revision !== pending.revision)
                    throw new Error(
                      "The archive changed since preview. Reopen the GEDCOM file before merging.",
                    );
                  return mergeImported(d, pending.data, choices, policy);
                });
                if (ok) {
                  setMessage(
                    "GEDCOM records merged. The previous archive was backed up. Reattach media files and position imported places before exploring the map.",
                  );
                  setPending(null);
                }
              }}
            >
              Confirm GEDCOM merge
            </Btn>
          </div>
        </Panel>
      )}
      <Panel title="Merge duplicates already in this archive">
        <div className="feature-grid">
          <PersonPicker
            label="Keep record"
            value={primary}
            onChange={setPrimary}
          />
          <PersonPicker
            label="Merge duplicate record"
            value={secondary}
            onChange={setSecondary}
          />
        </div>
        {primary && secondary && (
          <div className="import-table">
            <table>
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Kept record</th>
                  <th>Other record</th>
                </tr>
              </thead>
              <tbody>
                {[
                  "first",
                  "last",
                  "birth",
                  "birthDate",
                  "death",
                  "deathDate",
                  "born",
                  "bio",
                ].map((key) => (
                  <tr key={key}>
                    <th>{key}</th>
                    <td>
                      {String(
                        data.people.find((p) => p.id === primary)?.[key] ??
                          "Unknown",
                      )}
                    </td>
                    <td>
                      {String(
                        data.people.find((p) => p.id === secondary)?.[key] ??
                          "Unknown",
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <label className="studio-field">
          Field preference
          <select value={policy} onChange={(e) => setPolicy(e.target.value)}>
            <option value="keep">
              Keep the first record’s nonempty fields
            </option>
            <option value="incoming">
              Prefer the second record’s nonempty fields
            </option>
          </select>
        </label>
        <Btn
          disabled={!primary || !secondary || primary === secondary}
          onClick={() => setConfirm(true)}
        >
          Review duplicate merge
        </Btn>
      </Panel>
      {confirm && (
        <Modal
          title="Merge these two people?"
          onClose={() => setConfirm(false)}
        >
          <p>
            This replaces the second person with the first, redirects their
            relationships, documents and contributions, and retains conflicting
            dates/biographies as research evidence. An archive backup is saved
            first.
          </p>
          <Btn onClick={() => setConfirm(false)}>Cancel</Btn>
          <Btn
            kind="primary"
            onClick={async () => {
              if (
                await actions.mergeData((d) =>
                  mergeExisting(d, primary, secondary, policy),
                )
              ) {
                setConfirm(false);
                setMessage("Duplicate merged and references updated.");
                setSecondary("");
              }
            }}
          >
            Merge people
          </Btn>
        </Modal>
      )}
    </FeaturePage>
  );
}
