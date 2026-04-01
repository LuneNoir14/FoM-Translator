import Database from 'better-sqlite3'
import type { WorkspaceEntry } from '../../shared/contracts.js'

interface EntryRow {
  key: string
  translated_text: string
  status: string
  updated_at: string
}

export function createWorkspaceDb(filename: string) {
  const db = new Database(filename)

  db.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      key TEXT PRIMARY KEY,
      translated_text TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'untranslated',
      updated_at TEXT NOT NULL
    );
  `)

  const saveEntryStatement = db.prepare(`
    INSERT INTO entries (key, translated_text, status, updated_at)
    VALUES (@key, @translatedText, @status, @updatedAt)
    ON CONFLICT(key) DO UPDATE SET
      translated_text = excluded.translated_text,
      status = excluded.status,
      updated_at = excluded.updated_at
  `)

  const getEntryStatement = db.prepare('SELECT * FROM entries WHERE key = ?')
  const listCountsStatement = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM entries
    GROUP BY status
  `)

  return {
    saveEntry(entry: WorkspaceEntry) {
      saveEntryStatement.run({
        ...entry,
        updatedAt: entry.updatedAt ?? new Date().toISOString(),
      })
    },
    getEntry(key: string) {
      const row = getEntryStatement.get(key) as EntryRow | undefined

      if (!row) {
        return undefined
      }

      return {
        key: row.key,
        translatedText: row.translated_text,
        status: row.status,
        updatedAt: row.updated_at,
      }
    },
    listCounts() {
      return listCountsStatement.all() as Array<{ status: string; count: number }>
    },
  }
}
