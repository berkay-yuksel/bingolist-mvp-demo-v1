# BingoList — Prototip

PRD ve Karar Günlüğü'ndeki çekirdek döngüyü (**Keşfet → Oyna → Kaydet → Paylaş → Remixle → Oluştur**) uçtan uca çalışan, gerçek auth/veritabanı olmadan çalışan bir Next.js prototipi.

## Nasıl çalışır

- **Next.js 14, App Router, JavaScript** (TypeScript yok), **Tailwind CSS**.
- **"Veritabanı" yok** — `data/db.json` adında düz bir JSON dosyası var. API route'ları (`app/api/**/route.js`) bu dosyayı okuyup güncelliyor. Dosya ilk istekte `lib/mockData.js` içindeki tohum verilerden otomatik oluşturuluyor.
- **Gerçek kimlik doğrulama yok.** Sağ üstteki kullanıcı değiştiriciyle 3 demo kullanıcı arasında geçiş yapabilirsin (Aslı, Deniz, Mert) — bu, "giriş yapmış" farklı kullanıcıların aynı kartla nasıl etkileşime girdiğini görmeni sağlar (topluluk yüzdeleri, takip, beğeni vb. buna göre değişir).

## Kurulum

```bash
npm install
npm run dev
```

Tarayıcıda `http://localhost:3000` adresini aç.

## Verileri sıfırlama

```bash
npm run seed
```

Bu, `data/db.json` dosyasını siler; bir sonraki istekte tohum verilerden yeniden oluşturulur. (Oluşturduğun/oynadığın her şey de silinir.)

## Neler var

- **Anasayfa** — canlı/dokunulabilir bir mini kart içeren hero, Trend/Popüler/Öne Çıkan/Koleksiyon şeritleri, kategori çubuğu, trend yaratıcılar.
- **Kart oynama** (`/bingo/[category]/[id]`) — hücre seçimi (otomatik kaydedilir), tamamlanma algılama, topluluk yüzdesi göster/gizle, Kaydet, Beğen/Kaydet(Bookmark)/Sabitle, canvas ile anlık üretilen paylaşım görseli (indir/sistem paylaşımı/link kopyala), Remix, Bildir.
- **Kart oluşturma / remixleme** (`/create`) — başlık, açıklama, kategori, etiketler, kapak görseli yükleme, görünürlük, sınırlı özelleştirme (renk/şekil/işaret stili), 3×3-5×5-10×10 hazır boyutlar + özel sütun sayısı, hücre başına metin/emoji/görsel, canlı önizleme.
- **Kategori, etiket, arama, koleksiyon sayfaları.**
- **Profil sayfası** (`/profile/[username]`) — Spotify tarzı hafif profil, herkese açık yaratıcı metrikleri, takip, son oynananlar.
- **Moderasyon kuyruğu** (`/moderation`) — bildirilen kartları listeleyip çözümlemek için basit bir admin görünümü.

## Kapsam dışı bırakılanlar (PRD'ye göre bilinçli olarak)

Yorumlar, DM, sosyal akış, kullanıcı koleksiyonları, alt kategoriler, AI üretimi, rozetler, bildirimler, para kazanma, prediction bingo — hepsi PRD'de MVP dışı olarak işaretlenmiş, bu yüzden burada da yok.

## Bir sonraki adım (gerçek MVP'ye geçiş)

Bu prototip mock veriyle çalışıyor. Gerçek bir MVP için `lib/db.js`'teki `readDB`/`writeDB` fonksiyonlarının yerini bir ORM (örn. Prisma + Postgres) ve gerçek bir auth sistemi (örn. NextAuth) alması yeterli — API route'larının çoğu route imzası aynı kalacak şekilde tasarlandı.
