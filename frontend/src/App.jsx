import { useEffect, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowUpRight,
  BookOpen,
  Box,
  CarFront,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Menu,
  ShoppingBag,
  Wrench,
  X,
} from 'lucide-react'
import { FaDiscord, FaInstagram, FaTiktok, FaYoutube } from 'react-icons/fa6'
import './App.css'

const INSTAGRAM_URL = 'https://www.instagram.com/zecution_gaming/'
const SOCIAL_LINKS = [
  { label: 'YouTube', href: 'https://www.youtube.com/@zecution_gaming', Icon: FaYoutube },
  { label: 'Instagram', href: INSTAGRAM_URL, Icon: FaInstagram },
  { label: 'TikTok', href: 'https://www.tiktok.com/@Zecution_Gaming?lang=tr-TR', Icon: FaTiktok },
  { label: 'Discord', href: 'https://discord.gg/BsZTzENdAQ', Icon: FaDiscord },
]

function Brand({ compact = false }) {
  return (
    <a className={`brand ${compact ? 'brand--compact' : ''}`} href="#top" aria-label="Zecution Gaming ana sayfa">
      <img src="/media/images/logo.jpg" alt="Zecution Gaming" />
    </a>
  )
}

function App() {
  const sceneRef = useRef(null)
  const videoRef = useRef(null)
  const progressRef = useRef(null)
  const servicesRef = useRef(null)
  const [phase, setPhase] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [notice, setNotice] = useState('')

  const scrollServices = (direction) => {
    if (!servicesRef.current) return
    const scrollAmount = servicesRef.current.clientWidth * 0.75
    servicesRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  useEffect(() => {
    const scene = sceneRef.current
    const video = videoRef.current
    let animationFrame = 0
    let lastPhase = -1
    const isMobile = window.matchMedia('(max-width: 840px)').matches
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let targetTime = 0
    let easedTime = 0

    video.src = isMobile
      ? '/media/video/bmw-e36-scroll-mobile.mp4'
      : '/media/video/bmw-e36-scroll-desktop.mp4'
    video.load()

    const renderVideoTime = () => {
      animationFrame = 0
      if (!video.duration || reducedMotion) return
      const difference = targetTime - easedTime
      easedTime += difference * 0.22
      if (!video.seeking && Math.abs(video.currentTime - easedTime) > 1 / 60) {
        video.currentTime = easedTime
      }
      if (
        video.seeking ||
        Math.abs(difference) > 0.002 ||
        Math.abs(video.currentTime - targetTime) > 1 / 60
      ) {
        animationFrame = window.requestAnimationFrame(renderVideoTime)
      }
    }

    const update = () => {
      const start = scene.offsetTop
      const distance = Math.max(scene.offsetHeight - window.innerHeight, 1)
      const progress = Math.min(1, Math.max(0, (window.scrollY - start) / distance))
      if (video.duration && !reducedMotion) {
        targetTime = progress * Math.max(video.duration - 1 / 30, 0)
        if (!animationFrame) animationFrame = window.requestAnimationFrame(renderVideoTime)
      }

      if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`

      const nextPhase = progress < 0.12 ? 0 : progress < 0.38 ? 1 : progress < 0.68 ? 2 : 3
      if (nextPhase !== lastPhase) {
        lastPhase = nextPhase
        setPhase(nextPhase)
      }
    }

    const scheduleUpdate = () => {
      update()
    }

    const handleReady = () => {
      if ('requestVideoFrameCallback' in video) {
        video.requestVideoFrameCallback(() => setIsReady(true))
      } else {
        setIsReady(true)
      }
      easedTime = video.currentTime
      update()
    }

    if (video.readyState >= 2) {
      handleReady()
    }

    const fallbackTimer = window.setTimeout(() => {
      setIsReady(true)
    }, 2200)

    video.addEventListener('loadeddata', handleReady)
    video.addEventListener('canplay', handleReady)
    video.addEventListener('error', () => setIsReady(true))
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.clearTimeout(fallbackTimer)
      video.removeEventListener('loadeddata', handleReady)
      video.removeEventListener('canplay', handleReady)
      video.removeEventListener('error', () => setIsReady(true))
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
    }
  }, [])

  useEffect(() => {
    if (!notice) return undefined
    const timer = window.setTimeout(() => setNotice(''), 3200)
    return () => window.clearTimeout(timer)
  }, [notice])

  const copyInquiry = async (type) => {
    let message = ''
    if (type === 'model') {
      message = 'Merhaba Zecution Gaming, özel bir 3D model çalışması hakkında bilgi almak istiyorum.'
    } else if (type === 'vehicle') {
      message = 'Merhaba Zecution Gaming, kişiye özel araç modu yaptırmak istiyorum. Detayları görüşebilir miyiz?'
    } else if (type === 'setup') {
      message = 'Merhaba Zecution Gaming, sıfırdan kurulum hizmeti hakkında bilgi ve destek almak istiyorum.'
    }

    try {
      await navigator.clipboard.writeText(message)
      setNotice('Mesaj taslağı kopyalandı. Instagram DM’ye yapıştırabilirsin.')
    } catch {
      setNotice('Instagram açılıyor. Talebini DM üzerinden bize iletebilirsin.')
    }
  }

  return (
    <div id="top" className="site-shell">
      <header className={`site-header ${phase > 0 ? 'site-header--visible' : ''}`}>
        <Brand compact />
        <nav className="desktop-nav" aria-label="Ana menü">
          <a href="#mod-galerisi">Modlar</a>
          <a href="#rehberler">Rehberler</a>
          <a href="#hizmetler">Hizmetler</a>
          <a href="#hakkimizda">Hakkımızda</a>
        </nav>
        <button
          className="menu-button"
          type="button"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      {menuOpen && (
        <nav className="mobile-nav" aria-label="Mobil menü">
          <a href="#mod-galerisi" onClick={() => setMenuOpen(false)}>Modlar</a>
          <a href="#rehberler" onClick={() => setMenuOpen(false)}>Rehberler</a>
          <a href="#hizmetler" onClick={() => setMenuOpen(false)}>Hizmetler</a>
          <a href="#hakkimizda" onClick={() => setMenuOpen(false)}>Hakkımızda</a>
        </nav>
      )}

      <main>
        <section className="scroll-scene" ref={sceneRef} aria-label="BMW E36 320i Convertible tanıtımı">
          <div className="scroll-stage">
            <video
              ref={videoRef}
              className="sequence-video"
              muted
              playsInline
              preload="auto"
              poster="/media/images/bmw-e36-poster.jpg"
              aria-hidden="true"
            />
            <div className="cinema-shade" aria-hidden="true" />

            <div className={`loader ${isReady ? 'loader--hidden' : ''}`}>
              <span />
              Kareler hazırlanıyor
            </div>

            <div className={`opening-mark ${phase === 0 ? 'is-active' : ''}`}>
              <Brand />
            </div>

            <div className={`story-beat story-beat--left ${phase === 1 ? 'is-active' : ''}`}>
              <span className="eyebrow">Assetto Corsa modu</span>
              <h1>BMW E36<br />320i Convertible</h1>
              <p>Zecution Gaming tarafından oyun dünyasına yeniden yorumlandı.</p>
            </div>

            <div className={`story-beat story-beat--right ${phase === 2 ? 'is-active' : ''}`}>
              <span className="eyebrow">Detaylarda yaşar</span>
              <h2>Her açı,<br />başka bir karakter.</h2>
              <p>Aracı yakından incelemek için kaydırmaya devam et.</p>
            </div>

            <div className={`story-beat story-beat--final ${phase === 3 ? 'is-active' : ''}`}>
              <span className="eyebrow">Zecution seçkisi</span>
              <h2>Yola çıkmaya<br />hazır.</h2>
              <a className="text-link" href="#mod-galerisi">
                Mod galerisine geç <ArrowDown size={18} />
              </a>
            </div>

            <div className={`scroll-cue ${phase === 0 ? 'is-active' : ''}`}>
              <span>Keşfetmek için kaydır</span>
              <ArrowDown size={18} />
            </div>

            <div className="scene-rail" aria-hidden="true">
              <span ref={progressRef} />
            </div>
          </div>
        </section>

        <section id="mod-galerisi" className="gallery-gateway section-pad">
          <a className="gateway-card" href="/modlar" aria-label="Mod galerisine git">
            <div className="gateway-card-bg" aria-hidden="true" />
            <div className="gateway-copy">
              <span className="eyebrow">Tüm araçlar</span>
              <h2>Mod<br />Galerisi</h2>
              <p>Yayınlanan modları, görsellerini ve indirme bağlantılarını tek yerde keşfet.</p>
            </div>
            <span className="round-arrow"><ArrowUpRight /></span>
          </a>
        </section>

        <section className="store-gateway section-pad">
          <a className="store-gateway-card" href="/magaza" aria-label="Assetto Corsa mağazasına git">
            <div className="store-gateway-bg" aria-hidden="true" />
            <div className="store-gateway-copy">
              <span className="store-gateway-icon"><ShoppingBag /></span>
              <span className="eyebrow">Premium içerikler</span>
              <h2>Assetto Corsa<br />Mağazası</h2>
              <p>Ücretli araç modlarını, grafik paketlerini ve 3D modelleri keşfet; satın almak için bize ulaş.</p>
            </div>
            <span className="round-arrow"><ArrowUpRight /></span>
          </a>
        </section>

        <section id="rehberler" className="guide-gateway section-pad">
          <div className="guide-layout">
            <div className="guide-icon" aria-hidden="true"><BookOpen /></div>
            <div>
              <h2>Kurulumdan ayara,<br />yolda kalma.</h2>
              <p>Assetto Corsa ve BeamNG için kurulum anlatımları, pratik ayarlar ve video rehberleri.</p>
            </div>
            <a className="pill-link" href="/rehberler">Rehberlere git <ArrowUpRight size={18} /></a>
          </div>
        </section>

        <section id="hizmetler" className="services section-pad">
          <div className="section-heading services-heading">
            <div>
              <h2>Fikrini birlikte<br />gerçeğe dönüştürelim.</h2>
            </div>
            <div className="slider-controls">
              <button
                type="button"
                className="slider-arrow"
                onClick={() => scrollServices('left')}
                aria-label="Önceki hizmet"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                className="slider-arrow"
                onClick={() => scrollServices('right')}
                aria-label="Sonraki hizmet"
              >
                <ChevronRight size={22} />
              </button>
            </div>
          </div>
          <div className="service-slider" ref={servicesRef}>
            <a
              className="service-card service-card--model"
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              onClick={() => copyInquiry('model')}
            >
              <div className="service-card-bg service-card-bg--model" aria-hidden="true" />
              <div className="service-card-overlay" aria-hidden="true" />
              <div className="service-card-body">
                <Box className="service-icon" />
                <div>
                  <h3>3D Model</h3>
                  <p>Oyun, görselleştirme veya kişisel projen için özel model talebi oluştur.</p>
                </div>
                <span className="service-action">Instagram’dan yaz <ArrowUpRight size={18} /></span>
              </div>
            </a>
            <a
              className="service-card service-card--accent service-card--custom"
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              onClick={() => copyInquiry('vehicle')}
            >
              <div className="service-card-bg service-card-bg--custom" aria-hidden="true" />
              <div className="service-card-overlay" aria-hidden="true" />
              <div className="service-card-body">
                <CarFront className="service-icon" />
                <div>
                  <h3>Kişiye Özel<br />Araç Modu</h3>
                  <p>İstediğin aracı ve proje detaylarını paylaş, birlikte kapsamı belirleyelim.</p>
                </div>
                <span className="service-action">Teklif için yaz <ArrowUpRight size={18} /></span>
              </div>
            </a>
            <a
              className="service-card service-card--accent service-card--setup"
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              onClick={() => copyInquiry('setup')}
            >
              <div className="service-card-bg service-card-bg--setup" aria-hidden="true" />
              <div className="service-card-overlay" aria-hidden="true" />
              <div className="service-card-body">
                <Wrench className="service-icon" />
                <div>
                  <h3>Sıfırdan<br />Kurulum Hizmeti</h3>
                  <p>Assetto Corsa, Content Manager ve tüm eklentiler için baştan sona eksiksiz kurulum desteği.</p>
                </div>
                <span className="service-action">Kurulum İçin Yaz <ArrowUpRight size={18} /></span>
              </div>
            </a>
          </div>
        </section>

        <section id="hakkimizda" className="about section-pad">
          <div className="about-mark"><img src="/media/images/logo.jpg" alt="" /></div>
          <div className="about-copy">
            <h2>Otomobil tutkusunu<br />dijital dünyaya taşıyoruz.</h2>
            <p>
              Araç modları ve 3D modeller üretiyor; her projede otomobilin karakterini oyuna
              yansıtmaya odaklanıyoruz.
            </p>
          </div>
        </section>

        <section id="iletisim" className="contact section-pad">
          <div className="contact-bg" aria-hidden="true" />
          <div className="contact-overlay" aria-hidden="true" />
          <div className="contact-content">
            <span className="eyebrow">Bir proje mi var?</span>
            <h2>Konuşalım.</h2>
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
              <MessageCircle /> @zecution_gaming <ArrowUpRight />
            </a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <Brand compact />
            <p>Otomobil tutkusunu dijital dünyaya taşıyoruz.</p>
          </div>
          <nav className="footer-nav" aria-label="Footer menüsü">
            <span>Keşfet</span>
            <a href="#mod-galerisi">Modlar</a>
            <a href="#rehberler">Rehberler</a>
            <a href="#hizmetler">Hizmetler</a>
            <a href="#hakkimizda">Hakkımızda</a>
          </nav>
          <div className="footer-socials">
            <span>Bizi takip et</span>
            <div className="social-links">
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} title={label}>
                  <Icon aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Zecution Gaming</p>
          <a href="#top">Başa dön <ArrowUpRight size={16} /></a>
        </div>
      </footer>

      <div className={`notice ${notice ? 'notice--visible' : ''}`} role="status" aria-live="polite">
        {notice}
      </div>
    </div>
  )
}

export default App
