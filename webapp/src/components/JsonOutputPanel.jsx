import DownloadRow from './DownloadRow';

export default function JsonOutputPanel({
  downloadFiles,
  outputsOpen,
  zipFilename,
  onToggle,
}) {
  return (
    <section className="panel outputs">
      <button
        type="button"
        className="panel-header panel-header-toggle"
        onClick={onToggle}
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
