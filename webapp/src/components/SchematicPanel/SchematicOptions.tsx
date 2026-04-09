interface SchematicOptionsProps {
  cellSize: number;
  setCellSize: (size: number) => void;
}

export default function SchematicOptions({ cellSize, setCellSize }: SchematicOptionsProps) {
  return (
    <div className="schematic-controls">
      <label className="option-row option-row-stacked">
        <span>Cell size</span>
        <select value={cellSize} onChange={(e) => setCellSize(Number(e.target.value))}>
          <option value={20}>Small (20px)</option>
          <option value={28}>Medium (28px)</option>
          <option value={36}>Large (36px)</option>
          <option value={48}>XL (48px)</option>
        </select>
      </label>
    </div>
  );
}
