import DownloadRow from './DownloadRow';
import { useEffect, useState } from 'react';
import CollapsiblePanel from '../CollapsiblePanel';

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
    <CollapsiblePanel
      title="2) JSON Output"
      meta={downloadFiles.length === 0 ? 'No output yet' : outputsOpen ? 'Hide' : 'Show ZIP'}
      open={outputsOpen}
      onOpenChange={(v) => { if (downloadFiles.length > 0) setOutputsOpen(v); }}
      disabled={downloadFiles.length === 0}
      className="outputs"
    >
      <p className="hint output-summary">
        {downloadFiles.length === 0
          ? 'No output yet.'
          : `${downloadFiles.length} file(s) packaged into ${zipFilename}.`}
      </p>
      <div className="downloads">
        <DownloadRow filename={zipFilename} files={downloadFiles} />
      </div>
    </CollapsiblePanel>
  );
}
