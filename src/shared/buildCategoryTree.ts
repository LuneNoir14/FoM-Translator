import type { CategoryNode } from './contracts.js'

interface CategoryBuilderNode extends CategoryNode {
  childrenMap: Map<string, CategoryBuilderNode>
}

function createBuilderNode(path: string, label: string): CategoryBuilderNode {
  return {
    path,
    label,
    count: 0,
    children: [],
    childrenMap: new Map<string, CategoryBuilderNode>(),
  }
}

function sortNodes(nodes: CategoryBuilderNode[]): CategoryNode[] {
  return nodes
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count
      }

      return left.label.localeCompare(right.label, 'tr-TR')
    })
    .map((node) => ({
      path: node.path,
      label: node.label,
      count: node.count,
      children: sortNodes([...node.childrenMap.values()]),
    }))
}

export function buildCategoryTree(keys: string[]): CategoryNode[] {
  const rootMap = new Map<string, CategoryBuilderNode>()

  for (const key of keys) {
    const segments = key.split('/').filter(Boolean)
    let currentMap = rootMap
    const pathSegments: string[] = []

    for (const segment of segments) {
      pathSegments.push(segment)
      const path = pathSegments.join('/')
      let node = currentMap.get(segment)

      if (!node) {
        node = createBuilderNode(path, segment)
        currentMap.set(segment, node)
      }

      node.count += 1
      currentMap = node.childrenMap
    }
  }

  return sortNodes([...rootMap.values()])
}
