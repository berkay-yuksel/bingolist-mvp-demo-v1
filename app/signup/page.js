'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCurrentUser } from '@/components/UserContext';

export default function SignupPage() {
  const router = useRouter();
  const { refreshSession } = useCurrentUser();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, displayName, password }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json()).error);
      return;
    }
    await refreshSession();
    router.push('/');
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-1 font-display text-2xl font-bold">Hesap oluştur</h1>
      <p className="mb-6 text-sm text-paper/50">Birkaç saniyede hesabını aç, kart oluşturmaya başla.</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-paper/60">İsim</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="name"
            className="w-full rounded-md border border-ink-500 bg-ink-800 px-3 py-2 text-sm focus:border-mint"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-paper/60">Kullanıcı adı</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            placeholder="küçük harf, rakam, alt çizgi"
            className="w-full rounded-md border border-ink-500 bg-ink-800 px-3 py-2 text-sm focus:border-mint"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-paper/60">Şifre</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="en az 6 karakter"
            className="w-full rounded-md border border-ink-500 bg-ink-800 px-3 py-2 text-sm focus:border-mint"
          />
        </div>
        {error && <p className="text-sm text-stamp">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-mint py-2.5 text-sm font-semibold text-ink hover:bg-mint-dark disabled:opacity-60"
        >
          {busy ? 'Oluşturuluyor…' : 'Hesap oluştur'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-paper/50">
        Zaten hesabın var mı?{' '}
        <Link href="/login" className="text-mint hover:underline">
          Giriş yap
        </Link>
      </p>
    </div>
  );
}
