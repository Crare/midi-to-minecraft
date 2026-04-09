import { CellComponentProps } from 'react-window';

// Cell renderer for react-window Grid
export function TrackRowGridCell({
  columnIndex,
  rowIndex,
  style,
  cellProps,
}: CellComponentProps<{
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  cellProps: {
    tracks: any[];
    mutedTracks: Set<string>;
    showColor: boolean;
    showNumber: boolean;
    showSupport: boolean;
    trackUnitSize: number;
  };
}>) {
  if (!cellProps) return <div style={style} />;
  const { tracks, mutedTracks, showColor, showNumber, showSupport, trackUnitSize } = cellProps;
  if (!tracks || !mutedTracks) return <div style={style} />;
  const track = tracks[rowIndex];
  if (!track || !track.id || !Array.isArray(track.notes)) return null;
  if (mutedTracks.has(track.id)) return null;
  const note = track.notes[columnIndex];
  if (!note) return <div style={style} />;
  // Render a single note cell using TrackRow's logic (or inline for now)
  return (
    <div style={style}>
      <div className="note-unit">
        {note.placements.map((placement: any, pi: number) => (
          <span key={pi}>{placement.note}</span>
        ))}
      </div>
    </div>
  );
}
