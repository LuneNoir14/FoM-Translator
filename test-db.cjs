const { app } = require('electron');
const Database = require('better-sqlite3');
const path = require('node:path');

app.setName('FoMTranslator');

app.whenReady().then(() => {
  const dbPath = path.join(app.getPath('userData'), 'workspace.sqlite');
  console.log('Opening DB at:', dbPath);
  try {
    const db = new Database(dbPath);
    const rows = db.prepare('SELECT * FROM entries LIMIT 5').all();
    console.log('Rows in DB:', JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(err);
  }
  app.quit();
});
