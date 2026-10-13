import './globals.css';
import './fonts.css';
import Header from '@/components/Header';
import { UserProvider } from '@/components/UserContext';

// Absolute base for og:image and other metadata URLs. Set
// NEXT_PUBLIC_SITE_URL in Vercel to pin it to a custom domain; otherwise it
// falls back to Vercel's production URL.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'BingoList — Listeleri oyuna çevir',
  description: 'İlgi çekici listeleri interaktif, paylaşılabilir Bingo kartlarına dönüştür.',
  openGraph: {
    title: 'BingoList — Listeleri oyuna çevir',
    description: 'İlgi çekici listeleri interaktif, paylaşılabilir Bingo kartlarına dönüştür.',
    siteName: 'BingoList',
    locale: 'tr_TR',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body className="font-body bg-ink text-paper bg-grain" suppressHydrationWarning>
        <UserProvider>
          <Header />
          <main className="min-h-screen">{children}</main>
        </UserProvider>
      </body>
    </html>
  );
}