'use client';

import { useState, useRef, cloneElement } from 'react';
import { createPortal } from 'react-dom';

// Shows `text` in a small dark tooltip above the wrapped element after a
// short hover pause — positioned via a fixed-position portal so it's
// never clipped by a scrolling ancestor (a plain CSS group-hover tooltip
// would get cut off inside e.g. the cell list's overflow-y-auto box).
//
// `asChild`: clones the ref/hover handlers directly onto `children`
// instead of adding a wrapping <span> — required inside CSS grid layouts
// where an extra box would break aspect-ratio sizing (e.g. the bingo
// grid's cells). Only works when `children` is a single element that
// forwards refs to a real DOM node (a plain <button>/<div>, not an
// arbitrary function component) — the default (wrapped) mode works with
// anything and is fine outside of a grid.
export default function HoverTooltip({ text, children, delay = 900, className = 'relative inline-flex shrink-0', asChild = false }) {
  const [pos, setPos] = useState(null);
  const ref = useRef(null);
  const timer = useRef(null);

  function measure() {
    timer.current = setTimeout(() => {
      const rect = ref.current?.getBoundingClientRect();
      if (rect) setPos({ top: rect.top, left: rect.left + rect.width / 2 });
    }, delay);
  }

  function clear() {
    clearTimeout(timer.current);
    setPos(null);
  }

  const tooltip =
    pos && text && typeof document !== 'undefined'
      ? createPortal(
          <span
            style={{ position: 'fixed', top: pos.top - 8, left: pos.left, transform: 'translate(-50%, -100%)' }}
            className="pointer-events-none z-50 max-w-[220px] whitespace-normal break-words rounded-md bg-ink-900 px-2 py-1 text-center text-[11px] text-paper shadow-ticket"
          >
            {text}
          </span>,
          document.body
        )
      : null;

  if (asChild) {
    return (
      <>
        {cloneElement(children, {
          ref,
          onMouseEnter: (e) => {
            children.props.onMouseEnter?.(e);
            if (text) measure();
          },
          onMouseLeave: (e) => {
            children.props.onMouseLeave?.(e);
            clear();
          },
        })}
        {tooltip}
      </>
    );
  }

  return (
    <span ref={ref} onMouseEnter={() => text && measure()} onMouseLeave={clear} className={className}>
      {children}
      {tooltip}
    </span>
  );
}
