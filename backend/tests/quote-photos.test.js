import { describe, it, expect } from 'vitest'
import express from 'express'
import request from 'supertest'
import sharp from 'sharp'
import { prepareQuotePhotos, uploadQuotePhotos } from '../src/modules/quotes/quotes.photos.js'

const app = express()
app.post('/', uploadQuotePhotos, (req, res) => res.json({ count: req.files.length }))
app.use((err, _req, res, _next) => res.status(err.statusCode || 500).json({ message: err.message }))
const png = () => sharp({ create: { width: 12, height: 12, channels: 3, background: '#ff0000' } }).png().toBuffer()
describe('Quote photo upload limits', () => {
  it('accepts five photos and rejects the sixth', async () => {
    const buffer = await png()
    let five = request(app).post('/')
    for (let i = 0; i < 5; i++) five = five.attach('photos', buffer, `photo${i}.png`)
    expect((await five).body.count).toBe(5)
    let six = request(app).post('/')
    for (let i = 0; i < 6; i++) six = six.attach('photos', buffer, `photo${i}.png`)
    const response = await six
    expect(response.status).toBe(400)
    expect(response.body.message).toContain('5 fotoğraf')
  })
  it('rejects photos larger than 5 MB with the correct limit message', async () => {
    const response = await request(app).post('/').attach('photos', Buffer.alloc(5 * 1024 * 1024 + 1), 'large.jpg')
    expect(response.status).toBe(400)
    expect(response.body.message).toContain('5 MB')
  })
  it('rejects unsupported file types', async () => {
    expect((await request(app).post('/').attach('photos', Buffer.from('test'), 'file.txt')).status).toBe(400)
  })
  it('detects forged image types and corrupt files', async () => {
    await expect(prepareQuotePhotos([{ buffer: Buffer.from('not an image'), mimetype: 'image/jpeg', originalname: 'fake.jpg' }])).rejects.toThrow('Fotoğraf okunamadı')
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>')
    await expect(prepareQuotePhotos([{ buffer: svg, mimetype: 'image/png', originalname: 'fake.png' }])).rejects.toThrow('Fotoğraf okunamadı')
  })
  it('converts valid photos to optimized WebP', async () => {
    const result = await prepareQuotePhotos([{ buffer: await png(), mimetype: 'image/png', originalname: 'reference.png' }])
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ name: 'reference.png', sortOrder: 0 })
    expect((await sharp(result[0].data).metadata()).format).toBe('webp')
  })
})
