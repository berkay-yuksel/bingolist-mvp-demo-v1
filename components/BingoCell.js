'use client';

import HoverTooltip from './HoverTooltip';

const MARKS = {
  check: '✓',
  dot: '●',
  stamp: '★',
};

// Selection feedback is a "highlight" — dim/muted when unselected, full
// brightness when selected — never a solid color fill (that felt heavy and
// hid images). The optional 'border' mark style draws a thin accent frame
// instead of a corner glyph. A null/falsy accent means "colorless" — marks
// and borders fall back to a neutral gray instead of a theme color.
export default function BingoCell({ cell, selected, percent, showStats, checkStyle, shape, accent, hideText, onToggle }) {
  const aspect = shape === 'poster' ? 'aspect-[131/193]' : 'aspect-square';
  const radius = shape === 'circle' ? 'rounded-full' : 'rounded-sm';
  const isBorderStyle = checkStyle === 'border';
  const mark = isBorderStyle ? null : MARKS[checkStyle] || MARKS.check;
  const markColor = accent || '#9C9A92';
  const tooltipText = hideText && (cell.text || cell.emoji) ? `${cell.emoji ? cell.emoji + ' ' : ''}${cell.text || ''}`.trim() : null;

  return (
    <HoverTooltip text={tooltipText} asChild>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={selected}
        className={`group relative flex ${aspect} flex-col items-center border p-1.5 text-center transition-colors duration-150 ${radius} ${
          cell.image ? 'justify-end' : 'justify-center'
        } ${
          selected ? 'bg-ink-600 text-paper' : 'border-ink-500 bg-ink-700/60 text-paper/50 hover:border-paper/30'
        } ${selected && !isBorderStyle ? 'border-ink-500' : ''} ${selected && isBorderStyle ? 'border-2' : ''}`}
        style={selected && isBorderStyle ? { borderColor: markColor } : undefined}
      >
        <div className={`absolute inset-0 overflow-hidden ${radius}`}>
          {cell.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cell.image}
              alt=""
              className={`h-full w-full object-cover transition-all duration-200 ${selected ? 'brightness-[1.05]' : 'brightness-[0.55]'}`}
              aria-hidden
            />
          )}
        </div>

        {!hideText && (
          <span
            className={`relative z-10 line-clamp-3 text-xs font-medium leading-tight sm:text-sm ${
              cell.image ? 'drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]' : ''
            }`}
          >
            {cell.emoji && <span className="mr-1">{cell.emoji}</span>}
            {cell.text}
          </span>
        )}

        {showStats && (
          <span className="relative z-10 mt-1 rounded-full bg-ink-900/70 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-paper">
            {percent}%
          </span>
        )}

        {selected && mark && (
          <span className="absolute right-1 top-1 z-10 font-display text-sm leading-none" style={{ color: markColor }}>
            {mark}
          </span>
        )}
      </button>
    </HoverTooltip>
  );
}
