import './globals.css';
import Header from '@/components/Header';
import { UserProvider } from '@/components/UserContext';

export const metadata = {
  title: 'BingoList — Listeleri oyuna çevir',
  description: 'İlgi çekici listeleri interaktif, paylaşılabilir Bingo kartlarına dönüştür.',
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
