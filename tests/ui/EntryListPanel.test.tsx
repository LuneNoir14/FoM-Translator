import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import { EntryListPanel } from '../../src/renderer/workbench/EntryListPanel'
import { buildCategoryTree } from '../../src/shared/buildCategoryTree'
import { useWorkbenchStore } from '../../src/renderer/workbench/useWorkbenchStore'

test('filters to untranslated entries and selects the next result', async () => {
  const user = userEvent.setup()

  render(<EntryListPanel />)

  expect(screen.getByTestId('entry-list-panel-scroll')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: /^Untranslated$/i }))

  expect(screen.getByText('misc_local/sleep')).toBeInTheDocument()
})

test('moves selection with the next untranslated action', async () => {
  const user = userEvent.setup()

  render(<EntryListPanel />)

  await user.click(screen.getByRole('button', { name: /next untranslated/i }))

  expect(screen.getByTestId('entry-row-misc_local-talk')).toHaveAttribute(
    'data-selected',
    'true',
  )
})

test('shows English progress counters and generic status badges for each entry', () => {
  useWorkbenchStore.setState({
    entries: [
      {
        key: 'quest/draft',
        sourceText: 'Draft line',
        translatedText: 'Taslak satir',
        status: 'draft',
      },
      {
        key: 'quest/untranslated',
        sourceText: 'Missing line',
        translatedText: '',
        status: 'untranslated',
      },
      {
        key: 'quest/reviewed',
        sourceText: 'Reviewed line',
        translatedText: 'Tamam',
        status: 'reviewed',
      },
      {
        key: 'quest/warning',
        sourceText: 'Warning line',
        translatedText: 'Uyari',
        status: 'warning',
      },
    ],
    summary: {
      untranslated: 1,
      draft: 1,
      reviewed: 1,
      warning: 1,
    },
    selectedKey: 'quest/draft',
  })

  render(<EntryListPanel />)

  expect(screen.getByTestId('status-count-untranslated')).toHaveTextContent('1')
  expect(screen.getByTestId('status-count-untranslated')).toHaveTextContent(
    'Remaining',
  )
  expect(screen.getByTestId('status-count-draft')).toHaveTextContent('1')
  expect(screen.getByTestId('status-count-draft')).toHaveTextContent('Draft')
  expect(screen.getByTestId('status-count-reviewed')).toHaveTextContent('1')
  expect(screen.getByTestId('status-count-reviewed')).toHaveTextContent('Done')
  expect(screen.getByTestId('status-count-warning')).toHaveTextContent('1')
  expect(screen.getByTestId('status-count-warning')).toHaveTextContent('Warning')

  expect(
    within(screen.getByTestId('entry-row-quest-draft')).getByText('Draft'),
  ).toBeInTheDocument()
  expect(
    within(screen.getByTestId('entry-row-quest-untranslated')).getByText(
      'Untranslated',
    ),
  ).toBeInTheDocument()
  expect(
    within(screen.getByTestId('entry-row-quest-reviewed')).getByText(
      'Completed',
    ),
  ).toBeInTheDocument()
  expect(
    within(screen.getByTestId('entry-row-quest-warning')).getByText('Warning'),
  ).toBeInTheDocument()
})

test('shows session progress, selected category progress, and issue digest summaries', () => {
  const entries = [
    {
      key: 'Conversations/one',
      sourceText: 'Hello',
      translatedText: 'Merhaba',
      status: 'reviewed' as const,
    },
    {
      key: 'Conversations/two',
      sourceText: '[Ari], hello',
      translatedText: 'Merhaba',
      status: 'warning' as const,
    },
    {
      key: 'items/one',
      sourceText: 'Item',
      translatedText: '',
      status: 'untranslated' as const,
    },
  ]

  useWorkbenchStore.setState({
    entries,
    categoryTree: buildCategoryTree(entries.map((entry) => entry.key)),
    summary: {
      untranslated: 1,
      draft: 0,
      reviewed: 1,
      warning: 1,
    },
    selectedCategoryPath: 'Conversations',
    selectedKey: 'Conversations/one',
  })

  render(<EntryListPanel />)

  expect(screen.getByText('Session Progress')).toBeInTheDocument()
  expect(screen.getByText('Selected Category')).toBeInTheDocument()
  expect(screen.getByText('Issue Digest')).toBeInTheDocument()
  expect(screen.getByText('2 / 3 complete')).toBeInTheDocument()
  expect(screen.getAllByText('Conversations').length).toBeGreaterThan(0)
  expect(screen.getByText('2 / 2 complete')).toBeInTheDocument()
  expect(screen.getByText('Missing placeholder')).toBeInTheDocument()
})

test('shows completion percent and issue count for category rows', () => {
  const entries = [
    {
      key: 'Conversations/one',
      sourceText: 'Hello',
      translatedText: 'Merhaba',
      status: 'reviewed' as const,
    },
    {
      key: 'Conversations/two',
      sourceText: '[Ari], hello',
      translatedText: 'Merhaba',
      status: 'warning' as const,
    },
    {
      key: 'items/one',
      sourceText: 'Item',
      translatedText: '',
      status: 'untranslated' as const,
    },
  ]

  useWorkbenchStore.setState({
    entries,
    categoryTree: buildCategoryTree(entries.map((entry) => entry.key)),
    summary: {
      untranslated: 1,
      draft: 0,
      reviewed: 1,
      warning: 1,
    },
    selectedKey: 'Conversations/one',
  })

  render(<EntryListPanel />)

  expect(screen.getByText('2 / 2')).toBeInTheDocument()
  expect(screen.getByText('100% complete')).toBeInTheDocument()
  expect(screen.getByText('1 issue')).toBeInTheDocument()
})

test('does not mount every row at once for very large projects', () => {
  useWorkbenchStore.setState({
    entries: Array.from({ length: 500 }, (_value, index) => ({
      key: `bulk/entry-${index}`,
      sourceText: `Line ${index}`,
      translatedText: '',
      status: 'untranslated' as const,
    })),
    summary: {
      untranslated: 500,
      draft: 0,
      reviewed: 0,
      warning: 0,
    },
    selectedKey: 'bulk/entry-0',
  })

  render(<EntryListPanel />)

  expect(screen.getByText('bulk/entry-0')).toBeInTheDocument()
  expect(screen.queryByText('bulk/entry-499')).not.toBeInTheDocument()
})

test('filters entries by the selected category branch', async () => {
  const user = userEvent.setup()
  const entries = [
    {
      key: 'Conversations/Bank/March/gift_lines/1',
      sourceText: 'Bank line',
      translatedText: '',
      status: 'untranslated' as const,
    },
    {
      key: 'items/furniture/chair/name',
      sourceText: 'Chair',
      translatedText: '',
      status: 'untranslated' as const,
    },
  ]

  useWorkbenchStore.setState({
    entries,
    categoryTree: buildCategoryTree(entries.map((entry) => entry.key)),
    summary: {
      untranslated: 2,
      draft: 0,
      reviewed: 0,
      warning: 0,
    },
    selectedCategoryPath: null,
    selectedKey: entries[0].key,
  })

  render(<EntryListPanel />)

  await user.click(screen.getByTestId('category-toggle-Conversations'))
  await user.click(screen.getByTestId('category-node-Conversations-Bank'))

  expect(
    screen.getByTestId('entry-row-Conversations-Bank-March-gift_lines-1'),
  ).toBeInTheDocument()
  expect(
    screen.queryByTestId('entry-row-items-furniture-chair-name'),
  ).not.toBeInTheDocument()
})
