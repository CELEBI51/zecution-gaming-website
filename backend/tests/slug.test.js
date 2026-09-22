import { describe, it, expect } from 'vitest'
import { slugify } from '../src/utils/slug.js'

describe('Slug Utility', () => {
  it('should correctly convert Turkish characters to ASCII', () => {
    const input = 'Çok Güzel ve Şık Araç Modları — Türkçe İçerik Öğeleri'
    const expected = 'cok-guzel-ve-sik-arac-modlari-turkce-icerik-ogeleri'
    expect(slugify(input)).toBe(expected)
  })

  it('should strip special characters and consecutive dashes', () => {
    const input = '  Volkswagen Polo 1.4 TDI (2026 Edition!) #01  '
    const expected = 'volkswagen-polo-14-tdi-2026-edition-01'
    expect(slugify(input)).toBe(expected)
  })

  it('should handle empty or null values safely', () => {
    expect(slugify('')).toBe('')
    expect(slugify(null)).toBe('')
    expect(slugify(undefined)).toBe('')
  })
})
