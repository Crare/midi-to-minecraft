import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

interface VisualizationOptionsProps {
  viewMode: string;
  setViewMode: (v: string) => void;
  showColor: boolean;
  setShowColor: (v: boolean) => void;
  showNumber: boolean;
  setShowNumber: (v: boolean) => void;
  showSupport: boolean;
  setShowSupport: (v: boolean) => void;
  visibleTracks: any[];
  trackEvents: any[];
  viewModes: any;
}

export default function VisualizationOptions({
  viewMode,
  setViewMode,
  showColor,
  setShowColor,
  showNumber,
  setShowNumber,
  showSupport,
  setShowSupport,
  visibleTracks,
  trackEvents,
  viewModes,
}: VisualizationOptionsProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        gap: 3,
        alignItems: 'center',
        flexWrap: 'wrap',
        my: 2,
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span>Group by</span>
        <Select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value)}
          disabled={visibleTracks.length === 0 && trackEvents.length === 0}
          size="small"
          sx={{ minWidth: 140, bgcolor: '#fff', '& .MuiSelect-select': { py: 1 } }}
        >
          <MenuItem value={viewModes.instrument}>Instrument</MenuItem>
          <MenuItem value={viewModes.track}>Original tracks</MenuItem>
        </Select>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Checkbox
          checked={showColor}
          onChange={(e) => setShowColor(e.target.checked)}
          size="small"
          sx={{ color: '#3d5f22', '&.Mui-checked': { color: '#3d5f22' } }}
        />
        Color
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Checkbox
          checked={showNumber}
          onChange={(e) => setShowNumber(e.target.checked)}
          size="small"
          sx={{ color: '#3d5f22', '&.Mui-checked': { color: '#3d5f22' } }}
        />
        Number
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Checkbox
          checked={showSupport}
          onChange={(e) => setShowSupport(e.target.checked)}
          size="small"
          sx={{ color: '#3d5f22', '&.Mui-checked': { color: '#3d5f22' } }}
        />
        Support
      </Box>
    </Box>
  );
}
