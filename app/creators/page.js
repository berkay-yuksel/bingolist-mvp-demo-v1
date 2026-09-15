import { readDB, publicUserSummary } from '@/lib/db';
import CreatorRow from '@/components/CreatorRow';

export const dynamic = 'force-dynamic';

export default async function CreatorsPage() {
  const db = await readDB();
  const creators = [...db.users]
    .filter((u) => u.isCreator)
    .sort((a, b) => b.followers.length - a.followers.length)
    .map((u) => publicUserSummary(u, db));

  return (
    <div className="mx-auto w-[92vw] max-w-[1800px] py-10">
      <p className="font-mono text-xs uppercase tracking-wider text-stamp">Keşfet</p>
      <h1 className="mb-8 font-display text-3xl font-bold">Tüm Yaratıcılar</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {creators.map((c) => (
          <CreatorTile key={c.id} creator={c} />
        ))}
      </div>
    </div>
  );
}

function CreatorTile({ creator }) {
  return (
    <a
      href={`/profile/${creator.username}`}
      className="flex flex-col items-center gap-2 rounded-lg border border-ink-500 bg-ink-700 p-4 text-center transition hover:border-mint"
    >
      <span
        className="grid h-14 w-14 place-items-center overflow-hidden rounded-full text-xl font-bold text-ink"
        style={{ backgroundColor: creator.avatarColor }}
      >
        {creator.avatarImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={creator.avatarImage} alt="" className="h-full w-full object-cover" />
        ) : (
          creator.displayName[0]
        )}
      </span>
      <span className="font-display text-sm font-bold text-paper">{creator.displayName}</span>
      <span className="text-xs text-paper/45">@{creator.username}</span>
    </a>
  );
}
