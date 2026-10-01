// Splits pasted bulk text into one entry per cell.
//   - Multiple lines -> one entry per line (the common case: pasted from
//     a list, a spreadsheet column, a chat reply, etc.).
//   - A single line -> falls back to splitting on commas, since that's
//     the only case where someone typing on one line could plausibly mean
//     "these are separate items".
// Leading numbering/bullets ("1. ", "1) ", "- ", "• ", "* ") are stripped
// from each entry — pasted numbered lists are extremely common and this
// is unambiguous to clean up, unlike guessing at "1 2 3"-style separators
// with no punctuation, which we deliberately leave alone (too likely to
// mangle real content).
export function parseBulkText(input) {
  if (!input || !input.trim()) return [];

  const rawLines = input
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const entries = rawLines.length > 1 ? rawLines : rawLines[0].split(',').map((s) => s.trim()).filter(Boolean);

  return entries.map((line) => line.replace(/^(\d+[.)]\s+|[-•*]\s+)/, '').trim()).filter(Boolean);
}

// Applies parsed entries to a cells array positionally — entry i becomes
// cells[i].text. Cells beyond the entry count are cleared (so pasting a
// shorter list, or applying an empty box, cleans up the tail instead of
// leaving stale text behind); only `text` is touched, image/emoji/id stay
// as they were.
export function applyBulkText(cells, entries) {
  return cells.map((c, i) => ({ ...c, text: entries[i] || '' }));
}

// Grid shape (rows x columns) picked automatically after a bulk add,
// keyed by how many cells there are. Hand-tuned: [rows, cols].
const GRID_TABLE = {
  1: [1, 1], 2: [1, 2], 3: [1, 3], 4: [2, 2], 5: [2, 3],
  6: [2, 3], 7: [2, 4], 8: [2, 4], 9: [3, 3], 10: [5, 2],
  11: [3, 4], 12: [3, 4], 13: [7, 2], 14: [7, 2], 15: [5, 3],
  16: [4, 4], 17: [6, 3], 18: [6, 3], 19: [5, 4], 20: [5, 4],
  21: [7, 3], 22: [6, 4], 23: [6, 4], 24: [6, 4], 25: [5, 5],
  26: [9, 3], 27: [9, 3], 28: [7, 4], 29: [6, 5], 30: [6, 5],
  31: [8, 4], 32: [8, 4], 33: [7, 5], 34: [7, 5], 35: [7, 5],
  36: [6, 6], 37: [8, 5], 38: [8, 5], 39: [8, 5], 40: [8, 5],
  41: [7, 6], 42: [7, 6], 43: [9, 5], 44: [9, 5], 45: [9, 5],
  46: [12, 4], 47: [12, 4], 48: [8, 6], 49: [10, 5], 50: [10, 5],
};

// Beyond the table: always 5 columns with as many rows as needed
// (51 -> 11x5, 100 -> 20x5, 200 -> 40x5 ...). 180 is the one hand-picked
// exception: 30 rows x 6 columns.
const SPECIAL_CASES = {
  180: [30, 6],
};

// rows * cols is always >= count, so a bulk add can never come up short —
// it can only leave a few spare empty cells at the end.
export function computeAutoGrid(count) {
  const n = Math.max(1, Math.floor(count) || 1);
  const fixed = GRID_TABLE[n] || SPECIAL_CASES[n];
  if (fixed) return { rows: fixed[0], cols: fixed[1] };
  return { rows: Math.ceil(n / 5), cols: 5 };
}

// How many cells are actually in use: position of the last cell that has
// any content (text, emoji or image). Empty cells after it don't count —
// that's what lets a fresh form (which starts with 9 blank cells) shrink to
// exactly the size the table gives for what was added.
export function contentCount(cells) {
  for (let i = cells.length - 1; i >= 0; i--) {
    const c = cells[i];
    if ((c.text && c.text.trim()) || c.emoji || c.image) return i + 1;
  }
  return 0;
}

export function padCells(cells, total, makeCell) {
  if (cells.length >= total) return cells;
  return [...cells, ...Array.from({ length: total - cells.length }, (_, i) => makeCell(cells.length + i))];
}

// Drops the images into the cells that don't have one yet (in order), then
// appends new cells for any that are left over. Also remembers each file's
// original name so "dosya adlarından içe aktar" can use it later.
export function placeImages(cells, images, makeCell) {
  let i = 0;
  const next = cells.map((c) => {
    if (i < images.length && !c.image) {
      const img = images[i++];
      return { ...c, image: img.url, sourceFilename: img.filename };
    }
    return c;
  });
  while (i < images.length) {
    const img = images[i++];
    next.push({ ...makeCell(next.length), image: img.url, sourceFilename: img.filename });
  }
  return next;
}

// Sizes the grid for what's in `cells` (see computeAutoGrid) and returns
// the cells padded/trimmed to rows * cols. Only trailing *empty* cells can
// ever be trimmed, so nothing that has content is lost.
export function fitToAutoGrid(cells, makeCell) {
  const { rows, cols } = computeAutoGrid(contentCount(cells));
  const total = rows * cols;
  const fitted = cells.length > total ? cells.slice(0, total) : padCells(cells, total, makeCell);
  return { cells: fitted, rows, cols };
}

// Turns an uploaded file's name into a plausible cell caption:
// "Dark_Souls-Cover%27s.jpg" -> "Dark Souls Cover's"
export function filenameToText(filename) {
  let name = filename;
  try {
    name = decodeURIComponent(name);
  } catch {
    // malformed escape sequence — just use it as-is
  }
  return name
    .replace(/\.[a-zA-Z0-9]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}