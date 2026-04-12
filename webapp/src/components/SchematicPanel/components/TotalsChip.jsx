export function stackLabel(n) {
  const s = Math.floor(n / 64);
  const r = n % 64;
  if (s === 0) return "< 1 stack";
  if (r === 0) return `${s} stack${s !== 1 ? "s" : ""}`;
  return `${s}×64 + ${r}`;
}

export function TotalsChip({ icon, count, label }) {
  return (
    <div className="totals-chip">
      {icon}
      <div className="totals-chip-info">
        <span className="totals-chip-count">{count.toLocaleString()}</span>{" "}
        <span className="totals-chip-label">{label}</span>
        <span className="totals-chip-stacks">{stackLabel(count)}</span>
      </div>
    </div>
  );
}
