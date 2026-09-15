'use client';

import Link from 'next/link';
import { ShieldAlert, Flag, Sparkles, Lock } from 'lucide-react';
import { useCurrentUser } from '@/components/UserContext';

export default function ManagementHub() {
  const { user } = useCurrentUser();
  const isModerator = user.role === 'moderator';
  const isEditor = user.role === 'editor';

  if (!isModerator && !isEditor) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <Lock size={28} className="mx-auto mb-3 text-paper/40" />
        <p className="font-display text-xl font-bold">Bu alana erişimin yok</p>
        <p className="mt-2 text-sm text-paper/50">
          Yönetim ekranları sadece moderatör ve editör rolündeki hesaplara açık. Sağ üstten demo kullanıcısını
          değiştirerek deneyebilirsin.
        </p>
        <Link href="/" className="mt-4 inline-block text-mint">← Keşfete dön</Link>
      </div>
    );
  }

  const cards = [
    isModerator && {
      href: '/management/moderation',
      icon: ShieldAlert,
      title: 'Moderasyon Issue\'ları',
      desc: 'Kartlar üzerinde inceleme aç, revizyon iste, yayın durumu yönet.',
    },
    isModerator && {
      href: '/management/reports',
      icon: Flag,
      title: 'Kullanıcı Bildirimleri',
      desc: 'Kullanıcıların bildirdiği kartları triyaj et, gerekirse issue\'ya dönüştür.',
    },
    isEditor && {
      href: '/management/editorial',
      icon: Sparkles,
      title: 'Editöryal İçerik',
      desc: 'Öne çıkan kartlar, öne çıkan kategoriler ve koleksiyonları yönet.',
    },
  ].filter(Boolean);

  return (
    <div className="mx-auto w-[92vw] max-w-[1800px] py-10">
      <p className="font-mono text-xs uppercase tracking-wider text-stamp">Yönetim</p>
      <h1 className="mb-6 font-display text-3xl font-bold">Merhaba, {user.displayName}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-lg border border-ink-500 bg-ink-700/50 p-5 transition hover:-translate-y-0.5 hover:border-mint"
          >
            <c.icon size={20} className="mb-3 text-mint" />
            <p className="font-display text-lg font-bold">{c.title}</p>
            <p className="mt-1 text-sm text-paper/55">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
