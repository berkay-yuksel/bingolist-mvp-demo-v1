// Run with `npm run seed` to reset data/db.json back to the original seed data.
// The app regenerates the file automatically from lib/mockData.js the next
// time it's read (see ensureDBFile in lib/db.js), so resetting is just a delete.
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'db.json');

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('Removed data/db.json — it will be regenerated from lib/mockData.js on the next request.');
} else {
  console.log('data/db.json does not exist yet — it will be generated on first request.');
}
