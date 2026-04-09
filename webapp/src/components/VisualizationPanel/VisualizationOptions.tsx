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
    <div className="viz-toggles">
      <label className="option-row option-row-stacked">
        <span>Group by</span>
        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value)}
          disabled={visibleTracks.length === 0 && trackEvents.length === 0}
        >
          <option value={viewModes.instrument}>Instrument</option>
          <option value={viewModes.track}>Original tracks</option>
        </select>
      </label>
      <label className="viz-toggle-label">
        <input
          type="checkbox"
          checked={showColor}
          onChange={(e) => setShowColor(e.target.checked)}
        />
        Color
      </label>
      <label className="viz-toggle-label">
        <input
          type="checkbox"
          checked={showNumber}
          onChange={(e) => setShowNumber(e.target.checked)}
        />
        Number
      </label>
      <label className="viz-toggle-label">
        <input
          type="checkbox"
          checked={showSupport}
          onChange={(e) => setShowSupport(e.target.checked)}
        />
        Support
      </label>
    </div>
  );
}
