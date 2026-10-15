import { useState } from 'react';
import CollapsiblePanel from '../CollapsiblePanel';

export interface ConvertRequest {
  file: File;
  outputName: string;
  trimLeadingSilence: boolean;
  silent?: boolean;
}

interface UploadPanelProps {
  busy: boolean;
  status: string;
  onFileSelected: (filename: string) => void;
  onConvertRequest: (request: ConvertRequest) => unknown;
}

export default function UploadPanel({ busy, status, onFileSelected, onConvertRequest }: UploadPanelProps) {
  const [outputName, setOutputName] = useState('output.json');
  const [trimLeadingSilence, setTrimLeadingSilence] = useState(true);

  return (
    <CollapsiblePanel title="1) Upload MIDI" className="controls" collapsible={false}>
      <div className="control-row">
        <input
          type="file"
          aria-label="MIDI file"
          accept=".mid,.midi,audio/midi,audio/x-midi"
          disabled={busy}
          onChange={(event) => {
            const nextFile = event.target.files?.[0] || null;
            if (nextFile) {
              onFileSelected(nextFile.name);
              onConvertRequest({ file: nextFile, outputName, trimLeadingSilence });
            }
          }}
        />
        <input
          value={outputName}
          onChange={(event) => setOutputName(event.target.value)}
          placeholder="output.json"
          aria-label="output filename"
        />
      </div>
      <label className="option-row">
        <input
          type="checkbox"
          checked={trimLeadingSilence}
          onChange={(event) => setTrimLeadingSilence(event.target.checked)}
        />
        <span>Remove empty space at the start of the song</span>
      </label>
      <p id="status" className={busy ? 'status-busy' : undefined} role="status" aria-live="polite">
        {busy ? <span className="spinner" aria-hidden="true" /> : null}
        <span>{status}</span>
      </p>
    </CollapsiblePanel>
  );
}
