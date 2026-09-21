// Minimal markdown support for card descriptions — no external library,
// just the handful of patterns people actually use in a short blurb:
// ## and ### headings, **bold**, *italic*, "- " bullet lists, "- [ ]"/"- [x]"
// checkbox lists, and line breaks. Input is HTML-escaped first, so the
// markdown patterns are the only HTML that gets introduced — safe to
// render with dangerouslySetInnerHTML.
export function renderMarkdownLite(text) {
  if (!text) return '';

  let safe = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  safe = safe.replace(/(?<!\*)\*(?!\*)(.+?)\*(?!\*)/g, '<em>$1</em>');

  const lines = safe.split('\n');
  const out = [];
  let inList = false;
  const closeList = () => {
    if (inList) {
      out.push('</ul>');
      inList = false;
    }
  };
  for (const line of lines) {
    const h3 = line.match(/^###\s+(.*)/);
    const h2 = !h3 && line.match(/^##\s+(.*)/);
    if (h3 || h2) {
      closeList();
      out.push(h3 ? `<h3 class="mt-3 text-base font-bold text-paper">${h3[1]}</h3>` : `<h2 class="mt-3 text-lg font-bold text-paper">${h2[1]}</h2>`);
      continue;
    }

    const task = line.match(/^-\s+\[([ xX])\]\s+(.*)/);
    const bullet = !task && line.match(/^-\s+(.*)/);
    if (task || bullet) {
      if (!inList) {
        out.push('<ul class="space-y-1 pl-5">');
        inList = true;
      }
      if (task) {
        const checked = task[1].toLowerCase() === 'x';
        out.push(
          `<li class="-ml-5 flex list-none items-start gap-1.5"><input type="checkbox" disabled ${
            checked ? 'checked' : ''
          } class="mt-1 accent-mint" /><span${checked ? ' class="text-paper/40 line-through"' : ''}>${task[2]}</span></li>`
        );
      } else {
        out.push(`<li class="list-disc">${bullet[1]}</li>`);
      }
    } else {
      closeList();
      out.push(line + '<br/>');
    }
  }
  closeList();

  return out.join('');
}