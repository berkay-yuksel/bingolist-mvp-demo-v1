// Kullanım:
//   1) AI'nın ürettiği JSON array'ini "cards.json" olarak bu dosyanın yanına kaydet.
//   2) Aşağıdaki SITE_URL'i kendi canlı Vercel linkinle değiştir.
//   3) node bulk-create.js

const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://bingolist-demo.vercel.app'.replace(/\/$/, ''); // <-- burayı değiştir

// The old demo accounts (spinoza, nietzsche ...) no longer exist. Add the
// real accounts you want to post as: username -> user id (find the id with
// the SQL query from the setup notes).
const USERNAME_TO_ID = {
  lunarisdev: 'u_1789495703392',
};

async function main() {
  const cards = JSON.parse(fs.readFileSync(path.join(__dirname, 'cards3.json'), 'utf-8'));
  console.log(`${cards.length} kart bulundu, gönderiliyor...`);

  for (const card of cards) {
    const creatorId = USERNAME_TO_ID[card.creatorUsername];
    if (!creatorId) {
      console.log(`✗ ${card.title} -> bilinmeyen creatorUsername "${card.creatorUsername}" (USERNAME_TO_ID'ye ekle)`);
      continue;
    }
    const body = { ...card, creatorId };
    delete body.creatorUsername;

    try {
      const res = await fetch(`${SITE_URL}/api/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (res.ok) {
        console.log(`✓ ${card.title} -> ${json.card.id}`);
      } else {
        console.log(`✗ ${card.title} -> HATA: ${json.error}`);
      }
    } catch (err) {
      console.log(`✗ ${card.title} -> HATA: ${err.message}`);
    }

    await new Promise((r) => setTimeout(r, 300)); // sunucuyu yormamak için küçük ara
  }

  console.log('Bitti.');
}

main();
