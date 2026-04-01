import { expect, test } from 'vitest'
import { deriveProgressBoard } from '../../src/renderer/workbench/deriveProgressBoard'
import type { LocalizationEntry } from '../../src/shared/contracts'

function createEntry(overrides: Partial<LocalizationEntry>): LocalizationEntry {
  return {
    key: 'misc/example',
    sourceText: 'Example',
    translatedText: '',
    status: 'untranslated',
    ...overrides,
  }
}

test('treats reviewed and warning entries as complete while draft stays remaining', () => {
  const result = deriveProgressBoard({
    entries: [
      createEntry({ key: 'misc/untranslated', status: 'untranslated' }),
      createEntry({
        key: 'misc/draft',
        translatedText: 'Taslak',
        status: 'draft',
      }),
      createEntry({
        key: 'misc/reviewed',
        translatedText: 'Tamam',
        status: 'reviewed',
      }),
      createEntry({
        key: 'misc/warning',
        sourceText: '[Ari], hello',
        translatedText: 'Merhaba',
        status: 'warning',
      }),
    ],
    selectedCategoryPath: null,
  })

  expect(result.overall.label).toBe('All categories')
  expect(result.overall.totalCount).toBe(4)
  expect(result.overall.completeCount).toBe(2)
  expect(result.overall.remainingCount).toBe(2)
  expect(result.overall.warningCount).toBe(1)
  expect(result.overall.completionPercent).toBeCloseTo(0.5)
})

test('limits selected-scope metrics and category metrics to the active subtree', () => {
  const result = deriveProgressBoard({
    entries: [
      createEntry({
        key: 'Conversations/one',
        translatedText: 'Tamam',
        status: 'reviewed',
      }),
      createEntry({
        key: 'Conversations/two',
        sourceText: '[Ari], hello',
        translatedText: 'Merhaba',
        status: 'warning',
      }),
      createEntry({
        key: 'items/one',
        translatedText: '',
        status: 'untranslated',
      }),
    ],
    selectedCategoryPath: 'Conversations',
  })

  expect(result.selectedScope.label).toBe('Conversations')
  expect(result.selectedScope.totalCount).toBe(2)
  expect(result.selectedScope.completeCount).toBe(2)
  expect(result.selectedScope.remainingCount).toBe(0)
  expect(result.selectedScope.warningCount).toBe(1)

  expect(result.categoryProgressByPath.Conversations).toMatchObject({
    totalCount: 2,
    completeCount: 2,
    warningCount: 1,
  })
  expect(result.categoryProgressByPath.items).toMatchObject({
    totalCount: 1,
    completeCount: 0,
    remainingCount: 1,
    warningCount: 0,
  })
})

test('groups validation issue counts for warning entries in the active scope', () => {
  const result = deriveProgressBoard({
    entries: [
      createEntry({
        key: 'letters/missing',
        sourceText: '[Ari], hello',
        translatedText: 'Merhaba',
        status: 'warning',
      }),
      createEntry({
        key: 'letters/linebreak',
        sourceText: 'Line 1\\n\\nLine 2',
        translatedText: 'Satir 1\\nSatir 2',
        status: 'warning',
      }),
      createEntry({
        key: 'items/ignored',
        sourceText: 'Line 1\\n\\nLine 2',
        translatedText: 'Satir 1\\nSatir 2',
        status: 'warning',
      }),
    ],
    selectedCategoryPath: 'letters',
  })

  expect(result.issueDigest).toContainEqual(
    expect.objectContaining({ code: 'missing-placeholder', count: 1 }),
  )
  expect(result.issueDigest).toContainEqual(
    expect.objectContaining({ code: 'line-break-mismatch', count: 1 }),
  )
  expect(result.issueDigest).not.toContainEqual(
    expect.objectContaining({ code: 'line-break-mismatch', count: 2 }),
  )
})
