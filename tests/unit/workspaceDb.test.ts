import { expect, test } from 'vitest'
import { buildSearchIndex } from '../../src/main/project/buildSearchIndex'
import { createWorkspaceDb } from '../../src/main/project/workspaceDb'

test('saves and reloads translated entries with status', () => {
  const db = createWorkspaceDb(':memory:')

  db.saveEntry({
    key: 'misc_local/sleep',
    translatedText: 'Uyu',
    status: 'draft',
  })

  expect(db.getEntry('misc_local/sleep')).toMatchObject({
    translatedText: 'Uyu',
    status: 'draft',
  })
})

test('returns untranslated matches for key and source text queries', () => {
  const index = buildSearchIndex([
    {
      key: 'misc_local/sleep',
      sourceText: 'Sleep',
      translatedText: '',
      status: 'untranslated',
    },
    {
      key: 'misc_local/talk',
      sourceText: 'Talk',
      translatedText: 'Konus',
      status: 'reviewed',
    },
  ])

  expect(index.search({ query: 'sleep', status: 'untranslated' })).toEqual([
    'misc_local/sleep',
  ])
})
