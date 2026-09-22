import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Archive,
  CheckCircle2,
  Edit2,
  Eye,
  FileText,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react'
import { api, getMediaUrl } from '../../../services/api.js'

export default function ContentList() {
  const [contents, setContents] = useState([])
  const [loading, setLoading] = useState(true)
  const [sectionFilter, setSectionFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [showTrash, setShowTrash] = useState(false)
  const [actionNotice, setActionNotice] = useState('')

  const loadContents = async () => {
    try {
      setLoading(true)
      const params = { limit: 100 }
      if (sectionFilter !== 'ALL') params.section = sectionFilter
      if (statusFilter !== 'ALL') params.status = statusFilter
      if (showTrash) params.isDeleted = 'true'
      if (search.trim()) params.search = search.trim()

      const res = await api.getAdminContents(params)
      setContents(res.items || [])
    } catch (err) {
      console.error('İçerikler yüklenemedi:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContents()
  }, [sectionFilter, statusFilter, showTrash])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    loadContents()
  }

  const handlePublish = async (id) => {
    try {
      await api.publishContent(id)
      setActionNotice('İçerik başarıyla yayına alındı.')
      loadContents()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleArchive = async (id) => {
    try {
      await api.archiveContent(id)
      setActionNotice('İçerik arşivlendi.')
      loadContents()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bu içeriği çöp kutusuna taşımak istediğinizden emin misiniz?')) return
    try {
      await api.deleteContent(id)
      setActionNotice('İçerik çöp kutusuna taşındı.')
      loadContents()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleRestore = async (id) => {
    try {
      await api.restoreContent(id)
      setActionNotice('İçerik geri yüklendi.')
      loadContents()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div>
      <div className="admin-topbar">
        <div>
          <h1>İçerik Yönetimi</h1>
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
        {actionNotice && (
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '0.5rem',
              color: '#4ade80',
              marginBottom: '1.5rem',
              fontSize: '0.85rem',
            }}
          >
            {actionNotice}
          </div>
        )}

        {/* Filtre ve Arama Çubuğu */}
        <div
          style={{
            background: '#121212',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            {/* Bölüm Filtresi */}
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                padding: '0.5rem 0.8rem',
                borderRadius: '0.5rem',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            >
              <option value="ALL">Tüm Bölümler</option>
              <option value="STORE">Mağaza</option>
              <option value="GALLERY">Mod Galerisi</option>
            </select>

            {/* Durum Filtresi */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                padding: '0.5rem 0.8rem',
                borderRadius: '0.5rem',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            >
              <option value="ALL">Tüm Durumlar</option>
              <option value="PUBLISHED">Yayında</option>
              <option value="DRAFT">Taslak</option>
              <option value="ARCHIVED">Arşiv</option>
            </select>

            {/* Çöp Kutusu Butonu */}
            <button
              type="button"
              onClick={() => setShowTrash(!showTrash)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.85rem',
                background: showTrash ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                border: showTrash ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.15)',
                color: showTrash ? '#f87171' : '#fff',
                borderRadius: '0.5rem',
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={15} />
              <span>{showTrash ? 'Çöp Kutusu (Açık)' : 'Çöp Kutusu'}</span>
            </button>
          </div>

          {/* Arama Formu */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="İçerik ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                padding: '0.5rem 0.85rem',
                borderRadius: '0.5rem',
                fontSize: '0.85rem',
                outline: 'none',
                minWidth: '12rem',
              }}
            />
            <button
              type="submit"
              style={{
                padding: '0.5rem 0.85rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Search size={16} />
            </button>
          </form>
        </div>

        {/* Tablo */}
        <div
          style={{
            background: '#121212',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '0.75rem',
            overflowX: 'auto',
          }}
        >
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#ffffff8c' }}>
              <Loader2 className="animate-spin" size={26} style={{ margin: '0 auto 0.5rem' }} />
              <span>İçerikler yükleniyor...</span>
            </div>
          ) : contents.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#ffffff8c' }}>
              Herhangi bir içerik bulunamadı.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#ffffff8c' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Görsel</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Başlık</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Bölüm & Kategori</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Oyun</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Durum</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {contents.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background 0.2s ease',
                    }}
                  >
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <img
                        src={getMediaUrl(item.coverImage?.thumbnailPath || item.coverImage?.filePath)}
                        alt=""
                        style={{ width: '3.2rem', height: '2.4rem', borderRadius: '0.35rem', objectFit: 'cover' }}
                      />
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{item.title}</div>
                      <small style={{ color: '#ffffff59', fontFamily: 'monospace' }}>{item.slug}</small>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '0.3rem',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: item.section === 'STORE' ? 'rgba(177, 60, 255, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                          color: item.section === 'STORE' ? '#d880ff' : '#60a5fa',
                          marginBottom: '0.2rem',
                        }}
                      >
                        {item.section === 'STORE' ? 'Mağaza' : 'Mod Galerisi'}
                      </span>
                      <div style={{ fontSize: '0.78rem', color: '#ffffff8c' }}>{item.category?.name || '-'}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#ffffffcc' }}>
                      {item.game?.name || '-'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background:
                            item.status === 'PUBLISHED'
                              ? 'rgba(34, 197, 94, 0.2)'
                              : item.status === 'ARCHIVED'
                              ? 'rgba(156, 163, 175, 0.2)'
                              : 'rgba(234, 179, 8, 0.2)',
                          color:
                            item.status === 'PUBLISHED'
                              ? '#4ade80'
                              : item.status === 'ARCHIVED'
                              ? '#9ca3af'
                              : '#facc15',
                        }}
                      >
                        {item.status === 'PUBLISHED' ? 'Yayında' : item.status === 'ARCHIVED' ? 'Arşiv' : 'Taslak'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        {showTrash ? (
                          <button
                            type="button"
                            onClick={() => handleRestore(item.id)}
                            title="Geri Yükle"
                            style={{
                              padding: '0.45rem',
                              background: 'rgba(34, 197, 94, 0.15)',
                              border: '1px solid rgba(34, 197, 94, 0.3)',
                              color: '#4ade80',
                              borderRadius: '0.4rem',
                              cursor: 'pointer',
                            }}
                          >
                            <RotateCcw size={15} />
                          </button>
                        ) : (
                          <>
                            <Link
                              to={`/admin/icerikler/${item.id}/duzenle`}
                              title="Düzenle"
                              style={{
                                padding: '0.45rem',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                color: '#fff',
                                borderRadius: '0.4rem',
                                display: 'grid',
                                placeItems: 'center',
                                textDecoration: 'none',
                              }}
                            >
                              <Edit2 size={15} />
                            </Link>

                            {item.status === 'PUBLISHED' ? (
                              <button
                                type="button"
                                onClick={() => handleArchive(item.id)}
                                title="Arşivle"
                                style={{
                                  padding: '0.45rem',
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  border: '1px solid rgba(255, 255, 255, 0.12)',
                                  color: '#ffffff8c',
                                  borderRadius: '0.4rem',
                                  cursor: 'pointer',
                                }}
                              >
                                <Archive size={15} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handlePublish(item.id)}
                                title="Yayına Al"
                                style={{
                                  padding: '0.45rem',
                                  background: 'rgba(34, 197, 94, 0.15)',
                                  border: '1px solid rgba(34, 197, 94, 0.3)',
                                  color: '#4ade80',
                                  borderRadius: '0.4rem',
                                  cursor: 'pointer',
                                }}
                              >
                                <CheckCircle2 size={15} />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              title="Çöp Kutusuna Taşı"
                              style={{
                                padding: '0.45rem',
                                background: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#f87171',
                                borderRadius: '0.4rem',
                                cursor: 'pointer',
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
