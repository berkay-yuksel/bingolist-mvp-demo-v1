// Kullanım:
//   1) AI'nın ürettiği JSON array'ini "cards.json" olarak bu dosyanın yanına kaydet.
//   2) Aşağıdaki SITE_URL'i kendi canlı Vercel linkinle değiştir.
//   3) node bulk-create.js

const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://bingolist-demo.vercel.app/'; // <-- burayı değiştir

const USERNAME_TO_ID = {
  spinoza: 'u_asli',
  nietzsche: 'u_deniz',
  epiktetos: 'u_mert',
  epikuros: 'u_ece',
  marcusaurelius: 'u_can',
  seneca: 'u_selin',
  camus: 'u_leyla',
  schopenhauer: 'u_arda',
  carljung: 'u_duru',
  aynrand: 'u_bora',
  lunarisdev: 'u_1789495703392',
};

async function main() {
  const cards = JSON.parse(fs.readFileSync(path.join(__dirname, 'cards3.json'), 'utf-8'));
  console.log(`${cards.length} kart bulundu, gönderiliyor...`);

  for (const card of cards) {
    const creatorId = USERNAME_TO_ID[card.creatorUsername] || 'u_asli';
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
