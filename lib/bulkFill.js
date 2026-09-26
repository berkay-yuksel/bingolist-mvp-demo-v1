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

// Works out a sensible grid shape for N entries after a bulk add: rounds
// the total up to an even number, then keeps rows growing slowly (roughly
// sqrt-scaled) while columns absorb most of the growth — small lists stay
// close to square (9 -> 3x3), large ones go wide rather than turning into
// a long vertical scroll (100 -> 5 rows x 20 cols). cols is always
// rounded up, so rows*cols is never less than the actual count — it can
// only ever be equal or a little more, never short.
// Works out a sensible grid shape for N entries after a bulk add: rounds
// the total up to an even number, then keeps columns growing slowly
// (roughly sqrt-scaled, and always the smaller of the two numbers) while
// rows absorb most of the growth — a tall, narrow grid that just gets
// longer to scroll through, rather than getting so wide that cells shrink
// on a phone screen. Small lists stay close to square (9 -> 4x3), large
// ones go tall (100 -> 20 rows x 5 cols). cols is always rounded up when
// dividing, so rows*cols is never less than the actual count — it can
// only ever be equal or a little more, never short.
export function computeAutoGrid(rawCount) {
  const total = rawCount % 2 === 0 ? rawCount : rawCount + 1;
  const cols = Math.max(3, Math.ceil(Math.sqrt(total / 4)));
  const rows = Math.ceil(total / cols);
  return { rows, cols };
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