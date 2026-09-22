import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import {
  Archive,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FileText,
  FolderTree,
  Loader2,
  Package,
  Plus,
  Settings,
} from 'lucide-react'
import { api, getMediaUrl } from '../../../services/api.js'

export default function Dashboard() {
  const { admin } = useOutletContext()
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    drafts: 0,
    archived: 0,
    categories: 0,
  })
  const [recentContents, setRecentContents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadDashboard() {
      try {
        setLoading(true)
        const [contentsRes, categoriesRes] = await Promise.all([
          api.getAdminContents({ limit: 10 }),
          api.getAdminCategories(),
        ])

        if (!isMounted) return

        const items = contentsRes.items || []
        const total = contentsRes.pagination?.total || items.length
        const published = items.filter((i) => i.status === 'PUBLISHED').length
        const drafts = items.filter((i) => i.status === 'DRAFT').length
        const archived = items.filter((i) => i.status === 'ARCHIVED').length

        setStats({
          total,
          published,
          drafts,
          archived,
          categories: categoriesRes.length,
        })
        setRecentContents(items.slice(0, 5))
      } catch (err) {
        console.error('Dashboard yüklenemedi:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadDashboard()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div>
      <div className="admin-topbar">
        <div>
          <h1>Kontrol Paneli</h1>
        </div>
        <Link
          to="/admin/icerikler/yeni"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.65rem 1.1rem',
            background: 'linear-gradient(135deg, #7f22c9 0%, #a838f5 100%)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.85rem',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            boxShadow: '0 4px 15px rgba(127, 34, 201, 0.4)',
          }}
        >
          <Plus size={16} /> Yeni İçerik Ekle
        </Link>
      </div>

      <div className="admin-content-area">
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.4rem', color: '#fff' }}>
            Hoş geldin, {admin?.name || 'Yönetici'}! 👋
          </h2>
          <p style={{ color: '#ffffff8c', margin: 0, fontSize: '0.9rem' }}>
            Zecution Gaming içeriklerini, araç modlarını ve ayarlarını buradan yönetebilirsin.
          </p>
        </div>

        {/* İstatistik Kartları */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(13rem, 1fr))',
            gap: '1.25rem',
            marginBottom: '2.5rem',
          }}
        >
          <div
            style={{
              background: '#121212',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '1rem',
              padding: '1.4rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '0.75rem',
                background: 'rgba(127, 34, 201, 0.2)',
                color: '#d880ff',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Package size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', color: '#ffffff73', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Toplam İçerik
              </span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
                {loading ? '-' : stats.total}
              </div>
            </div>
          </div>

          <div
            style={{
              background: '#121212',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '1rem',
              padding: '1.4rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '0.75rem',
                background: 'rgba(34, 197, 94, 0.18)',
                color: '#4ade80',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <CheckCircle2 size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', color: '#ffffff73', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Yayında
              </span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#4ade80' }}>
                {loading ? '-' : stats.published}
              </div>
            </div>
          </div>

          <div
            style={{
              background: '#121212',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '1rem',
              padding: '1.4rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '0.75rem',
                background: 'rgba(234, 179, 8, 0.18)',
                color: '#facc15',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Clock size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', color: '#ffffff73', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Taslaklar
              </span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#facc15' }}>
                {loading ? '-' : stats.drafts}
              </div>
            </div>
          </div>

          <div
            style={{
              background: '#121212',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '1rem',
              padding: '1.4rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '0.75rem',
                background: 'rgba(59, 130, 246, 0.18)',
                color: '#60a5fa',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <FolderTree size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', color: '#ffffff73', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Kategoriler
              </span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#60a5fa' }}>
                {loading ? '-' : stats.categories}
              </div>
            </div>
          </div>
        </div>

        {/* Hızlı İşlemler & Son İçerikler */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))', gap: '1.5rem' }}>
          {/* Son Eklenen İçerikler */}
          <div
            style={{
              background: '#121212',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '1rem',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                Son İçerikler
              </h3>
              <Link to="/admin/icerikler" style={{ fontSize: '0.8rem', color: '#d880ff', textDecoration: 'none', fontWeight: 600 }}>
                Tümünü Gör →
              </Link>
            </div>

            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#ffffff73' }}>
                <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 0.5rem' }} />
                <span>Yükleniyor...</span>
              </div>
            ) : recentContents.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#ffffff73' }}>
                Henüz içerik bulunmuyor.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentContents.map((content) => (
                  <Link
                    key={content.id}
                    to={`/admin/icerikler/${content.id}/duzenle`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '0.65rem',
                      textDecoration: 'none',
                      color: '#fff',
                      transition: 'background 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                      <img
                        src={getMediaUrl(content.coverImage?.thumbnailPath || content.coverImage?.filePath)}
                        alt=""
                        style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.4rem', objectFit: 'cover' }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {content.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#ffffff73' }}>
                          {content.section === 'STORE' ? 'Mağaza' : 'Mod Galerisi'} · {content.game?.name || 'Assetto Corsa'}
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '999px',
                        background:
                          content.status === 'PUBLISHED'
                            ? 'rgba(34, 197, 94, 0.2)'
                            : 'rgba(234, 179, 8, 0.2)',
                        color: content.status === 'PUBLISHED' ? '#4ade80' : '#facc15',
                      }}
                    >
                      {content.status === 'PUBLISHED' ? 'Yayında' : 'Taslak'}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Hızlı Kısayollar */}
          <div
            style={{
              background: '#121212',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '1rem',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 1.25rem', color: '#fff' }}>
                Hızlı İşlemler
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Link
                  to="/admin/icerikler/yeni"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.85rem 1rem',
                    borderRadius: '0.65rem',
                    background: 'rgba(127, 34, 201, 0.15)',
                    border: '1px solid rgba(177, 60, 255, 0.3)',
                    color: '#fff',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                  }}
                >
                  <Plus size={18} style={{ color: '#d880ff' }} />
                  <span>Yeni Ürün veya Mod Ekle</span>
                </Link>

                <Link
                  to="/admin/kategoriler"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.85rem 1rem',
                    borderRadius: '0.65rem',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#fff',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                  }}
                >
                  <FolderTree size={18} style={{ color: '#60a5fa' }} />
                  <span>Kategorileri Düzenle</span>
                </Link>

                <Link
                  to="/admin/ayarlar"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.85rem 1rem',
                    borderRadius: '0.65rem',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#fff',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                  }}
                >
                  <Settings size={18} style={{ color: '#facc15' }} />
                  <span>Sosyal Medya & Site Bağlantıları</span>
                </Link>
              </div>
            </div>

            <div
              style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '0.65rem',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '0.82rem', color: '#ffffff8c' }}>Siteyi Ziyaret Et</span>
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  color: '#fff',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Ana Sayfa <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
