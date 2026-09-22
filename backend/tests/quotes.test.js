import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
const db = vi.hoisted(() => ({ quoteRequest: { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn(), update: vi.fn() }, adminSession: { findUnique: vi.fn() } }))
vi.mock('../src/config/database.js', () => ({ prisma: db }))
import { app } from '../src/app.js'
import { createQuoteSchema } from '../src/modules/quotes/quotes.validation.js'
import { createQuote, listQuotes, updateQuote } from '../src/modules/quotes/quotes.service.js'

const id = '0aa31419-bdc4-47df-bb09-4b111ae73e16'
const payload = { submissionId: id, name: 'Test Kullanıcı', email: 'TEST@example.com', game: 'Assetto Corsa', type: 'VEHICLE', description: 'Özel bir araç modu için detaylı test açıklaması.', website: '' }
beforeEach(() => vi.resetAllMocks())
describe('Quote validation and persistence', () => {
  it('normalizes optional fields and email', () => {
    expect(createQuoteSchema.parse(payload)).toMatchObject({ email: 'test@example.com', budget: null, referenceUrl: null, desiredDate: null })
  })
  it.each([{ name: '   ' }, { email: 'invalid' }, { description: 'short' }, { type: 'INVALID' }, { referenceUrl: 'javascript:alert(1)' }, { referenceUrl: 'file:///private' }, { desiredDate: '2026-02-30' }, { website: 'spam' }, { status: 'ACCEPTED' }, { adminNotes: 'injected' }])('rejects invalid or admin-only input: %j', fields => {
    expect(createQuoteSchema.safeParse({ ...payload, ...fields }).success).toBe(false)
  })
  it('stores only validated request data and returns a minimal receipt', async () => {
    db.quoteRequest.create.mockResolvedValue({ id, createdAt: new Date() })
    await createQuote(createQuoteSchema.parse(payload))
    expect(db.quoteRequest.create).toHaveBeenCalledWith({ data: expect.not.objectContaining({ website: expect.anything() }), select: { id: true, createdAt: true } })
    expect(db.quoteRequest.create.mock.calls[0][0].data).not.toHaveProperty('status')
  })
  it('deduplicates retries after a successful write', async () => {
    db.quoteRequest.create.mockRejectedValue({ code: 'P2002' })
    db.quoteRequest.findUnique.mockResolvedValue({ id })
    await expect(createQuote(createQuoteSchema.parse(payload))).resolves.toEqual({ id })
    expect(db.quoteRequest.findUnique).toHaveBeenCalledWith({ where: { submissionId: id }, select: { id: true, createdAt: true } })
  })
  it('propagates storage failure instead of reporting success', async () => {
    db.quoteRequest.create.mockRejectedValue(new Error('unavailable'))
    await expect(createQuote(createQuoteSchema.parse(payload))).rejects.toThrow('unavailable')
  })
  it('paginates filtered requests newest first', async () => {
    db.quoteRequest.count.mockResolvedValue(21)
    db.quoteRequest.findMany.mockResolvedValue([])
    const result = await listQuotes({ status: 'NEW', search: 'test', page: 2, limit: 20 })
    expect(result.pagination).toMatchObject({ total: 21, totalPages: 2 })
    expect(db.quoteRequest.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 20, take: 20, where: expect.objectContaining({ status: 'NEW' }), orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] }))
  })
  it('returns not-found for missing updates', async () => {
    db.quoteRequest.update.mockRejectedValue({ code: 'P2025' })
    await expect(updateQuote(id, { status: 'NEW', adminNotes: '' })).rejects.toMatchObject({ statusCode: 404 })
  })
})

describe('Quote API access boundaries', () => {
  it('accepts a public request and returns only a receipt', async () => {
    db.quoteRequest.create.mockResolvedValue({ id, createdAt: new Date() })
    const res = await request(app).post('/api/quotes').send(payload)
    expect(res.status).toBe(201)
    expect(Object.keys(res.body.data).sort()).toEqual(['createdAt', 'id'])
  })
  it('does not expose a public listing or detail endpoint', async () => {
    expect((await request(app).get('/api/quotes')).status).toBe(404)
    expect((await request(app).get(`/api/quotes/${id}`)).status).toBe(404)
  })
  it('requires authentication for list, detail and updates', async () => {
    expect((await request(app).get('/api/admin/quotes')).status).toBe(401)
    expect((await request(app).get(`/api/admin/quotes/${id}`)).status).toBe(401)
    expect((await request(app).patch(`/api/admin/quotes/${id}`).send({ status: 'COMPLETED', adminNotes: '' })).status).toBe(401)
    expect(db.quoteRequest.findMany).not.toHaveBeenCalled()
  })
  it('lets authenticated admins read and save status and private notes', async () => {
    db.adminSession.findUnique.mockResolvedValue({ admin: { isActive: true }, expiresAt: new Date(Date.now() + 60000), lastSeenAt: new Date() })
    db.quoteRequest.findUnique.mockResolvedValue({ id, adminNotes: 'Private' })
    db.quoteRequest.update.mockResolvedValue({ id, status: 'QUOTED', adminNotes: '2500 TL' })
    const detail = await request(app).get(`/api/admin/quotes/${id}`).set('Authorization', 'Bearer test')
    expect(detail.status).toBe(200)
    expect(detail.headers['cache-control']).toBe('no-store')
    const updated = await request(app).patch(`/api/admin/quotes/${id}`).set('Authorization', 'Bearer test').send({ status: 'QUOTED', adminNotes: '2500 TL' })
    expect(updated.status).toBe(200)
    expect(db.quoteRequest.update).toHaveBeenCalledWith({ where: { id }, data: { status: 'QUOTED', adminNotes: '2500 TL' } })
    expect((await request(app).patch(`/api/admin/quotes/${id}`).set('Cookie', 'sid=test').send({ status: 'NEW', adminNotes: '' })).status).toBe(403)
  })
  it('rejects spam and limits repeated anonymous submissions', async () => {
    const invalid = await request(app).post('/api/quotes').send({ ...payload, website: 'bot' })
    expect(invalid.status).toBe(422)
    db.quoteRequest.create.mockResolvedValue({ id })
    const responses = []
    for (let n = 0; n < 5; n++) responses.push(await request(app).post('/api/quotes').send(payload))
    expect(responses.at(-1).status).toBe(429)
  })
})
