import DownloadRow from './DownloadRow';
import CollapsiblePanel from '../CollapsiblePanel';
import type { DownloadFile } from '../../types';

interface JsonOutputPanelProps {
  downloadFiles: DownloadFile[];
  zipFilename: string;
}

export default function JsonOutputPanel({ downloadFiles, zipFilename }: JsonOutputPanelProps) {
  return (
    <CollapsiblePanel
      title="2) JSON Output"
      collapsible={false}
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
