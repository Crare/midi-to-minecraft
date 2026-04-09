import TrackRow from './TrackRow';

export default function trackRowRendererFactory(
  visibleTracks: any[],
  mutedTracks: Set<string>,
  showColor: boolean,
  showNumber: boolean,
  showSupport: boolean,
  trackUnitSize: number,
  scrollLeft: number,
  containerWidth: number,
) {
  return ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const track = visibleTracks[index];
    if (!track || !track.id || !Array.isArray(track.notes)) return null;
    if (mutedTracks.has(track.id)) return null;
    return (
      <div style={style} key={track.id}>
        <TrackRow
          notes={track.notes}
          showColor={showColor}
          showNumber={showNumber}
          showSupport={showSupport}
          noteTooltipDirection={index === 0 ? 'bottom' : 'top'}
          unitSize={trackUnitSize}
          scrollLeft={scrollLeft}
          containerWidth={containerWidth}
        />
      </div>
    );
  };
}
