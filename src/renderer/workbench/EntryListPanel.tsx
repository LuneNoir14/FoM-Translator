import { useEffect, useMemo, useRef, useState } from 'react'
import { useWorkbenchStore } from './useWorkbenchStore'
import { buildCategoryTree } from '../../shared/buildCategoryTree'
import type { CategoryNode, EntryStatus } from '../../shared/contracts'

function matchesQuery(query: string, value: string) {
  return value.toLocaleLowerCase('tr-TR').includes(query.toLocaleLowerCase('tr-TR'))
}

const statusMeta: Record<
  EntryStatus,
  { badgeLabel: string; summaryLabel: string }
> = {
  untranslated: { badgeLabel: 'Untranslated', summaryLabel: 'Remaining' },
  draft: { badgeLabel: 'Draft', summaryLabel: 'Draft' },
  reviewed: { badgeLabel: 'Completed', summaryLabel: 'Done' },
  warning: { badgeLabel: 'Warning', summaryLabel: 'Warning' },
}

const ENTRY_ROW_HEIGHT = 132
const ENTRY_ROW_OVERSCAN = 8

interface FlatCategoryNode {
  depth: number
  node: CategoryNode
}

function flattenCategoryTree(
  nodes: CategoryNode[],
  expandedPaths: Set<string>,
  depth = 0,
): FlatCategoryNode[] {
  return nodes.flatMap((node) => {
    const children = expandedPaths.has(node.path)
      ? flattenCategoryTree(node.children, expandedPaths, depth + 1)
      : []

    return [{ depth, node }, ...children]
  })
}

function matchesCategoryPath(key: string, selectedCategoryPath: string | null) {
  if (!selectedCategoryPath) {
    return true
  }

  return key === selectedCategoryPath || key.startsWith(`${selectedCategoryPath}/`)
}

