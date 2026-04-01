import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { parseLocalizationFile } from '../../src/main/project/parseLocalizationFile'

test('flattens english entries from the eng object', () => {
  const raw = readFileSync('tests/fixtures/localization-sample.json', 'utf8')
  const result = parseLocalizationFile(raw)

  expect(result.entries[0]).toMatchObject({
    key: 'misc_local/sleep',
    sourceText: 'Sleep',
    status: 'untranslated',
  })
})

test('throws a friendly error for invalid localization shape', () => {
  expect(() => parseLocalizationFile('{"foo":{}}')).toThrow(/eng/i)
})
