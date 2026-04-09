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
    <div className="totals-chip">
      {icon}
      <div className="totals-chip-info">
        <span className="totals-chip-count">{count.toLocaleString()}</span>{' '}
        <span className="totals-chip-label">{label}</span>
        <span className="totals-chip-stacks">{stackLabel(count)}</span>
      </div>
    </div>
  );
};

export default TotalsChip;
