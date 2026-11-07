import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowUpRight, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { api, getMediaUrl } from '../../services/api.js'
import ContentReviews from '../../components/ContentReviews.jsx'
import CreatorCard from '../../components/CreatorCard.jsx'
import UserNavButton from '../../components/UserNavButton.jsx'
import {
  isProducerFounder,
  setServerDeletedProducers,
  setServerProducerAvatars,
  setServerProducerRoles,
} from '../../services/producers.js'
import {
  formatStorePrice,
  getPlatformConfig,
  getStorePriceNote,
  sanitizePurchaseOptions,
} from '../../utils/purchaseOptions.js'
import './ProductDetail.css'

const DEFAULT_INSTAGRAM = 'https://www.instagram.com/zecution_gaming/'
const DEFAULT_DISCORD = 'https://discord.gg/BsZTzENdAQ'

function ProductDetail() {
  const { slug = 'vw-polo-1-4-tdi' } = useParams()
  const [activeImage, setActiveImage] = useState(0)
  const [product, setProduct] = useState(null)
  const [producerPostCount, setProducerPostCount] = useState(1)
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    async function loadDetail() {
      try {
        setLoading(true)
        setError(null)
        setActiveImage(0)
        const [content, siteSettings, allContentsRes] = await Promise.all([
          api.getContentBySlug(slug),
          api.getSettings().catch(() => ({})),
          api.getContents({ limit: 100 }).catch(() => ({ items: [] })),
        ])
        if (!mounted) return
        if (siteSettings?.producer_avatars) {
          setServerProducerAvatars(siteSettings.producer_avatars)
        }
        if (siteSettings?.producer_roles) {
          setServerProducerRoles(siteSettings.producer_roles)
        }
        if (siteSettings?.deleted_producers) {
          setServerDeletedProducers(siteSettings.deleted_producers)
        }
        setProduct(content)
        setSettings(siteSettings)

        const allItems = allContentsRes?.items || []
        const prodClean = (content?.producer || 'Zecution Gaming')
          .toLowerCase()
          .replace(/👑/g, '')
          .trim()
        const matches = allItems.filter(
          (item) =>
            (item.producer || 'Zecution Gaming').toLowerCase().replace(/👑/g, '').trim() ===
            prodClean
        )
        setProducerPostCount(matches.length > 0 ? matches.length : 1)

        api.trackContentClick(slug)
      } catch (loadError) {
        if (mounted) setError(loadError.message || 'Ürün detayları yüklenemedi.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadDetail()
    return () => { mounted = false }
  }, [slug])

  if (loading) {
    return (
      <div className="product-detail-page product-detail-state">
        <Loader2 className="product-detail-spinner" size={24} />
        <span>Ürün yükleniyor...</span>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="product-detail-page product-detail-state">
        <h2>Ürün bulunamadı</h2>
        <p>{error || 'İstenen ürün mevcut değil veya yayından kaldırılmış.'}</p>
        <a href="/magaza">Mağazaya dön</a>
      </div>
    )
  }

  const mediaItems = product.media?.length
    ? product.media.map((media) => {
        const url = getMediaUrl(media.filePath)
        const thumbnail = getMediaUrl(media.filePath || media.thumbnailPath)
        const isVideo = media.mediaType === 'VIDEO' || /\.(mp4|webm|mov)(\?|$)/i.test(url)
        return { url, thumbnail, isVideo }
      })
    : [{ url: '/media/images/logo.jpg', thumbnail: '/media/images/logo.jpg', isVideo: false }]

  const images = mediaItems.map((m) => m.url)
  const features = product.features || []
  const isFounder = isProducerFounder(product.producer || 'Zecution Gaming')
  const cleanProducer = (product.producer || 'Zecution Gaming').replace(/👑/g, '').trim()
  const instagramUrl = settings.instagram_url || DEFAULT_INSTAGRAM
  const discordUrl = settings.discord_url || DEFAULT_DISCORD
  const priceLabel = formatStorePrice(product)
  const priceNote = getStorePriceNote(product)
  const customPurchaseOptions = sanitizePurchaseOptions(product.purchaseOptions)
  const purchaseOptions =
    customPurchaseOptions.length > 0
      ? customPurchaseOptions
      : [
          {
            id: 'default-instagram',
            platform: 'instagram',
            label: "Instagram'dan iletişime geç",
            url: instagramUrl,
          },
          {
            id: 'default-discord',
            platform: 'discord',
            label: 'Discord sunucusu',
            url: discordUrl,
          },
        ]
  const gameName = product.game?.name || 'Assetto Corsa'
  const categoryName = product.category?.name || 'Ücretli araç modları'
  const shortDescription = product.shortDescription || product.description || ''
  const description = product.description || product.shortDescription || ''

  const showPrevious = () => setActiveImage((current) => (current === 0 ? images.length - 1 : current - 1))
  const showNext = () => setActiveImage((current) => (current === images.length - 1 ? 0 : current + 1))

  return (
    <div className="product-detail-page">
      <header className="product-detail-header">
        <a className="product-detail-brand" href="/">
          <img src="/media/images/logo.jpg" alt="Zecution Gaming" />
          <span>Zecution Gaming</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <UserNavButton />
          <a className="product-detail-back" href="/magaza">← Mağazaya dön</a>
        </div>
      </header>

      <main className="product-detail-content">
        <nav className="product-breadcrumb" aria-label="Sayfa yolu">
          <a href="/magaza">Mağaza</a><span>/</span><span>{categoryName}</span>
        </nav>

        <section className="product-heading">
          <h1>{product.title}</h1>
          {shortDescription && <div className="product-lead">{shortDescription}</div>}
          <div className="product-meta">
            <span>Yapımcı <strong>{cleanProducer} {isFounder && '👑'}</strong></span>
            <span>Görsel <strong>{images.length}</strong></span>
          </div>
        </section>

        <section className="product-showcase">
          <div className="product-gallery">
            <div className="gallery-stage">
              {mediaItems[activeImage]?.isVideo ? (
                <video
                  key={mediaItems[activeImage].url}
                  src={mediaItems[activeImage].url}
                  poster={mediaItems[activeImage].thumbnail}
                  controls
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <img key={images[activeImage]} src={images[activeImage]} alt={`${product.title} görünüm ${activeImage + 1}`} />
              )}
              <span className="gallery-counter">{String(activeImage + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}</span>
              {images.length > 1 && (
                <div className="gallery-controls">
                  <button type="button" onClick={showPrevious} aria-label="Önceki görsel"><ChevronLeft size={21} /></button>
                  <button type="button" onClick={showNext} aria-label="Sonraki görsel"><ChevronRight size={21} /></button>
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="gallery-thumbnails">
                {mediaItems.map((item, index) => (
                  <button
                    key={`${item.url}-${index}`}
                    type="button"
                    className={activeImage === index ? 'is-active' : ''}
                    aria-label={`${index + 1}. medyayı göster`}
                    onClick={() => setActiveImage(index)}
                  >
                    <img src={item.thumbnail} alt="" loading="lazy" />
                    <span>{item.isVideo ? 'VIDEO' : String(index + 1).padStart(2, '0')}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="product-detail-sidebar">
            <aside className="product-order-panel">
              <span className="product-order-category">{categoryName}</span>
              <h2>{product.title}</h2>
              <p>{shortDescription}</p>
              <div className="product-price">
                <small>Satın alma</small>
                <strong>{priceLabel}</strong>
                {priceNote && <span className="product-price-note">{priceNote}</span>}
              </div>
              <div className="product-purchase-options">
                {purchaseOptions.map((opt, idx) => {
                  const cfg = getPlatformConfig(opt.platform)
                  const PlatIcon = cfg.Icon
                  const isPrimary = idx === 0
                  return (
                    <a
                      key={opt.id || `${opt.platform}-${idx}`}
                      className={`product-purchase-btn ${isPrimary ? 'is-primary' : 'is-secondary'}`}
                      style={{ '--option-accent': cfg.accent }}
                      href={opt.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="product-purchase-btn__icon">
                        <PlatIcon size={17} />
                      </span>
                      <span className="product-purchase-btn__copy">
                        <strong>{opt.label}</strong>
                        {opt.note && <small>{opt.note}</small>}
                      </span>
                      <ArrowUpRight size={16} className="product-purchase-btn__arrow" />
                    </a>
                  )
                })}
              </div>
            </aside>

            <div className="product-producer-card-wrap">
              <CreatorCard
                name={product.producer || 'Zecution Gaming'}
                posts={isFounder ? Math.max(producerPostCount, 12) : producerPostCount}
                joinYear="2024"
                actionText={isFounder ? 'Kurulum Hizmeti İste' : 'Yapımcının Diğer Modları'}
                actionHref={isFounder ? instagramUrl : `/modlar?search=${encodeURIComponent(cleanProducer)}`}
              />
            </div>
          </div>
        </section>

        <section className="product-information">
          <article className="product-description">
            <h2>Açıklama</h2>
            <p>{description}</p>
          </article>

          <article className="product-features">
            <h2>Özellikler</h2>
            {features.length > 0 ? (
              <dl>
                {features.map((feature) => (
                  <div key={feature.id || feature.label}>
                    <dt>{feature.label}</dt>
                    <dd>{feature.value}</dd>
                  </div>
                ))}
              </dl>
            ) : <p>Bu ürün için özellik bilgisi henüz eklenmedi.</p>}
          </article>
        </section>

        {/* Değerlendirme ve Yorum Yapma Kısmı */}
        <ContentReviews slug={product.slug} contentTitle={product.title} />
      </main>

      <footer className="product-detail-footer">
        <span>© {new Date().getFullYear()} Zecution Gaming</span>
        <a href="/magaza">Mağazaya dön</a>
      </footer>
    </div>
  )
}

export default ProductDetail
