import Link from 'next/link';
import { readDB, publicCardSummary, publicUserSummary, sortCreatorsByPlayers, trendingScore, popularScore, isPubliclyListed, withAdsFirst, autoPopularTagsForCategory, mostUsedTags } from '@/lib/db';
import CardRow from '@/components/CardRow';
import HeroCard from '@/components/HeroCard';
import CategoryStrip from '@/components/CategoryStrip';
import CreatorRow from '@/components/CreatorRow';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const db = await readDB();
  const publicCards = db.cards.filter(isPubliclyListed);

  const trending = [...publicCards].sort((a, b) => trendingScore(b) - trendingScore(a)).slice(0, 8);
  const popular = [...publicCards].sort((a, b) => popularScore(b) - popularScore(a)).slice(0, 8);
  const newest = [...publicCards].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);
  const featured = publicCards.filter((c) => c.featured);

  const trendingCreators = sortCreatorsByPlayers(
    db.users.filter((u) => u.isCreator).map((u) => publicUserSummary(u, db))
  );

  // The rows below "Yeniler" come from one ordered list the editor controls
  // ("Öne Çıkanlar", category rows, collections and "Popüler Bingolar").
  const sectionRows = (db.homeSections || [])
    .map((key) => {
      if (key === 'featured') {
        return (
          <CardRow
            key={key}
            eyebrow="Editörün seçimi"
            title="Öne Çıkanlar"
            titleHref="/browse/featured"
            cards={featured.map(publicCardSummary)}
          />
        );
      }

      if (key === 'popular') {
        return (
          <CardRow
            key={key}
            eyebrow="Her zaman güçlü"
            title="Popüler Bingolar"
            titleHref="/browse/popular"
            cards={popular.map(publicCardSummary)}
          />
        );
      }

      if (key.startsWith('category:')) {
        const category = db.categories.find((c) => c.slug === key.slice('category:'.length));
        if (!category) return null;
        const eligible = publicCards.filter(
          (c) => c.category === category.slug || (c.isAd && c.adCategory === category.slug)
        );
        const sorted = [...eligible].sort((a, b) => trendingScore(b) - trendingScore(a));
        return (
          <CardRow
            key={key}
            eyebrow="Öne çıkan kategori"
            title={`${category.label} kategorisinde trend`}
            titleHref={`/category/${category.slug}`}
            hideTitleArrow
            cards={withAdsFirst(sorted, category.slug).slice(0, 8).map(publicCardSummary)}
          />
        );
      }

      if (key.startsWith('collection:')) {
        const col = db.collections.find((c) => c.id === key.slice('collection:'.length));
        if (!col) return null;
        const cards = col.cardIds.map((id) => db.cards.find((c) => c.id === id)).filter(Boolean).map(publicCardSummary);
        return (
          <CardRow
            key={key}
            eyebrow="Koleksiyon"
            title={col.title}
            titleHref={`/collections/${col.id}`}
            hideTitleArrow
            cards={cards}
          />
        );
      }

      return null;
    })
    .filter(Boolean);

  const heroCardEntity = db.heroBanner?.cardId ? db.cards.find((c) => c.id === db.heroBanner.cardId) : null;
  const heroCard = heroCardEntity || trending[0];

  const popularTags = mostUsedTags(db, 12);

  return (
    <div>
      <HeroCard card={heroCard ? publicCardSummary(heroCard) : null} media={db.heroBanner?.media} />
      <CategoryStrip categories={db.categories} popularTags={popularTags} />
      <CardRow eyebrow="Şu an yükselişte" title="Trend Bingolar" titleHref="/browse/trending" cards={trending.map(publicCardSummary)} />
      <CardRow eyebrow="Yeni eklendi" title="Yeniler" titleHref="/browse/new" cards={newest.map(publicCardSummary)} />
      {sectionRows}

      <CreatorRow creators={trendingCreators} />

      <div className="mx-auto w-[92vw] max-w-[1800px] pb-16">
        <Link
          href="/create"
          className="block rounded-lg border border-dashed border-ink-500 p-6 text-center text-sm text-paper/60 transition hover:border-mint hover:text-mint"
        >
          Aklındaki listeyi bir BingoCard'a dönüştür → Yeni kart oluştur
        </Link>
      </div>
    </div>
  );
}