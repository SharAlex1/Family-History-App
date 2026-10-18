import { tr, formatDate, countText } from "../../i18n/index.js";
import React, { useEffect, useState } from "react";
import { useData } from "../../state/DataContext.jsx";
import {
  FeaturePage,
  Panel,
  PersonPicker,
  ErrorNotice,
} from "../../components/ui/FeatureUI.jsx";
import { Btn } from "../../components/ui/Primitives.jsx";
import { MediaPreview } from "../../components/media/MediaPreview.jsx";
import { discoveries } from "../../lib/discoveries.js";
import { uid } from "../../utils/ids.js";
import { fullName } from "../../utils/people.js";
export function DiscoveriesView({ openPerson, setView }) {
  const { data, actions } = useData();
  const [now, setNow] = useState(() => new Date()),
    [error, setError] = useState(""),
    [notify, setNotify] = useState(false),
    [title, setTitle] = useState(""),
    [month, setMonth] = useState(now.getMonth() + 1),
    [day, setDay] = useState(now.getDate()),
    [personId, setPerson] = useState("");
  const result = discoveries(data, now);
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (
      !notify ||
      !("Notification" in window) ||
      Notification.permission !== "granted"
    )
      return;
    for (const o of result.today) {
      const key = `familyAtlas.notified.${o.id}.${now.getFullYear()}`;
      try {
        if (!localStorage.getItem(key)) {
          new Notification(o.title, {
            body:
              o.years != null
                ? tr("{{count}} years in the family story",{count:o.years})
                : tr("A family date to remember"),
            tag: key,
          });
          localStorage.setItem(key, "yes");
        }
      } catch (e) {
        setError(tr("Could not display a reminder: {{v0}}", {v0: e.message}));
      }
    }
  }, [notify, now, data]);
  async function enable() {
    if (!("Notification" in window)) {
      setError(
        tr("Desktop notifications are unavailable here. Today’s reminders are still listed below."),
      );
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") setNotify(true);
    else
      setError(
        tr("Notifications were not enabled. You can still use the in-app reminders."),
      );
  }
  return (
    <FeaturePage
      title={tr("On this day & discoveries")}
      description={tr("Rediscover the archive, celebrate family dates and find places that connect generations.")}
      actions={
        <Btn onClick={enable}>
          {notify
            ? tr("Reminders enabled while open")
            : tr("Enable reminders while app is open")}
        </Btn>
      }
    >
      <ErrorNotice message={error} />
      <p className="feature-muted">{tr("Dates use your device’s local calendar. Only exact month/day dates produce anniversaries. Desktop reminders run while this app is open; there is no background email or push service.")}</p>
      <div className="feature-grid">
        <Panel
          title={tr("On this day · {{v0}}", {v0: formatDate(now, { month: "long", day: "numeric" })})}
        >
          {result.today.length ? (
            result.today.map((o) => (
              <article key={o.id}>
                <h4>{o.title}</h4>
                <p>
                  {o.years != null
                    ? countText("yearsAgo",o.years)
                    : tr("Annual family reminder")}
                </p>
                {o.personId && (
                  <Btn small onClick={() => openPerson(o.personId)}>{tr("Open person")}</Btn>
                )}
              </article>
            ))
          ) : (
            <p>{tr("No exact-date anniversaries are recorded for today. Add full birth, marriage or event dates, or create a reminder below.")}</p>
          )}
        </Panel>
        <Panel title={tr("Coming up in 30 days")}>
          {result.upcoming.map((o) => (
            <p key={o.id}>
              {o.title}{tr(" — in ")}{o.days}{tr(" days (")}{o.month}/{o.day})
            </p>
          ))}
          {!result.upcoming.length && <p>{tr("No upcoming dates recorded.")}</p>}
        </Panel>
      </div>
      {result.spotlight && (
        <Panel title={tr("A discovery from the archive")}>
          <h4>{result.spotlight.title}</h4>
          {result.spotlight.file && (
            <MediaPreview file={result.spotlight.file} thumbnail />
          )}
          <p>{result.spotlight.description}</p>
          <div className="feature-actions">
            {result.spotlight.personId && (
              <Btn onClick={() => openPerson(result.spotlight.personId)}>{tr("Meet the person")}</Btn>
            )}
            <Btn
              onClick={() =>
                setView(
                  result.spotlight.kind === "document"
                    ? "documents"
                    : "timeline",
                )
              }
            >{tr("Explore the record")}</Btn>
          </div>
        </Panel>
      )}
      <Panel title={tr("Places that connect the family")}>
        <div className="feature-grid">
          {result.connections.map((l) => (
            <article key={l.id}>
              <h4>
                {l.name} · {l.people.length}{tr(" relatives")}</h4>
              <div className="feature-actions">
                {l.people.map((p) => (
                  <button
                    className="person-chip"
                    key={p.id}
                    onClick={() => openPerson(p.id)}
                  >
                    {fullName(p)}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </Panel>
      <Panel title={tr("Your annual reminders")}>
        <form
          className="studio-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              await actions.save("reminders", {
                id: uid("reminder"),
                title,
                personId,
                month: Number(month),
                day: Number(day),
              })
            )
              setTitle("");
          }}
        >
          <div className="feature-grid">
            <label className="studio-field">{tr("Reminder title")}<input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <PersonPicker
              label={tr("Related person")}
              optional
              value={personId}
              onChange={setPerson}
            />
            <label className="studio-field">{tr("Month")}<input
                required
                type="number"
                min="1"
                max="12"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </label>
            <label className="studio-field">{tr("Day")}<input
                required
                type="number"
                min="1"
                max="31"
                value={day}
                onChange={(e) => setDay(e.target.value)}
              />
            </label>
          </div>
          <Btn type="submit" kind="primary">{tr("Add reminder")}</Btn>
        </form>
        {(data.reminders || []).map((r) => (
          <div className="feature-row" key={r.id}>
            <p>
              {r.month}/{r.day} · {r.title}
            </p>
            <Btn small onClick={() => actions.remove("reminders", r.id)}>{tr("Remove reminder")}</Btn>
          </div>
        ))}
      </Panel>
    </FeaturePage>
  );
}
