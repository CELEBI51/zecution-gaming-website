import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CarFront,
  Check,
  Download,
  Eye,
  Gamepad2,
  Loader2,
  Map,
  Mountain,
  PackageOpen,
  Puzzle,
  Search,
  Server,
  Truck,
  UploadCloud,
  X,
} from 'lucide-react'
import { api, getMediaUrl } from '../../services/api.js'
import UserNavButton from '../../components/UserNavButton.jsx'
import './ModGallery.css'

const GAME_META = {
  ets2: { shortName: 'ETS2', Icon: Truck, tone: 'amber', defaultImg: '/media/images/game-ets2.jpg' },
  'assetto-corsa': { shortName: 'Assetto Corsa', Icon: Gamepad2, tone: 'violet', defaultImg: '/media/images/game-assetto-corsa.png' },
  beamng: { shortName: 'BeamNG', Icon: Mountain, tone: 'orange', defaultImg: '/media/images/game-beamng.jpg' },
}

const CATEGORY_ICONS = {
  vehicles: CarFront,
  maps: Map,
  servers: Server,
  addons: Puzzle,
}

function ModGallery() {
  const [selectedGame, setSelectedGame] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [games, setGames] = useState([])
  const [categories, setCategories] = useState([])
  const [mods, setMods] = useState([])
  const [loading, setLoading] = useState(true)

  // Arama Durumları
  const [searchQuery, setSearchQuery] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [onlyInCategory, setOnlyInCategory] = useState(true)
  const searchInputRef = useRef(null)
  const searchSectionRef = useRef(null)

  useEffect(() => {
    let isMounted = true

    async function loadGalleryData() {
      try {
        setLoading(true)
        const [gamesData, categoriesData, contentsData] = await Promise.all([
          api.getGames(),
          api.getCategories({ section: 'gallery' }),
          api.getContents({ section: 'gallery', limit: 100 }),
        ])

        if (!isMounted) return

        // Oyunlar
        const mappedGames = gamesData.map((g) => {
          const meta = GAME_META[g.slug] || { shortName: g.name, Icon: Gamepad2, tone: 'violet', defaultImg: '/media/images/logo.jpg' }
          return {
            id: g.slug,
            name: g.name,
            shortName: meta.shortName,
            description: g.description || 'Oyun modları ve içerikleri.',
            image: g.coverImage || meta.defaultImg,
            Icon: meta.Icon,
            tone: meta.tone,
          }
        })
        setGames(mappedGames)

        // Kategoriler
        const mappedCategories = categoriesData.map((c) => ({
          id: c.slug,
          name: c.name,
          description: c.name,
          gameSlug: c.game?.slug || 'assetto-corsa',
          Icon: CATEGORY_ICONS[c.slug] || Puzzle,
          image: c.slug === 'vehicles' ? '/media/images/category-assetto-vehicles.jpg' : c.slug === 'servers' ? '/media/images/category-assetto-servers.jpg' : null,
        }))
        setCategories(mappedCategories)

        // Modlar
        const mappedMods = (contentsData.items || []).map((item) => ({
          id: item.id,
          slug: item.slug || item.id,
          name: item.title,
          producer: item.producer || 'Zecution Gaming',
          description: item.shortDescription || item.description || '',
          game: item.game?.slug || '',
          category: item.category?.slug || '',
          image: getMediaUrl(item.coverImage?.filePath || item.coverImage?.thumbnailPath),
          downloadUrl: item.downloadUrl,
        }))
        setMods(mappedMods)
      } catch (err) {
        console.error('Galeri yükleme hatası:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadGalleryData()

    return () => {
      isMounted = false
    }
  }, [])

  const selectedCategoryObj = categories.find((c) => c.id === selectedCategory)

  const filteredMods = useMemo(() => {
    if (!selectedGame) return []
    const q = appliedSearch.trim().toLowerCase()

    return mods.filter((mod) => {
      const gameMatches = mod.game === selectedGame

      // Eğer seçili kategori varsa ve 'sadece bu kategoride ara' aktifse o kategoriye filtrele
      const categoryMatches =
        selectedGame !== 'assetto-corsa' ||
        !selectedCategory ||
        !onlyInCategory ||
        mod.category === selectedCategory

      let searchMatches = true
      if (q) {
        const titleMatch = (mod.name || '').toLowerCase().includes(q)
        const descMatch = (mod.description || '').toLowerCase().includes(q)
        const producerMatch = (mod.producer || '').toLowerCase().includes(q)
        searchMatches = titleMatch || descMatch || producerMatch
      }

      return gameMatches && categoryMatches && searchMatches
    })
  }, [mods, selectedGame, selectedCategory, onlyInCategory, appliedSearch])

  // Seçili kategoride arama yapıldığında 0 sonuç çıkarsa, diğer kategorilerde eşleşme var mı kontrolü
  const otherCategoryMatches = useMemo(() => {
    if (!appliedSearch.trim() || !selectedCategory || !selectedGame) return []
    const q = appliedSearch.trim().toLowerCase()
    return mods.filter(
      (m) =>
        m.game === selectedGame &&
        m.category !== selectedCategory &&
        ((m.name || '').toLowerCase().includes(q) ||
          (m.description || '').toLowerCase().includes(q) ||
          (m.producer || '').toLowerCase().includes(q))
    )
  }, [mods, appliedSearch, selectedGame, selectedCategory])

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault()
    setAppliedSearch(searchQuery.trim())
    window.requestAnimationFrame(() => {
      document.querySelector('#mod-sonuclari')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setAppliedSearch('')
    searchInputRef.current?.focus()
  }

  const handleHeaderSearchClick = () => {
    if (!selectedGame) {
      setSelectedGame('assetto-corsa')
    }
    window.requestAnimationFrame(() => {
      setTimeout(() => {
        document.querySelector('#mod-sonuclari')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        searchInputRef.current?.focus()
      }, 90)
    })
  }

  const chooseGame = (gameId) => {
    setSelectedGame(gameId)
    setSelectedCategory(null)
    setOnlyInCategory(false)
    window.requestAnimationFrame(() => {
      setTimeout(() => {
        if (gameId === 'assetto-corsa') {
          document.querySelector('#mod-secimi')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } else {
          document.querySelector('#mod-sonuclari')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 60)
    })
  }

  const chooseCategory = (catId) => {
    setSelectedCategory(catId)
    setOnlyInCategory(true)
    window.requestAnimationFrame(() => {
      setTimeout(() => {
        document.querySelector('#mod-sonuclari')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 60)
    })
  }

  const activeGame = games.find((game) => game.id === selectedGame)
  const isWaitingForAssettoType =
    selectedGame === 'assetto-corsa' && !selectedCategory && !appliedSearch.trim()

  return (
    <div className="mods-page">
      <header className="mods-header">
        <a className="mods-brand" href="/" aria-label="Zecution Gaming ana sayfa">
          <img src="/media/images/logo.jpg" alt="Zecution Gaming" />
          <span className="mods-brand__copy">
            <strong>Zecution Gaming</strong>
            <small>Mod Galerisi</small>
          </span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <button
            type="button"
            className="mods-header-search-btn"
            onClick={handleHeaderSearchClick}
            title="Mod Galerisinde Ara"
          >
            <Search size={15} />
            <span>Mod Ara</span>
          </button>
          <a
            className="mods-back"
            href="/mod-yayinla"
            style={{
              background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.25), rgba(168, 85, 247, 0.15))',
              borderColor: 'rgba(168, 85, 247, 0.4)',
              color: '#d8b4fe',
            }}
          >
            <UploadCloud size={16} /> Modunu Yayınla
          </a>
          <UserNavButton />
          <a className="mods-back" href="/">
            <ArrowLeft size={17} /> Ana sayfa
          </a>
        </div>
      </header>

      <main>
        <section className="game-picker" aria-labelledby="game-picker-title">
          <div className="picker-heading">
            <div>
              <span className="step-label">Oyun seçimi</span>
              <h2 id="game-picker-title">Hangi oyunu<br />oynuyorsun?</h2>
            </div>
            <p>Seçimin yalnızca ilgili oyun için yayınlanan modları gösterir.</p>
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '12rem', gap: '0.8rem', color: '#fff9' }}>
              <Loader2 className="animate-spin" size={26} />
              <span>Oyunlar yükleniyor...</span>
            </div>
          ) : (
            <div className="game-grid">
              {games.map(({ id, name, shortName, description, image, Icon, tone }, index) => {
                const isSelected = selectedGame === id
                return (
                  <button
                    key={id}
                    className={`game-card game-card--${tone} ${isSelected ? 'is-selected' : ''}`}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => chooseGame(id)}
                    style={{
                      '--card-delay': `${index * 70}ms`,
                      '--card-image': `url("${image}")`,
                    }}
                  >
                    <span className="game-card__backdrop" aria-hidden="true" />
                    <span className="game-card__top">
                      <span className="game-card__icon"><Icon /></span>
                      <span className="game-card__index">
                        {isSelected ? <Check size={17} /> : `${String(index + 1).padStart(2, '0')} · ${shortName}`}
                      </span>
                    </span>
                    <span className="game-card__bottom">
                      <span>
                        <h3>{name}</h3>
                        <p>{description}</p>
                      </span>
                      <ArrowUpRight className="game-card__arrow" />
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        <section id="mod-secimi" className={`mod-selection ${selectedGame ? 'is-visible' : ''}`}>
          {selectedGame === 'assetto-corsa' && categories.length > 0 && (
            <div className="type-picker">
              <div className="picker-heading picker-heading--compact">
                <div>
                  <span className="step-label">Assetto Corsa</span>
                  <h2>Mod türünü seç.</h2>
                </div>
                <p>İçerik gruplarından birini seçerek sonuçları daralt.</p>
              </div>
              <div className="type-grid">
                {categories.map(({ id, name, description, image, Icon }, index) => {
                  const isSelected = selectedCategory === id
                  return (
                    <button
                      key={id}
                      className={`type-card ${image ? 'has-image' : ''} ${isSelected ? 'is-selected' : ''}`}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => chooseCategory(id)}
                      style={{
                        '--card-delay': `${index * 55}ms`,
                        ...(image ? { '--card-image': `url("${image}")` } : {}),
                      }}
                    >
                      {image && <span className="type-card__backdrop" aria-hidden="true" />}
                      <span className="type-card__icon"><Icon /></span>
                      <h3>{name}</h3>
                      <span>{description}</span>
                      <span className="type-card__check"><Check size={15} /></span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div id="mod-sonuclari" className="results-panel" aria-live="polite">
            <div className="results-heading">
              <div>
                <span className="step-label">Sonuçlar</span>
                <h2>{activeGame?.name || 'Mod Listesi'}</h2>
              </div>
              <span>{filteredMods.length} mod listeleniyor</span>
            </div>

            {/* MOD GALERİSİ KATEGORİ ARAMA PANELİ */}
            <div className="mod-search-wrapper" ref={searchSectionRef}>
              <form className="mod-search-form" onSubmit={handleSearchSubmit}>
                <div className="mod-search-input-wrap">
                  <Search size={18} className="mod-search-icon" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="mod-search-input"
                    placeholder={
                      selectedCategoryObj && onlyInCategory
                        ? `"${selectedCategoryObj.name}" kategorisinde mod ara...`
                        : activeGame
                        ? `${activeGame.name} modları arasında ara...`
                        : 'Mod galerisinde ara (araç, harita, sunucu...)'
                    }
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setAppliedSearch(e.target.value)
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="mod-search-clear-btn"
                      onClick={handleClearSearch}
                      title="Aramayı Temizle"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                {/* SADECE SEÇİLİ KATEGORİDE ARA BUTONU */}
                {selectedCategoryObj && (
                  <button
                    type="button"
                    className={`mod-category-filter-btn ${onlyInCategory ? 'is-active' : ''}`}
                    onClick={() => setOnlyInCategory((prev) => !prev)}
                    title={
                      onlyInCategory
                        ? 'Şu anda yalnızca bu kategoride arama yapılıyor'
                        : 'Şu anda tüm kategorilerde arama yapılıyor'
                    }
                  >
                    <span className="mod-category-filter-indicator" />
                    <span>
                      {onlyInCategory
                        ? `Sadece "${selectedCategoryObj.name}" Kategorisinde Ara`
                        : `Tüm ${activeGame?.name || 'Oyun'} Kategorilerinde Ara`}
                    </span>
                  </button>
                )}

                {/* ARAMA BUTONU */}
                <button type="submit" className="mod-search-submit-btn">
                  <Search size={16} />
                  <span>Ara</span>
                </button>
              </form>

              {/* Hızlı Kategori Filtresi */}
              {selectedGame === 'assetto-corsa' && categories.length > 0 && (
                <div className="mod-search-quick-categories">
                  <span className="mod-quick-cat-label">Kategori:</span>
                  <button
                    type="button"
                    className={`mod-quick-cat-pill ${!selectedCategory ? 'is-active' : ''}`}
                    onClick={() => {
                      setSelectedCategory(null)
                      setOnlyInCategory(false)
                    }}
                  >
                    Tüm Kategoriler
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`mod-quick-cat-pill ${selectedCategory === c.id ? 'is-active' : ''}`}
                      onClick={() => {
                        setSelectedCategory(c.id)
                        setOnlyInCategory(true)
                      }}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Aktif Arama Bilgi Çubuğu */}
              {appliedSearch.trim() && (
                <div className="mod-search-status-bar">
                  <div className="mod-search-status-info">
                    <span>Arama: <strong>"{appliedSearch}"</strong></span>
                    {selectedCategoryObj && onlyInCategory && (
                      <span className="mod-search-category-tag">
                        Kategori: <strong>{selectedCategoryObj.name}</strong>
                      </span>
                    )}
                    <span className="mod-search-count-tag">
                      {filteredMods.length} mod bulundu
                    </span>
                  </div>
                  <button
                    type="button"
                    className="mod-search-reset-link"
                    onClick={handleClearSearch}
                  >
                    Aramayı Temizle <X size={13} />
                  </button>
                </div>
              )}
            </div>

            {isWaitingForAssettoType ? (
              <div className="results-empty">
                <p>Sonuçları görmek için yukarıdan bir mod türü seçin veya arama yapın.</p>
              </div>
            ) : filteredMods.length > 0 ? (
              <div className="mod-grid mods-grid">
                {filteredMods.map((mod) => (
                  <article className="mod-card" key={mod.id}>
                    <Link
                      to={`/modlar/${mod.slug}`}
                      className="mod-card__media"
                      onClick={() => api.trackContentClick(mod.slug)}
                    >
                      <img src={mod.image} alt={mod.name} loading="lazy" />
                      <span className="mod-card__hover-overlay">
                        <Eye size={20} /> Detayları İncele
                      </span>
                    </Link>
                    <div className="mod-card__body">
                      <span className="mod-card__producer">{mod.producer}</span>
                      <h3>
                        <Link
                          to={`/modlar/${mod.slug}`}
                          className="mod-card__title-link"
                          onClick={() => api.trackContentClick(mod.slug)}
                        >
                          {mod.name}
                        </Link>
                      </h3>
                      <p>{mod.description}</p>
                      <div className="mod-card__actions">
                        <Link
                          to={`/modlar/${mod.slug}`}
                          className="mod-card__btn mod-card__btn--detail"
                          onClick={() => api.trackContentClick(mod.slug)}
                        >
                          İncele <ArrowRight size={15} />
                        </Link>
                        {mod.downloadUrl ? (
                          <a
                            className="mod-card__btn mod-card__btn--dl"
                            href={mod.downloadUrl}
                            target="_blank"
                            rel="noreferrer"
                            title="Doğrudan İndir"
                            onClick={() => api.trackContentDownload(mod.slug)}
                          >
                            <Download size={15} />
                          </a>
                        ) : (
                          <a
                            className="mod-card__btn mod-card__btn--contact"
                            href="https://www.instagram.com/zecution_gaming/"
                            target="_blank"
                            rel="noreferrer"
                            title="Özel Talep / İletişim"
                            onClick={() => api.trackContentClick(mod.slug)}
                          >
                            <ArrowUpRight size={15} />
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : appliedSearch.trim() && otherCategoryMatches.length > 0 ? (
              <div className="results-empty">
                <PackageOpen size={36} />
                <h3>"{selectedCategoryObj?.name || 'Seçili kategori'}" kategorisinde sonuç bulunamadı</h3>
                <p>
                  Ancak diğer kategorilerde <strong>"{appliedSearch}"</strong> ile eşleşen {otherCategoryMatches.length} mod bulundu!
                </p>
                <button
                  type="button"
                  className="mod-search-expand-btn"
                  onClick={() => {
                    setOnlyInCategory(false)
                    setSelectedCategory(null)
                  }}
                >
                  Tüm kategorilerdeki sonuçları göster ({otherCategoryMatches.length})
                </button>
              </div>
            ) : (
              <div className="results-empty">
                <PackageOpen size={36} />
                <h3>Bu kriterde mod bulunamadı.</h3>
                <p>
                  {appliedSearch.trim()
                    ? `"${appliedSearch}" araması için mod bulunamadı.`
                    : 'Bu kategoride henüz yayınlanan mod yok. Yeni modlar eklendiğinde burada görüntülenecektir.'}
                </p>
                {appliedSearch.trim() && (
                  <button
                    type="button"
                    className="mod-search-reset-btn"
                    onClick={handleClearSearch}
                  >
                    Aramayı Sıfırla
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="mods-footer">
        <span>© {new Date().getFullYear()} Zecution Gaming</span>
        <a href="https://www.instagram.com/zecution_gaming/" target="_blank" rel="noreferrer">
          Özel mod talebi <ArrowUpRight size={16} />
        </a>
      </footer>
    </div>
  )
}

export default ModGallery
