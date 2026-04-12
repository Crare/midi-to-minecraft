import CollapsiblePanel from '@components/common/CollapsiblePanel';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { ChangeEvent, useState } from 'react';

interface UploadPanelProps {
  busy: boolean;
  status: string;
  onFileSelected: (filename: string) => void;
  onConvertRequest: (args: { file: File; outputName: string; trimLeadingSilence: boolean }) => void;
}

export default function UploadPanel({
  busy,
  status,
  onFileSelected,
  onConvertRequest,
}: UploadPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [outputName, setOutputName] = useState('output.json');
  const [trimLeadingSilence, setTrimLeadingSilence] = useState(true);

  return (
    <CollapsiblePanel title="1) Upload MIDI" defaultOpen={true}>
      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center', mb: 2 }}>
        <input
          type="file"
          accept=".mid,.midi,audio/midi,audio/x-midi"
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
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
          style={{ minWidth: 120 }}
        />
        <Button
          onClick={() => {
            if (!file || busy) return;
            onConvertRequest({ file, outputName, trimLeadingSilence });
          }}
          disabled={!file || busy}
          variant="contained"
          sx={{
            minWidth: 110,
            bgcolor: '#3d5f22',
            color: '#fff',
            '&:hover': { bgcolor: '#49732a' },
          }}
        >
          {busy ? (
            <>
              <CircularProgress size={18} sx={{ mr: 1 }} />
              Converting...
            </>
          ) : (
            'Convert'
          )}
        </Button>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Checkbox
          checked={trimLeadingSilence}
          onChange={(event) => setTrimLeadingSilence(event.target.checked)}
          size="small"
          sx={{
            color: '#3d5f22',
            '&.Mui-checked': {
              color: '#3d5f22',
            },
          }}
        />
        <Typography variant="body2">Remove empty space at the start of the song</Typography>
      </Box>
      <Typography
        id="status"
        variant="body2"
        sx={{
          color: busy ? 'primary.main' : 'text.secondary',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        {busy ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
        <span>{status}</span>
      </Typography>
    </CollapsiblePanel>
  );
}
