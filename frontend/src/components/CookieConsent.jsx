import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ADMIN_BASE_PATH, ADMIN_LOGIN_PATH } from '../config/routes.js'
import './CookieConsent.css'

const CONSENT_STORAGE_KEY = 'zecution_cookie_consent'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const location = useLocation()

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CONSENT_STORAGE_KEY)
      if (!saved) {
        setVisible(true)
      }
    } catch {
      setVisible(true)
    }

    const handleOpenBanner = () => {
      setVisible(true)
    }

    window.addEventListener('zecution:open-cookie-banner', handleOpenBanner)
    return () => {
      window.removeEventListener('zecution:open-cookie-banner', handleOpenBanner)
    }
  }, [])

  // Gizli admin panelinde çerez çubuğunu gösterme
  if (
    location.pathname.startsWith(ADMIN_BASE_PATH) ||
    location.pathname.startsWith(ADMIN_LOGIN_PATH)
  ) {
    return null
  }

  if (!visible) return null

  const savePreference = (choice) => {
    try {
      localStorage.setItem(
        CONSENT_STORAGE_KEY,
        JSON.stringify({
          choice,
          timestamp: new Date().toISOString(),
        })
      )
      window.dispatchEvent(new CustomEvent('zecution:cookie-consent-updated', { detail: { choice } }))
    } catch {
      // ignore storage errors
    }
    setVisible(false)
  }

  return (
    <div className="cookie-banner" role="dialog" aria-live="polite" aria-label="Çerez ve gizlilik bildirimi">
      <div className="cookie-banner-copy">
        <p className="cookie-banner-title">Çerez ve Reklam Tercihleri</p>
        <p className="cookie-banner-text">
          Zecution Gaming olarak size daha iyi bir deneyim sunmak, site trafiğini analiz etmek ve Google AdSense aracılığıyla ilgi alanlarınıza uygun reklamlar göstermek için çerezler (cookies) kullanıyoruz. Detaylı bilgi için{' '}
          <Link to="/cerez-politikasi" className="cookie-banner-link">
            Çerez Politikası
          </Link>{' '}
          ve{' '}
          <Link to="/gizlilik-politikasi" className="cookie-banner-link">
            Gizlilik Politikası
          </Link>{' '}
          sayfalarımızı inceleyebilirsiniz.
        </p>
      </div>

      <div className="cookie-banner-actions">
        <button
          type="button"
          className="cookie-btn cookie-btn--essential"
          onClick={() => savePreference('essential')}
        >
          Sadece Zorunlu Çerezler
        </button>
        <button
          type="button"
          className="cookie-btn cookie-btn--accept"
          onClick={() => savePreference('accepted')}
        >
          Tümünü Kabul Et
        </button>
      </div>
    </div>
  )
}
