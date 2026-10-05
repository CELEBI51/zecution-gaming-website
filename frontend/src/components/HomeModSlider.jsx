import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  CarFront,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pause,
  Play,
  Sparkles,
} from 'lucide-react'
import { api, getMediaUrl } from '../services/api.js'
import { DEFAULT_MODS, MOD_CATEGORIES } from '../data/modsData.js'

const formatViewCount = (count) => {
  const num = Number(count) || 0
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
  return String(num)
}

const getSubcategoryName = (mod) => {
  if (mod.slug === 'real-monaco' || mod.category?.toLowerCase().includes('harita')) {
    return 'Harita Modu'
  }
  if (mod.category?.toLowerCase().includes('araç') || mod.category?.toLowerCase().includes('arac')) {
    return 'Araç Modu'
  }
  return mod.category || 'Araç Modu'
}

export default function HomeModSlider() {
  const [mods, setMods] = useState(DEFAULT_MODS)
  const [selectedCategory, setSelectedCategory] = useState('Tümü')
  const [isPaused, setIsPaused] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(true)
  const [cardsPerView, setCardsPerView] = useState(3)
  const [containerWidth, setContainerWidth] = useState(0)

  const viewportRef = useRef(null)
  const touchStartXRef = useRef(0)
  const touchEndXRef = useRef(0)
  const gap = 24 // 24px gap between cards

  // Fetch real database mods
  useEffect(() => {
    let isMounted = true

    api.getContents({ section: 'gallery', limit: 100 })
      .then((res) => {
        if (!isMounted) return
        const rawApiItems = (Array.isArray(res?.items) ? res.items : []).filter(
          (item) => item.title && !['jhfkjh', 'sfas'].includes(item.title)
        )

        if (rawApiItems.length > 0) {
          const TAG_MAP = {
            'honda-s2000-ap2-v2': ['Warex Egzoz', 'VTEC', 'AP2 V2', 'JDM'],
            'real-monaco': ['Monaco GP', 'Gezinti Pisti', 'Cadde & Şehir', 'Harita'],
            'tofas-doganslx-ankara-isi': ['Doğan SLX', 'Ankara İşi', 'Basık', 'Cadde'],
            'bmw-e36-320i-convertible-1997': ['E36 Cabrio', 'M50B20', 'BBS RS', 'Drift & Cadde'],
            'cingan-gasa-ford-transit-minibus': ['Ford Transit', 'Çingene Kasa', 'Minibüs', 'Dolmuş'],
            'tofas-dogans-atmosferik-adana-isi': ['Doğan S', 'Adana İşi', 'Mangels Jant', 'Atmosferik'],
            'fiat-linea-eski-kasa-2009-bedelinea': ['Bedelinea', '2009 Linea', 'Birebir Model', 'Cadde'],
            'fiat-linea-2014-13-multijet': ['1.3 Multijet', '34 JZ 1417', 'JZ Linea', 'Dizel Turbo'],
          }

          const mappedApiMods = rawApiItems.map((item) => {
            const gameSlug = item.game?.slug || 'assetto-corsa'
            const gameName =
              item.game?.name ||
              (gameSlug === 'beamng'
                ? 'BeamNG.drive'
                : gameSlug === 'ets2'
                ? 'Euro Truck Simulator 2'
                : 'Assetto Corsa')

            const customTags = TAG_MAP[item.slug] || (item.features?.map((f) => f.value).slice(0, 4)) || ['Assetto Corsa', 'Zecution']
            const realViews = formatViewCount(item.viewCount || 0)

            return {
              id: item.id,
              slug: item.slug || item.id,
              name: item.title,
              game: gameName,
              gameCode: gameSlug,
              category: item.category?.name || 'Araç Modları',
              producer: item.producer || 'Zecution Gaming',
              image: getMediaUrl(
                item.coverImage?.filePath ||
                  item.coverImage?.thumbnailPath ||
                  '/media/images/logo.jpg'
              ),
              description: item.shortDescription || item.description || '',
              tags: customTags,
              downloads: item.downloadCount
                ? `${item.downloadCount} İndirme`
                : 'Ücretsiz İndir',
              badge: item.slug === 'real-monaco' ? 'Harita Modu' : item.isFeatured ? 'Öne Çıkan' : 'Popüler',
              downloadUrl: item.downloadUrl,
              views: realViews,
              comments: 0,
            }
          })

          // Variety ordering for authentic mods
          const customVarietyOrder = [
            'honda-s2000-ap2-v2',
            'real-monaco',
            'tofas-doganslx-ankara-isi',
            'bmw-e36-320i-convertible-1997',
            'cingan-gasa-ford-transit-minibus',
            'tofas-dogans-atmosferik-adana-isi',
            'fiat-linea-eski-kasa-2009-bedelinea',
            'fiat-linea-2014-13-multijet',
          ]

          const sortedMods = [...mappedApiMods].sort((a, b) => {
            const idxA = customVarietyOrder.indexOf(a.slug)
            const idxB = customVarietyOrder.indexOf(b.slug)
            if (idxA !== -1 && idxB !== -1) return idxA - idxB
            if (idxA !== -1) return -1
            if (idxB !== -1) return 1
            return 0
          })

          setMods(sortedMods)
        }
      })
      .catch(() => {
        // Fallback to DEFAULT_MODS
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Responsive calculation for cards per view and container width
  useEffect(() => {
    const updateMetrics = () => {
      if (!viewportRef.current) return
      const width = viewportRef.current.clientWidth
      if (width > 0) {
        setContainerWidth(width)
        if (width < 640) {
          setCardsPerView(1)
        } else if (width < 1024) {
          setCardsPerView(2)
        } else {
          setCardsPerView(3)
        }
      }
    }

    updateMetrics()
    const ro = new ResizeObserver(updateMetrics)
    if (viewportRef.current) ro.observe(viewportRef.current)
    window.addEventListener('resize', updateMetrics)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', updateMetrics)
    }
  }, [])

  // Filter mods by selected category
  const filteredMods = useMemo(() => {
    return mods.filter((mod) => {
      if (selectedCategory === 'Tümü') return true
      if (selectedCategory === 'Assetto Corsa') {
        return (
          mod.gameCode === 'assetto-corsa' ||
          mod.game?.toLowerCase().includes('assetto')
        )
      }
      if (selectedCategory === 'BeamNG.drive') {
        return (
          mod.gameCode === 'beamng' ||
          mod.game?.toLowerCase().includes('beamng')
        )
      }
      if (
        selectedCategory === 'Euro Truck Simulator 2' ||
        selectedCategory === 'ETS2'
      ) {
        return (
          mod.gameCode === 'ets2' ||
          mod.game?.toLowerCase().includes('truck') ||
          mod.game?.toLowerCase().includes('ets')
        )
      }
      if (
        selectedCategory === 'Harita Modları' ||
        selectedCategory === 'Harita & Pist'
      ) {
        return (
          mod.category?.toLowerCase().includes('harita') ||
          mod.category?.toLowerCase().includes('pist') ||
          mod.tags?.some((t) =>
            t.toLowerCase().match(/(harita|pist|shuto|daikoku|rota|monaco)/)
          )
        )
      }
      return true
    })
  }, [mods, selectedCategory])

  // Ensure baseList has enough items for 3-card sliding
  const baseList = useMemo(() => {
    if (filteredMods.length === 0) return []
    let list = [...filteredMods]
    while (list.length < 4) {
      list = list.concat(filteredMods)
    }
    return list
  }, [filteredMods])

  // Triplicated list for seamless infinite wrap
  const displayList = useMemo(() => {
    if (baseList.length === 0) return []
    return [...baseList, ...baseList, ...baseList]
  }, [baseList])

  // Reset starting position to middle block when category or list changes
  useEffect(() => {
    if (baseList.length > 0) {
      setIsTransitionEnabled(false)
      setCurrentIndex(baseList.length)
    }
  }, [selectedCategory, baseList.length])

  // Calculate card width and step distance
  const cardWidth = useMemo(() => {
    const width = containerWidth || 1200
    return Math.floor((width - (cardsPerView - 1) * gap) / cardsPerView)
  }, [containerWidth, cardsPerView, gap])

  const stepDistance = cardWidth + gap

  // 3-second pause, then slide 1 card
  useEffect(() => {
    if (isPaused || isHovered || baseList.length === 0) return

    const timer = setTimeout(() => {
      setIsTransitionEnabled(true)
      setCurrentIndex((prev) => prev + 1)
    }, 3000)

    return () => clearTimeout(timer)
  }, [currentIndex, isPaused, isHovered, baseList.length])

  // Seamless jump on transition end
  const handleTransitionEnd = () => {
    const N = baseList.length
    if (N === 0) return

    if (currentIndex >= 2 * N) {
      setIsTransitionEnabled(false)
      setCurrentIndex((prev) => prev - N)
    } else if (currentIndex < N) {
      setIsTransitionEnabled(false)
      setCurrentIndex((prev) => prev + N)
    }
  }

  // Restore transition capability on next frame after invisible jump
  useEffect(() => {
    if (!isTransitionEnabled) {
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitionEnabled(true)
        })
      })
      return () => cancelAnimationFrame(frame)
    }
  }, [isTransitionEnabled])

  // Navigation handlers
  const handlePrev = () => {
    setIsTransitionEnabled(true)
    setCurrentIndex((prev) => prev - 1)
  }

  const handleNext = () => {
    setIsTransitionEnabled(true)
    setCurrentIndex((prev) => prev + 1)
  }

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX
  }

  const handleTouchMove = (e) => {
    touchEndXRef.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    const diff = touchStartXRef.current - touchEndXRef.current
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNext()
      } else {
        handlePrev()
      }
    }
  }

  return (
    <section id="mod-galerisi" className="mod-gateway section-pad">
      <div className="mod-gateway-inner">
        {/* Header Row */}
        <div className="mod-header-row">
          <div className="mod-header-copy">
            <div className="mod-eyebrow">
              <CarFront size={14} /> Mod Galerisi
            </div>
            <h2>Öne Çıkan Modlar</h2>
            <p>
              Assetto Corsa, BeamNG ve ETS2 için en güncel araç ve harita modları.
            </p>
          </div>

          <div className="mod-header-actions">
            <div className="mod-slider-quick-controls">
              <button
                type="button"
                className="mod-control-btn"
                onClick={handlePrev}
                title="Önceki Mod"
                aria-label="Önceki Mod"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                className="mod-control-btn"
                onClick={() => setIsPaused((prev) => !prev)}
                title={isPaused ? 'Oynat (3s Otomatik)' : 'Durdur'}
                aria-label={isPaused ? 'Oynat' : 'Durdur'}
              >
                {isPaused ? <Play size={16} /> : <Pause size={16} />}
              </button>
              <button
                type="button"
                className="mod-control-btn"
                onClick={handleNext}
                title="Sonraki Mod"
                aria-label="Sonraki Mod"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <a className="mod-all-link" href="/modlar">
              Tüm Modları Keşfet ({filteredMods.length}){' '}
              <ArrowUpRight size={18} />
            </a>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="mod-home-filters">
          {MOD_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`mod-home-filter-btn ${
                selectedCategory === cat ? 'is-active' : ''
              }`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 3-Card Landscape Carousel (Wait 3s, then slide 1 card) */}
        <div
          className="mod-carousel-container"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="mod-carousel-viewport" ref={viewportRef}>
            <div
              className="mod-carousel-track"
              onTransitionEnd={handleTransitionEnd}
              style={{
                transform: `translate3d(-${currentIndex * stepDistance}px, 0, 0)`,
                transition: isTransitionEnabled
                  ? 'transform 0.65s cubic-bezier(0.22, 1, 0.36, 1)'
                  : 'none',
              }}
            >
              {displayList.map((mod, index) => (
                <a
                  key={`${mod.id || mod.slug}-${index}`}
                  href={`/modlar/${mod.slug}`}
                  className="mod-photo-card"
                  style={{
                    width: `${cardWidth}px`,
                    flex: `0 0 ${cardWidth}px`,
                  }}
                >
                  {/* 1. Kapak Görseli (Üstte, tamamen açık ve hiçbir şey kapatmıyor) */}
                  <div className="mod-photo-media" aria-hidden="true">
                    <img
                      src={mod.image}
                      alt={mod.name}
                      className="mod-photo-img"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = '/media/images/logo.jpg'
                      }}
                    />
                    <div className="mod-photo-media-overlay" />
                  </div>

                  {/* 2. Başlık ve Bilgi Alanı (Kapağın altında ayrı uzanıyor) */}
                  <div className="mod-photo-info">
                    {/* Üst Bilgi: Etiketler & İstatistikler */}
                    <div className="mod-photo-info-top">
                      <div className="mod-photo-pills">
                        <span
                          className={`mod-photo-pill mod-photo-pill--${
                            mod.gameCode || 'assetto-corsa'
                          }`}
                        >
                          {mod.game}
                        </span>
                        <span
                          className={`mod-photo-pill mod-photo-pill--category ${
                            getSubcategoryName(mod) === 'Harita Modu'
                              ? 'mod-photo-pill--category-map'
                              : ''
                          }`}
                        >
                          {getSubcategoryName(mod)}
                        </span>
                        <span className="mod-photo-pill mod-photo-pill--producer">
                          @{mod.producer || 'Zecution'}
                        </span>
                      </div>
                      <div className="mod-photo-stats">
                        <span
                          className="mod-photo-stat-item"
                          title={`${mod.views ?? 0} görüntülenme`}
                        >
                          <Eye size={13} /> {mod.views ?? 0}
                        </span>
                      </div>
                    </div>

                    {/* Alt Bilgi: Başlık & Aksiyon Butonu */}
                    <div className="mod-photo-info-bottom">
                      <h3 className="mod-photo-title" title={mod.name}>
                        {mod.name}
                      </h3>
                      <span
                        className="mod-photo-action-btn"
                        aria-hidden="true"
                        title="Modu İncele"
                      >
                        <ArrowRight size={15} />
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="mod-bottom-bar">
          <div className="mod-bottom-info">
            <Sparkles size={18} />
            <span>
              Kendi geliştirdiğin veya toplulukla paylaşmak istediğin bir mod mu
              var? Modunu gönder, Zecution vitrininde binlerce oyuncuyla
              buluştur.
            </span>
          </div>
          <a href="/mod-gonder" className="mod-bottom-link">
            Mod Gönder <ArrowUpRight size={16} />
          </a>
        </div>
      </div>
    </section>
  )
}
