// Rich seed content for the BingoList prototype.
// Real titles, places, foods and experiences make the UI states credible.
// Images are fixed Unsplash CDN assets rather than random endpoints.

const U = (photoId, width = 1200, height = 800) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${width}&h=${height}&q=82`;

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

export const USERS = [
  {
    id: 'u_asli', username: 'spinoza', displayName: 'Baruch Spinoza',
    bio: 'İstanbul sokak lezzetlerini ve iyi kahveyi keşfediyorum. 🍢',
    avatarColor: '#FF4B6E', avatarImage: U('photo-1494790108377-be9c29b29330', 256, 256),
    isCreator: true, role: 'player', social: { instagram: 'aslikaya' },
    following: ['u_deniz', 'u_leyla', 'u_arda'],
  },
  {
    id: 'u_deniz', username: 'nietzsche', displayName: 'Friedrich Nietzsche',
    bio: 'Retro oyun arşivcisi, speedrun meraklısı.',
    avatarColor: '#38D6A7', avatarImage: U('photo-1500648767791-00dcc994a43e', 256, 256),
    isCreator: true, role: 'player', social: { twitter: 'denizyildiz' },
    following: ['u_selin', 'u_arda'],
  },
  {
    id: 'u_mert', username: 'epiktetos', displayName: 'Epiktetos',
    bio: 'Futbol, deplasman ve hafta sonu rotaları.', avatarColor: '#4FA3FF', avatarImage: null,
    isCreator: true, role: 'player', social: {}, following: ['u_asli', 'u_deniz'],
  },
  {
    id: 'u_ece', username: 'epikuros', displayName: 'Epikuros',
    bio: 'Okuma listelerimi bingo ile eritiyorum.', avatarColor: '#FFC53D', avatarImage: null,
    isCreator: true, role: 'player', social: { goodreads: 'ecedemir' }, following: ['u_asli', 'u_leyla'],
  },
  {
    id: 'u_can', username: 'marcusaurelius', displayName: 'Marcus Aurelius',
    bio: 'Kahve demler, listeleri tamamlar.', avatarColor: '#B98CFF', avatarImage: null,
    isCreator: false, role: 'player', social: {}, following: ['u_asli'],
  },
  {
    id: 'u_selin', username: 'seneca', displayName: 'Seneca',
    bio: 'Film ve dizi bingoları; az spoiler, çok öneri.', avatarColor: '#FF8A3D', avatarImage: null,
    isCreator: true, role: 'player', social: { letterboxd: 'selinarslan' }, following: ['u_deniz', 'u_ece'],
  },
  {
    id: 'u_leyla', username: 'camus', displayName: 'Albert Camus',
    bio: 'Trenle, yürüyerek, bazen kaybolarak.', avatarColor: '#22A06B', avatarImage: null,
    isCreator: true, role: 'player', social: { instagram: 'leylagezer' }, following: ['u_asli', 'u_mert'],
  },
  {
    id: 'u_arda', username: 'schopenhauer', displayName: 'Arthur Schopenhauer',
    bio: 'Plaklar, konserler ve iyi hazırlanmış listeler.', avatarColor: '#7C5CFC', avatarImage: null,
    isCreator: true, role: 'player', social: { spotify: 'ardakayitlari' }, following: ['u_deniz', 'u_selin'],
  },
  {
    id: 'u_duru', username: 'carljung', displayName: 'Carl Jung',
    bio: 'Patikalar, millî parklar ve erken sabahlar.', avatarColor: '#16A085', avatarImage: null,
    isCreator: true, role: 'player', social: {}, following: ['u_leyla'],
  },
  {
    id: 'u_bora', username: 'aynrand', displayName: 'Ayn Rand',
    bio: 'Toplantılardan içerik çıkarıyorum.', avatarColor: '#64748B', avatarImage: null,
    isCreator: true, role: 'player', social: {}, following: ['u_ece'],
  },
  {
    id: 'u_ahmet_mod', username: 'kant', displayName: 'Immanuel Kant',
    bio: 'Topluluk ve içerik moderasyonu.', avatarColor: '#4DE0E0', avatarImage: null,
    isCreator: false, role: 'moderator', social: {}, following: [],
  },
  {
    id: 'u_zeynep_editor', username: 'beauvoir', displayName: 'Simone de Beauvoir',
    bio: 'Editöryal seçkiler ve koleksiyonlar.', avatarColor: '#FF6FD8', avatarImage: null,
    isCreator: false, role: 'editor', social: {}, following: ['u_asli', 'u_selin', 'u_leyla'],
  },
];

function textCells(list) {
  return list.map((item, index) => {
    const [text, emoji = null, description = ''] = Array.isArray(item) ? item : [item];
    return { id: `c${index + 1}`, contentType: 'text', text, emoji, description, image: null, imageAlt: null };
  });
}

function imageCells(list) {
  return list.map((item, index) => ({
    id: `c${index + 1}`,
    contentType: 'image',
    text: item.text,
    emoji: null,
    description: item.description || '',
    image: U(item.photoId, 720, 720),
    imageAlt: item.imageAlt || item.text,
    imageCredit: 'Unsplash',
  }));
}

function card(config) {
  const { coverPhotoId = null, coverImageAlt, ...data } = config;
  return {
    cellShape: 'square', checkStyle: 'border', visibility: 'public',
    originalCardId: null, featured: false, publicationState: 'PUBLISHED',
    ...data,
    coverImage: coverPhotoId ? U(coverPhotoId, 1600, 900) : null,
    coverImageAlt: coverImageAlt || `${data.title} kapak görseli`,
    coverImageCredit: coverPhotoId ? 'Unsplash' : null,
  };
}

export const CARDS = [
  card({
    id: 'istanbul-street-food', title: 'İstanbul Sokak Lezzetleri',
    description: 'Şehrin klasikleşmiş sokak lezzetlerinden kaçını tattın?', category: 'food',
    tags: ['istanbul', 'sokak-lezzetleri', 'yerel'], columns: 4, theme: { accent: '#FF8A3D' },
    creatorId: 'u_asli', createdAt: '2026-06-12T09:00:00.000Z', featured: true,
    coverPhotoId: 'photo-1504674900247-0877df9cc836', coverImageAlt: 'Paylaşımlı sofrada çeşitli yemekler',
    cells: textCells([
      ['Balık ekmek', '🐟'], ['Islak hamburger', '🍔'], ['Kokoreç', '🌯'], ['Midye dolma', '🦪'],
      ['Simit ve çay', '🥯'], ['Vefa bozası', '🥛'], ['Közde kestane', '🌰'], ['Maraş dondurması', '🍦'],
      ['Lahmacun', '🫓'], ['Ortaköy kumpiri', '🥔'], ['Tantuni', '🌮'], ['Nohutlu pilav', '🍚'],
      ['Çiğ köfte dürüm', '🌶️'], ['Künefe', '🧀'], ['Sahlep', '☕'], ['Börek', '🥐'],
    ]),
  }),
  card({
    id: 'turkish-breakfast-table', title: 'Türkiye Kahvaltı Sofrası',
    description: 'Dokuz parçalık görsel kahvaltı bingosu: gördüğünü değil, tattığını işaretle.', category: 'food',
    tags: ['kahvaltı', 'türkiye', 'görsel-bingo'], columns: 3, theme: { accent: '#E8792E' },
    creatorId: 'u_asli', createdAt: '2026-07-02T08:15:00.000Z', featured: true,
    coverPhotoId: 'photo-1533777857889-4be7c70b33f7', coverImageAlt: 'Kalabalık bir kahvaltı sofrası',
    cells: imageCells([
      { text: 'Simit', photoId: 'photo-1586444248902-2f64eddc13df', imageAlt: 'Susamlı simit' },
      { text: 'Menemen', photoId: 'photo-1608039829572-78524f79c4c7', imageAlt: 'Tavada yumurtalı kahvaltı' },
      { text: 'Beyaz peynir', photoId: 'photo-1486297678162-eb2a19b0a32d', imageAlt: 'Beyaz peynir dilimleri' },
      { text: 'Zeytin', photoId: 'photo-1474979266404-7eaacbcd87c5', imageAlt: 'Kâsede zeytin' },
      { text: 'Bal ve kaymak', photoId: 'photo-1587049352846-4a222e784d38', imageAlt: 'Bal kavanozu' },
      { text: 'Demli çay', photoId: 'photo-1594631252845-29fc4cc8cde9', imageAlt: 'İnce belli bardakta çay' },
      { text: 'Gözleme', photoId: 'photo-1565299507177-b0ac66763828', imageAlt: 'Sacda pişmiş gözleme' },
      { text: 'Reçel', photoId: 'photo-1490474418585-ba9bad8fd0ea', imageAlt: 'Reçel için taze orman meyveleri' },
      { text: 'Sucuklu yumurta', photoId: 'photo-1525351484163-7529414344d8', imageAlt: 'Tavada yumurta' },
    ]),
  }),
  card({
    id: 'coffee-brewing-methods', title: 'Kahve Demleme Yöntemleri',
    description: 'Evde veya bir kafede denediğin demleme yöntemlerini tamamla.', category: 'food',
    tags: ['kahve', 'demleme', 'barista'], columns: 3, theme: { accent: '#9A633A' },
    creatorId: 'u_can', createdAt: '2026-05-18T07:40:00.000Z',
    coverPhotoId: 'photo-1495474472287-4d71bcdd2085', coverImageAlt: 'Ahşap masada kahve fincanı',
    cells: textCells([
      ['Türk kahvesi', '☕'], ['V60', '🔻'], ['Chemex', '⚗️'], ['AeroPress', '💨'], ['French press', '🫗'],
      ['Moka pot', '♨️'], ['Espresso', '🤎'], ['Cold brew', '🧊'], ['Syphon', '🧪'],
    ]),
  }),
  card({
    id: 'istanbul-landmarks-photo', title: 'Seyahat Kareleri',
    description: 'Fotoğraflardaki gerçek seyahat anlarından yaşadıklarını işaretle.', category: 'travel',
    tags: ['seyahat', 'deneyim', 'görsel-bingo'], columns: 3, theme: { accent: '#3478F6' },
    creatorId: 'u_leyla', createdAt: '2026-07-21T10:30:00.000Z', featured: true,
    coverPhotoId: 'photo-1477959858617-67f85cf4f1df', coverImageAlt: 'Geniş bir şehir manzarası',
    cells: imageCells([
      { text: 'Gün doğumunda balon', photoId: 'photo-1528181304800-259b08848526' },
      { text: 'Dağ yürüyüşü', photoId: 'photo-1501785888041-af3ef285b470' },
      { text: 'Sahil günü', photoId: 'photo-1507525428034-b723cf961d3e' },
      { text: 'Şehir manzarası', photoId: 'photo-1477959858617-67f85cf4f1df' },
      { text: 'Çadır kampı', photoId: 'photo-1504280390367-361c6d9f38f4' },
      { text: 'Tren yolculuğu', photoId: 'photo-1473445361085-b9a07f55608b' },
      { text: 'Yerel pazar', photoId: 'photo-1488459716781-31db52582fe9' },
      { text: 'Mahalle kahvesi', photoId: 'photo-1495474472287-4d71bcdd2085' },
      { text: 'Karlı rota', photoId: 'photo-1483347756197-71ef80e95f73' },
    ]),
  }),
  card({
    id: 'weekend-in-kadikoy', title: "Kadıköy'de Bir Hafta Sonu",
    description: 'Moda’dan Yeldeğirmeni’ne klasikleşmiş semt ritüelleri.', category: 'travel',
    tags: ['istanbul', 'kadıköy', 'hafta-sonu'], columns: 4, theme: { accent: '#4FA3FF' },
    creatorId: 'u_asli', createdAt: '2026-06-28T10:00:00.000Z',
    coverPhotoId: 'photo-1524230572899-a752b3835840', coverImageAlt: 'Vapurdan İstanbul kıyısı',
    cells: textCells([
      ['Moda sahilinde yürü', '🌊'], ['Akmar’da kitap karıştır', '📚'], ['Çarşıda balık ye', '🐟'], ['Bahariye’de tramvayı gör', '🚋'],
      ['Yeldeğirmeni’nde mural bul', '🎨'], ['Vapurda çay iç', '⛴️'], ['Bir sokak kedisini sev', '🐈'], ['Barış Manço Evi’ni ziyaret et', '🎸'],
      ['Süreyya Operası’nın önünden geç', '🎭'], ['Moda’da dondurma ye', '🍦'], ['Gün batımını izle', '🌇'], ['Sokak müzisyeni dinle', '🎻'],
      ['Plakçıya uğra', '💿'], ['Kahve molası ver', '☕'], ['Antikacı gez', '🕰️'], ['Gece vapuruna bin', '🌙'],
    ]),
  }),
  card({
    id: 'turkiye-unesco-checklist', title: 'Türkiye’den UNESCO Durakları',
    description: 'UNESCO Dünya Mirası Listesi’ndeki bu Türkiye varlıklarından hangilerini gördün?', category: 'travel',
    tags: ['unesco', 'türkiye', 'kültür'], columns: 4, theme: { accent: '#2B7A78' },
    creatorId: 'u_leyla', createdAt: '2026-04-09T12:00:00.000Z',
    coverPhotoId: 'photo-1528181304800-259b08848526', coverImageAlt: 'Tarihî taş yapı ve sıcak hava balonları',
    cells: textCells([
      ['Göreme Millî Parkı ve Kapadokya', '🎈'], ['İstanbul’un Tarihî Alanları', '🕌'], ['Divriği Ulu Camii ve Darüşşifası', '🪨'], ['Hattuşa', '🦁'],
      ['Nemrut Dağı', '⛰️'], ['Hierapolis-Pamukkale', '♨️'], ['Xanthos-Letoon', '🏛️'], ['Safranbolu Şehri', '🏘️'],
      ['Troya Arkeolojik Alanı', '🐴'], ['Selimiye Camii ve Külliyesi', '🕌'], ['Çatalhöyük', '🏺'], ['Efes', '🏛️'],
      ['Diyarbakır Kalesi ve Hevsel Bahçeleri', '🌿'], ['Ani Arkeolojik Alanı', '⛪'], ['Aphrodisias', '🗿'], ['Göbekli Tepe', '☀️'],
    ]),
  }),
  card({
    id: 'europe-city-breaks', title: 'Avrupa Şehir Kaçamakları',
    description: 'Kısa bir hafta sonunda keşfettiğin şehirleri seç.', category: 'travel',
    tags: ['avrupa', 'city-break', 'seyahat'], columns: 4, theme: { accent: '#5B8FF9' },
    creatorId: 'u_leyla', createdAt: '2026-05-04T14:20:00.000Z',
    coverPhotoId: 'photo-1499856871958-5b9627545d1a', coverImageAlt: 'Paris caddesi ve Eyfel Kulesi',
    cells: textCells([
      ['Paris', '🇫🇷'], ['Roma', '🇮🇹'], ['Barselona', '🇪🇸'], ['Lizbon', '🇵🇹'],
      ['Prag', '🇨🇿'], ['Viyana', '🇦🇹'], ['Budapeşte', '🇭🇺'], ['Amsterdam', '🇳🇱'],
      ['Kopenhag', '🇩🇰'], ['Berlin', '🇩🇪'], ['Atina', '🇬🇷'], ['Edinburgh', '🏴󠁧󠁢󠁳󠁣󠁴󠁿'],
      ['Dubrovnik', '🇭🇷'], ['Kraków', '🇵🇱'], ['Brugge', '🇧🇪'], ['Porto', '🇵🇹'],
    ]),
  }),
  card({
    id: 'turkiye-national-parks', title: 'Türkiye’de Doğa Rotası',
    description: 'Millî parklar, vadiler ve kıyı rotalarından gördüklerini işaretle.', category: 'nature',
    tags: ['doğa', 'türkiye', 'yürüyüş'], columns: 4, theme: { accent: '#22A06B' },
    creatorId: 'u_duru', createdAt: '2026-05-27T06:45:00.000Z',
    coverPhotoId: 'photo-1501785888041-af3ef285b470', coverImageAlt: 'Dağlık arazide yürüyüş rotası',
    cells: textCells([
      ['Kaçkar Dağları', '⛰️'], ['Yedigöller', '🍂'], ['Köprülü Kanyon', '🛶'], ['Kazdağı', '🌲'],
      ['Munzur Vadisi', '🏞️'], ['Saklıkent Kanyonu', '🧗'], ['Dilek Yarımadası', '🌊'], ['İğneada Longozları', '🦆'],
      ['Beydağları Sahili', '🏕️'], ['Aladağlar', '🥾'], ['Küre Dağları', '🌳'], ['Uludağ', '❄️'],
      ['Spil Dağı', '🌷'], ['Güllük Dağı-Termessos', '🏛️'], ['Altınbeşik Mağarası', '🕳️'], ['Nemrut Dağı', '🌅'],
    ]),
  }),
  card({
    id: 'best-picture-essentials', title: 'En İyi Film Kazananları',
    description: 'Akademi Ödülleri’nde En İyi Film seçilmiş modern klasiklerden kaçını izledin?', category: 'movies',
    tags: ['oscar', 'sinema', 'ödüllü-filmler'], columns: 5, cellShape: 'square', checkStyle: 'border',
    theme: { accent: '#FF4B6E' }, creatorId: 'u_selin', createdAt: '2026-03-14T19:00:00.000Z', featured: true,
    coverPhotoId: 'photo-1489599849927-2ee91cede3ba', coverImageAlt: 'Kırmızı koltuklu sinema salonu',
    cells: textCells([
      ['The Godfather', '🎬'], ['Amadeus', '🎼'], ['The Silence of the Lambs', '🐑'], ['Schindler’s List', '📜'], ['Forrest Gump', '🏃'],
      ['Titanic', '🚢'], ['Gladiator', '⚔️'], ['The Lord of the Rings: The Return of the King', '💍'], ['The Departed', '🚔'], ['No Country for Old Men', '🪙'],
      ['Slumdog Millionaire', '💰'], ['The Artist', '🎞️'], ['12 Years a Slave', '⛓️'], ['Birdman', '🦅'], ['Moonlight', '🌙'],
      ['The Shape of Water', '🌊'], ['Parasite', '🏠'], ['Nomadland', '🚐'], ['CODA', '🤟'], ['Everything Everywhere All at Once', '🌀'],
      ['Oppenheimer', '⚛️'], ['Spotlight', '📰'], ['Argo', '✈️'], ['The Hurt Locker', '💣'], ['Million Dollar Baby', '🥊'],
    ]),
  }),
  card({
    id: 'studio-ghibli-starter', title: 'Studio Ghibli Başlangıç Seti',
    description: 'Hayao Miyazaki’den Isao Takahata’ya temel Ghibli filmleri.', category: 'movies',
    tags: ['anime', 'studio-ghibli', 'japonya'], columns: 4, theme: { accent: '#58B7B3' },
    creatorId: 'u_selin', createdAt: '2026-04-18T20:15:00.000Z',
    coverPhotoId: 'photo-1528360983277-13d401cdc186', coverImageAlt: 'Japonya’da geleneksel bir sokak',
    cells: textCells([
      ['My Neighbor Totoro', '🌳'], ['Spirited Away', '🐉'], ['Princess Mononoke', '🐺'], ['Howl’s Moving Castle', '🏰'],
      ['Kiki’s Delivery Service', '🧹'], ['Nausicaä of the Valley of the Wind', '🪲'], ['Castle in the Sky', '☁️'], ['Ponyo', '🐠'],
      ['The Wind Rises', '✈️'], ['Porco Rosso', '🐷'], ['Grave of the Fireflies', '✨'], ['The Tale of the Princess Kaguya', '🎋'],
      ['Whisper of the Heart', '🎻'], ['Only Yesterday', '🌾'], ['The Boy and the Heron', '🪶'], ['The Cat Returns', '🐈'],
    ]),
  }),
  card({
    id: 'tv-classics-binge', title: 'Dizi Klasikleri: Kaçını Bitirdin?',
    description: 'Farklı dönem ve türlerden çok konuşulan diziler.', category: 'movies',
    tags: ['dizi', 'tv', 'binge'], columns: 4, theme: { accent: '#A855F7' },
    creatorId: 'u_selin', createdAt: '2026-02-22T21:00:00.000Z',
    coverPhotoId: 'photo-1522869635100-9f4c5e86aa37', coverImageAlt: 'Televizyon karşısında oturma alanı',
    cells: textCells([
      ['The Sopranos', '🦆'], ['The Wire', '📞'], ['Breaking Bad', '⚗️'], ['Mad Men', '🥃'],
      ['Succession', '📰'], ['Fleabag', '🦊'], ['Dark', '⏳'], ['The Office', '📎'],
      ['Friends', '☕'], ['Seinfeld', '🥣'], ['Twin Peaks', '🦉'], ['Black Mirror', '📱'],
      ['Game of Thrones', '🐉'], ['Better Call Saul', '⚖️'], ['The Bear', '🥪'], ['The Last of Us', '🍄'],
    ]),
  }),
  card({
    id: 'retro-games-veteran', title: 'Retro Oyun Kütüphanesi',
    description: 'PC ve konsol tarihine damga vurmuş oyunlardan kaçını oynadın?', category: 'gaming',
    tags: ['retro', 'oyun', 'nostalji'], columns: 5, theme: { accent: '#38D6A7' },
    creatorId: 'u_deniz', createdAt: '2026-03-03T12:00:00.000Z', featured: true,
    coverPhotoId: 'photo-1511512578047-dfb367046420', coverImageAlt: 'Oyun kumandası ve ekran',
    cells: textCells([
      ['Super Mario Bros.', '🍄'], ['Tetris', '🧱'], ['The Legend of Zelda', '🗡️'], ['Doom', '😈'], ['Quake', '⚡'],
      ['Half-Life', 'λ'], ['Counter-Strike 1.6', '💣'], ['Age of Empires II', '🏰'], ['Diablo II', '💀'], ['StarCraft', '👾'],
      ['The Sims', '🏠'], ['Pokémon Red/Blue', '⚡'], ['Tekken 3', '🥋'], ['Metal Gear Solid', '📦'], ['Final Fantasy VII', '☄️'],
      ['Tomb Raider', '🏺'], ['Crash Bandicoot', '🦊'], ['GTA: Vice City', '🌴'], ['GTA: San Andreas', '🚲'], ['Need for Speed: Underground', '🏎️'],
      ['Prince of Persia: The Sands of Time', '⌛'], ['Warcraft III', '🛡️'], ['Max Payne', '💊'], ['Silent Hill 2', '🌫️'], ['The Elder Scrolls III: Morrowind', '📜'],
    ]),
  }),
  card({
    id: 'modern-game-essentials', title: 'Modern Oyun Esasları',
    description: '2010 sonrası dönemin farklı türlerde öne çıkan yapımları.', category: 'gaming',
    tags: ['oyun', 'modern-klasikler', 'konsol'], columns: 4, theme: { accent: '#00B894' },
    creatorId: 'u_deniz', createdAt: '2026-05-11T16:00:00.000Z',
    coverPhotoId: 'photo-1493711662062-fa541adb3fc8', coverImageAlt: 'Oyun oynayan kişi ve ekran',
    cells: textCells([
      ['Red Dead Redemption 2', '🤠'], ['The Witcher 3: Wild Hunt', '🐺'], ['Elden Ring', '💍'], ['Baldur’s Gate 3', '🎲'],
      ['The Last of Us', '🍄'], ['God of War', '🪓'], ['Hades', '🔥'], ['Disco Elysium', '🕵️'],
      ['Celeste', '🏔️'], ['Hollow Knight', '🪲'], ['Portal 2', '🌀'], ['Minecraft', '⛏️'],
      ['Mass Effect 2', '🚀'], ['Dark Souls', '🔥'], ['Sekiro: Shadows Die Twice', '⚔️'], ['Outer Wilds', '🪐'],
    ]),
  }),
  card({
    id: 'albums-for-a-lifetime', title: 'Bir Ömre Sığacak Albümler',
    description: 'Baştan sona dinlediğin dönüm noktası albümleri seç.', category: 'music',
    tags: ['albüm', 'müzik', 'klasikler'], columns: 5, theme: { accent: '#FFC53D' },
    creatorId: 'u_arda', createdAt: '2026-01-19T18:30:00.000Z', featured: true,
    coverPhotoId: 'photo-1461360228754-6e81c478b882', coverImageAlt: 'Plak çalar ve plak koleksiyonu',
    cells: textCells([
      ['The Beatles — Abbey Road', '🚶'], ['Pink Floyd — The Dark Side of the Moon', '🌈'], ['Fleetwood Mac — Rumours', '🖤'], ['Michael Jackson — Thriller', '🧟'], ['Prince — Purple Rain', '☔'],
      ['Nirvana — Nevermind', '🌊'], ['Radiohead — OK Computer', '🤖'], ['Lauryn Hill — The Miseducation of Lauryn Hill', '📚'], ['Daft Punk — Discovery', '🤖'], ['Amy Winehouse — Back to Black', '🖤'],
      ['Beyoncé — Lemonade', '🍋'], ['Kendrick Lamar — To Pimp a Butterfly', '🦋'], ['Miles Davis — Kind of Blue', '🎺'], ['Stevie Wonder — Songs in the Key of Life', '🎹'], ['Bob Dylan — Highway 61 Revisited', '🛣️'],
      ['The Clash — London Calling', '📞'], ['David Bowie — Ziggy Stardust', '⚡'], ['Joni Mitchell — Blue', '💙'], ['Sade — Diamond Life', '💎'], ['Portishead — Dummy', '🎛️'],
      ['Massive Attack — Mezzanine', '🌃'], ['Fela Kuti — Expensive Shit', '🎷'], ['Buena Vista Social Club — Buena Vista Social Club', '🇨🇺'], ['Sezen Aksu — Gülümse', '🌹'], ['Barış Manço — 2023', '🎸'],
    ]),
  }),
  card({
    id: 'concert-life', title: 'Konser Hayatı Bingosu',
    description: 'Canlı müzik hafızandaki küçük ve büyük anlar.', category: 'music',
    tags: ['konser', 'festival', 'canlı-müzik'], columns: 4, theme: { accent: '#F7B731' },
    creatorId: 'u_arda', createdAt: '2026-06-07T17:45:00.000Z',
    coverPhotoId: 'photo-1501386761578-eac5c94b800a', coverImageAlt: 'Kalabalık açık hava konseri',
    cells: textCells([
      ['Festivalde headliner izle', '🎤'], ['Küçük mekânda akustik set', '🎸'], ['Yağmurda konser', '🌧️'], ['Yurt dışında konser', '✈️'],
      ['En önde yer kap', '🙌'], ['Encore için bağır', '🔥'], ['Konserde ağla', '🥹'], ['Setlist yakala', '📜'],
      ['Kulak tıkacı kullan', '👂'], ['Merch standından tişört al', '👕'], ['Açılış grubuna hayran kal', '⭐'], ['Telefonu cebinde tutup anı yaşa', '📵'],
      ['Bilet kuyruğunda bekle', '🎟️'], ['Crowdsurf gör', '🏄'], ['Son metroya koş', '🚇'], ['Ertesi gün sesin kısılsın', '🗣️'],
    ]),
  }),
  card({
    id: 'world-classics-books', title: 'Dünya Edebiyatı Rafı',
    description: 'Farklı coğrafya ve dönemlerden roman klasikleri.', category: 'books',
    tags: ['kitap', 'roman', 'klasikler'], columns: 5, theme: { accent: '#8B6F47' },
    creatorId: 'u_ece', createdAt: '2026-02-05T11:10:00.000Z', featured: true,
    coverPhotoId: 'photo-1532012197267-da84d127e765', coverImageAlt: 'Raflarda eski kitaplar',
    cells: textCells([
      ['Don Quixote — Cervantes', '🐴'], ['Pride and Prejudice — Jane Austen', '💌'], ['Jane Eyre — Charlotte Brontë', '🏚️'], ['Moby-Dick — Herman Melville', '🐋'], ['Madame Bovary — Gustave Flaubert', '💐'],
      ['Crime and Punishment — Dostoevsky', '🪓'], ['Anna Karenina — Tolstoy', '🚂'], ['The Trial — Franz Kafka', '⚖️'], ['Mrs Dalloway — Virginia Woolf', '🌸'], ['The Great Gatsby — F. Scott Fitzgerald', '🥂'],
      ['Brave New World — Aldous Huxley', '🧬'], ['Nineteen Eighty-Four — George Orwell', '👁️'], ['The Stranger — Albert Camus', '☀️'], ['One Hundred Years of Solitude — García Márquez', '🦋'], ['Beloved — Toni Morrison', '👻'],
      ['Things Fall Apart — Chinua Achebe', '🥁'], ['The Master and Margarita — Mikhail Bulgakov', '🐈'], ['The Name of the Rose — Umberto Eco', '🌹'], ['Blindness — José Saramago', '⚪'], ['The Handmaid’s Tale — Margaret Atwood', '🔴'],
      ['My Name Is Red — Orhan Pamuk', '🎨'], ['The Disconnected — Oğuz Atay', '🚂'], ['Madonna in a Fur Coat — Sabahattin Ali', '🧥'], ['Memed, My Hawk — Yaşar Kemal', '🌾'], ['The Little Prince — Antoine de Saint-Exupéry', '🌟'],
    ]),
  }),
  card({
    id: 'super-lig-fan-check', title: 'Süper Lig Taraftar Kontrolü',
    description: 'Skordan bağımsız, tribün deneyimlerinden kaçını yaşadın?', category: 'sports',
    tags: ['futbol', 'süper-lig', 'taraftar'], columns: 4, theme: { accent: '#B98CFF' },
    creatorId: 'u_mert', createdAt: '2026-03-30T18:00:00.000Z',
    coverPhotoId: 'photo-1522778119026-d647f0596c20', coverImageAlt: 'Işıklar altında futbol stadyumu',
    cells: textCells([
      ['Deplasmana git', '🚌'], ['Derbiyi stadyumda izle', '🏟️'], ['Golden sonra tanımadığın biriyle sarıl', '🤝'], ['Maç saatine zor yetiş', '⏰'],
      ['Takım forması giy', '👕'], ['Bir maçta gözlerin dolsun', '🥹'], ['VAR kararına itiraz et', '📺'], ['Taraftar bestesine katıl', '📣'],
      ['Uzatmalarda gol gör', '⚽'], ['Transferi önceden tahmin et', '🔮'], ['Kırmızı karta sevin', '🟥'], ['Maç bileti hediye et', '🎟️'],
      ['Atkı değiş tokuşu yap', '🧣'], ['Stadyum turuna katıl', '🚪'], ['Sezon açılışına git', '📅'], ['Maç sonu sesin kısılsın', '🗣️'],
    ]),
  }),
  card({
    id: 'thirty-day-reset', title: '30 Günlük İyi Yaşam Reset’i',
    description: 'Kusursuzluk değil süreklilik: ay boyunca tamamladığın alışkanlıklar.', category: 'lifestyle',
    tags: ['alışkanlık', 'wellness', '30-gün'], columns: 5, theme: { accent: '#F06EC7' },
    creatorId: 'u_duru', createdAt: '2026-08-01T06:30:00.000Z',
    coverPhotoId: 'photo-1499209974431-9dddcece7f88', coverImageAlt: 'Sabah ışığında yoga yapan kişi',
    cells: textCells([
      ['8 saat uyu', '😴'], ['2 litre su iç', '💧'], ['30 dakika yürü', '🚶'], ['Sebzeli bir öğün ye', '🥗'], ['10 dakika esne', '🧘'],
      ['Telefonu yataktan uzak tut', '📵'], ['Gün ışığına çık', '☀️'], ['Bir arkadaşını ara', '📞'], ['Evde yemek yap', '🍳'], ['Şekerli içecek içme', '🥤'],
      ['20 sayfa oku', '📖'], ['Masa başında mola ver', '⏸️'], ['Ertesi günü planla', '🗓️'], ['Nefes egzersizi yap', '🌬️'], ['Odanı havalandır', '🪟'],
      ['Merdiven kullan', '🪜'], ['Sosyal medyaya ara ver', '🔕'], ['Bir şeyi ertelemeden bitir', '✅'], ['Açık havada kahve iç', '☕'], ['Erken yat', '🌙'],
      ['Meyve ye', '🍎'], ['Müzik dinle', '🎧'], ['Şükran notu yaz', '✍️'], ['Çalışma alanını toparla', '🧹'], ['Kendine boş zaman bırak', '🛋️'],
    ]),
  }),
  card({
    id: 'meeting-bingo', title: 'Kurumsal Toplantı Bingosu',
    description: 'Bir iş gününde duyma ihtimalin şaşırtıcı derecede yüksek cümleler.', category: 'work',
    tags: ['ofis', 'toplantı', 'mizah'], columns: 5, theme: { accent: '#64748B' },
    creatorId: 'u_bora', createdAt: '2026-07-14T08:55:00.000Z', featured: true,
    coverPhotoId: 'photo-1521737711867-e3b97375f902', coverImageAlt: 'Toplantı masasındaki ekip',
    cells: textCells([
      ['“Sesim geliyor mu?”', '🎙️'], ['“Bir adım geri çekilelim.”', '↩️'], ['“Bunu park edelim.”', '🅿️'], ['“Ekranımı görebiliyor musunuz?”', '🖥️'], ['“Hızlıca üzerinden geçelim.”', '⚡'],
      ['Takvime bakma sessizliği', '📅'], ['Yanlış linkten gelen biri', '🔗'], ['Mikrofonu açık unutan biri', '🔊'], ['Sunum açılmıyor', '📊'], ['Toplantı e-postaya dönüşebilir', '📧'],
      ['“Aksiyon kimde?”', '👉'], ['“Offline konuşalım.”', '💬'], ['“Son bir soru…”', '☝️'], ['Toplantı beş dakika uzar', '⏳'], ['Kısaltmanın anlamı sorulur', '🔤'],
      ['Kamera açma pazarlığı', '📹'], ['“Bende görünmüyor.”', '🙈'], ['Aynı konu ikinci kez anlatılır', '🔁'], ['Beklenmedik yönetici katılımı', '👔'], ['Not alan tek kişi sensin', '📝'],
      ['“Kaynakları hizalayalım.”', '🧩'], ['“Bunu sahiplenebilir misin?”', '🙋'], ['Molaya üç dakika kala yeni gündem', '🚨'], ['Herkes aynı anda konuşur', '🗯️'], ['Toplantı başka toplantıyla biter', '♾️'],
    ]),
  }),
  card({
    id: 'cat-person-bingo', title: 'Kediyle Yaşayanlar Kulübü',
    description: 'Evin gerçekten kime ait olduğunu bilenler için.', category: 'lifestyle',
    tags: ['kedi', 'evcil-hayvan', 'mizah'], columns: 4, theme: { accent: '#F59E0B' },
    creatorId: 'u_ece', createdAt: '2026-08-08T12:25:00.000Z',
    coverPhotoId: 'photo-1518791841217-8f162f1e1131', coverImageAlt: 'Yakından bakan tekir kedi',
    cells: textCells([
      ['Klavye üstüne oturdu', '⌨️'], ['Boş kutuyu pahalı yatağa tercih etti', '📦'], ['Gece üçte koşmaya başladı', '🌙'], ['Musluktan su içti', '🚰'],
      ['Yeni mamayı reddetti', '🥣'], ['Kucağına tam kalkarken geldi', '🛋️'], ['Bitki toprağını kazdı', '🪴'], ['Videolu toplantıya katıldı', '💻'],
      ['Poşet sesiyle koştu', '🛍️'], ['Veteriner çantasını görünce saklandı', '🩺'], ['Kapalı kapıya itiraz etti', '🚪'], ['Perdeye tırmandı', '🪟'],
      ['Aynı noktada saatlerce uyudu', '💤'], ['Seni banyoya kadar takip etti', '🚿'], ['Mama saatini erkene çekmeye çalıştı', '⏰'], ['Fotoğrafta gözlerini kapattı', '📷'],
    ]),
  }),
];

export const REMIX_CARD = card({
  id: 'istanbul-street-food-vegan', title: 'İstanbul Sokak Lezzetleri — Vegan Remix',
  description: 'İstanbul klasiğinin bitki bazlı alternatiflerle hazırlanmış kısa sürümü.', category: 'food',
  tags: ['istanbul', 'vegan', 'remix'], columns: 3, checkStyle: 'border', theme: { accent: '#38D6A7' },
  creatorId: 'u_ece', originalCardId: 'istanbul-street-food', createdAt: '2026-08-20T09:00:00.000Z',
  coverPhotoId: 'photo-1540420773420-3366772f4999', coverImageAlt: 'Renkli sebze ve yeşillik tabağı',
  cells: textCells([
    ['Simit ve çay', '🥯'], ['Közde kestane', '🌰'], ['Nohutlu pilav', '🍚'],
    ['Zeytinyağlı yaprak sarma', '🫒'], ['Vegan lahmacun', '🫓'], ['Mercimek köftesi', '🌿'],
    ['Falafel dürüm', '🧆'], ['Kumpir — tereyağsız', '🥔'], ['Tahinli kabak tatlısı', '🎃'],
  ]),
});

export const COLLECTIONS = [
  { id: 'col_editor_picks', title: 'Editörün Seçtikleri', description: 'Farklı kategorilerden güçlü başlangıç kartları.', cardIds: ['istanbul-landmarks-photo', 'best-picture-essentials', 'retro-games-veteran', 'meeting-bingo'] },
  { id: 'col_istanbul', title: 'İstanbul’u Yaşa', description: 'Şehrin yemekleri, semtleri ve simgeleri.', cardIds: ['istanbul-street-food', 'turkish-breakfast-table', 'istanbul-landmarks-photo', 'weekend-in-kadikoy'] },
  { id: 'col_screen_time', title: 'Ekran Başında', description: 'Film, dizi ve oyun seçkileri.', cardIds: ['best-picture-essentials', 'studio-ghibli-starter', 'tv-classics-binge', 'modern-game-essentials'] },
  { id: 'col_slow_weekend', title: 'Yavaş Hafta Sonu', description: 'Kahve, kitap, müzik ve doğa.', cardIds: ['coffee-brewing-methods', 'world-classics-books', 'albums-for-a-lifetime', 'turkiye-national-parks'] },
  { id: 'col_photo_bingos', title: 'Tam Görsel Bingolar', description: 'Her hücresi fotoğraftan oluşan kartlar.', cardIds: ['turkish-breakfast-table', 'istanbul-landmarks-photo'] },
];
export const FEATURED_CATEGORIES = ['travel', 'movies', 'gaming', 'books', 'lifestyle'];
export const ALL_CARDS = [...CARDS, REMIX_CARD];
