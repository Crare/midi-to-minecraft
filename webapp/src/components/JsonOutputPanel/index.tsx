import { useEffect, useState } from 'react';
import CollapsiblePanel from '../CollapsiblePanel';
import DownloadRow from './DownloadRow';

interface JsonOutputPanelProps {
  downloadFiles: { name: string; data: unknown }[];
  zipFilename: string;
}

export default function JsonOutputPanel({ downloadFiles, zipFilename }: JsonOutputPanelProps) {
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
      onOpenChange={(v) => {
        if (downloadFiles.length > 0) setOutputsOpen(v);
      }}
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
