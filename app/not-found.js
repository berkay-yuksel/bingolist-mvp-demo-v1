import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="font-display text-2xl font-bold">Sayfa bulunamadı</p>
      <p className="mt-2 text-paper/50">Aradığın şey burada değil.</p>
      <Link href="/" className="mt-4 inline-block text-mint">← Anasayfaya dön</Link>
    </div>
  );
}
