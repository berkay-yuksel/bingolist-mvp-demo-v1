import './globals.css';
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
        />
      </head>
      <body className="font-body bg-ink text-paper bg-grain" suppressHydrationWarning>
        <UserProvider>
          <Header />
          <main className="min-h-screen">{children}</main>
        </UserProvider>
      </body>
    </html>
  );
}
