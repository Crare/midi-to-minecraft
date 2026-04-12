import ExamplePanel from '@components/ExamplePanel';
import JsonOutputPanel from '@components/JsonOutputPanel';
import SchematicPanel from '@components/SchematicPanel';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { Midi } from '@tonejs/midi';
import { useState } from 'react';
import { playSuccessJingle } from './audio/noteblockAudio';
import UploadPanel from './components/UploadPanel';
import { eventsToPlacements } from './midi/placements';
import {
  buildTrackEvents,
  getZipFilename,
  splitOutputTarget,
  type TrackEvent,
} from './midi/trackEvents';
import { Placement } from './midi/types';

interface ConvertRequest {
  file: File;
  outputName?: string;
  trimLeadingSilence?: boolean;
}

export default function App() {
  const [status, setStatus] = useState<string>('Choose a MIDI file to begin.');
  const [busy, setBusy] = useState<boolean>(false);
  const [trackEvents, setTrackEvents] = useState<TrackEvent[]>([]);
  const [downloadFiles, setDownloadFiles] = useState<{ name: string; data: Placement[] }[]>([]);
  const [zipFilename, setZipFilename] = useState<string>('output.zip');
  const [exampleOpen, setExampleOpen] = useState<boolean>(true);

  console.log('trackEvents', trackEvents);

  const onConvertRequest = async ({ file, outputName, trimLeadingSilence }: ConvertRequest) => {
    if (!file || busy) return;

    try {
      setBusy(true);
      setStatus('Reading MIDI file...');
      const buffer = await file.arrayBuffer();
      const midi = new Midi(buffer);
      const nextTrackEvents = buildTrackEvents(midi, { trimLeadingSilence });
      const sequences = nextTrackEvents.map((track) => eventsToPlacements(track.events));
      setTrackEvents(nextTrackEvents);

      const target = splitOutputTarget(file.name, outputName);
      const files =
        sequences.length <= 1
          ? [
              {
                name: `${target.dir}/${target.stem}${target.ext}`,
                data: sequences[0] || [],
              },
            ]
          : sequences.map((track, i) => ({
              name: `${target.dir}/${target.stem}.${i}${target.ext}`,
              data: track,
            }));

      setDownloadFiles(files);
      setZipFilename(getZipFilename(outputName, file.name));
      const totalNotes = sequences.reduce((sum, track) => sum + track.length, 0);
      setStatus(`Converted ${sequences.length} track(s), ${totalNotes} notes total.`);
      setExampleOpen(false);
      setTimeout(() => playSuccessJingle(), 500);
    } catch (error: any) {
      console.error(error);
      setStatus(`Conversion failed: ${error.message || String(error)}`);
    } finally {
      setTimeout(() => setBusy(false), 500);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box component="header" sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          MIDI to Minecraft Noteblocks
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Upload a MIDI file, convert it to note block JSON, and visualize each track as a
          horizontal build line.
        </Typography>
      </Box>

      <Box component="main" sx={{ mb: 4 }}>
        <ExamplePanel open={exampleOpen} onOpenChange={setExampleOpen} />

        <UploadPanel
          busy={busy}
          status={status}
          onFileSelected={(filename: string) => {
            setStatus(`Selected: ${filename}`);
          }}
          onConvertRequest={onConvertRequest}
        />

        <JsonOutputPanel downloadFiles={busy ? [] : downloadFiles} zipFilename={zipFilename} />

        <SchematicPanel trackEvents={busy ? [] : trackEvents} busy={busy} />
      </Box>

      <Box
        component="footer"
        sx={{ textAlign: 'center', color: 'text.secondary', fontSize: '0.95rem', mt: 4 }}
      >
        <Typography variant="body2" gutterBottom>
          Inspired by the{' '}
          <Link href="https://github.com/colinthesealion" target="_blank" rel="noreferrer">
            MIDI to Minecraft project by colinthesealion
          </Link>
          . Website with visualization and schematic created by{' '}
          <Link href="https://crare.github.io" target="_blank" rel="noreferrer">
            Crare
          </Link>
          .
        </Typography>
        <Typography variant="body2" gutterBottom>
          This site uses{' '}
          <Link href="https://www.goatcounter.com" target="_blank" rel="noreferrer">
            GoatCounter
          </Link>{' '}
          to count anonymous page visits. No personal data is collected.
        </Typography>
        <Typography variant="body2">
          Licensed under the{' '}
          <Link
            href="https://github.com/Crare/midi-to-minecraft/blob/main/LICENSE"
            target="_blank"
            rel="noreferrer"
          >
            MIT License
          </Link>
          .
        </Typography>
      </Box>
    </Container>
  );
}
