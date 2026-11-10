import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import UserNavButton from '../../components/UserNavButton.jsx'
import './LegalPages.css'

const CORPORATE_LINKS = [
  { path: '/hakkimizda', label: 'Hakkımızda' },
  { path: '/iletisim', label: 'İletişim' },
  { path: '/gizlilik-politikasi', label: 'Gizlilik Politikası' },
  { path: '/cerez-politikasi', label: 'Çerez Politikası' },
  { path: '/kullanim-kosullari', label: 'Kullanım Koşulları & Telif' },
  { path: '/kvkk', label: 'KVKK Aydınlatma Metni' },
]

export const SOCIAL_LINKS = [
  { label: 'YouTube', href: 'https://www.youtube.com/@zecution_gaming' },
  { label: 'Instagram', href: 'https://www.instagram.com/zecution_gaming/' },
  { label: 'TikTok', href: 'https://www.tiktok.com/@Zecution_Gaming?lang=tr-TR' },
  { label: 'Discord', href: 'https://discord.gg/BsZTzENdAQ' },
]

export default function LegalLayout({
  title,
  description,
  lastUpdated = '10 Kasım 2026',
  effectiveDate = '1 Ekim 2026',
  seoTitle,
  seoDescription,
  children,
}) {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
    if (seoTitle || title) {
      document.title = `${seoTitle || title} | Zecution Gaming`
    }
    if (seoDescription || description) {
      const metaDesc = document.querySelector('meta[name="description"]')
      if (metaDesc) {
        metaDesc.setAttribute('content', seoDescription || description)
      }
    }
  }, [location.pathname, title, description, seoTitle, seoDescription])

  return (
    <div className="legal-page">
      <header className="legal-header">
        <div className="legal-header-inner">
          <Link to="/" className="legal-brand-text">
            Zecution Gaming
          </Link>

          <nav className="legal-nav" aria-label="Üst menü">
            <Link to="/" className="legal-nav-link">
              Ana Sayfa
            </Link>
            <Link to="/modlar" className="legal-nav-link">
              Mod Galerisi
            </Link>
            <Link to="/magaza" className="legal-nav-link">
              Mağaza
            </Link>
            <Link to="/rehberler" className="legal-nav-link">
              Rehberler
            </Link>
            <Link to="/teklif-al" className="legal-nav-link">
              Teklif Al
            </Link>
          </nav>

          <div className="legal-header-actions">
            <UserNavButton />
          </div>
        </div>

        <div className="legal-subnav-bar">
          <div className="legal-subnav-inner" role="navigation" aria-label="Kurumsal ve yasal sayfalar">
            {CORPORATE_LINKS.map(({ path, label }) => {
              const isActive = location.pathname === path
              return (
                <Link
                  key={path}
                  to={path}
                  className={`legal-subnav-link ${isActive ? 'is-active' : ''}`}
                >
                  {label}
                </Link>
              )
            })}
          </div>
        </div>
      </header>

      <main className="legal-main">
        <div className="legal-heading-block">
          <h1 className="legal-hero-title">{title}</h1>
          {description && <p className="legal-hero-desc">{description}</p>}
          {lastUpdated && (
            <div className="legal-hero-meta">
              <span>Son Güncelleme: {lastUpdated}</span>
              <span>Yürürlük Tarihi: {effectiveDate}</span>
              <span>Alan Adı: zecution.com</span>
            </div>
          )}
        </div>

        <div className="legal-content">{children}</div>
      </main>

      <footer className="legal-footer">
        <div className="legal-footer-inner">
          <div className="legal-footer-col">
            <h4>Zecution Gaming</h4>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
              Assetto Corsa, BeamNG.drive ve Euro Truck Simulator 2 başta olmak üzere simülasyon dünyası için özel 3D araç modelleme, fizik geliştirme ve Türkçe kurulum rehberleri platformu.
            </p>
          </div>

          <div className="legal-footer-col">
            <h4>Sayfalar</h4>
            <Link to="/">Ana Sayfa</Link>
            <Link to="/modlar">Mod Galerisi</Link>
            <Link to="/magaza">Dijital Mağaza</Link>
            <Link to="/rehberler">Kurulum Rehberleri</Link>
            <Link to="/teklif-al">Teklif Al</Link>
            <Link to="/mod-yayinla">Modunu Yayınla</Link>
          </div>

          <div className="legal-footer-col">
            <h4>Kurumsal &amp; Yasal</h4>
            <Link to="/hakkimizda">Hakkımızda</Link>
            <Link to="/iletisim">İletişim</Link>
            <Link to="/gizlilik-politikasi">Gizlilik Politikası</Link>
            <Link to="/cerez-politikasi">Çerez Politikası</Link>
            <Link to="/kullanim-kosullari">Kullanım Koşulları &amp; Telif</Link>
            <Link to="/kvkk">KVKK Aydınlatma Metni</Link>
          </div>

          <div className="legal-footer-col">
            <h4>İletişim &amp; Sosyal Medya</h4>
            <a href="mailto:iletisim@zecution.com">iletisim@zecution.com</a>
            {SOCIAL_LINKS.map(({ label, href }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer">
                {label}
              </a>
            ))}
          </div>
        </div>

        <div className="legal-footer-bottom">
          <span>© {new Date().getFullYear()} Zecution Gaming (zecution.com). Tüm hakları saklıdır.</span>
          <span>Simülasyon ve 3D Dijital Tasarım Platformu</span>
        </div>
      </footer>
    </div>
  )
}
