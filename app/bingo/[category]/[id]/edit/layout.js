// The edit screen shouldn't inherit the "şimdi çöz" link-preview title
// from the play page and shouldn't be indexed.
export const metadata = {
  title: 'Kartı düzenle — BingoList',
  robots: { index: false },
  openGraph: { title: 'Kartı düzenle — BingoList' },
};

export default function EditLayout({ children }) {
  return children;
}
