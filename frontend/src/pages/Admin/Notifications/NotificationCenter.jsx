import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bell,
  Check,
  CheckCheck,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Star,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { api } from '../../../services/api.js'
import { isSoundMuted, playNotificationSound, toggleSoundMuted } from '../../../utils/sound.js'
import './NotificationCenter.css'

function formatRelativeTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)

  if (diffInSeconds < 30) return 'Az önce'
  if (diffInSeconds < 60) return `${diffInSeconds} sn önce`
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `${diffInMinutes} dk önce`
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} saat önce`
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays} gün önce`

  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

export default function NotificationCenter({ onCountsUpdate }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState('ALL') // 'ALL' | 'REVIEW' | 'QUOTE'
  const [muted, setMuted] = useState(isSoundMuted())
  const [activeToast, setActiveToast] = useState(null)

  const dropdownRef = useRef(null)
  const toastTimeoutRef = useRef(null)
  const isInitialMount = useRef(true)
  const lastKnownIdRef = useRef(null)
  const navigate = useNavigate()

  const loadNotifications = async (isPolling = false) => {
    try {
      const lastSeen = localStorage.getItem('zecution_last_seen_activity')
      const res = await api.getAdminNotifications({ limit: 25 })
      const items = res.items || []

      setNotifications(items)

      // Unread hesaplama
      let count = 0
      if (lastSeen) {
        const lastSeenDate = new Date(lastSeen)
        count = items.filter((item) => new Date(item.createdAt) > lastSeenDate).length
      } else {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        count = items.filter((item) => new Date(item.createdAt) > oneDayAgo).length
      }
      setUnreadCount(count)

      if (onCountsUpdate) {
        onCountsUpdate({
          unreadCount: count,
          totalNewQuotes: res.totalNewQuotes || 0,
          totalReviews: res.totalReviews || 0,
        })
      }

      // Yeni aksiyon tespit edildiğinde Toast ve Ses tetikle!
      if (items.length > 0) {
        const newest = items[0]
        if (!isInitialMount.current && lastKnownIdRef.current && lastKnownIdRef.current !== newest.id) {
          // Yeni bir aksiyon var!
          triggerToast(newest)
          playNotificationSound()
        }
        lastKnownIdRef.current = newest.id
      }
    } catch (err) {
      console.error('Bildirimler yüklenemedi:', err)
    } finally {
      isInitialMount.current = false
    }
  }

  const triggerToast = (item) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current)
    }
    setActiveToast(item)
    toastTimeoutRef.current = setTimeout(() => {
      setActiveToast(null)
    }, 6000)
  }

  useEffect(() => {
    loadNotifications(false)

    // 18 saniyede bir otomatik bildirim polling'i
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadNotifications(true)
      }
    }, 18000)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadNotifications(true)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    }
  }, [])

  // Dışarı tıklama hook'u
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleMarkAllRead = () => {
    const nowIso = new Date().toISOString()
    localStorage.setItem('zecution_last_seen_activity', nowIso)
    setUnreadCount(0)
    if (onCountsUpdate) {
      onCountsUpdate((prev) => ({ ...prev, unreadCount: 0 }))
    }
  }

  const handleToggleSound = () => {
    const next = toggleSoundMuted()
    setMuted(next)
  }

  const handleItemClick = (item) => {
    setIsOpen(false)
    // Öğeyi okundu kabul etmek için tarih güncelle
    const nowIso = new Date().toISOString()
    localStorage.setItem('zecution_last_seen_activity', nowIso)
    setUnreadCount((prev) => Math.max(0, prev - 1))
    navigate(item.link)
  }

  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'REVIEW') return item.type === 'REVIEW'
    if (filter === 'QUOTE') return item.type === 'QUOTE'
    return true
  })

  const lastSeen = localStorage.getItem('zecution_last_seen_activity')
  const isItemUnread = (item) => {
    if (!lastSeen) return true
    return new Date(item.createdAt) > new Date(lastSeen)
  }

  return (
    <div className="notification-center" ref={dropdownRef}>
      {/* Zil Butonu */}
      <button
        type="button"
        className={`notification-bell-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Bildirimler ve Yeni Aksiyonlar"
        aria-label="Bildirimler"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Flyout Panel */}
      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown__header">
            <div className="notification-dropdown__title">
              <Sparkles size={16} style={{ color: '#c084fc' }} />
              <span>Aktivite & Bildirimler</span>
            </div>

            <div className="notification-dropdown__actions">
              <button
                type="button"
                className="notification-icon-btn"
                onClick={handleToggleSound}
                title={muted ? 'Bildirim sesini aç' : 'Bildirim sesini kapat'}
              >
                {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  className="notification-mark-all"
                  onClick={handleMarkAllRead}
                  title="Tümünü Okundu İşaretle"
                >
                  <CheckCheck size={13} style={{ marginRight: '0.2rem', verticalAlign: 'middle' }} />
                  Okundu Say
                </button>
              )}
            </div>
          </div>

          {/* Sekmeler */}
          <div className="notification-tabs">
            <button
              type="button"
              className={`notification-tab ${filter === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilter('ALL')}
            >
              Tümü ({notifications.length})
            </button>
            <button
              type="button"
              className={`notification-tab ${filter === 'REVIEW' ? 'active' : ''}`}
              onClick={() => setFilter('REVIEW')}
            >
              Yorumlar ({notifications.filter((n) => n.type === 'REVIEW').length})
            </button>
            <button
              type="button"
              className={`notification-tab ${filter === 'QUOTE' ? 'active' : ''}`}
              onClick={() => setFilter('QUOTE')}
            >
              Talepler ({notifications.filter((n) => n.type === 'QUOTE').length})
            </button>
          </div>

          {/* Liste */}
          <div className="notification-list">
            {filteredNotifications.length === 0 ? (
              <div className="notification-empty">
                <Bell size={24} style={{ opacity: 0.4 }} />
                <span>Henüz bildirim veya yeni aktivite bulunmuyor.</span>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const unread = isItemUnread(item)
                return (
                  <div
                    key={item.id}
                    className={`notification-item ${unread ? 'is-unread' : ''}`}
                    onClick={() => handleItemClick(item)}
                    role="button"
                    tabIndex={0}
                  >
                    <div
                      className={`notification-item__icon ${
                        item.type === 'REVIEW'
                          ? 'notification-item__icon--review'
                          : 'notification-item__icon--quote'
                      }`}
                    >
                      {item.type === 'REVIEW' ? <Star size={16} /> : <MessageSquare size={16} />}
                    </div>

                    <div className="notification-item__content">
                      <div className="notification-item__top">
                        <span className="notification-item__label">{item.title}</span>
                        <span className="notification-item__time">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>

                      <p className="notification-item__msg">{item.message}</p>

                      <div className="notification-item__meta">
                        {item.type === 'REVIEW' && item.rating && (
                          <span className="notification-item__tag" style={{ color: '#facc15' }}>
                            {'★'.repeat(item.rating)} {item.rating}/5
                          </span>
                        )}
                        {item.type === 'QUOTE' && item.game && (
                          <span className="notification-item__tag">{item.game}</span>
                        )}
                        <span
                          style={{
                            fontSize: '0.7rem',
                            color: '#a855f7',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            marginLeft: 'auto',
                            fontWeight: 600,
                          }}
                        >
                          Görüntüle →
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Floating In-App Toast Alert (Yeni bir aksiyon olduğunda sağ üstte belirir) */}
      {activeToast && (
        <div className="notification-toast-container">
          <div className="notification-toast">
            <div className="notification-toast__progress" />
            <div className="notification-toast__icon">
              {activeToast.type === 'REVIEW' ? <Star size={18} /> : <MessageSquare size={18} />}
            </div>
            <div className="notification-toast__body">
              <div className="notification-toast__title">
                <span>{activeToast.title}</span>
                <button
                  type="button"
                  className="notification-toast__close"
                  onClick={() => setActiveToast(null)}
                  aria-label="Kapat"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="notification-toast__desc">{activeToast.message}</div>
              <button
                type="button"
                className="notification-toast__link"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                onClick={() => {
                  setActiveToast(null)
                  handleItemClick(activeToast)
                }}
              >
                Hemen İncele →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
