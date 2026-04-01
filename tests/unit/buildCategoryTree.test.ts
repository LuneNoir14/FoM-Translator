import { expect, test } from 'vitest'
import { buildCategoryTree } from '../../src/shared/buildCategoryTree'

test('builds a nested category tree from slash-delimited localization keys', () => {
  const tree = buildCategoryTree([
    'Conversations/Bank/March/gift_lines/1',
    'Conversations/Bank/June/follow_up/1',
    'items/furniture/chair/name',
  ])

  expect(tree.map((node) => [node.label, node.count])).toEqual([
    ['Conversations', 2],
    ['items', 1],
  ])

  expect(tree[0]?.children.map((node) => [node.label, node.count])).toEqual([
    ['Bank', 2],
  ])

  expect(
    tree[0]?.children[0]?.children.map((node) => [node.label, node.count]),
  ).toEqual([
    ['June', 1],
    ['March', 1],
  ])
})
