import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

const playIcon = `${import.meta.env.BASE_URL}assets/icons/play.svg`;
const stopIcon = `${import.meta.env.BASE_URL}assets/icons/stop.svg`;
const gotoStartIcon = `${import.meta.env.BASE_URL}assets/icons/goto-start.svg`;

interface PlaybackControlsProps {
  playbackScope: string;
  setPlaybackScope: (v: string) => void;
  visibleTracks: any[];
  selectedPlaybackTrackId: string;
  setSelectedPlaybackTrackId: (v: string) => void;
  isPlaying: boolean;
  playheadTick: number;
  startPlayback: () => void;
  stopPlayback: (tick?: number) => void;
}

export default function PlaybackControls({
  playbackScope,
  setPlaybackScope,
  visibleTracks,
  selectedPlaybackTrackId,
  setSelectedPlaybackTrackId,
  isPlaying,
  playheadTick,
  startPlayback,
  stopPlayback,
}: PlaybackControlsProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start', my: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span>Playback</span>
          <Select
            value={playbackScope}
            onChange={(event) => setPlaybackScope(event.target.value)}
            disabled={visibleTracks.length === 0}
            size="small"
            sx={{ minWidth: 120, bgcolor: '#fff', '& .MuiSelect-select': { py: 1 } }}
          >
            <MenuItem value="all">All tracks</MenuItem>
            <MenuItem value="single">Single track</MenuItem>
          </Select>
        </Box>
        {playbackScope === 'single' ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span>Track</span>
            <Select
              value={selectedPlaybackTrackId}
              onChange={(event) => setSelectedPlaybackTrackId(event.target.value)}
              disabled={visibleTracks.length === 0}
              size="small"
              sx={{ minWidth: 160, bgcolor: '#fff', '& .MuiSelect-select': { py: 1 } }}
            >
              {visibleTracks.map((track: any) => (
                <MenuItem key={track.id} value={track.id}>
                  {track.title} ({track.subtitle})
                </MenuItem>
              ))}
            </Select>
          </Box>
        ) : null}
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center', mt: 1 }}>
        <Button
          variant="contained"
          onClick={startPlayback}
          disabled={visibleTracks.length === 0 || isPlaying}
          aria-label="Play"
          sx={{
            bgcolor: '#3d5f22',
            color: '#fff',
            minWidth: 36,
            p: 0.5,
            '&:hover': { bgcolor: '#49732a' },
          }}
        >
          <img
            src={playIcon}
            width="16"
            height="16"
            alt="Play"
            aria-hidden="true"
            draggable={false}
          />
        </Button>
        <Button
          variant="contained"
          onClick={() => stopPlayback()}
          disabled={!isPlaying && playheadTick === 0}
          aria-label="Stop"
          sx={{
            bgcolor: '#3d5f22',
            color: '#fff',
            minWidth: 36,
            p: 0.5,
            '&:hover': { bgcolor: '#49732a' },
          }}
        >
          <img
            src={stopIcon}
            width="16"
            height="16"
            alt="Stop"
            aria-hidden="true"
            draggable={false}
          />
        </Button>
        <Button
          variant="contained"
          onClick={() => stopPlayback(0)}
          disabled={visibleTracks.length === 0}
          aria-label="Go to start"
          sx={{
            bgcolor: '#3d5f22',
            color: '#fff',
            minWidth: 36,
            p: 0.5,
            '&:hover': { bgcolor: '#49732a' },
          }}
        >
          <img
            src={gotoStartIcon}
            width="16"
            height="16"
            alt="Go to start"
            aria-hidden="true"
            draggable={false}
          />
        </Button>
      </Box>
      <Box sx={{ color: 'text.secondary', fontSize: 13, mt: 1 }}>
        Position: {playheadTick.toFixed(1)} ticks
      </Box>
    </Box>
  );
}
