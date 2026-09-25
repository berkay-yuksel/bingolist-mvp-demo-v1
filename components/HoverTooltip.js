'use client';

import { useState, useRef, cloneElement } from 'react';
import { createPortal } from 'react-dom';

// Shows `text` in a small dark tooltip near the mouse cursor's tip after a
// short hover pause — positioned via a fixed-position portal so it's
// never clipped by a scrolling ancestor (a plain CSS group-hover tooltip
// would get cut off inside e.g. the cell list's overflow-y-auto box).
// Follows the cursor while hovering (tracked via mousemove), rather than
// staying centered over the whole element, which reads oddly on a large
// cell.
//
// `asChild`: clones the ref/hover handlers directly onto `children`
// instead of adding a wrapping <span> — required inside CSS grid layouts
// where an extra box would break aspect-ratio sizing (e.g. the bingo
// grid's cells). Only works when `children` is a single element that
// forwards refs to a real DOM node (a plain <button>/<div>, not an
// arbitrary function component) — the default (wrapped) mode works with
// anything and is fine outside of a grid.
export default function HoverTooltip({ text, children, delay = 350, className = 'relative inline-flex shrink-0', asChild = false }) {
  const [pos, setPos] = useState(null);
  const mouse = useRef({ x: 0, y: 0 });
  const timer = useRef(null);

  function trackMouse(e) {
    mouse.current = { x: e.clientX, y: e.clientY };
  }

  function handleEnter(e) {
    trackMouse(e);
    if (!text) return;
    timer.current = setTimeout(() => {
      setPos({ ...mouse.current });
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
            style={{ position: 'fixed', top: pos.y - 14, left: pos.x + 14, transform: 'translate(0, -100%)' }}
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
          onMouseEnter: (e) => {
            children.props.onMouseEnter?.(e);
            handleEnter(e);
          },
          onMouseMove: (e) => {
            children.props.onMouseMove?.(e);
            trackMouse(e);
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
    <span onMouseEnter={handleEnter} onMouseMove={trackMouse} onMouseLeave={clear} className={className}>
      {children}
      {tooltip}
    </span>
  );
}