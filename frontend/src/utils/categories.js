// Flatten in tree order while retaining the full path for selects and filters.
export function categoryRows(categories) {
  const byId = new Map(categories.map(category => [category.id, category]))
  const children = new Map()
  for (const category of categories) {
    const parentId = category.parentId || category.parent?.id
    const key = byId.has(parentId) ? parentId : null
    if (!children.has(key)) children.set(key, [])
    children.get(key).push(category)
  }
  for (const siblings of children.values()) {
    siblings.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.name.localeCompare(b.name, 'tr') || a.id.localeCompare(b.id))
  }
  const rows = [], visited = new Set()
  function visit(category, ancestors = []) {
    if (visited.has(category.id)) return
    visited.add(category.id)
    const path = [...ancestors, category]
    rows.push({ ...category, depth: ancestors.length, pathLabel: path.map(c => c.name).join(' / '), ancestorIds: ancestors.map(c => c.id), hasChildren: Boolean(children.get(category.id)?.length || category.children?.length), branchActive: path.every(c => c.isActive !== false) })
    for (const child of children.get(category.id) || []) visit(child, path)
  }
  for (const root of children.get(null) || []) visit(root)
  // Keep malformed legacy records visible to administrators without looping.
  for (const category of categories) visit(category)
  return rows
}
