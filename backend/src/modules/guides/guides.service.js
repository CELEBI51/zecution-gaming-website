import { prisma } from '../../config/database.js'
import { DEFAULT_GUIDES } from './guides.default.js'
import { NotFoundError, BadRequestError } from '../../utils/api-error.js'

const SETTINGS_KEY = 'custom_guides'

function slugify(text) {
  if (!text) return ''
  const turkishMap = {
    'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ı': 'i', 'İ': 'i',
    'ö': 'o', 'Ö': 'o', 'ş': 's', 'Ş': 's', 'ü': 'u', 'Ü': 'u',
  }
  let str = text.toString()
  for (const [k, v] of Object.entries(turkishMap)) {
    str = str.replace(new RegExp(k, 'g'), v)
  }
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function loadRawGuides() {
  try {
    const record = await prisma.siteSetting.findUnique({
      where: { key: SETTINGS_KEY },
    })

    if (!record || !record.value) {
      // Seed default guides
      await prisma.siteSetting.upsert({
        where: { key: SETTINGS_KEY },
        update: { value: JSON.stringify(DEFAULT_GUIDES) },
        create: { key: SETTINGS_KEY, value: JSON.stringify(DEFAULT_GUIDES) },
      })
      return DEFAULT_GUIDES
    }

    const parsed = JSON.parse(record.value)
    const list = Array.isArray(parsed) ? parsed : DEFAULT_GUIDES
    return list.map((g) => {
      const isZecution = !g.author?.name || g.author.name.toLowerCase().includes('zecution')
      const { reputation, ...cleanAuthor } = g.author || {}
      return {
        ...g,
        author: {
          ...cleanAuthor,
          name: isZecution ? 'Zecution Gaming 👑' : (g.author?.name || 'Zecution Gaming 👑'),
          role: isZecution ? 'Kurucu' : (g.author?.role || 'Mod Yapımcısı'),
          badge: isZecution ? 'KURUCU' : (g.author?.badge || 'ONAYLI YAPIMCI'),
          avatar: g.author?.avatar || '/media/images/logo.jpg',
          posts: g.author?.posts || '148 Gönderi',
        },
      }
    })
  } catch (err) {
    console.error('Error loading guides from DB:', err)
    return DEFAULT_GUIDES
  }
}

async function saveRawGuides(guides) {
  await prisma.siteSetting.upsert({
    where: { key: SETTINGS_KEY },
    update: { value: JSON.stringify(guides) },
    create: { key: SETTINGS_KEY, value: JSON.stringify(guides) },
  })
  return guides
}

export async function getAllGuides({ isAdmin = false, search = '', category = '' } = {}) {
  const allGuides = await loadRawGuides()
  let filtered = allGuides

  if (!isAdmin) {
    filtered = filtered.filter((g) => g.isActive !== false)
  }

  if (category && category !== 'Tümü') {
    filtered = filtered.filter((g) => {
      if (category === 'Assetto Corsa') return g.game === 'Assetto Corsa'
      if (category === 'BeamNG.drive') return g.game === 'BeamNG.drive'
      if (category === 'Grafik & CSP') return g.category === 'Grafik & CSP'
      if (category === 'Donanım & Ayarlar') return g.category === 'Donanım & Ayarlar'
      return g.category === category || g.game === category
    })
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase()
    filtered = filtered.filter(
      (g) =>
        g.title?.toLowerCase().includes(q) ||
        g.summary?.toLowerCase().includes(q) ||
        g.game?.toLowerCase().includes(q) ||
        g.category?.toLowerCase().includes(q) ||
        (g.highlights && g.highlights.some((h) => h.toLowerCase().includes(q)))
    )
  }

  return filtered
}

export async function getGuideBySlug(slugOrId, { isAdmin = false } = {}) {
  const allGuides = await loadRawGuides()
  const found = allGuides.find((g) => g.slug === slugOrId || g.id === slugOrId)
  if (!found) {
    throw new NotFoundError('Rehber bulunamadı.')
  }
  if (!isAdmin && found.isActive === false) {
    throw new NotFoundError('Rehber bulunamadı veya henüz yayında değil.')
  }
  return found
}

export async function createGuide(data) {
  if (!data.title) {
    throw new BadRequestError('Rehber başlığı zorunludur.')
  }

  const allGuides = await loadRawGuides()

  let slug = data.slug ? slugify(data.slug) : slugify(data.title)
  // Ensure slug uniqueness
  let uniqueSlug = slug
  let counter = 1
  while (allGuides.some((g) => g.slug === uniqueSlug)) {
    uniqueSlug = `${slug}-${counter++}`
  }

  const newGuide = {
    id: data.id || `guide-${Date.now()}`,
    slug: uniqueSlug,
    title: data.title.trim(),
    game: data.game || 'Assetto Corsa',
    gameCode: slugify(data.game || 'Assetto Corsa'),
    category: data.category || 'Temel Kurulum',
    forumCategory: data.forumCategory || `${data.game || 'Assetto Corsa'} / ${data.category || 'Temel Kurulum'}`,
    time: data.time || '5 dk okuma',
    difficulty: data.difficulty || 'Kolay',
    coverImage: data.coverImage || '/media/images/game-assetto-corsa.png',
    summary: data.summary || '',
    highlights: Array.isArray(data.highlights) ? data.highlights : [],
    targetPath: data.targetPath || '',
    isActive: data.isActive !== false,
    author: data.author || {
      name: 'Zecution Gaming 👑',
      role: 'Kurucu',
      badge: 'KURUCU',
      avatar: '/media/images/logo.jpg',
      posts: '148 Gönderi',
    },
    stats: {
      views: '1.2k Görüntülenme',
      likes: 12,
      replies: 0,
      date: 'Yeni',
      ...(data.stats || {}),
    },
    requirements: Array.isArray(data.requirements) ? data.requirements : [],
    steps: Array.isArray(data.steps)
      ? data.steps.map((st, i) => {
          const imgs = Array.isArray(st.images) && st.images.length > 0
            ? st.images.filter(Boolean)
            : (st.image ? [st.image] : [])
          return {
            stepNumber: st.stepNumber || i + 1,
            title: st.title || '',
            description: st.description || '',
            images: imgs,
            image: imgs[0] || '',
            tip: st.tip || '',
          }
        })
      : [],
    tips: Array.isArray(data.tips) ? data.tips : [],
    troubleshooting: Array.isArray(data.troubleshooting) ? data.troubleshooting : [],
    youtubeVideo: data.youtubeVideo || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  allGuides.unshift(newGuide)
  await saveRawGuides(allGuides)
  return newGuide
}

export async function updateGuide(idOrSlug, data) {
  const allGuides = await loadRawGuides()
  const index = allGuides.findIndex((g) => g.id === idOrSlug || g.slug === idOrSlug)

  if (index === -1) {
    throw new NotFoundError('Güncellenecek rehber bulunamadı.')
  }

  const existing = allGuides[index]

  let slug = data.slug ? slugify(data.slug) : existing.slug
  if (slug !== existing.slug) {
    let uniqueSlug = slug
    let counter = 1
    while (allGuides.some((g, i) => i !== index && g.slug === uniqueSlug)) {
      uniqueSlug = `${slug}-${counter++}`
    }
    slug = uniqueSlug
  }

  const updatedGuide = {
    ...existing,
    ...data,
    slug,
    gameCode: slugify(data.game || existing.game),
    steps: Array.isArray(data.steps)
      ? data.steps.map((st, i) => {
          const imgs = Array.isArray(st.images) && st.images.length > 0
            ? st.images.filter(Boolean)
            : (st.image ? [st.image] : [])
          return {
            stepNumber: st.stepNumber || i + 1,
            title: st.title || '',
            description: st.description || '',
            images: imgs,
            image: imgs[0] || '',
            tip: st.tip || '',
          }
        })
      : existing.steps,
    updatedAt: new Date().toISOString(),
  }

  allGuides[index] = updatedGuide
  await saveRawGuides(allGuides)
  return updatedGuide
}

export async function deleteGuide(idOrSlug) {
  const allGuides = await loadRawGuides()
  const index = allGuides.findIndex((g) => g.id === idOrSlug || g.slug === idOrSlug)

  if (index === -1) {
    throw new NotFoundError('Silinecek rehber bulunamadı.')
  }

  const deleted = allGuides.splice(index, 1)[0]
  await saveRawGuides(allGuides)
  return { success: true, deleted }
}
