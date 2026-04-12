import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import JSZip from 'jszip';
import { useEffect, useState } from 'react';

interface DownloadRowProps {
  filename: string;
  files: { name: string; data: unknown }[];
}

export default function DownloadRow({ filename, files }: DownloadRowProps) {
  const [href, setHref] = useState('');

  useEffect(() => {
    let active = true;
    let objectUrl = '';

    async function buildArchive() {
      const zip = new JSZip();
      files.forEach((file) => {
        zip.file(file.name.replace(/^.*\//, ''), JSON.stringify(file.data, null, 2));
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      if (!active) return;
      objectUrl = URL.createObjectURL(blob);
      setHref(objectUrl);
    }

    setHref('');
    void buildArchive();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [files]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2">{filename}</Typography>
        <Typography variant="caption" color="text.secondary">
          {files.length} JSON file(s) in ZIP
        </Typography>
      </Box>
      <Button
        component="a"
        href={href}
        download={filename}
        variant="contained"
        sx={{
          pointerEvents: href ? 'auto' : 'none',
          opacity: href ? 1 : 0.5,
          bgcolor: '#7ec850',
          color: '#222',
          '&:hover': { bgcolor: '#a3e072' },
        }}
        disabled={!href}
      >
        Download ZIP
      </Button>
    </Box>
  );
}
