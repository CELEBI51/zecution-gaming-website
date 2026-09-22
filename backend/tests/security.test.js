import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../src/app.js'

describe('App & Security Infrastructure', () => {
  it('should return health status on GET /health', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('status', 'ok')
    expect(res.body).toHaveProperty('timestamp')
  })

  it('should include Helmet security headers', async () => {
    const res = await request(app).get('/health')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['x-dns-prefetch-control']).toBe('off')
  })

  it('should handle non-existent routes with 404 JSON response', async () => {
    const res = await request(app).get('/api/does-not-exist')
    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
    expect(res.body.error.message).toBe('İstenen API rotası bulunamadı')
  })

  it('should validate inputs and reject invalid payloads with 422 ValidationError', async () => {
    const res = await request(app)
      .post('/api/admin/auth/login')
      .send({ email: 'not-an-email', password: '' })

    expect(res.status).toBe(422)
    expect(res.body.success).toBe(false)
    expect(res.body.error.message).toBe('Girdi doğrulama hatası')
    expect(Array.isArray(res.body.error.details)).toBe(true)
  })
})
