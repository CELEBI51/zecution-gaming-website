const STORAGE_KEY = 'zecution_producers_list'
const ALIASES_KEY = 'zecution_producers_aliases'
const DELETED_KEY = 'zecution_producers_deleted'
const AVATARS_KEY = 'zecution_producers_avatars'
const ROLES_KEY = 'zecution_producers_roles'

export const DEFAULT_PRODUCERS = [
  'Zecution Gaming',
  'Cml Gaming',
]

export const PRODUCER_ROLES = [
  { key: 'KURUCU', label: 'Kurucu 👑', badge: 'KURUCU', roleTitle: 'Kurucu', badgeClass: 'creator-card-badge--founder' },
  { key: 'PARTNER', label: 'Partner 🤝', badge: 'PARTNER', roleTitle: 'Mod Yapımcısı', badgeClass: 'creator-card-badge--partner' },
  { key: 'ONAYLI YAPIMCI', label: 'Onaylı Yapımcı ⭐', badge: 'ONAYLI YAPIMCI', roleTitle: 'Mod Yapımcısı', badgeClass: 'creator-card-badge--verified' },
  { key: 'MOD YAPIMCISI', label: 'Mod Yapımcısı 🛠️', badge: 'YAPIMCI', roleTitle: 'Mod Yapımcısı', badgeClass: 'creator-card-badge--verified' },
]

export const DEFAULT_PRODUCER_ROLES = {
  'zecution gaming': 'KURUCU',
  'cml gaming': 'PARTNER',
}

export const DEFAULT_PRODUCER_AVATARS = {
  'zecution gaming': '/media/images/logo.jpg',
}

let cachedServerAvatars = null
let cachedServerRoles = null
let cachedServerDeleted = []

export function setServerProducerAvatars(map) {
  if (!map) return
  if (typeof map === 'string') {
    try {
      cachedServerAvatars = JSON.parse(map)
    } catch {
      cachedServerAvatars = {}
    }
  } else if (typeof map === 'object') {
    cachedServerAvatars = map
  }
}

export function setServerProducerRoles(map) {
  if (!map) return
  if (typeof map === 'string') {
    try {
      cachedServerRoles = JSON.parse(map)
    } catch {
      cachedServerRoles = {}
    }
  } else if (typeof map === 'object') {
    cachedServerRoles = map
  }
}

export function setServerDeletedProducers(list) {
  if (!list) return
  if (typeof list === 'string') {
    try {
      cachedServerDeleted = JSON.parse(list)
    } catch {
      cachedServerDeleted = []
    }
  } else if (Array.isArray(list)) {
    cachedServerDeleted = list
  }
}

export function getProducerRoles() {
  try {
    const raw = localStorage.getItem(ROLES_KEY)
    const local = raw ? JSON.parse(raw) : {}
    return {
      ...DEFAULT_PRODUCER_ROLES,
      ...(cachedServerRoles || {}),
      ...local,
    }
  } catch {
    return {
      ...DEFAULT_PRODUCER_ROLES,
      ...(cachedServerRoles || {}),
    }
  }
}

export function getProducerRoleInfo(producerName, customMap = null) {
  if (!producerName) {
    return PRODUCER_ROLES[2]
  }
  const clean = String(producerName).replace(/👑/g, '').trim().toLowerCase()

  const map = customMap || getProducerRoles()
  let matchedKey = null

  for (const [k, role] of Object.entries(map)) {
    if (k.trim().toLowerCase() === clean && role) {
      matchedKey = role
      break
    }
  }

  if (!matchedKey) {
    if (clean.includes('zecution')) matchedKey = 'KURUCU'
    else if (clean.includes('cml')) matchedKey = 'PARTNER'
    else matchedKey = 'ONAYLI YAPIMCI'
  }

  const found = PRODUCER_ROLES.find((r) => r.key === matchedKey)
  if (found) return found

  return {
    key: matchedKey,
    label: matchedKey,
    badge: matchedKey,
    roleTitle: 'Mod Yapımcısı',
    badgeClass: 'creator-card-badge--verified',
  }
}

export function saveProducerRole(producerName, roleKey) {
  if (!producerName) return
  const clean = String(producerName).replace(/👑/g, '').trim()
  try {
    const raw = localStorage.getItem(ROLES_KEY)
    const current = raw ? JSON.parse(raw) : {}
    current[clean] = roleKey
    localStorage.setItem(ROLES_KEY, JSON.stringify(current))
  } catch (err) {
    console.error('Error saving producer role:', err)
  }
}

export function getProducerAvatars() {
  try {
    const raw = localStorage.getItem(AVATARS_KEY)
    const local = raw ? JSON.parse(raw) : {}
    return {
      ...DEFAULT_PRODUCER_AVATARS,
      ...(cachedServerAvatars || {}),
      ...local,
    }
  } catch {
    return {
      ...DEFAULT_PRODUCER_AVATARS,
      ...(cachedServerAvatars || {}),
    }
  }
}

export function getProducerAvatar(producerName, customMap = null) {
  if (!producerName) return null
  const clean = String(producerName).replace(/👑/g, '').trim().toLowerCase()
  if (!clean) return null

  if (clean.includes('zecution')) {
    return '/media/images/logo.jpg'
  }

  const map = customMap || getProducerAvatars()

  for (const [key, url] of Object.entries(map)) {
    if (key.trim().toLowerCase() === clean && url) {
      return url
    }
  }

  return null
}

