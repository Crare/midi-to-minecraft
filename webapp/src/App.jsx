import { Midi } from "@tonejs/midi";
import { useState } from "react";
import { playSuccessJingle } from "./audio/noteblockAudio";
import ExamplePanel from "./components/ExamplePanel";
import JsonOutputPanel from "./components/JsonOutputPanel";
import SchematicPanel from "./components/SchematicPanel";
import UploadPanel from "./components/UploadPanel";
import VisualizationPanel from "./components/VisualizationPanel";

import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import {
  buildTrackEvents,
  eventsToPlacements,
  getZipFilename,
  splitOutputTarget
} from "./utils";

export default function App() {
  const [status, setStatus] = useState("Choose a MIDI file to begin.");
  const [busy, setBusy] = useState(false);
  const [trackEvents, setTrackEvents] = useState([]);
  const [downloadFiles, setDownloadFiles] = useState([]);
  const [zipFilename, setZipFilename] = useState("output.zip");

  const onConvertRequest = async ({ file, outputName, trimLeadingSilence }) => {
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
      setZipFilename(getZipFilename(outputName, file.name));
      const totalNotes = sequences.reduce(
        (sum, track) => sum + track.length,
        0
      );
      setStatus(
        `Converted ${sequences.length} track(s), ${totalNotes} notes total.`
      );
      setTimeout(() => playSuccessJingle(), 2000);
    } catch (error) {
      console.error(error);
      setStatus(`Conversion failed: ${error.message || String(error)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Header />

      <main>
        <ExamplePanel />

        <UploadPanel
          busy={busy}
          status={status}
          onFileSelected={(filename) => setStatus(`Selected: ${filename}`)}
          onConvertRequest={onConvertRequest}
        />

        <JsonOutputPanel
          downloadFiles={downloadFiles}
          zipFilename={zipFilename}
        />

        <VisualizationPanel trackEvents={trackEvents} />

        <SchematicPanel trackEvents={trackEvents} />
      </main>

      <Footer />
    </>
  );
}
