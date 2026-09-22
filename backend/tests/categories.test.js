import { beforeEach, describe, expect, it, vi } from 'vitest'
const db = vi.hoisted(() => ({
  category: { findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn() },
  content: { findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn() },
}))
vi.mock('../src/config/database.js', () => ({ prisma: db }))
import { validateContentCategory, validateCategoryParent } from '../src/modules/categories/category-rules.js'
import { createCategory, updateCategory } from '../src/modules/categories/categories.service.js'
import { createContent, updateContent, publishContent, restoreContent, listPublicContents } from '../src/modules/contents/contents.service.js'
import { categoryRows } from '../../frontend/src/utils/categories.js'

const root = { id: 'root', name: '3D Modeller', slug: 'models', section: 'STORE', isActive: true, parentId: null, _count: { children: 1 } }
const leaf = { id: 'leaf', name: 'Araç', slug: 'vehicles', section: 'STORE', isActive: true, parentId: 'root', _count: { children: 0 } }
beforeEach(() => {
  vi.resetAllMocks()
  db.category.findUnique.mockImplementation(async ({ where }) => ({ root, leaf })[where.id] || null)
  db.content.count.mockResolvedValue(0)
  db.category.count.mockResolvedValue(0)
})

describe('Content category enforcement', () => {
  it('allows active leaves and uncategorized drafts', async () => {
    await expect(validateContentCategory({ categoryId: 'leaf', section: 'STORE' })).resolves.toBeUndefined()
    await expect(validateContentCategory({ status: 'DRAFT' })).resolves.toBeUndefined()
  })
  it('rejects parent, missing, wrong-section and uncategorized published assignments', async () => {
    for (const data of [{ categoryId: 'root', section: 'STORE' }, { categoryId: 'missing', section: 'STORE' }, { categoryId: 'leaf', section: 'GALLERY' }, { status: 'PUBLISHED' }]) {
      await expect(validateContentCategory(data)).rejects.toThrow()
    }
  })
  it('rejects a leaf under an inactive ancestor', async () => {
    db.category.findUnique.mockResolvedValueOnce(leaf).mockResolvedValueOnce({ ...root, isActive: false })
    await expect(validateContentCategory({ categoryId: 'leaf', section: 'STORE' })).rejects.toThrow('aktif')
  })
  it('enforces the rule on create, edit, publish and restore', async () => {
    const invalid = { id: 'item', categoryId: 'root', section: 'STORE', status: 'DRAFT' }
    db.content.findUnique.mockResolvedValue(invalid)
    await expect(createContent(invalid)).rejects.toThrow('Üst kategori')
    await expect(updateContent('item', { title: 'Updated' })).rejects.toThrow('Üst kategori')
    await expect(publishContent('item')).rejects.toThrow('Üst kategori')
    await expect(restoreContent('item')).rejects.toThrow('Üst kategori')
    expect(db.content.create).not.toHaveBeenCalled()
    expect(db.content.update).not.toHaveBeenCalled()
  })
  it('lets an old parent assignment be corrected to a leaf', async () => {
    db.content.findUnique.mockResolvedValue({ categoryId: 'root', section: 'STORE', status: 'DRAFT' })
    await updateContent('item', { categoryId: 'leaf' })
    expect(db.content.update).toHaveBeenCalled()
  })
  it('includes grandchildren in public category filters', async () => {
    db.category.findMany.mockResolvedValue([root, leaf, { id: 'grandchild', parentId: 'leaf', slug: 'rims' }])
    db.content.findMany.mockResolvedValue([])
    await listPublicContents({ category: 'models', section: 'STORE' })
    expect(db.content.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ categoryId: { in: ['root', 'leaf', 'grandchild'] } }) }))
  })
})

describe('Category structure', () => {
  it('rejects self-parenting, descendant-parenting and cross-section parenting', async () => {
    await expect(validateCategoryParent('root', { parentId: 'root', section: 'STORE' })).rejects.toThrow()
    await expect(validateCategoryParent('root', { parentId: 'leaf', section: 'STORE' })).rejects.toThrow()
    await expect(validateCategoryParent(null, { parentId: 'root', section: 'GALLERY' })).rejects.toThrow()
  })
  it('prevents turning a populated category into a parent', async () => {
    db.content.count.mockResolvedValue(2)
    await expect(createCategory({ name: 'Yeni', parentId: 'leaf', section: 'STORE' })).rejects.toThrow('içerikleri')
    expect(db.category.create).not.toHaveBeenCalled()
  })
  it('prevents moving a branch to another section', async () => {
    db.category.count.mockResolvedValue(1)
    await expect(updateCategory('root', { section: 'GALLERY' })).rejects.toThrow('bölümü')
  })
  it('groups shuffled siblings under their parent with full paths', () => {
    const rows = categoryRows([{ ...leaf, sortOrder: 2 }, { id: 'other', name: 'Diğer', sortOrder: 3 }, { ...root, sortOrder: 1 }, { ...leaf, id: 'rim', name: 'Jant', sortOrder: 1 }])
    expect(rows.map(row => row.id)).toEqual(['root', 'rim', 'leaf', 'other'])
    expect(rows[0].hasChildren).toBe(true)
    expect(rows[2].pathLabel).toBe('3D Modeller / Araç')
    expect(rows[2].ancestorIds).toEqual(['root'])
  })
  it('terminates on malformed legacy cycles and excludes inactive branches from assignment', () => {
    expect(categoryRows([{ ...root, parentId: 'leaf' }, leaf])).toHaveLength(2)
    const rows = categoryRows([{ ...root, isActive: false }, leaf])
    expect(rows[1].branchActive).toBe(false)
  })
})
