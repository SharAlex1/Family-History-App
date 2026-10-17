import { zipSync, unzipSync, strToU8, strFromU8 } from "fflate";
import { parseArchive, downloadArchive } from "./storage.js";
export const MAX_MEDIA_BYTES = 100 * 1024 * 1024;
const MAX_BUNDLE_BYTES = 500 * 1024 * 1024;
const TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "application/pdf",
  "text/plain",
  "audio/webm",
  "audio/ogg",
  "audio/wav",
  "audio/mpeg",
  "audio/mp4",
  "video/webm",
  "video/mp4",
  "video/ogg",
]);
let database;
function db() {
  if (!database)
    database = new Promise((resolve, reject) => {
      const r = indexedDB.open("family-atlas-media", 1);
      r.onupgradeneeded = () =>
        r.result.createObjectStore("files", { keyPath: "id" });
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => {
        database = null;
        reject(
          new Error(
            "Could not open media storage. Check browser storage permissions.",
          ),
        );
      };
    });
  return database;
}
export async function getMedia(id) {
  const database = await db();
  return new Promise((resolve, reject) => {
    const tx = database.transaction("files"),
      r = tx.objectStore("files").get(id);
    r.onsuccess = () => resolve(r.result || null);
    r.onerror = () => reject(r.error);
  });
}
export async function putMediaBatch(records) {
  if (!records.length) return;
  const database = await db();
  return new Promise((resolve, reject) => {
    const tx = database.transaction("files", "readwrite");
    records.forEach((r) => tx.objectStore("files").put(r));
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(
        new Error(
          "Could not store media. Export a backup and free browser storage.",
        ),
      );
    tx.onabort = () => reject(new Error("Media storage was interrupted."));
  });
}
export const hashBytes = async (bytes) =>
  Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
    (x) => x.toString(16).padStart(2, "0"),
  ).join("");
export async function prepareFile(file) {
  const type = (file.type || "").split(";")[0];
  if (!TYPES.has(type))
    throw new Error(
      "Choose a JPEG, PNG, WebP, GIF, AVIF, PDF, plain text, audio or video file. HTML and SVG files are not accepted.",
    );
  if (!file.size || file.size > MAX_MEDIA_BYTES)
    throw new Error("Each file must be nonempty and at most 100 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer()),
    sha256 = await hashBytes(bytes),
    id = `file_${sha256}`;
  const metadata = {
    id,
    name: file.name || "recording.webm",
    type,
    size: file.size,
    sha256,
  };
  return {
    metadata,
    record: { ...metadata, blob: new Blob([bytes], { type }) },
  };
}
export async function storeFiles(files) {
  const prepared = await Promise.all([...files].map(prepareFile));
  await putMediaBatch(prepared.map((p) => p.record));
  return prepared.map((p) => p.metadata);
}
export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function exportMediaBundle(data) {
  const all = [
    ...new Map(
      data.documents.flatMap((d) => d.files || []).map((f) => [f.id, f]),
    ).values(),
  ];
  const files = { "archive.json": strToU8(JSON.stringify(data, null, 2)) };
  let total = files["archive.json"].length;
  for (const descriptor of all) {
    const file = await getMedia(descriptor.id);
    if (!file)
      throw new Error(
        `Missing media: ${descriptor.name}. Reattach it before exporting a complete bundle.`,
      );
    const bytes = new Uint8Array(await file.blob.arrayBuffer());
    if ((await hashBytes(bytes)) !== descriptor.sha256)
      throw new Error(`Media checksum failed: ${descriptor.name}`);
    total += bytes.length;
    if (total > MAX_BUNDLE_BYTES)
      throw new Error(
        "This bundle exceeds 500 MB. A smaller archive is required.",
      );
    files[`media/${descriptor.id}`] = bytes;
  }
  const zip = zipSync(files, { level: 0 });
  if (zip.length > MAX_BUNDLE_BYTES)
    throw new Error("This ZIP exceeds 500 MB. A smaller archive is required.");
  downloadBlob(
    new Blob([zip], { type: "application/zip" }),
    "family-atlas-with-media.zip",
  );
}
export async function readMediaBundle(file) {
  if (file.size > MAX_BUNDLE_BYTES)
    throw new Error("Bundles must be at most 500 MB.");
  let total = 0;
  const files = unzipSync(new Uint8Array(await file.arrayBuffer()), {
    filter: (entry) => {
      total += entry.originalSize;
      return (
        entry.originalSize <= MAX_MEDIA_BYTES &&
        total <= MAX_BUNDLE_BYTES &&
        (entry.name === "archive.json" ||
          /^media\/file_[a-f0-9]{64}$/.test(entry.name))
      );
    },
  });
  if (total > MAX_BUNDLE_BYTES || !files["archive.json"])
    throw new Error("Invalid or oversized media bundle.");
  const data = parseArchive(strFromU8(files["archive.json"])),
    records = [];
  for (const descriptor of new Map(
    data.documents.flatMap((d) => d.files || []).map((f) => [f.id, f]),
  ).values()) {
    const bytes = files[`media/${descriptor.id}`];
    if (
      !bytes ||
      bytes.length !== descriptor.size ||
      (await hashBytes(bytes)) !== descriptor.sha256
    )
      throw new Error(`Missing or damaged attachment: ${descriptor.name}.`);
    if (!TYPES.has(descriptor.type))
      throw new Error("Unsupported attachment type in bundle.");
    records.push({
      ...descriptor,
      blob: new Blob([bytes], { type: descriptor.type }),
    });
  }
  return { data, records };
}
export function exportTranscript(interview) {
  downloadArchive(
    {
      title: interview.title,
      prompt: interview.prompt,
      transcript: interview.transcript,
    },
    "interview-transcript.json",
  );
}
