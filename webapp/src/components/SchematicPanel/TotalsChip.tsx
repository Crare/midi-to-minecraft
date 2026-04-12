import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import React from 'react';

function stackLabel(n: number): string {
  const s = Math.floor(n / 64);
  const r = n % 64;
  if (s === 0) return '< 1 stack';
  if (r === 0) return `${s} stack${s !== 1 ? 's' : ''}`;
  return `${s}64 + ${r}`;
}

interface TotalsChipProps {
  icon: React.ReactNode;
  count: number;
  label: string;
}

const TotalsChip: React.FC<TotalsChipProps> = ({ icon, count, label }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1,
        py: 0.5,
        borderRadius: 2,
        bgcolor: 'background.paper',
        boxShadow: 1,
      }}
    >
      {icon}
      <Box sx={{ display: 'flex', flexDirection: 'column', ml: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1 }}>
          {count.toLocaleString()} <span style={{ fontWeight: 400 }}>{label}</span>
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
          {stackLabel(count)}
        </Typography>
      </Box>
    </Box>
  );
};

export default TotalsChip;
