import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pause,
  Play,
  ShoppingBag,
} from 'lucide-react'
import { api, getMediaUrl } from '../services/api.js'
import {
  formatStorePrice,
  getPlatformConfig,
  getStorePriceNote,
  sanitizePurchaseOptions,
} from '../utils/purchaseOptions.js'
import './HomeStoreShowcase.css'

const SLIDE_INTERVAL_MS = 7000
const SLIDE_GAP = 28

const formatViewCount = (count) => {
  const num = Number(count) || 0
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
  return String(num)
}

const getItemTimestamp = (item) => {
  const raw = item?.publishedAt || item?.createdAt || item?.updatedAt
  if (!raw) return 0
  const parsed = Date.parse(raw)
  return Number.isFinite(parsed) ? parsed : 0
}

const mapStoreItemToCard = (item, isLatest = false) => {
  const gameSlug = item.game?.slug || 'assetto-corsa'
  const gameName =
    item.game?.name ||
    (gameSlug === 'beamng'
      ? 'BeamNG.drive'
      : gameSlug === 'ets2'
      ? 'Euro Truck Simulator 2'
      : 'Assetto Corsa')

  const rawCover =
    item.coverImage?.filePath ||
    item.coverImage?.thumbnailPath ||
    '/media/images/game-assetto-corsa.png'

  const options = sanitizePurchaseOptions(item.purchaseOptions)
  const uniquePlatforms = []
  const seenKeys = new Set()
  for (const opt of options) {
    const cfg = getPlatformConfig(opt.platform)
    const label = cfg.key === 'custom' ? opt.label : cfg.name
    const dedupeKey = `${cfg.key}:${label}`
    if (!seenKeys.has(dedupeKey)) {
      seenKeys.add(dedupeKey)
      uniquePlatforms.push({
        key: dedupeKey,
        label,
        accent: cfg.accent,
        Icon: cfg.Icon,
      })
    }
  }

  return {
    id: item.id || item.slug,
    slug: item.slug,
    title: item.title,
    gameName,
    gameCode: gameSlug,
    categoryName: item.category?.name || 'Ücretli Mod',
    producer: item.producer || 'Zecution Gaming',
    description:
      item.shortDescription ||
      item.description ||
      'Zecution Gaming mağazasında yayınlanan içerik detaylarını ve satın alma seçeneklerini mağaza sayfasında inceleyebilirsiniz.',
    coverUrl: getMediaUrl(rawCover),
    priceText: formatStorePrice(item),
    priceNote: getStorePriceNote(item),
    views: formatViewCount(item.viewCount || 0),
    platforms: uniquePlatforms.slice(0, 4),
    badgeText: isLatest ? 'Son Eklenen' : null,
  }
}

const FALLBACK_CARD = {
  id: 'fallback-store',
  slug: '',
  title: 'Assetto Corsa Premium Mağazası',
  gameName: 'Assetto Corsa',
  gameCode: 'assetto-corsa',
  categoryName: 'Premium İçerikler',
  producer: 'Zecution Gaming',
  description:
    'Ücretli araç modlarını, özel grafik paketlerini ve yüksek detaylı 3D modelleri keşfetmek için mağaza sayfasına göz atın.',
  coverUrl: '/media/images/game-assetto-corsa.png',
  priceText: 'Mağazayı İncele',
  priceNote: '',
  views: null,
  platforms: [],
  badgeText: 'Premium Vitrin',
}

