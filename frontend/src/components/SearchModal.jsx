import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  Box,
  CarFront,
  Clock,
  Layers,
  Loader2,
  MessageCircle,
  Package,
  Search,
  Sparkles,
  TrendingUp,
  UploadCloud,
  Wrench,
  X,
} from 'lucide-react'
import { api, getMediaUrl } from '../services/api.js'
import { GUIDES } from '../data/guidesData.js'
import './SearchModal.css'

const STATIC_SITE_ITEMS = [
  {
    id: 'static-bmw-e36',
    title: 'BMW E36 320i Convertible',
    description: 'Zecution Gaming imzalı Assetto Corsa araç modu ve 3D sahne vitrini.',
    type: 'MOD',
    category: 'Assetto Corsa',
    path: '/#top',
    hash: 'top',
    image: '/media/images/bmw-e36-poster.jpg',
    keywords: ['bmw', 'e36', '320i', 'convertible', 'cabrio', 'assetto corsa', 'vitrin', 'drift', 'araba'],
  },
  {
    id: 'static-mod-gallery',
    title: 'Mod Galerisi',
    description: 'Assetto Corsa, ETS2 ve BeamNG için yayınlanan tüm araç, harita ve sunucu modları.',
    type: 'SAYFA',
    category: 'Tüm Oyunlar',
    path: '/modlar',
    image: '/media/images/category-assetto-vehicles.jpg',
    keywords: ['mod', 'galeri', 'modlar', 'assetto corsa', 'ets2', 'beamng', 'indir', 'araçlar', 'sunucular', 'haritalar'],
  },
  {
    id: 'static-store',
    title: 'Assetto Corsa Mağazası',
    description: 'Özel ücretli modlar, grafik paketleri ve 3D model koleksiyonları.',
    type: 'MAĞAZA',
    category: 'Mağaza',
    path: '/magaza',
    image: '/media/images/game-assetto-corsa.png',
    keywords: ['mağaza', 'store', 'ücretli', 'premium', 'mod', 'grafik', '3d model', 'satın al', 'fiyat'],
  },
  {
    id: 'static-guides',
    title: 'Kurulum ve Ayar Rehberleri Merkezi',
    description: 'Assetto Corsa, Content Manager, CSP ve BeamNG için adım adım kurulum anlatımları.',
    type: 'REHBER',
    category: 'Rehberler',
    path: '/rehberler',
    Icon: BookOpen,
    keywords: ['rehber', 'kurulum', 'ayar', 'content manager', 'csp', 'pure', 'nasıl kurulur', 'video anlatım'],
  },
  ...GUIDES.map((g) => ({
    id: `guide-${g.id}`,
    title: g.title,
    description: g.summary,
    type: 'REHBER',
    category: g.game,
    path: `/rehberler/${g.slug}`,
    Icon: BookOpen,
    keywords: [
      'rehber',
      'kurulum',
      'anlatım',
      g.game.toLowerCase(),
      g.category.toLowerCase(),
      ...(g.highlights || []).map((h) => h.toLowerCase()),
    ],
  })),
  {
    id: 'static-service-model',
    title: '3D Model Hizmeti',
    description: 'Oyun, görselleştirme veya kişisel projeler için sıfırdan 3D modelleme talebi oluştur.',
    type: 'HİZMET',
    category: 'Hizmetler',
    path: '/teklif-al?type=MODEL',
    image: '/media/images/2.png',
    Icon: Box,
    keywords: ['3d model', 'modelleme', 'özel model', 'render', 'görselleştirme', 'teklif al', 'hizmet'],
  },
  {
    id: 'static-service-custom-mod',
    title: 'Kişiye Özel Araç Modu Hizmeti',
    description: 'İstediğin aracı oyuna aktaralım; fizik, model ve ses detaylarını birlikte belirleyelim.',
    type: 'HİZMET',
    category: 'Hizmetler',
    path: '/teklif-al?type=VEHICLE',
    image: '/media/images/1.3-multijet-soyo-daikoku.png',
    Icon: CarFront,
    keywords: ['özel araç modu', 'araç yaptırma', 'kişiye özel mod', 'sipariş', 'fizik', 'ses', 'teklif al'],
  },
  {
    id: 'static-service-setup',
    title: 'Sıfırdan Kurulum Hizmeti',
    description: 'Assetto Corsa, Content Manager, CSP ve grafik paketleri için eksiksiz uzaktan kurulum desteği.',
    type: 'HİZMET',
    category: 'Hizmetler',
    path: '/#hizmetler',
    hash: 'hizmetler',
    image: '/media/images/setup-service.jpg',
    Icon: Wrench,
    keywords: ['sıfırdan kurulum', 'kurulum hizmeti', 'content manager kurulumu', 'csp kurulum', 'destek'],
  },
  {
    id: 'static-quote',
    title: 'Teklif Al / Mod Talebi',
    description: 'Özel 3D model veya araç projeniz için anında fiyat teklifi talep formu oluşturun.',
    type: 'FORM',
    category: 'Başvuru',
    path: '/teklif-al',
    Icon: Clock,
    keywords: ['teklif al', 'fiyat', 'mod siparişi', 'talep formu', 'başvuru', 'fiyat teklifi'],
  },
  {
    id: 'static-mod-submit',
    title: 'Modunu Yayınla (Mod Gönder)',
    description: 'Mod yapımcıları için başvuru formu; modunu Zecution Gaming platformunda oyunculara ulaştır.',
    type: 'FORM',
    category: 'Başvuru',
    path: '/mod-yayinla',
    Icon: UploadCloud,
    keywords: ['modunu yayınla', 'mod gönder', 'geliştirici', 'mod yükle', 'başvuru', 'yapımcı'],
  },
  {
    id: 'static-about',
    title: 'Hakkımızda',
    description: 'Otomobil tutkusunu dijital simülasyon dünyasına taşıyan Zecution Gaming vizyonu.',
    type: 'BÖLÜM',
    category: 'Hakkımızda',
    path: '/#hakkimizda',
    hash: 'hakkimizda',
    image: '/media/images/logo.jpg',
    keywords: ['hakkımızda', 'zecution gaming', 'vizyon', 'kimdir', 'otomobil tutkusu', 'ekip'],
  },
  {
    id: 'static-contact',
    title: 'İletişim & Sosyal Medya',
    description: 'Instagram @zecution_gaming, YouTube, TikTok ve Discord kanallarımız.',
    type: 'İLETİŞİM',
    category: 'İletişim',
    path: '/#iletisim',
    hash: 'iletisim',
    Icon: MessageCircle,
    keywords: ['iletişim', 'instagram', 'discord', 'youtube', 'tiktok', 'sosyal medya', 'bize ulaşın'],
  },
]

