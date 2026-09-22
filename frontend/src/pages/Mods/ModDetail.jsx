import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { api, getMediaUrl } from '../../services/api.js'
import './ModDetail.css'

const DEFAULT_INSTAGRAM = 'https://www.instagram.com/zecution_gaming/'
const DEFAULT_DISCORD = 'https://discord.gg/BsZTzENdAQ'

export default function ModDetail() {
  const { slug } = useParams()
  const [mod, setMod] = useState(null)
  const [relatedMods, setRelatedMods] = useState([])
  const [settings, setSettings] = useState({})
  const [activeImage, setActiveImage] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    async function loadModDetail() {
      try {
        setLoading(true)
        setError(null)
        setActiveImage(0)

        const [modData, settingsData] = await Promise.all([
          api.getContentBySlug(slug),
          api.getSettings().catch(() => ({})),
        ])

        if (!mounted) return
        setMod(modData)
        setSettings(settingsData)

        if (modData?.game?.slug) {
          try {
            const result = await api.getContents({ section: 'gallery', game: modData.game.slug, limit: 4 })
            if (mounted) setRelatedMods((result.items || []).filter((item) => item.slug !== slug).slice(0, 3))
          } catch {
            if (mounted) setRelatedMods([])
          }
        }
      } catch (loadError) {
        if (mounted) setError(loadError.message || 'Mod detayları yüklenemedi.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadModDetail()
    window.scrollTo({ top: 0 })
    return () => { mounted = false }
  }, [slug])

  const mediaItems = useMemo(() => {
    if (!mod?.media?.length) return [{ url: '/media/images/logo.jpg', thumbnail: '/media/images/logo.jpg', isVideo: false }]
    return mod.media.map((item) => {
      const url = getMediaUrl(item.filePath)
      const thumbnail = getMediaUrl(item.thumbnailPath || item.filePath)
      const isVideo = item.mediaType === 'VIDEO' || /\.(mp4|webm|mov)(\?|$)/i.test(url)
      return { url, thumbnail, isVideo }
    })
  }, [mod?.media])

  const images = useMemo(() => mediaItems.map((m) => m.url), [mediaItems])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsLightboxOpen(false)
      if (images.length <= 1) return
      if (event.key === 'ArrowLeft') setActiveImage((current) => (current === 0 ? images.length - 1 : current - 1))
      if (event.key === 'ArrowRight') setActiveImage((current) => (current === images.length - 1 ? 0 : current + 1))
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [images.length])

  if (loading) {
    return <div className="mod-detail-state"><Loader2 className="mod-detail-spinner" size={25} /><span>Mod yükleniyor...</span></div>
  }

  if (error || !mod) {
    return <div className="mod-detail-state"><h1>Mod bulunamadı</h1><p>{error || 'İstenen içerik mevcut değil.'}</p><Link to="/modlar">Galeriye dön</Link></div>
  }

  const instagramUrl = settings.instagram_url || DEFAULT_INSTAGRAM
  const discordUrl = settings.discord_url || DEFAULT_DISCORD
  const features = mod.features || []
  const gameName = mod.game?.name || 'Oyun modu'
  const categoryName = mod.category?.name || 'Mod galerisi'
  const description = mod.description || mod.shortDescription || ''
  const showPrevious = () => setActiveImage((current) => (current === 0 ? images.length - 1 : current - 1))
  const showNext = () => setActiveImage((current) => (current === images.length - 1 ? 0 : current + 1))

  return (
    <div className="mod-detail-page">
      <header className="mod-detail-header">
        <Link className="mod-detail-brand" to="/"><img src="/media/images/logo.jpg" alt="Zecution Gaming" /><span>Zecution Gaming</span></Link>
        <Link className="mod-detail-back" to="/modlar">← Mod galerisine dön</Link>
      </header>

      <main className="mod-detail-content">
        <nav className="mod-detail-breadcrumb"><Link to="/modlar">Mod galerisi</Link><span>/</span><span>{categoryName}</span></nav>

        <section className="mod-detail-heading">
          <h1>{mod.title}</h1>
          {mod.shortDescription && <div className="mod-detail-lead">{mod.shortDescription}</div>}
          <div className="mod-detail-meta">
            <span>Yapımcı <strong>{mod.producer || 'Zecution Gaming'}</strong></span>
            <span>Görsel <strong>{images.length}</strong></span>
          </div>
        </section>

        <section className="mod-detail-showcase">
          <div className="mod-detail-gallery">
            <div className="mod-gallery-stage">
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
                <button className="mod-gallery-image" type="button" onClick={() => setIsLightboxOpen(true)} aria-label="Görseli tam ekranda aç">
                  <img key={images[activeImage]} src={images[activeImage]} alt={`${mod.title} görünüm ${activeImage + 1}`} />
                </button>
              )}
              <span className="mod-gallery-counter">{String(activeImage + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}</span>
              {images.length > 1 && <div className="mod-gallery-controls"><button type="button" onClick={showPrevious} aria-label="Önceki görsel"><ChevronLeft size={21} /></button><button type="button" onClick={showNext} aria-label="Sonraki görsel"><ChevronRight size={21} /></button></div>}
            </div>

            {images.length > 1 && (
              <div className="mod-gallery-thumbnails">
                {mediaItems.map((item, index) => (
                  <button key={`${item.url}-${index}`} type="button" className={activeImage === index ? 'is-active' : ''} onClick={() => setActiveImage(index)} aria-label={`${index + 1}. medyayı göster`}>
                    <img src={item.thumbnail} alt="" loading="lazy" />
                    <span>{item.isVideo ? 'VIDEO' : String(index + 1).padStart(2, '0')}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <aside className="mod-download-panel">
            <span className="mod-panel-category">{categoryName}</span>
            <h2>{mod.title}</h2>
            <p>{mod.shortDescription || description}</p>
            {mod.downloadUrl ? <a className="mod-primary-action" href={mod.downloadUrl} target="_blank" rel="noreferrer">Modu indir</a> : <a className="mod-primary-action" href={instagramUrl} target="_blank" rel="noreferrer">Instagram'dan iletişime geç</a>}
            <a className="mod-secondary-action" href={discordUrl} target="_blank" rel="noreferrer">Discord sunucusu</a>
          </aside>
        </section>

        <section className="mod-detail-information">
          <article className="mod-description-block">
            <h2>Açıklama</h2>
            <div className="mod-description-copy">
              {description.split('\n').filter(Boolean).map((paragraph, index) => <p key={`${paragraph}-${index}`}>{paragraph}</p>)}
            </div>
          </article>

          <article className="mod-features-block">
            <h2>Özellikler</h2>
            {features.length > 0 ? <dl>{features.map((feature) => <div key={feature.id || feature.label}><dt>{feature.label}</dt><dd>{feature.value}</dd></div>)}</dl> : <p>Bu mod için özellik bilgisi henüz eklenmedi.</p>}
          </article>
        </section>

        {relatedMods.length > 0 && (
          <section className="mod-related-section">
            <div className="mod-related-heading"><h2>Diğer modlar</h2></div>
            <div className="mod-related-grid">
              {relatedMods.map((item) => (
                <Link key={item.id} to={`/modlar/${item.slug}`} className="mod-related-card">
                  <img src={getMediaUrl(item.coverImage?.thumbnailPath || item.coverImage?.filePath)} alt={item.title} loading="lazy" />
                  <div><small>{item.game?.name || gameName}</small><h3>{item.title}</h3></div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="mod-detail-footer"><span>© {new Date().getFullYear()} Zecution Gaming</span><Link to="/modlar">Mod galerisi</Link></footer>

      {isLightboxOpen && (
        <div className="mod-lightbox" role="dialog" aria-modal="true" onClick={() => setIsLightboxOpen(false)}>
          <button className="mod-lightbox-close" type="button" onClick={() => setIsLightboxOpen(false)} aria-label="Kapat">×</button>
          <div className="mod-lightbox-content" onClick={(event) => event.stopPropagation()}>
            {mediaItems[activeImage]?.isVideo ? (
              <video
                key={mediaItems[activeImage].url}
                src={mediaItems[activeImage].url}
                controls
                autoPlay
                playsInline
                style={{ maxWidth: '90vw', maxHeight: '85vh' }}
              />
            ) : (
              <img src={images[activeImage]} alt={`${mod.title} tam ekran görünüm`} />
            )}
            {images.length > 1 && <><button className="mod-lightbox-prev" type="button" onClick={showPrevious} aria-label="Önceki görsel"><ChevronLeft size={30} /></button><button className="mod-lightbox-next" type="button" onClick={showNext} aria-label="Sonraki görsel"><ChevronRight size={30} /></button></>}
            <span>{activeImage + 1} / {images.length}</span>
          </div>
        </div>
      )}
    </div>
  )
}