export function EntryListPanel() {
  const listViewportRef = useRef<HTMLDivElement | null>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(640)
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())
  const [categoryCollapsed, setCategoryCollapsed] = useState(false)
  const entries = useWorkbenchStore((state) => state.entries)
  const categoryTree = useWorkbenchStore((state) => state.categoryTree)
  const selectedCategoryPath = useWorkbenchStore(
    (state) => state.selectedCategoryPath,
  )
  const summary = useWorkbenchStore((state) => state.summary)
  const query = useWorkbenchStore((state) => state.query)
  const statusFilter = useWorkbenchStore((state) => state.statusFilter)
  const selectedKey = useWorkbenchStore((state) => state.selectedKey)
  const setQuery = useWorkbenchStore((state) => state.setQuery)
  const setCategoryPath = useWorkbenchStore((state) => state.setCategoryPath)
  const setStatusFilter = useWorkbenchStore((state) => state.setStatusFilter)
  const selectKey = useWorkbenchStore((state) => state.selectKey)
  const effectiveCategoryTree = useMemo(
    () =>
      categoryTree.length > 0
        ? categoryTree
        : buildCategoryTree(entries.map((entry) => entry.key)),
    [categoryTree, entries],
  )
  const topLevelPathsKey = useMemo(
    () => effectiveCategoryTree.map((node) => node.path).join('|'),
    [effectiveCategoryTree],
  )

  const filteredEntries = useMemo(
    () =>
      entries.filter((entry) => {
        const matchesStatus =
          statusFilter === 'all' || entry.status === statusFilter
        const matchesCategory = matchesCategoryPath(
          entry.key,
          selectedCategoryPath,
        )
        const matchesText =
          query.trim().length === 0 ||
          matchesQuery(query, entry.key) ||
          matchesQuery(query, entry.sourceText)

        return matchesStatus && matchesCategory && matchesText
      }),
    [entries, query, selectedCategoryPath, statusFilter],
  )

  const flatCategoryTree = useMemo(
    () => flattenCategoryTree(effectiveCategoryTree, expandedPaths),
    [effectiveCategoryTree, expandedPaths],
  )

  useEffect(() => {
    const viewport = listViewportRef.current

    if (!viewport) {
      return
    }

    const measure = () => {
      setViewportHeight(viewport.clientHeight || 640)
    }

    measure()

    if (typeof ResizeObserver === 'undefined') {
      return
    }

    const observer = new ResizeObserver(() => {
      measure()
    })
    observer.observe(viewport)

    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    setExpandedPaths(new Set())
  }, [topLevelPathsKey])

  const startIndex = Math.max(
    0,
    Math.floor(scrollTop / ENTRY_ROW_HEIGHT) - ENTRY_ROW_OVERSCAN,
  )
  const endIndex = Math.min(
    filteredEntries.length,
    Math.ceil((scrollTop + viewportHeight) / ENTRY_ROW_HEIGHT) +
      ENTRY_ROW_OVERSCAN,
  )
  const visibleEntries = filteredEntries.slice(startIndex, endIndex)
  const totalHeight = filteredEntries.length * ENTRY_ROW_HEIGHT

  const handleSelectNextUntranslated = () => {
    const untranslatedEntries = filteredEntries.filter(
      (entry) => entry.status === 'untranslated',
    )
    const currentIndex = untranslatedEntries.findIndex(
      (entry) => entry.key === selectedKey,
    )
    const nextEntry =
      currentIndex >= 0
        ? untranslatedEntries[currentIndex + 1] ?? untranslatedEntries[0]
        : untranslatedEntries[0]

    if (nextEntry) {
      selectKey(nextEntry.key)
      setStatusFilter('untranslated')
    }
  }

  return (
    <section className="panel entry-list-panel" data-testid="entry-list-panel">
      <h2>Entries</h2>

      <div className="entry-status-overview">
        {(
          ['untranslated', 'draft', 'reviewed', 'warning'] as EntryStatus[]
        ).map((status) => (
          <div
            key={status}
            className="entry-status-card"
            data-status={status}
            data-testid={`status-count-${status}`}
          >
            <span>{statusMeta[status].summaryLabel}</span>
            <strong>{summary[status]}</strong>
          </div>
        ))}
      </div>

      <div
        className="entry-list-panel-scroll"
        data-testid="entry-list-panel-scroll"
      >
        <div className="category-section" data-collapsed={categoryCollapsed ? 'true' : 'false'}>
          <div className="category-header" onClick={() => setCategoryCollapsed(!categoryCollapsed)}>
            <button
              type="button"
              className="category-collapse-toggle"
              aria-label={categoryCollapsed ? 'Expand categories' : 'Collapse categories'}
            >
              ▾
            </button>
            <h3>Categories</h3>
            <button
              type="button"
              className="category-clear"
              onClick={(e) => { e.stopPropagation(); setCategoryPath(null) }}
            >
              All
            </button>
          </div>
          <div className="category-current">
            {selectedCategoryPath ?? 'All categories'}
          </div>
          <div className="category-tree">
            {flatCategoryTree.map(({ depth, node }) => {
              const hasChildren = node.children.length > 0
              const isExpanded = expandedPaths.has(node.path)
              const pathId = node.path.replace(/\//g, '-')

              return (
                <div
                  key={node.path}
                  className="category-row"
                  style={{ paddingLeft: `${depth * 14}px` }}
                >
                  <button
                    type="button"
                    className="category-node"
                    data-active={
                      selectedCategoryPath === node.path ? 'true' : 'false'
                    }
                    data-testid={`category-node-${pathId}`}
                    onClick={() => setCategoryPath(node.path)}
                  >
                    <span className="category-label">{node.label}</span>
                    <span className="category-count">{node.count}</span>
                  </button>
                  {hasChildren ? (
                    <button
                      type="button"
                      className="category-toggle"
                      data-testid={`category-toggle-${pathId}`}
                      onClick={() =>
                        setExpandedPaths((current) => {
                          const next = new Set(current)

                          if (next.has(node.path)) {
                            next.delete(node.path)
                          } else {
                            next.add(node.path)
                          }

                          return next
                        })
                      }
                    >
                      {isExpanded ? '-' : '+'}
                    </button>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>

        <div className="entry-toolbar">
          <input
            aria-label="Search entries"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search key or text"
          />
          <div className="entry-actions">
            <button
              type="button"
              data-active={statusFilter === 'all' ? 'true' : 'false'}
              onClick={() => setStatusFilter('all')}
            >
              All
            </button>
            <button
              type="button"
              data-active={statusFilter === 'untranslated' ? 'true' : 'false'}
              onClick={() => setStatusFilter('untranslated')}
            >
              Untranslated
            </button>
            <button
              type="button"
              onClick={() => handleSelectNextUntranslated()}
            >
              Next Untranslated
            </button>
          </div>
        </div>

        <div
          className="entry-list"
          ref={listViewportRef}
          onScroll={(event) => {
            setScrollTop(event.currentTarget.scrollTop)
          }}
        >
          <div
            className="entry-list-spacer"
            style={{ height: `${totalHeight}px` }}
          >
            {visibleEntries.map((entry, visibleIndex) => (
              <div
                key={entry.key}
                className="entry-row-shell"
                style={{
                  transform: `translateY(${(startIndex + visibleIndex) * ENTRY_ROW_HEIGHT}px)`,
                }}
              >
                <button
                  type="button"
                  className="entry-row"
                  data-status={entry.status}
                  data-testid={`entry-row-${entry.key.replace(/\//g, '-')}`}
                  data-selected={selectedKey === entry.key ? 'true' : 'false'}
                  title={entry.key}
                  onClick={() => selectKey(entry.key)}
                >
                  <strong>{entry.key}</strong>
                  <span className="status-pill" data-status={entry.status}>
                    {statusMeta[entry.status].badgeLabel}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
