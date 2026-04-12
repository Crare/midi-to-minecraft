import CollapsiblePanel from '@components/common/CollapsiblePanel';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
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
    >
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        {downloadFiles.length === 0
          ? 'No output yet.'
          : `${downloadFiles.length} file(s) packaged into ${zipFilename}.`}
      </Typography>
      <Box sx={{ mt: 1 }}>
        <DownloadRow filename={zipFilename} files={downloadFiles} />
      </Box>
    </CollapsiblePanel>
  );
}
