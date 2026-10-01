// Category definitions — the only static content the app still ships with.
// Everything else (users, cards, collections) lives in the database.
export const CATEGORIES = [
  { slug: 'food', label: 'Yeme İçme', accent: '#FF8A3D' },
  { slug: 'music', label: 'Müzik', accent: '#FFC53D' },
  { slug: 'gaming', label: 'Oyun', accent: '#38D6A7' },
  { slug: 'movies', label: 'Film', accent: '#FF4B6E' },
  { slug: 'series', label: 'Dizi', accent: '#D946EF' },
  { slug: 'books', label: 'Kitap', accent: '#8B6F47' },
  { slug: 'lifestyle', label: 'Yaşam', accent: '#F06EC7' },
  { slug: 'work', label: 'Meslek', accent: '#64748B' },
  { slug: 'travel', label: 'Seyahat', accent: '#4FA3FF' },
  { slug: 'tech', label: 'Teknoloji', accent: '#06B6D4' },
  { slug: 'sports', label: 'Spor', accent: '#B98CFF' },
  { slug: 'other', label: 'Diğer', accent: '#9C9A92' },
];

export const FEATURED_CATEGORIES = ['travel', 'movies', 'gaming', 'books', 'lifestyle'];
