'use client';

import BingoCell from './BingoCell';

export default function BingoGrid({ cells, columns, selectedIds, cellStats, showStats, checkStyle, shape, accent, hideText, onToggle, interactive = true }) {
  return (
    <div
      className="grid gap-1.5 sm:gap-2"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {cells.map((cell) => (
        <BingoCell
          key={cell.id}
          cell={cell}
          selected={selectedIds.has(cell.id)}
          percent={cellStats?.[cell.id]?.percent ?? 0}
          showStats={showStats}
          checkStyle={checkStyle}
          shape={shape}
          accent={accent}
          hideText={hideText}
          onToggle={interactive ? () => onToggle(cell.id) : undefined}
        />
      ))}
    </div>
  );
}
