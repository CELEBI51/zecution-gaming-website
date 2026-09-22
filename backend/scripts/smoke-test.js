import request from 'supertest'
import { app } from '../src/app.js'
import { disconnectDatabase } from '../src/config/database.js'

const assertResponse = (response, label) => {
  if (response.status !== 200 || response.body.success === false) {
    throw new Error(`${label} basarisiz: HTTP ${response.status}`)
  }
}

try {
  const health = await request(app).get('/health')
  const games = await request(app).get('/api/games')
  const store = await request(app).get('/api/contents').query({ section: 'STORE' })
  const polo = await request(app).get('/api/contents/vw-polo-1-4-tdi')

  assertResponse(health, 'Health')
  assertResponse(games, 'Games')
  assertResponse(store, 'Store')
  assertResponse(polo, 'Polo detail')

  const result = {
    health: health.body.status,
    games: games.body.data.length,
    storeItems: store.body.items.length,
    poloTitle: polo.body.data.title,
    poloMedia: polo.body.data.media.length,
    poloFeatures: polo.body.data.features.length,
  }

  console.log(JSON.stringify(result, null, 2))
} finally {
  await disconnectDatabase()
}
