import { tr, locale } from "../../i18n/index.js";
import React, { useEffect, useRef, useState } from "react";
import { useData } from "../../state/DataContext.jsx";
import {
  FeaturePage,
  Panel,
  PersonPicker,
  ErrorNotice,
} from "../../components/ui/FeatureUI.jsx";
import { Btn } from "../../components/ui/Primitives.jsx";
import { MediaPreview } from "../../components/media/MediaPreview.jsx";
import { storeFiles, exportTranscript } from "../../lib/media.js";
import { uid } from "../../utils/ids.js";
const PROMPTS = [
  "What was your childhood home like?",
  "Who influenced you most while growing up?",
  "What brought your family to a new place?",
  "Which family tradition would you like preserved?",
  "What story do you wish you had asked your grandparents?",
];
export function InterviewView() {
  const { data, actions } = useData();
  const [personId, setPersonId] = useState(data.people[0]?.id || ""),
    [title, setTitle] = useState(""),
    [prompt, setPrompt] = useState(PROMPTS[0]),
    [transcript, setTranscript] = useState(""),
    [recording, setRecording] = useState(false),
    [file, setFile] = useState(null),
    [error, setError] = useState(""),
    [speech, setSpeech] = useState(false),
    [busy, setBusy] = useState(false);
  const recorder = useRef(null),
    stream = useRef(null),
    recognizer = useRef(null),
    chunks = useRef([]),
    mounted = useRef(true);
  const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      recorder.current?.state === "recording" && recorder.current.stop();
      stream.current?.getTracks().forEach((t) => t.stop());
      recognizer.current?.abort();
    };
  }, []);
  async function start() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError(
        tr("Recording is unavailable in this browser. Upload an existing audio file below."),
      );
      return;
    }
    setBusy(true);
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (!mounted.current) {
        stream.current.getTracks().forEach((t) => t.stop());
        return;
      }
      chunks.current = [];
      const r = new MediaRecorder(stream.current);
      recorder.current = r;
      r.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data);
      };
      r.onstop = () => {
        const type = r.mimeType.split(";")[0] || "audio/webm";
        const blob = new Blob(chunks.current, { type });
        if (mounted.current) {
          setFile(
            new File(
              [blob],
              `interview-${Date.now()}.${type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm"}`,
              { type },
            ),
          );
          setRecording(false);
        }
        stream.current?.getTracks().forEach((t) => t.stop());
        recognizer.current?.stop();
      };
      r.onerror = () => {
        if (mounted.current) {
          setError(
            tr("Recording stopped unexpectedly. Review the audio before saving or try recording again."),
          );
          setRecording(false);
        }
        stream.current?.getTracks().forEach((t) => t.stop());
      };
      r.start(1000);
      setRecording(true);
    } catch (e) {
      stream.current?.getTracks().forEach((t) => t.stop());
      setError(tr("Microphone could not start: {{v0}}", {v0: e.message}));
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  function startSpeech() {
    if (!Speech) return;
    const recognition = new Speech();
    recognizer.current = recognition;
    recognition.continuous = true;
    recognition.lang = locale();
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++)
        if (e.results[i].isFinal) text += e.results[i][0].transcript + " ";
      setTranscript((t) => `${t}${t ? " " : ""}${text.trim()}`);
    };
    recognition.onerror = (e) => {
      setError(
        tr("Live transcription stopped ({{v0}}). The recording is separate; edit or type its transcript below.", {v0: e.error}),
      );
      setSpeech(false);
    };
    recognition.onend = () => {
      if (mounted.current) setSpeech(false);
    };
    try {
      recognition.start();
      setSpeech(true);
    } catch (e) {
      setError(e.message);
    }
  }
  async function save(e) {
    e.preventDefault();
    if (recording) {
      setError(tr("Stop the recording before saving."));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const files = file ? await storeFiles([file]) : [];
      const documentId = files.length ? uid("doc") : "";
      const interview = {
        id: uid("interview"),
        personId,
        title: title.trim() || tr(prompt),
        prompt: tr(prompt),
        transcript,
        documentId,
        createdAt: new Date().toISOString(),
      };
      const ok = await actions.mergeData((d) => ({
        ...d,
        documents: documentId
          ? [
              ...d.documents,
              {
                id: documentId,
                title: interview.title,
                type: "audio",
                year: new Date().getFullYear(),
                people: [personId],
                events: [],
                desc: transcript,
                caption: prompt,
                files,
              },
            ]
          : d.documents,
        interviews: [...(d.interviews || []), interview],
      }));
      if (ok) {
        setTitle("");
        setTranscript("");
        setFile(null);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <FeaturePage
      title={tr("Oral history studio")}
      description={tr("Capture a relative’s voice, keep the original recording, and link an editable transcript to their profile.")}
    >
      <ErrorNotice message={error} />
      <div className="feature-grid">
        <Panel title={tr("Interview recorder")}>
          <form className="studio-form" onSubmit={save}>
            <PersonPicker
              label={tr("Interview subject")}
              value={personId}
              onChange={setPersonId}
            />
            <label className="studio-field">{tr("Interview title")}<input value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label className="studio-field">{tr("Interview prompt")}<select
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              >
                {PROMPTS.map((p) => (
                  <option key={p} value={p}>{tr(p)}</option>
                ))}
              </select>
            </label>
            <div className="feature-actions">
              <Btn disabled={recording || busy} onClick={start}>{tr("Start recording")}</Btn>
              <Btn
                disabled={!recording}
                onClick={() => recorder.current?.stop()}
              >{tr("Stop recording")}</Btn>
              {Speech && (
                <Btn disabled={speech} onClick={startSpeech}>{tr("Start live transcription")}</Btn>
              )}
              {speech && (
                <Btn onClick={() => recognizer.current?.stop()}>{tr("Stop transcription")}</Btn>
              )}
            </div>
            <p role="status">
              {recording
                ? tr("Recording microphone…")
                : file
                  ? tr("Recording ready: {{v0}}", {v0: file.name})
                  : tr("No recording selected.")}
            </p>
            <label className="studio-field">{tr("Or upload an existing recording")}<input
                type="file"
                accept="audio/*"
                disabled={recording}
                onChange={(e) => setFile(e.target.files[0] || null)}
              />
            </label>
            <p className="feature-muted">{tr("Live transcription is optional and browser-dependent; your browser may use its speech service. It is never started automatically. Uploaded recordings require a typed transcript here; no background transcription service is configured.")}</p>
            <label className="studio-field">{tr("Transcript")}<textarea
                rows={9}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={tr("Type, paste, or review the transcript. Identify uncertain words rather than guessing.")}
              />
            </label>
            <Btn
              type="submit"
              kind="primary"
              disabled={
                busy || recording || !personId || (!transcript.trim() && !file)
              }
            >
              {busy ? tr("Saving interview…") : tr("Save interview")}
            </Btn>
          </form>
        </Panel>
        <Panel title={tr("Saved interviews")}>
          {(data.interviews || [])
            .filter((i) => i.personId === personId)
            .map((i) => (
              <article key={i.id} className="evidence-card">
                <h4>{i.title}</h4>
                <p>{i.prompt}</p>
                {data.documents.find((d) => d.id === i.documentId)
                  ?.files?.[0] && (
                  <MediaPreview
                    file={
                      data.documents.find((d) => d.id === i.documentId).files[0]
                    }
                  />
                )}
                <label className="studio-field">{tr("Edit transcript")}<textarea
                    rows={5}
                    defaultValue={i.transcript}
                    onBlur={async (e) => {
                      if (e.target.value !== i.transcript) {
                        const text = e.target.value;
                        await actions.mergeData((d) => {
                          if (
                            d.interviews.find((x) => x.id === i.id)
                              ?.transcript !== i.transcript
                          )
                            throw new Error(
                              tr("This transcript changed in another tab. Reopen Oral History before editing it."),
                            );
                          return {
                            ...d,
                            interviews: d.interviews.map((x) =>
                              x.id === i.id ? { ...x, transcript: text } : x,
                            ),
                            documents: d.documents.map((doc) =>
                              doc.id === i.documentId
                                ? { ...doc, desc: text }
                                : doc,
                            ),
                          };
                        });
                      }
                    }}
                  />
                </label>
                <div className="feature-actions">
                  <Btn small onClick={() => exportTranscript(i)}>{tr("Export transcript")}</Btn>
                  <Btn
                    small
                    onClick={() => {
                      if (
                        window.confirm(
                          tr("Delete this interview? Its archive recording will be retained."),
                        )
                      )
                        actions.remove("interviews", i.id);
                    }}
                  >{tr("Delete interview")}</Btn>
                </div>
              </article>
            ))}
          {!(data.interviews || []).some((i) => i.personId === personId) && (
            <p>{tr("Record or upload an interview, or save a written answer to get started.")}</p>
          )}
        </Panel>
      </div>
    </FeaturePage>
  );
}
