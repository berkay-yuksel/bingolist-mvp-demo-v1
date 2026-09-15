'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { useCurrentUser } from './UserContext';
import NotificationBell from './NotificationBell';

export default function Header() {
  const { user, users, setUserId, isRealSession, devSwitcherEnabled, logout } = useCurrentUser();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();

  function handleSearch(e) {
    e.preventDefault();
    if (q.trim()) {
      setSearchOpen(false);
      router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    }
  }

  useEffect(() => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      const json = await res.json();
      setResults(json);
      setSearchOpen(true);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    function onClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const navLink = (href, label) => (
    <Link
      href={href}
      className={`text-sm transition-colors ${
        pathname === href ? 'text-paper' : 'text-paper/55 hover:text-paper/85'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-ink-500/40 bg-ink/90 backdrop-blur-md">
      <div className="mx-auto flex w-[92vw] max-w-[1800px] items-center gap-6 py-3">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-stamp font-display text-sm font-bold text-ink shadow-stamp">
            B
          </span>
          <span className="font-display text-lg font-bold tracking-tight">BingoList</span>
        </Link>

        <nav className="hidden items-center gap-5 md:flex">
          {navLink('/', 'Keşfet')}
          {navLink('/categories', 'Kategoriler')}
          {navLink('/create', 'Oluştur')}
          {(user.role === 'moderator' || user.role === 'editor') && navLink('/management', 'Yönetim')}
        </nav>

        <div ref={searchRef} className="relative ml-auto hidden max-w-xs flex-1 sm:block">
          <form onSubmit={handleSearch} className="flex items-center">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => q.trim() && setSearchOpen(true)}
              placeholder="Kart veya @kullanıcı ara"
              className="w-full rounded-full border border-ink-500 bg-ink-700 px-4 py-1.5 text-sm text-paper placeholder:text-paper/35 focus:border-mint"
            />
          </form>

          {searchOpen && results && (
            <div className="absolute right-0 top-10 max-h-96 w-80 overflow-y-auto rounded-xl border border-ink-500 bg-ink-700 p-2 shadow-ticket">
              {results.creators.length === 0 && results.cards.length === 0 ? (
                <p className="px-2 py-4 text-center text-sm text-paper/40">Sonuç bulunamadı.</p>
              ) : (
                <>
                  {results.creators.slice(0, 3).map((c) => (
                    <Link
                      key={c.id}
                      href={`/profile/${c.username}`}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-ink-600"
                    >
                      <span
                        className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold text-ink"
                        style={{ backgroundColor: c.avatarColor }}
                      >
                        {c.displayName[0]}
                      </span>
                      <span className="truncate text-paper">@{c.username}</span>
                    </Link>
                  ))}
                  {results.cards.slice(0, 6).map((c) => (
                    <Link
                      key={c.id}
                      href={`/bingo/${c.category}/${c.id}`}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-ink-600"
                    >
                      <Search size={13} className="shrink-0 text-paper/35" />
                      <span className="truncate text-paper">{c.title}</span>
                    </Link>
                  ))}
                  <button
                    onClick={handleSearch}
                    className="mt-1 block w-full rounded-lg px-2 py-1.5 text-left text-xs text-mint hover:bg-ink-600"
                  >
                    "{q}" için tüm sonuçları gör →
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <Link
          href="/create"
          className="hidden shrink-0 rounded-full bg-stamp px-4 py-1.5 text-sm font-semibold text-ink transition hover:bg-stamp-light sm:block"
        >
          + Yeni Kart
        </Link>

        <div className="relative ml-2 shrink-0">
          <NotificationBell />
        </div>

        {!isRealSession && (
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <Link
              href="/login"
              className="rounded-full border border-ink-500 px-3 py-1.5 text-sm text-paper/70 hover:border-mint hover:text-mint"
            >
              Giriş yap
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-mint px-3 py-1.5 text-sm font-medium text-ink hover:bg-mint-dark"
            >
              Kayıt ol
            </Link>
          </div>
        )}

        {(isRealSession || devSwitcherEnabled) && (
        <div className="relative shrink-0">
          <button
            onClick={() => setSwitcherOpen((s) => !s)}
            className="flex items-center gap-2 rounded-full border border-ink-500 bg-ink-700 py-1 pl-1 pr-3 text-sm"
            aria-label={isRealSession ? 'Hesap menüsü' : 'Demo kullanıcısını değiştir'}
          >
            <span
              className="grid h-6 w-6 place-items-center overflow-hidden rounded-full text-[11px] font-bold text-ink"
              style={{ backgroundColor: user.avatarColor }}
            >
              {user.avatarImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarImage} alt="" className="h-full w-full object-cover" />
              ) : (
                user.displayName[0]
              )}
            </span>
            <span className="hidden text-paper/80 sm:inline">@{user.username}</span>
          </button>

          {switcherOpen && isRealSession && (
            <div className="absolute right-0 top-11 w-56 overflow-hidden rounded-xl border border-ink-500 bg-ink-700 p-2 shadow-ticket">
              <p className="truncate px-2 pb-1.5 pt-1 text-sm text-paper">
                {user.displayName} <span className="text-paper/40">@{user.username}</span>
              </p>
              <Link
                href={`/profile/${user.username}`}
                onClick={() => setSwitcherOpen(false)}
                className="mt-1 block rounded-lg px-2 py-1.5 text-sm text-mint hover:bg-ink-600"
              >
                Profilimi gör
              </Link>
              <button
                onClick={() => {
                  logout();
                  setSwitcherOpen(false);
                }}
                className="mt-1 block w-full rounded-lg px-2 py-1.5 text-left text-sm text-stamp hover:bg-ink-600"
              >
                Çıkış yap
              </button>
            </div>
          )}

          {switcherOpen && !isRealSession && (
            <div className="absolute right-0 top-11 max-h-96 w-64 overflow-y-auto rounded-xl border border-ink-500 bg-ink-700 p-2 shadow-ticket">
              <p className="px-2 pb-1.5 pt-1 font-mono text-[10px] uppercase tracking-wider text-paper/40">
                Demo kullanıcısı olarak gez
              </p>
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    setUserId(u.id);
                    setSwitcherOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-ink-600 ${
                    u.id === user.id ? 'bg-ink-600' : ''
                  }`}
                >
                  <span
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold text-ink"
                    style={{ backgroundColor: u.avatarColor }}
                  >
                    {u.displayName[0]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate leading-tight text-paper">{u.displayName}</span>
                    <span className="block truncate text-xs leading-tight text-paper/45">@{u.username}</span>
                  </span>
                  {u.role !== 'player' && (
                    <span className="shrink-0 rounded-full bg-ink-800 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-paper/50">
                      {u.role === 'moderator' ? 'Mod' : 'Editor'}
                    </span>
                  )}
                  {u.isCreator && (
                    <span className="shrink-0 rounded-full bg-stamp/15 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-stamp">
                      Creator
                    </span>
                  )}
                </button>
              ))}
              <Link
                href={`/profile/${user.username}`}
                onClick={() => setSwitcherOpen(false)}
                className="mt-1 block rounded-lg px-2 py-1.5 text-sm text-mint hover:bg-ink-600"
              >
                Profilimi gör →
              </Link>
              <Link
                href="/login"
                onClick={() => setSwitcherOpen(false)}
                className="mt-1 block rounded-lg px-2 py-1.5 text-sm text-paper/60 hover:bg-ink-600"
              >
                Gerçek hesapla giriş yap →
              </Link>
            </div>
          )}
        </div>
        )}
      </div>
    </header>
  );
}