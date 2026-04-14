import React from 'react';

interface TlGridProps {
  startHour: number;
  endHour: number;
}

export function TlGrid({ startHour, endHour }: TlGridProps) {
  const hourCount = endHour - startHour;
  if (hourCount <= 0) return null;
  const hours: number[] = [];
  for (let h = startHour; h < endHour; h++) hours.push(h);

  return (
    <div
      className="tl-grid-header"
      style={{ '--tl-hour-count': hourCount } as React.CSSProperties}
    >
      {hours.map(h => {
        const left = ((h - startHour) / hourCount) * 100;
        return (
          <div key={h} className="tl-hour-label" style={{ left: `${left}%` }}>
            {String(h).padStart(2, '0')}:00
          </div>
        );
      })}
    </div>
  );
}
