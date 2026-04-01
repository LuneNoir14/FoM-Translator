const Database = require('better-sqlite3');
const path = require('node:path');
// Hardcode the path manually based on the Windows APPDATA env var
const dbPath = path.join(process.env.APPDATA, 'FoMTranslator', 'workspace.sqlite');

try {
  console.log('Opening DB at:', dbPath);
  const db = new Database(dbPath);
  
  const entries = db.prepare('SELECT * FROM entries LIMIT 10').all();
  console.log('Entries:', entries);
} catch (err) {
  console.error('Error reading DB:', err.message);
}
