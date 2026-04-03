import { useState } from 'react';

export default function UploadPanel({ busy, status, onFileSelected, onConvertRequest }) {
  const [file, setFile] = useState(null);
  const [outputName, setOutputName] = useState('output.json');
  const [trimLeadingSilence, setTrimLeadingSilence] = useState(true);

  return (
    <section className="panel controls">
      <h2>1) Upload MIDI</h2>
      <div className="control-row">
        <input
          type="file"
          accept=".mid,.midi,audio/midi,audio/x-midi"
          onChange={(event) => {
            const nextFile = event.target.files?.[0] || null;
            setFile(nextFile);
            if (nextFile) onFileSelected(nextFile.name);
          }}
        />
        <input
          value={outputName}
          onChange={(event) => setOutputName(event.target.value)}
          placeholder="output.json"
          aria-label="output filename"
        />
        <button
          onClick={() => {
            if (!file || busy) return;
            onConvertRequest({ file, outputName, trimLeadingSilence });
          }}
          disabled={!file || busy}
        >
          {busy ? (
            <>
              <span className="spinner spinner-inline" aria-hidden="true" />
              Converting...
            </>
          ) : (
            'Convert'
          )}
        </button>
      </div>
      <label className="option-row">
        <input
          type="checkbox"
          checked={trimLeadingSilence}
          onChange={(event) => setTrimLeadingSilence(event.target.checked)}
        />
        <span>Remove empty space at the start of the song</span>
      </label>
      <p id="status" className={busy ? 'status-busy' : undefined}>
        {busy ? <span className="spinner" aria-hidden="true" /> : null}
        <span>{status}</span>
      </p>
    </section>
  );
}
