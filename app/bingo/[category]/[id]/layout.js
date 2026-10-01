import { readDB } from '@/lib/db';

function plainText(markdown = '') {
  return markdown
    .replace(/[#*_`>\[\]-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstHttpImage(card) {
  const candidates = [card.coverImage, ...card.cells.map((c) => c.image)];
  return candidates.find((u) => typeof u === 'string' && /^https?:\/\//.test(u)) || null;
}

// Link previews (WhatsApp, Telegram, Twitter/X, iMessage ...) read these
// tags. The play page itself is a client component, so the metadata lives
// here in the route's layout instead.
export async function generateMetadata({ params }) {
  const { id } = await params;
  const db = await readDB();
  const card = db.cards.find((c) => c.id === id);

  if (!card || card.publicationState !== 'PUBLISHED') {
    return { title: 'BingoList — Bingo kartı' };
  }

  const title = `${card.title} — Bingo kartı, şimdi çöz`;
  const description =
    plainText(card.description).slice(0, 160) ||
    `${card.cells.length} hücrelik bingo kartı. Sen kaçını işaretleyebilirsin?`;
  const image = firstHttpImage(card);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'BingoList',
      locale: 'tr_TR',
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default function CardLayout({ children }) {
  return children;
}
