interface SchematicOptionsProps {
  cellSize: number;
  setCellSize: (size: number) => void;
}

import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

export default function SchematicOptions({ cellSize, setCellSize }: SchematicOptionsProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span>Cell size</span>
        <Select
          value={cellSize}
          onChange={(e) => setCellSize(Number(e.target.value))}
          size="small"
          sx={{ minWidth: 120, bgcolor: '#fff', '& .MuiSelect-select': { py: 1 } }}
        >
          <MenuItem value={20}>Small (20px)</MenuItem>
          <MenuItem value={28}>Medium (28px)</MenuItem>
          <MenuItem value={36}>Large (36px)</MenuItem>
          <MenuItem value={48}>XL (48px)</MenuItem>
        </Select>
      </Box>
    </Box>
  );
}
