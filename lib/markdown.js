// Minimal markdown support for card descriptions — no external library,
// just the handful of patterns people actually use in a short blurb:
// **bold**, *italic*, "- " bullet lists, and line breaks. Input is
// HTML-escaped first, so the markdown patterns are the only HTML that
// gets introduced — safe to render with dangerouslySetInnerHTML.
export function renderMarkdownLite(text) {
  if (!text) return '';

  let safe = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  safe = safe.replace(/(?<!\*)\*(?!\*)(.+?)\*(?!\*)/g, '<em>$1</em>');

  // Turn consecutive "- item" lines into a single <ul>, leave everything
  // else as plain lines joined by <br/>.
  const lines = safe.split('\n');
  const out = [];
  let inList = false;
  for (const line of lines) {
    const bullet = line.match(/^-\s+(.*)/);
    if (bullet) {
      if (!inList) {
        out.push('<ul class="list-disc pl-5">');
        inList = true;
      }
      out.push(`<li>${bullet[1]}</li>`);
    } else {
      if (inList) {
        out.push('</ul>');
        inList = false;
      }
      out.push(line + '<br/>');
    }
  }
  if (inList) out.push('</ul>');

  return out.join('');
}
