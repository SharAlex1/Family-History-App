import React, { useEffect, useState } from "react";
import { getMedia, downloadBlob } from "../../lib/media.js";
export function useMediaUrl(id) {
  const [state, setState] = useState({ url: "", missing: false });
  useEffect(() => {
    let active = true,
      url;
    setState({ url: "", missing: false });
    if (id)
      getMedia(id)
        .then((record) => {
          if (!active) return;
          if (record) {
            url = URL.createObjectURL(record.blob);
            setState({ url, missing: false });
          } else setState({ url: "", missing: true });
        })
        .catch(() => {
          if (active) setState({ url: "", missing: true });
        });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [id]);
  return state;
}
export function MediaPreview({ file, thumbnail = false }) {
  const { url, missing } = useMediaUrl(file?.id);
  if (!file) return null;
  if (missing)
    return (
      <p role="status">
        File not found in this browser. Import the full media ZIP or reattach “
        {file.name}”.
      </p>
    );
  if (!url) return <span role="status">Loading {file.name}…</span>;
  if (file.type.startsWith("image/"))
    return (
      <img
        src={url}
        alt={file.name}
        className={thumbnail ? "media-thumb" : "media-image"}
      />
    );
  if (thumbnail)
    return (
      <span className="media-file-kind">
        {file.type.split("/")[0]} · {Math.ceil(file.size / 1024)} KB
      </span>
    );
  if (file.type === "application/pdf")
    return (
      <iframe title={`PDF: ${file.name}`} src={url} className="media-pdf" />
    );
  if (file.type.startsWith("audio/"))
    return (
      <audio controls preload="metadata" src={url} aria-label={file.name} />
    );
  if (file.type.startsWith("video/"))
    return (
      <video
        controls
        preload="metadata"
        src={url}
        aria-label={file.name}
        className="media-image"
      />
    );
  return (
    <a href={url} download={file.name}>
      Download {file.name}
    </a>
  );
}
export async function downloadMedia(file) {
  const record = await getMedia(file.id);
  if (!record) throw new Error("That attachment is missing in this browser.");
  downloadBlob(record.blob, file.name);
}
