import DownloadRow from './DownloadRow';
import { useEffect, useState } from 'react';

export default function JsonOutputPanel({ downloadFiles, zipFilename }) {
  const [outputsOpen, setOutputsOpen] = useState(false);

  useEffect(() => {
    if (downloadFiles.length > 0) {
      setOutputsOpen(true);
    } else {
      setOutputsOpen(false);
    }
  }, [downloadFiles]);

  return (
    <section className="panel outputs">
      <button
        type="button"
        className="panel-header panel-header-toggle"
        onClick={() => {
          if (downloadFiles.length > 0) {
            setOutputsOpen((open) => !open);
          }
        }}
        aria-expanded={outputsOpen}
        disabled={downloadFiles.length === 0}
      >
        <h2>2) JSON Output</h2>
        <span className="panel-header-meta">
          {downloadFiles.length === 0 ? 'No output yet' : outputsOpen ? 'Hide' : 'Show ZIP'}
        </span>
      </button>
      <div className="panel-body">
        <p className="hint output-summary">
          {downloadFiles.length === 0
            ? 'No output yet.'
            : `${downloadFiles.length} file(s) packaged into ${zipFilename}.`}
        </p>
        {outputsOpen ? (
          <div className="downloads">
            <DownloadRow filename={zipFilename} files={downloadFiles} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
