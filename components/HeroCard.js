import Link from 'next/link';
import CardCover from './CardCover';

// The right side is an editor-controlled ad slot (image or video) rather
// than the old interactive demo grid — content and media are both set from
// Management → Editorial → Banner.
export default function HeroCard({ card, media }) {
  if (!card) return null;

  return (
    <section className="relative overflow-hidden border-b border-ink-500/40">
      <div
        className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full opacity-25 blur-3xl"
        style={{ backgroundColor: card.theme?.accent || '#38D6A7' }}
        aria-hidden
      />
      <div className="mx-auto grid w-[92vw] max-w-[1800px] items-center gap-8 py-12 md:grid-cols-2 md:py-20">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-stamp">Bu senin için mi geçerli?</p>
          <h1 className="mt-3 text-balance font-display text-4xl font-bold leading-[1.05] text-paper sm:text-5xl">
            {card.title}
          </h1>
          {card.description && <p className="mt-4 max-w-md text-paper/60">{card.description}</p>}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/bingo/${card.category}/${card.id}`}
              className="rounded-full bg-stamp px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-stamp-light"
            >
              Kartı oyna
            </Link>
            <Link
              href="/create"
              className="rounded-full border border-ink-500 px-5 py-2.5 text-sm font-semibold text-paper/80 transition hover:border-mint hover:text-mint"
            >
              Kendi kartını oluştur
            </Link>
          </div>
        </div>

        <Link
          href={`/bingo/${card.category}/${card.id}`}
          className="block aspect-video overflow-hidden rounded-lg border border-ink-500 shadow-ticket"
        >
          {media?.type === 'video' && media.url ? (
            <video src={media.url} className="h-full w-full object-cover" autoPlay muted loop playsInline />
          ) : media?.type === 'image' && media.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={media.url} alt={card.title} className="h-full w-full object-cover" />
          ) : card.coverImage ? (
            // No banner media was picked — fall back to the selected card's
            // own cover image before resorting to the procedural pattern.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.coverImage} alt={card.title} className="h-full w-full object-cover" />
          ) : (
            <CardCover accent={card.theme?.accent} seed={card.coverSeed ?? 0} title={card.title} className="h-full w-full" />
          )}
        </Link>
      </div>
    </section>
  );
}
