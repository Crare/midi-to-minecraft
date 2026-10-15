import { Midi } from "@tonejs/midi";
import { useEffect, useRef, useState } from "react";
import { playSuccessJingle } from "./audio/noteblockAudio";
import ExamplePanel from "./components/ExamplePanel";
import JsonOutputPanel from "./components/JsonOutputPanel";
import SchematicPanel from "./components/SchematicPanel";
import UploadPanel, { type ConvertRequest } from "./components/UploadPanel";
import type { DownloadFile, TrackEvents } from "./types";
import VisualizationPanel from "./components/VisualizationPanel";

import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import {
  buildTrackEvents,
  eventsToPlacements,
  getOutputPrefix,
  getZipFilename,
  splitOutputTarget
} from "./utils";

export default function App() {
  const [status, setStatus] = useState("Choose a MIDI file to begin.");
  const [busy, setBusy] = useState(false);
  const [trackEvents, setTrackEvents] = useState<TrackEvents[]>([]);
  const [downloadFiles, setDownloadFiles] = useState<DownloadFile[]>([]);
  const [outputName, setOutputName] = useState("output");
  const [zipFilename, setZipFilename] = useState("output-json.zip");
  const [convertedInputName, setConvertedInputName] = useState("");

  const exampleLoadedRef = useRef(false);

  const onConvertRequest = async ({
    file,
    outputName,
    trimLeadingSilence,
    silent = false
  }: ConvertRequest) => {
    if (!file || busy) return;

    try {
      setBusy(true);
      setStatus("Reading MIDI file...");
      const buffer = await file.arrayBuffer();
      const midi = new Midi(buffer);
      const nextTrackEvents = buildTrackEvents(midi, { trimLeadingSilence });
      const sequences = nextTrackEvents.map((track) =>
        eventsToPlacements(track.events)
      );
      setTrackEvents(nextTrackEvents);

      const target = splitOutputTarget(file.name, outputName);
      const files =
        sequences.length <= 1
          ? [
              {
                name: `${target.dir}/${target.stem}${target.ext}`,
                data: sequences[0] || []
              }
            ]
          : sequences.map((track, i) => ({
              name: `${target.dir}/${target.stem}.${i}${target.ext}`,
              data: track
            }));

      setDownloadFiles(files);
      setConvertedInputName(file.name);
      setOutputName(getOutputPrefix(outputName, file.name));
      setZipFilename(getZipFilename(outputName, file.name));
      const totalNotes = sequences.reduce(
        (sum, track) => sum + track.length,
        0
      );
      setStatus(
        `Converted ${sequences.length} track(s), ${totalNotes} notes total.`
      );
      if (!silent) playSuccessJingle();
      return true;
    } catch (error) {
      console.error(error);
      setStatus(`Conversion failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setBusy(false);
    }
  };

  const onOutputNameChange = (nextOutputName: string) => {
    setOutputName(nextOutputName);
    if (!convertedInputName || downloadFiles.length === 0) return;

    const target = splitOutputTarget(convertedInputName, nextOutputName);
    setDownloadFiles((currentFiles) =>
      currentFiles.map((file, index) => ({
        ...file,
        name:
          currentFiles.length <= 1
            ? `${target.dir}/${target.stem}${target.ext}`
            : `${target.dir}/${target.stem}.${index}${target.ext}`
      }))
    );
    setZipFilename(getZipFilename(nextOutputName, convertedInputName));
  };

  // Load the bundled example so the visualization is playable right away.
  useEffect(() => {
    if (exampleLoadedRef.current) return;
    exampleLoadedRef.current = true;

    (async () => {
      try {
        const response = await fetch(
          `${import.meta.env.BASE_URL}assets/example.mid`
        );
        if (!response.ok) return;
        const file = new File([await response.blob()], "ode-to-joy.mid", {
          type: "audio/midi"
        });
        const ok = await onConvertRequest({
          file,
          outputName: "output",
          trimLeadingSilence: true,
          silent: true
        });
        if (ok) setStatus(
          "Loaded example: Ode to Joy. Press play in the visualization, or choose your own MIDI file."
        );
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

  return (
    <>
      <a className="skip-link" href="#main">Skip to main content</a>
      <Header />

      <main id="main" tabIndex={-1}>
        <div className="top-row">
          <div className="top-row__left">
            <UploadPanel
              busy={busy}
              status={status}
              onFileSelected={(filename) => {
                setStatus(`Selected: ${filename}`);
                const prefix = getOutputPrefix(undefined, filename);
                setOutputName(prefix);
                return prefix;
              }}
              onConvertRequest={onConvertRequest}
            />

            <JsonOutputPanel
              downloadFiles={downloadFiles}
              zipFilename={zipFilename}
              outputName={outputName}
              onOutputNameChange={onOutputNameChange}
              trackEvents={trackEvents}
            />
          </div>

          <ExamplePanel />
        </div>

        <VisualizationPanel trackEvents={trackEvents} />

        <SchematicPanel trackEvents={trackEvents} />
      </main>

      <Footer />
    </>
  );
}
