import React, { useEffect, useState } from "react";
import { useData } from "../../state/DataContext.jsx";
import {
  FeaturePage,
  Panel,
  PersonPicker,
} from "../../components/ui/FeatureUI.jsx";
import { Btn } from "../../components/ui/Primitives.jsx";
import { MediaPreview } from "../../components/media/MediaPreview.jsx";
import { LAND_PATHS, useWorldMap, arcPath } from "../../lib/worldMap.js";
import { C } from "../../config/theme.js";
import { fullName } from "../../utils/people.js";
export function JourneyView({ setYear, openPerson }) {
  const { data, getP, getL } = useData(),
    world = useWorldMap();
  const [id, setId] = useState(data.people[0]?.id || ""),
    [index, setIndex] = useState(0),
    [playing, setPlaying] = useState(false);
  const p = getP(id),
    stops = [...p.residences].sort((a, b) => a.from - b.from),
    at = stops[index];
  useEffect(() => {
    if (playing) {
      const timer = setInterval(
        () =>
          setIndex((i) => {
            if (i >= stops.length - 1) {
              setPlaying(false);
              return i;
            }
            return i + 1;
          }),
        6000,
      );
      return () => clearInterval(timer);
    }
  }, [playing, stops.length]);
  useEffect(() => {
    if (at) setYear(at.from);
  }, [id, index, at?.from, setYear]);
  const point = (l) => {
    if (world.proj && Number.isFinite(l.lng) && Number.isFinite(l.lat)) {
      const xy = world.proj([l.lng, l.lat]);
      if (xy?.every(Number.isFinite)) return { x: xy[0], y: xy[1] };
    }
    return { x: l.x, y: l.y };
  };
  const focus =
    at && !getL(at.at).unmapped ? point(getL(at.at)) : { x: 500, y: 280 };
  const rangeEnd = stops[index + 1]?.from ?? 10000;
  const events = data.events.filter(
    (e) =>
      e.people.includes(id) && at && e.year >= at.from && e.year < rangeEnd,
  );
  const docs = data.documents.filter(
    (d) =>
      d.people.includes(id) && at && d.year >= at.from && d.year < rangeEnd,
  );
  return (
    <FeaturePage
      title="Follow their journey"
      description="A guided trip through a relative’s recorded residences, with evidence at each stop."
    >
      <PersonPicker
        label="Journey person"
        value={id}
        onChange={(value) => {
          setId(value);
          setIndex(0);
          setPlaying(false);
        }}
      />
      <div className="feature-actions">
        <Btn disabled={!stops.length} onClick={() => setPlaying((v) => !v)}>
          {playing ? "Pause journey" : "Play journey"}
        </Btn>
        <Btn
          disabled={index === 0}
          onClick={() => {
            setPlaying(false);
            setIndex((i) => i - 1);
          }}
        >
          Previous stop
        </Btn>
        <Btn
          disabled={index >= stops.length - 1}
          onClick={() => {
            setPlaying(false);
            setIndex((i) => i + 1);
          }}
        >
          Next stop
        </Btn>
        <Btn onClick={() => openPerson(id)}>Open traveler profile</Btn>
        <span>
          {stops.length
            ? `Stop ${index + 1} of ${stops.length}`
            : "No residences recorded"}
        </span>
      </div>
      <div className="journey-map">
        <svg
          viewBox="0 0 1000 400"
          role="img"
          aria-label={
            at
              ? `${fullName(p)} in ${getL(at.at).name}, ${at.from}`
              : "No journey stops"
          }
        >
          <rect width="1000" height="400" fill="#0b0d13" />
          <g
            style={{
              transformOrigin: "0 0",
              transition: "transform 1s ease",
              transform: `translate(${500 - focus.x * 1.5}px, ${190 - focus.y * 1.5}px) scale(1.5)`,
            }}
          >
            {world.landPath ? (
              <path d={world.landPath} fill={C.panel2} stroke={C.border} />
            ) : (
              LAND_PATHS.map((d, i) => (
                <path key={i} d={d} fill={C.panel2} stroke={C.border} />
              ))
            )}
            {stops.slice(1, index + 1).map((s, i) => (
              <path
                opacity={
                  getL(s.at).unmapped || getL(stops[i].at).unmapped ? 0 : 1
                }
                key={i}
                d={arcPath(point(getL(stops[i].at)), point(getL(s.at)))}
                fill="none"
                stroke={C.amber}
                strokeWidth="2"
              />
            ))}
            {stops.map((s, i) => {
              if (getL(s.at).unmapped) return null;
              const pt = point(getL(s.at));
              return (
                <g key={i}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={i === index ? 9 : 4}
                    fill={i === index ? C.amber : C.teal}
                  />
                  <text x={pt.x + 12} y={pt.y - 7} fill={C.text} fontSize="11">
                    {getL(s.at).name}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
      {at ? (
        <div className="feature-grid">
          <Panel title={`${at.from} · ${getL(at.at).name}`}>
            <p>
              {fullName(p)}{" "}
              {index === 0 ? "is first recorded living" : "arrives"} in{" "}
              {getL(at.at).name}
              {stops[index + 1]
                ? `, until the next recorded move in ${stops[index + 1].from}`
                : ""}
              .
            </p>
            <p>{getL(at.at).desc}</p>
            {getL(at.at).unmapped && (
              <p>
                Coordinates are not recorded for this stop; no geographic pin is
                shown.
              </p>
            )}
            <ol>
              {events.map((e) => (
                <li key={e.id}>
                  <strong>
                    {e.year} · {e.title}
                  </strong>
                  <p>{e.desc}</p>
                </li>
              ))}
            </ol>
            {!events.length && (
              <p className="feature-muted">
                No linked events are recorded for this stop yet.
              </p>
            )}
          </Panel>
          <Panel title="Evidence at this stop">
            {docs.map((doc) => (
              <article key={doc.id}>
                <h4>{doc.title}</h4>
                {doc.files?.[0] && (
                  <MediaPreview file={doc.files[0]} thumbnail />
                )}
                <p>{doc.caption || doc.desc}</p>
              </article>
            ))}
            {!docs.length && (
              <p>
                Add and tag photographs or records from these years in the
                archive.
              </p>
            )}
          </Panel>
        </div>
      ) : (
        <Panel title="Start with a residence">
          <p>
            Edit this person and record where they lived and when. The journey
            uses those records, without inventing missing stops.
          </p>
        </Panel>
      )}
      <ol className="journey-stops">
        {stops.map((s, i) => (
          <li key={i}>
            <button
              aria-current={i === index ? "step" : undefined}
              onClick={() => {
                setPlaying(false);
                setIndex(i);
              }}
            >
              {s.from} · {getL(s.at).name}
            </button>
          </li>
        ))}
      </ol>
    </FeaturePage>
  );
}
