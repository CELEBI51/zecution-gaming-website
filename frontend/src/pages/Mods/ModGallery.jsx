import { useEffect, useMemo, useState } from 'react'
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
  Server,
  Truck,
} from 'lucide-react'
import { api, getMediaUrl } from '../../services/api.js'
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
          image: getMediaUrl(item.coverImage?.thumbnailPath || item.coverImage?.filePath),
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

  const filteredMods = useMemo(() => {
    if (!selectedGame) return []
    return mods.filter((mod) => {
      const gameMatches = mod.game === selectedGame
      const categoryMatches =
        selectedGame !== 'assetto-corsa' || !selectedCategory || mod.category === selectedCategory
      return gameMatches && categoryMatches
    })
  }, [mods, selectedGame, selectedCategory])

  const chooseGame = (gameId) => {
    setSelectedGame(gameId)
    setSelectedCategory(null)
    window.requestAnimationFrame(() => {
      document.querySelector('#mod-secimi')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const activeGame = games.find((game) => game.id === selectedGame)
  const isWaitingForAssettoType = selectedGame === 'assetto-corsa' && !selectedCategory

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
        <a className="mods-back" href="/">
          <ArrowLeft size={17} /> Ana sayfa
        </a>
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
                      onClick={() => setSelectedCategory(id)}
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

          <div className="results-panel" aria-live="polite">
            <div className="results-heading">
              <div>
                <span className="step-label">Sonuçlar</span>
                <h2>{activeGame?.name || 'Mod Listesi'}</h2>
              </div>
              <span>{filteredMods.length} mod listeleniyor</span>
            </div>

            {isWaitingForAssettoType ? (
              <div className="results-empty">
                <p>Sonuçları görmek için yukarıdan bir mod türü seçin.</p>
              </div>
            ) : filteredMods.length > 0 ? (
              <div className="mod-grid">
                {filteredMods.map((mod) => (
                  <article className="mod-card" key={mod.id}>
                    <Link to={`/modlar/${mod.slug}`} className="mod-card__media">
                      <img src={mod.image} alt={mod.name} loading="lazy" />
                      <span className="mod-card__hover-overlay">
                        <Eye size={20} /> Detayları İncele
                      </span>
                    </Link>
                    <div className="mod-card__body">
                      <span className="mod-card__producer">{mod.producer}</span>
                      <h3>
                        <Link to={`/modlar/${mod.slug}`} className="mod-card__title-link">
                          {mod.name}
                        </Link>
                      </h3>
                      <p>{mod.description}</p>
                      <div className="mod-card__actions">
                        <Link
                          to={`/modlar/${mod.slug}`}
                          className="mod-card__btn mod-card__btn--detail"
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
                          >
                            <ArrowUpRight size={15} />
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="results-empty">
                <PackageOpen size={36} />
                <h3>Bu kategoride henüz yayınlanan mod yok.</h3>
                <p>Yeni modlar eklendiğinde burada görüntülenecektir.</p>
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
