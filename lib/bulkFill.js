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
