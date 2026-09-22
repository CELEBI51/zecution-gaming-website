import { beforeEach, describe, expect, it, vi } from 'vitest'

const content = vi.hoisted(() => ({
  count: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(),
}))
vi.mock('../src/config/database.js', () => ({ prisma: { content } }))
import { createContent, listAdminContents, listPublicContents } from '../src/modules/contents/contents.service.js'

describe('Content creation and listing', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    content.count.mockResolvedValue(0)
    content.findMany.mockResolvedValue([])
  })

  it.each([listAdminContents, listPublicContents])('lists newest creations first, regardless of manual priority or edits', async (list) => {
    await list({})
    expect(content.findMany).toHaveBeenCalledWith(expect.objectContaining({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    }))
  })

  it('automatically generates a unique slug from the title without publishing a draft', async () => {
    content.findUnique.mockResolvedValueOnce({ id: 'existing' }).mockResolvedValueOnce(null)
    await createContent({ title: 'Şık Araç', section: 'STORE', status: 'DRAFT' })
    expect(content.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ slug: 'sik-arac-2', publishedAt: null, downloadUrl: null }),
    }))
  })
})
