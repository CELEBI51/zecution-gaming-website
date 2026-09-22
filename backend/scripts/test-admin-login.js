import request from 'supertest'
import { app } from '../src/app.js'
import { disconnectDatabase } from '../src/config/database.js'

const email = process.env.ADMIN_EMAIL
const password = process.env.ADMIN_PASSWORD

if (!email || !password) {
  throw new Error('ADMIN_EMAIL ve ADMIN_PASSWORD test için zorunludur.')
}

const agent = request.agent(app)

try {
  const login = await agent
    .post('/api/admin/auth/login')
    .send({ email, password })

  if (login.status !== 200 || !login.body.data?.csrfToken) {
    throw new Error(`Admin girişi başarısız: HTTP ${login.status}`)
  }

  const me = await agent.get('/api/admin/auth/me')
  if (me.status !== 200 || me.body.data?.admin?.email !== email) {
    throw new Error(`Admin oturum kontrolü başarısız: HTTP ${me.status}`)
  }

  const logout = await agent
    .post('/api/admin/auth/logout')
    .set('x-csrf-token', me.body.data.csrfToken)

  if (logout.status !== 200) {
    throw new Error(`Admin çıkışı başarısız: HTTP ${logout.status}`)
  }

  console.log(`Admin giriş, oturum ve çıkış testi başarılı: ${email}`)
} finally {
  await disconnectDatabase()
}