const POPULAR_SEARCHES = [
  'BMW E36',
  'Assetto Corsa',
  '3D Model',
  'Kurulum Hizmeti',
  'ETS2',
  'BeamNG',
  'Teklif Al',
  'Mağaza',
]

const TABS = [
  { id: 'all', label: 'Tümü' },
  { id: 'mods', label: 'Modlar' },
  { id: 'store', label: 'Mağaza' },
  { id: 'services', label: 'Hizmetler & Sayfalar' },
]

export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [apiContents, setApiContents] = useState([])
  const [apiGuides, setApiGuides] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const inputRef = useRef(null)
  const listRef = useRef(null)
  const navigate = useNavigate()

  // API içeriklerini ve rehberleri bir defa yükle ve hafızada tut
  useEffect(() => {
    let isMounted = true
    if (!isOpen) return

    async function fetchContents() {
      try {
        setLoading(true)
        const [contentsRes, guidesRes] = await Promise.allSettled([
          api.getContents({ limit: 100 }),
          api.getGuides(),
        ])
        if (!isMounted) return

        if (contentsRes.status === 'fulfilled') {
          const items = contentsRes.value?.items || []
          const formatted = items.map((item) => ({
            id: `api-${item.id}`,
            title: item.title,
            description: item.shortDescription || item.description || '',
            type: item.section === 'store' ? 'MAĞAZA' : 'MOD',
            category: item.category?.name || (item.section === 'store' ? 'Mağaza' : 'Mod Galerisi'),
            gameName: item.game?.name || '',
            path: item.section === 'store' ? `/magaza/${item.slug}` : `/modlar/${item.slug}`,
            image: getMediaUrl(item.coverImage?.filePath || item.coverImage?.thumbnailPath),
            priceLabel: item.priceLabel || (item.price ? `${item.price} ₺` : null),
            producer: item.producer,
            keywords: [
              item.title,
              item.game?.name,
              item.category?.name,
              item.producer,
              item.section === 'store' ? 'mağaza' : 'mod',
            ].filter(Boolean),
          }))
          setApiContents(formatted)
        }

        if (guidesRes.status === 'fulfilled' && Array.isArray(guidesRes.value)) {
          const activeGuides = guidesRes.value.filter((g) => g.isActive !== false)
          const formattedGuides = activeGuides.map((g) => ({
            id: `guide-${g.id || g.slug}`,
            title: g.title,
            description: g.summary,
            type: 'REHBER',
            category: g.game,
            path: `/rehberler/${g.slug}`,
            image: getMediaUrl(g.coverImage || '/media/images/cm-csp-preview.jpg'),
            Icon: BookOpen,
            keywords: [
              'rehber',
              'kurulum',
              'anlatım',
              g.game?.toLowerCase(),
              g.category?.toLowerCase(),
              ...(g.highlights || []).map((h) => h.toLowerCase()),
            ].filter(Boolean),
          }))
          setApiGuides(formattedGuides)
        }
      } catch (err) {
        console.error('Arama içerikleri yüklenemedi:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchContents()

    return () => {
      isMounted = false
    }
  }, [isOpen])

  // Modal açıldığında input'a odaklan ve body scroll'u kilitle
  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
    document.body.style.overflow = 'hidden'
    return () => {
      clearTimeout(timer)
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // ESC ile kapatma
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Tüm havuz: Statik sayfalar/hizmetler + Rehberler + API'den gelen modlar & mağaza ürünleri
  const allPool = useMemo(() => {
    const nonGuideStatic = STATIC_SITE_ITEMS.filter((item) => !item.id.startsWith('guide-'))
    const guidesToUse = apiGuides.length > 0 ? apiGuides : STATIC_SITE_ITEMS.filter((item) => item.id.startsWith('guide-'))
    return [...nonGuideStatic, ...guidesToUse, ...apiContents]
  }, [apiContents, apiGuides])

  // Filtrelenmiş sonuçlar
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase()

    let pool = allPool

    if (activeTab === 'mods') {
      pool = pool.filter((item) => item.type === 'MOD')
    } else if (activeTab === 'store') {
      pool = pool.filter((item) => item.type === 'MAĞAZA')
    } else if (activeTab === 'services') {
      pool = pool.filter((item) => ['HİZMET', 'REHBER', 'FORM', 'SAYFA', 'BÖLÜM', 'İLETİŞİM'].includes(item.type))
    }

    if (!q) {
      return pool.slice(0, 8)
    }

    // Arama puanlaması
    const scored = pool
      .map((item) => {
        let score = 0
        const titleLower = item.title.toLowerCase()
        const descLower = item.description?.toLowerCase() || ''
        const catLower = item.category?.toLowerCase() || ''
        const gameLower = item.gameName?.toLowerCase() || ''
        const producerLower = item.producer?.toLowerCase() || ''

        if (titleLower === q) score += 100
        else if (titleLower.startsWith(q)) score += 60
        else if (titleLower.includes(q)) score += 40

        if (catLower.includes(q)) score += 25
        if (gameLower.includes(q)) score += 25
        if (producerLower.includes(q)) score += 20
        if (descLower.includes(q)) score += 15

        if (item.keywords?.some((k) => k.toLowerCase().includes(q))) {
          score += 20
        }

        return { item, score }
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.item)

    return scored
  }, [allPool, query, activeTab])

  const handleSelectItem = (item) => {
    onClose()
    if (!item?.path) return

    if (item.path.startsWith('/#')) {
      const hashId = item.hash || item.path.replace('/#', '')
      if (window.location.pathname === '/') {
        const el = document.getElementById(hashId)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' })
        } else if (hashId === 'top') {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      } else {
        navigate(`/#${hashId}`)
      }
    } else if (item.path.startsWith('/')) {
      navigate(item.path)
    } else {
      window.location.href = item.path
    }
  }

  // Klavye ok tuşları ile gezinme
  const handleInputKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1 < filteredResults.length ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredResults.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredResults[selectedIndex]) {
        handleSelectItem(filteredResults[selectedIndex])
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="search-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Arama Paneli">
      <div className="search-container" onClick={(e) => e.stopPropagation()}>
        {/* Üst Arama Çubuğu */}
        <div className="search-box">
          <Search className="search-box__icon" size={20} />
          <input
            ref={inputRef}
            type="text"
            className="search-box__input"
            placeholder="İçerik, mod, mağaza veya hizmet ara... (Örn: BMW, Kurulum, 3D Model)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleInputKeyDown}
          />
          {loading && <Loader2 className="search-box__spinner animate-spin" size={18} />}
          {query && !loading && (
            <button
              type="button"
              className="search-box__clear"
              onClick={() => {
                setQuery('')
                setSelectedIndex(0)
                inputRef.current?.focus()
              }}
              title="Aramayı temizle"
              aria-label="Aramayı temizle"
            >
              <X size={16} />
            </button>
          )}
          <kbd className="search-box__kbd">ESC</kbd>
          <button type="button" className="search-box__close" onClick={onClose} aria-label="Kapat">
            <X size={20} />
          </button>
        </div>

        {/* Kategori Filtre Sekmeleri */}
        <div className="search-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`search-tab ${activeTab === tab.id ? 'is-active' : ''}`}
              onClick={() => {
                setActiveTab(tab.id)
                setSelectedIndex(0)
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Boş Arama Durumunda Popüler Aramalar */}
        {!query && (
          <div className="search-suggestions">
            <span className="search-suggestions__title">
              <Sparkles size={14} /> Popüler Aramalar
            </span>
            <div className="search-suggestions__pills">
              {POPULAR_SEARCHES.map((term) => (
                <button
                  key={term}
                  type="button"
                  className="search-suggestion-pill"
                  onClick={() => {
                    setQuery(term)
                    inputRef.current?.focus()
                  }}
                >
                  <TrendingUp size={12} />
                  <span>{term}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Arama Sonuç Listesi */}
        <div className="search-results" ref={listRef}>
          {filteredResults.length > 0 ? (
            <div className="search-results__list">
              <div className="search-results__header">
                <span>{query ? `"${query}" için ${filteredResults.length} sonuç` : 'Öne Çıkan İçerikler'}</span>
                <small>Seçmek için ↑ ↓ ve Enter tuşlarını kullanabilirsiniz</small>
              </div>

              {filteredResults.map((item, idx) => {
                const isSelected = selectedIndex === idx
                const FallbackIcon = item.Icon || Layers

                return (
                  <div
                    key={item.id}
                    className={`search-item ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSelectItem(item)
                    }}
                  >
                    {/* Görsel / İkon */}
                    <div className="search-item__media">
                      {item.image ? (
                        <img src={item.image} alt={item.title} loading="lazy" />
                      ) : (
                        <div className="search-item__icon-wrap">
                          <FallbackIcon size={20} />
                        </div>
                      )}
                    </div>

                    {/* Bilgi */}
                    <div className="search-item__info">
                      <div className="search-item__top">
                        <span className={`search-badge search-badge--${item.type.toLowerCase()}`}>
                          {item.type}
                        </span>
                        {item.gameName && <span className="search-item__meta">{item.gameName}</span>}
                        {item.category && !item.gameName && (
                          <span className="search-item__meta">{item.category}</span>
                        )}
                        {item.priceLabel && (
                          <span className="search-item__price">{item.priceLabel}</span>
                        )}
                      </div>

                      <h4 className="search-item__title">{item.title}</h4>
                      {item.description && (
                        <p className="search-item__desc">{item.description}</p>
                      )}
                    </div>

                    {/* Eylem İkonu */}
                    <div className="search-item__action">
                      <ArrowRight size={17} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="search-empty">
              <Package size={44} className="search-empty__icon" />
              <h3>Sonuç Bulunamadı</h3>
              <p>
                <strong>"{query}"</strong> ile eşleşen bir mod, mağaza ürünü veya hizmet bulunamadı.
              </p>
              <div className="search-empty__hints">
                <span>İpucu: Farklı bir kelimeyle aramayı deneyebilir veya popüler önerilere göz atabilirsiniz.</span>
              </div>
            </div>
          )}
        </div>

        {/* Alt Bilgi Çubuğu */}
        <div className="search-footer">
          <div className="search-footer__keys">
            <span><kbd>↑</kbd> <kbd>↓</kbd> Gezin</span>
            <span><kbd>↵</kbd> Aç</span>
            <span><kbd>ESC</kbd> Kapat</span>
          </div>
          <div className="search-footer__brand">
            <span>Zecution Gaming Global Search</span>
          </div>
        </div>
      </div>
    </div>
  )
}
