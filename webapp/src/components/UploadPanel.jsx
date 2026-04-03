export default function UploadPanel({
  canConvert,
  outputName,
  busy,
  trimLeadingSilence,
  status,
  onFileChange,
  onOutputNameChange,
  onTrimLeadingSilenceChange,
  onConvert,
}) {
  return (
    <section className="panel controls">
      <h2>1) Upload MIDI</h2>
      <div className="control-row">
        <input
          type="file"
          accept=".mid,.midi,audio/midi,audio/x-midi"
          onChange={(event) => {
            onFileChange(event.target.files?.[0] || null);
          }}
        />
        <input
          value={outputName}
          onChange={(event) => onOutputNameChange(event.target.value)}
          placeholder="output.json"
          aria-label="output filename"
        />
        <button onClick={onConvert} disabled={!canConvert || busy}>
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
          onChange={(event) => onTrimLeadingSilenceChange(event.target.checked)}
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
