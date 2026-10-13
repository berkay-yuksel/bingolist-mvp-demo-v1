// Minimal markdown support for card descriptions — no external library,
// just the handful of patterns people actually use in a short blurb:
// ## and ### headings, **bold**, *italic*, "- " bullet lists, "- [ ]"/"- [x]"
// checkbox lists, links, and line breaks.
//
// Links: [text](https://example.com) or just a bare https://example.com
// (or www.example.com) in the text. Only http(s) links are ever created.
//
// Input is HTML-escaped first, so the markdown patterns are the only HTML
// that gets introduced — safe to render with dangerouslySetInnerHTML. The
// links are the one place user text ends up inside an attribute, so the URL
// pattern cannot match a quote, whitespace, "<" or ">" — nothing typed into a
// URL can break out of the href="..." it is written into.

// The characters of a URL. Stops at whitespace, quotes and angle brackets
// (including the escaped &lt; / &gt;), and allows one level of balanced
// parentheses, so Wikipedia-style addresses work but "(see https://x.com)"
// does not swallow the closing bracket.
const URL_BODY = `(?:(?!&[lg]t;)[^\\s<>"'\`()]|\\((?:(?!&[lg]t;)[^\\s<>"'\`()])*\\))+`;
const LINK_RE = new RegExp(
  `\\[([^\\]\\n]+)\\]\\(\\s*(https?:\\/\\/${URL_BODY})\\s*\\)|\\b((?:https?:\\/\\/|www\\.)${URL_BODY})`,
  'gi'
);

const LINK_CLASS = 'text-mint underline underline-offset-2 hover:opacity-80 break-words';

function anchor(href, labelHtml) {
  // href never contains a quote (see URL_BODY); & is already written as &amp;
  return `<a href="${href}" target="_blank" rel="noopener noreferrer nofollow ugc" title="${href}" class="${LINK_CLASS}">${labelHtml}</a>`;
}

// What a bare address shows as its text: no scheme / www., no trailing slash,
// cut to a readable length. The full address stays in the href and the title.
function shortLabel(url) {
  let s = url.replace(/&amp;/g, '&').replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '');
  if (s.length > 45) s = `${s.slice(0, 44)}…`;
  return s.replace(/&/g, '&amp;');
}

// Trailing punctuation belongs to the sentence, not to the address
// ("bkz. https://x.com." / "https://x.com!" / "**https://x.com**").
function splitTrailing(url) {
  let tail = '';
  for (;;) {
    const last = url.slice(-1);
    const endsWithEntity = /&[a-z]+;$/i.test(url);
    if (last && ('.,:!?…*_'.includes(last) || (last === ';' && !endsWithEntity))) {
      tail = last + tail;
      url = url.slice(0, -1);
    } else {
      return [url, tail];
    }
  }
}

const emphasis = (s) =>
  s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(?<!\*)\*(?!\*)(.+?)\*(?!\*)/g, '<em>$1</em>');

export function renderMarkdownLite(text) {
  if (!text) return '';

  let safe = text
    .replace(/[\uE000\uE001]/g, '') // private-use characters are used as placeholders below
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Links first, swapped for placeholders, so the bold/italic patterns below
  // can never reach into an address (an * or _ in a URL stays a URL).
  const links = [];
  const stash = (html) => `\uE000${links.push(html) - 1}\uE001`;
  safe = safe.replace(LINK_RE, (match, mdText, mdUrl, bare) => {
    if (mdUrl) return stash(anchor(mdUrl, emphasis(mdText)));
    const [url, tail] = splitTrailing(bare);
    if (url.length <= 4) return match; // nothing left after the punctuation was trimmed off
    const href = /^www\./i.test(url) ? `https://${url}` : url;
    return stash(anchor(href, shortLabel(url))) + tail;
  });

  safe = emphasis(safe);

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

  return out.join('').replace(/\uE000(\d+)\uE001/g, (_, i) => links[Number(i)]);
}