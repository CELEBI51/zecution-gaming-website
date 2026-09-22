import { describe, it, expect, vi } from 'vitest'
import { hashToken } from '../src/utils/crypto.js'
import { requireAdmin } from '../src/middleware/auth.middleware.js'
import { prisma } from '../src/config/database.js'

describe('Auth & CSRF Middleware', () => {
  it('should reject request when no sid cookie is provided', async () => {
    const req = { cookies: {}, headers: {}, method: 'GET' }
    const res = {}
    const next = vi.fn()

    await requireAdmin(req, res, next)

    expect(next).toHaveBeenCalled()
    const error = next.mock.calls[0][0]
    expect(error.statusCode).toBe(401)
    expect(error.message).toBe('Oturum açmanız gerekiyor')
  })

  it('should reject mutating requests (POST, PATCH, DELETE) when CSRF token is missing', async () => {
    const rawToken = 'test-session-token'
    const tokenHash = hashToken(rawToken)

    vi.spyOn(prisma.adminSession, 'findUnique').mockResolvedValueOnce({
      id: 'session-id',
      tokenHash,
      csrfTokenHash: hashToken('valid-csrf-token'),
      expiresAt: new Date(Date.now() + 3600 * 1000),
      revokedAt: null,
      lastSeenAt: new Date(),
      admin: {
        id: 'admin-id',
        name: 'Test Admin',
        email: 'admin@test.com',
        role: 'ADMIN',
        isActive: true,
      },
    })

    const req = {
      cookies: { sid: rawToken },
      headers: {},
      method: 'POST',
    }
    const res = {}
    const next = vi.fn()

    await requireAdmin(req, res, next)

    expect(next).toHaveBeenCalled()
    const error = next.mock.calls[0][0]
    expect(error.statusCode).toBe(403)
    expect(error.message).toContain('CSRF token bulunamadı')
  })

  it('should reject mutating requests when CSRF token does not match', async () => {
    const rawToken = 'test-session-token'
    const tokenHash = hashToken(rawToken)

    vi.spyOn(prisma.adminSession, 'findUnique').mockResolvedValueOnce({
      id: 'session-id',
      tokenHash,
      csrfTokenHash: hashToken('valid-csrf-token'),
      expiresAt: new Date(Date.now() + 3600 * 1000),
      revokedAt: null,
      lastSeenAt: new Date(),
      admin: {
        id: 'admin-id',
        name: 'Test Admin',
        email: 'admin@test.com',
        role: 'ADMIN',
        isActive: true,
      },
    })

    const req = {
      cookies: { sid: rawToken },
      headers: { 'x-csrf-token': 'attacker-forged-csrf' },
      method: 'POST',
    }
    const res = {}
    const next = vi.fn()

    await requireAdmin(req, res, next)

    expect(next).toHaveBeenCalled()
    const error = next.mock.calls[0][0]
    expect(error.statusCode).toBe(403)
    expect(error.message).toBe('Geçersiz CSRF token')
  })

  it('should allow mutating requests with valid session and valid CSRF token', async () => {
    const rawToken = 'test-session-token'
    const validCsrf = 'valid-csrf-token-123'
    const tokenHash = hashToken(rawToken)

    vi.spyOn(prisma.adminSession, 'findUnique').mockResolvedValueOnce({
      id: 'session-id',
      tokenHash,
      csrfTokenHash: hashToken(validCsrf),
      expiresAt: new Date(Date.now() + 3600 * 1000),
      revokedAt: null,
      lastSeenAt: new Date(),
      admin: {
        id: 'admin-id',
        name: 'Test Admin',
        email: 'admin@test.com',
        role: 'ADMIN',
        isActive: true,
      },
    })

    const req = {
      cookies: { sid: rawToken },
      headers: { 'x-csrf-token': validCsrf },
      method: 'POST',
    }
    const res = {}
    const next = vi.fn()

    await requireAdmin(req, res, next)

    expect(next).toHaveBeenCalledWith()
    expect(req.admin).toBeDefined()
    expect(req.admin.email).toBe('admin@test.com')
  })
})