export function saveProducerAvatar(producerName, avatarUrl) {
  if (!producerName) return
  const clean = String(producerName).replace(/👑/g, '').trim()
  try {
    const raw = localStorage.getItem(AVATARS_KEY)
    const current = raw ? JSON.parse(raw) : {}
    if (avatarUrl) {
      current[clean] = avatarUrl
    } else {
      delete current[clean]
      delete current[clean.toLowerCase()]
    }
    localStorage.setItem(AVATARS_KEY, JSON.stringify(current))
  } catch (err) {
    console.error('Error saving producer avatar:', err)
  }
}

export function getProducerAliases() {
  try {
    const raw = localStorage.getItem(ALIASES_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function getDeletedProducers() {
  try {
    const raw = localStorage.getItem(DELETED_KEY)
    const local = raw ? JSON.parse(raw) : []
    return Array.from(new Set([...cachedServerDeleted, ...local]))
  } catch {
    return cachedServerDeleted
  }
}

/**
 * Get all known producers from localStorage + defaults
 */
export function getSavedProducers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    const aliases = getProducerAliases()
    const deleted = getDeletedProducers()

    const combined = Array.from(new Set([...DEFAULT_PRODUCERS, ...parsed]))
      .map((p) => aliases[p.toLowerCase()] || p)
      .filter((p) => !deleted.includes(p.toLowerCase()))

    return combined
  } catch {
    return DEFAULT_PRODUCERS
  }
}

/**
 * Save a new producer permanently to localStorage
 */
export function isPermanentPlatformName(producerName = '') {
  if (!producerName) return false
  return String(producerName).trim().toLowerCase().includes('zecution')
}

/**
 * Save a new producer permanently to localStorage
 */
export function saveProducer(name) {
  if (!name || typeof name !== 'string') return
  const clean = name.trim().replace(/👑/g, '').trim()
  if (!clean) return

  try {
    const deleted = getDeletedProducers().filter((d) => d !== clean.toLowerCase())
    cachedServerDeleted = deleted
    localStorage.setItem(DELETED_KEY, JSON.stringify(deleted))

    const current = getSavedProducers()
    const exists = current.some((p) => p.toLowerCase() === clean.toLowerCase())
    if (!exists) {
      const updated = [...current, clean]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    }
  } catch (err) {
    console.error('Error saving producer:', err)
  }
}

/**
 * Update an existing producer name across aliases and saved list
 */
export function updateProducer(oldName, newName) {
  if (!oldName || !newName) return false
  const cleanOld = oldName.trim().replace(/👑/g, '').trim()
  const cleanNew = newName.trim().replace(/👑/g, '').trim()
  if (!cleanNew) return false
  if (isPermanentPlatformName(cleanOld)) return false

  try {
    const aliases = getProducerAliases()
    aliases[cleanOld.toLowerCase()] = cleanNew
    localStorage.setItem(ALIASES_KEY, JSON.stringify(aliases))

    const current = getSavedProducers()
    const updated = current.map((p) => (p.toLowerCase() === cleanOld.toLowerCase() ? cleanNew : p))
    if (!updated.some((p) => p.toLowerCase() === cleanNew.toLowerCase())) {
      updated.push(cleanNew)
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(new Set(updated))))
    return true
  } catch (err) {
    console.error('Error updating producer:', err)
    return false
  }
}

/**
 * Delete a producer from the active list
 */
export function deleteProducer(name) {
  if (!name) return null
  const clean = name.trim().replace(/👑/g, '').trim()
  if (isPermanentPlatformName(clean)) return null

  try {
    const deleted = Array.from(new Set([...getDeletedProducers(), clean.toLowerCase()]))
    cachedServerDeleted = deleted
    localStorage.setItem(DELETED_KEY, JSON.stringify(deleted))

    const current = getSavedProducers()
    const updated = current.filter((p) => p.toLowerCase() !== clean.toLowerCase())
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

    // Clean up local avatar & role
    saveProducerAvatar(clean, '')
    try {
      const rawRoles = localStorage.getItem(ROLES_KEY)
      if (rawRoles) {
        const currentRoles = JSON.parse(rawRoles)
        delete currentRoles[clean]
        delete currentRoles[clean.toLowerCase()]
        localStorage.setItem(ROLES_KEY, JSON.stringify(currentRoles))
      }
    } catch {}

    return deleted
  } catch (err) {
    console.error('Error deleting producer:', err)
    return null
  }
}

/**
 * Combine saved producers with existing contents to always have the latest full list
 */
export function getAllProducers(existingContents = []) {
  const saved = getSavedProducers()
  const aliases = getProducerAliases()
  const deleted = getDeletedProducers()

  const fromContents = Array.isArray(existingContents)
    ? existingContents
        .map((c) => c.producer?.trim())
        .filter(Boolean)
        .map((p) => p.replace(/👑/g, '').trim())
        .map((p) => aliases[p.toLowerCase()] || p)
        .filter((p) => !deleted.includes(p.toLowerCase()))
    : []

  const all = Array.from(new Set([...saved, ...fromContents]))

  // Always ensure 'Zecution Gaming' is first
  const withoutFounder = all.filter((p) => !p.toLowerCase().includes('zecution'))
  return ['Zecution Gaming', ...withoutFounder]
}

/**
 * Check if a producer is Zecution Gaming / Founder
 */
export function isProducerFounder(producerName = '') {
  if (!producerName) return false
  const info = getProducerRoleInfo(producerName)
  return info.key === 'KURUCU'
}

/**
 * Check if a producer is Partner (e.g. Cml Gaming)
 */
export function isProducerPartner(producerName = '') {
  if (!producerName) return false
  const info = getProducerRoleInfo(producerName)
  return info.key === 'PARTNER'
}