export default function HomeStoreShowcase() {
  const [storeItems, setStoreItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(true)
  const [containerWidth, setContainerWidth] = useState(0)

  const viewportRef = useRef(null)
  const touchStartXRef = useRef(0)
  const touchEndXRef = useRef(0)

  useEffect(() => {
    let isMounted = true

    api
      .getContents({ section: 'store', limit: 50 })
      .then((res) => {
        if (!isMounted) return
        const rawItems = Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res)
          ? res
          : []

        const validItems = rawItems.filter((item) => item && item.title)
        validItems.sort((a, b) => getItemTimestamp(b) - getItemTimestamp(a))
        setStoreItems(validItems)
        if (validItems.length > 1) {
          setIsTransitionEnabled(false)
          setCurrentIndex(validItems.length)
        } else {
          setCurrentIndex(0)
        }
      })
      .catch(() => {
        if (isMounted) setStoreItems([])
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (loading) return undefined
    const el = viewportRef.current
    if (!el) return undefined

    const updateMetrics = () => {
      const width = el.clientWidth
      if (width > 0) {
        setContainerWidth(width)
      }
    }

    updateMetrics()
    const ro = new ResizeObserver(updateMetrics)
    ro.observe(el)
    window.addEventListener('resize', updateMetrics)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', updateMetrics)
    }
  }, [loading])

  const cards = useMemo(() => {
    if (storeItems.length === 0) return [FALLBACK_CARD]
    return storeItems.map((item, idx) => mapStoreItemToCard(item, idx === 0))
  }, [storeItems])

  const hasMultiple = cards.length > 1

  const displayList = useMemo(() => {
    if (!hasMultiple) return cards
    return [...cards, ...cards, ...cards]
  }, [cards, hasMultiple])

  useEffect(() => {
    if (!isTransitionEnabled) {
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitionEnabled(true)
        })
      })
      return () => cancelAnimationFrame(frame)
    }
    return undefined
  }, [isTransitionEnabled])

  // 7 saniye durup bir sonraki mağaza içeriğine kaydır
  useEffect(() => {
    if (loading || isPaused || !hasMultiple) return undefined

    const total = cards.length
    const timer = setTimeout(() => {
      setIsTransitionEnabled(true)
      setCurrentIndex((prev) => {
        if (prev >= 3 * total - 1) return total
        return prev + 1
      })
    }, SLIDE_INTERVAL_MS)

    return () => clearTimeout(timer)
  }, [currentIndex, isPaused, hasMultiple, cards.length, loading])

  const handleTransitionEnd = (e) => {
    if (e.target !== e.currentTarget || !hasMultiple) return
    const total = cards.length
    if (currentIndex >= 2 * total) {
      setIsTransitionEnabled(false)
      setCurrentIndex((prev) => prev - total)
    } else if (currentIndex < total) {
      setIsTransitionEnabled(false)
      setCurrentIndex((prev) => prev + total)
    }
  }

  const handlePrev = () => {
    if (!hasMultiple) return
    const total = cards.length
    setIsTransitionEnabled(true)
    setCurrentIndex((prev) => (prev <= 0 ? total - 1 : prev - 1))
  }

  const handleNext = () => {
    if (!hasMultiple) return
    const total = cards.length
    setIsTransitionEnabled(true)
    setCurrentIndex((prev) => (prev >= 3 * total - 1 ? total : prev + 1))
  }

  const handleDotClick = (targetIdx) => {
    if (!hasMultiple) return
    const total = cards.length
    setIsTransitionEnabled(true)
    setCurrentIndex(total + targetIdx)
  }

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX
    touchEndXRef.current = e.touches[0].clientX
  }

  const handleTouchMove = (e) => {
    touchEndXRef.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    if (!hasMultiple) return
    const diff = touchStartXRef.current - touchEndXRef.current
    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        handleNext()
      } else {
        handlePrev()
      }
    }
  }

  const activeDotIndex = hasMultiple
    ? ((currentIndex % cards.length) + cards.length) % cards.length
    : 0

  const slideWidth = containerWidth || 0
  const stepDistance = slideWidth + SLIDE_GAP

  return (
    <section id="magaza-vitrin" className="store-showcase-gateway section-pad">
      <div className="mod-gateway-inner">
        {/* Üst Başlık Satırı */}
        <div className="mod-header-row">
          <div className="mod-header-copy">
            <div className="mod-eyebrow store-showcase-eyebrow">
              <ShoppingBag size={15} /> Mağaza Vitrini
            </div>
            <p>
              Ücretli araç modları, özel 3D modeller ve grafik paketleri.
            </p>
          </div>

          <div className="mod-header-actions">
            {hasMultiple && (
              <div className="mod-slider-quick-controls">
                <button
                  type="button"
                  className="mod-control-btn"
                  onClick={handlePrev}
                  title="Önceki Mağaza İçeriği"
                  aria-label="Önceki Mağaza İçeriği"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  className="mod-control-btn"
                  onClick={() => setIsPaused((prev) => !prev)}
                  title={isPaused ? 'Oynat (7s Otomatik)' : 'Durdur'}
                  aria-label={isPaused ? 'Oynat' : 'Durdur'}
                >
                  {isPaused ? <Play size={16} /> : <Pause size={16} />}
                </button>
                <button
                  type="button"
                  className="mod-control-btn"
                  onClick={handleNext}
                  title="Sonraki Mağaza İçeriği"
                  aria-label="Sonraki Mağaza İçeriği"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}

            <a className="mod-all-link" href="/magaza">
              Mağazayı Keşfet{storeItems.length > 0 ? ` (${storeItems.length})` : ''}{' '}
              <ArrowUpRight size={18} />
            </a>
          </div>
        </div>

        {/* Büyük Vitrin Slider -> 7 saniye bekleyip yana kayar, tıklanınca /magaza sayfasına yönlendirir */}
        {loading ? (
          <div className="store-hero-skeleton" aria-hidden="true" />
        ) : (
          <div
            className="store-carousel-container"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="store-carousel-viewport" ref={viewportRef}>
              <div
                className="store-carousel-track"
                onTransitionEnd={handleTransitionEnd}
                style={
                  hasMultiple && slideWidth > 0
                    ? {
                        transform: `translate3d(-${currentIndex * stepDistance}px, 0, 0)`,
                        transition: isTransitionEnabled
                          ? 'transform 0.75s cubic-bezier(0.22, 1, 0.36, 1)'
                          : 'none',
                      }
                    : undefined
                }
              >
                {displayList.map((cardData, index) => (
                  <a
                    key={`${cardData.id}-${index}`}
                    href="/magaza"
                    className="store-hero-card"
                    aria-label={`${cardData.title} - Mağaza sayfasına git`}
                    style={
                      hasMultiple && slideWidth > 0
                        ? {
                            width: `${slideWidth}px`,
                            flex: `0 0 ${slideWidth}px`,
                          }
                        : undefined
                    }
                  >
                    <div className="store-hero-media">
                      {cardData.badgeText && (
                        <span className="store-hero-live-badge">
                          <span className="store-hero-live-dot" aria-hidden="true" />
                          {cardData.badgeText}
                        </span>
                      )}
                      <img
                        src={cardData.coverUrl}
                        alt={cardData.title}
                        className="store-hero-img"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = '/media/images/game-assetto-corsa.png'
                        }}
                      />
                      <div className="store-hero-media-shade" aria-hidden="true" />
                    </div>

                    <div className="store-hero-info">
                      <div className="store-hero-top">
                        <div className="mod-photo-pills">
                          <span
                            className={`mod-photo-pill mod-photo-pill--${
                              cardData.gameCode || 'assetto-corsa'
                            }`}
                          >
                            {cardData.gameName}
                          </span>
                          <span className="mod-photo-pill mod-photo-pill--category">
                            {cardData.categoryName}
                          </span>
                          <span className="mod-photo-pill mod-photo-pill--producer">
                            @{cardData.producer}
                          </span>
                        </div>

                        {cardData.views !== null && (
                          <div className="mod-photo-stats">
                            <span
                              className="mod-photo-stat-item"
                              title={`${cardData.views} görüntülenme`}
                            >
                              <Eye size={14} /> {cardData.views}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="store-hero-body">
                        <h3 className="store-hero-title">{cardData.title}</h3>
                        <p className="store-hero-desc">{cardData.description}</p>
                      </div>

                      <div>
                        <div className="store-hero-meta-box">
                          <div className="store-hero-price-col">
                            <span className="store-hero-price-label">Satın Alma</span>
                            <span className="store-hero-price-value">
                              {cardData.priceText}
                            </span>
                            {cardData.priceNote && (
                              <span className="store-hero-price-note">
                                {cardData.priceNote}
                              </span>
                            )}
                          </div>

                          {cardData.platforms.length > 0 && (
                            <div className="store-hero-platforms">
                              {cardData.platforms.map(
                                ({ key, label, accent, Icon }) => (
                                  <span
                                    key={key}
                                    className="store-hero-platform-chip"
                                    style={{
                                      borderColor: `${accent}55`,
                                    }}
                                  >
                                    <Icon size={13} style={{ color: accent }} />
                                    <span>{label}</span>
                                  </span>
                                )
                              )}
                            </div>
                          )}
                        </div>

                        <div
                          className="store-hero-footer"
                          style={{ marginTop: '1.15rem' }}
                        >
                          <span className="store-hero-cta-btn">
                            Mağazaya Git <ArrowRight size={17} />
                          </span>
                          <span className="store-hero-hint">
                            Tüm mağaza içeriklerini incele <ArrowUpRight size={15} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {hasMultiple && !loading && (
          <div className="store-carousel-dots" role="tablist" aria-label="Mağaza vitrini slaytları">
            {cards.map((card, idx) => (
              <button
                key={card.id}
                type="button"
                className={`store-carousel-dot ${
                  idx === activeDotIndex ? 'is-active' : ''
                }`}
                onClick={() => handleDotClick(idx)}
                aria-label={`${idx + 1}. mağaza içeriği: ${card.title}`}
              />
            ))}
          </div>
        )}

        {/* Alt Bilgilendirme Çubuğu */}
        <div className="mod-bottom-bar">
          <div className="mod-bottom-info">
            <ShoppingBag size={18} />
            <span>
              Kişiye özel araç modu veya özel 3D model mi arıyorsun? Mağazadaki
              hazır paketleri inceleyebilir ya da projen için teklif alabilirsin.
            </span>
          </div>
          <a href="/teklif-al" className="mod-bottom-link">
            Özel Teklif Al <ArrowUpRight size={16} />
          </a>
        </div>
      </div>
    </section>
  )
}
