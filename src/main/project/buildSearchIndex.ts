import type { LocalizationEntry, SearchFilters } from '../../shared/contracts.js'

function normalize(value: string) {
  return value.toLocaleLowerCase('tr-TR')
}

export function buildSearchIndex(entries: LocalizationEntry[]) {
  const indexedEntries = entries.map((entry) => ({
    ...entry,
    normalizedKey: normalize(entry.key),
    normalizedSourceText: normalize(entry.sourceText),
  }))

  return {
    search(filters: SearchFilters) {
      const normalizedQuery = normalize(filters.query.trim())

      return indexedEntries
        .filter((entry) => {
          const matchesStatus =
            !filters.status ||
            filters.status === 'all' ||
            entry.status === filters.status
          const matchesQuery =
            normalizedQuery.length === 0 ||
            entry.normalizedKey.includes(normalizedQuery) ||
            entry.normalizedSourceText.includes(normalizedQuery)

          return matchesStatus && matchesQuery
        })
        .map((entry) => entry.key)
    },
  }
}
