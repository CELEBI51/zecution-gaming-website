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
  const gallery = await request(app).get('/api/contents').query({ section: 'GALLERY' })
  const activeSlug = gallery.body.items?.[0]?.slug || 'bmw-e36-320i-convertible-1997'
  const detail = await request(app).get(`/api/contents/${activeSlug}`)

  assertResponse(health, 'Health')
  assertResponse(games, 'Games')
  assertResponse(detail, 'Content detail')

  const result = {
    health: health.body.status,
    games: games.body.data.length,
    galleryItems: gallery.body.items.length,
    detailTitle: detail.body.data.title,
    detailMedia: detail.body.data.media.length,
    detailViewCount: detail.body.data.viewCount,
  }

  console.log(JSON.stringify(result, null, 2))
} finally {
  await disconnectDatabase()
}
