import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  BookOpen,
  Check,
  Clock,
  ExternalLink,
  Eye,
  Gauge,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { api } from '../../../services/api.js'
import { adminPath } from '../../../config/routes.js'
import './AdminGuideList.css'

export default function AdminGuideList() {
  const [guides, setGuides] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedGame, setSelectedGame] = useState('ALL')
  const [deletingId, setDeletingId] = useState(null)
  const [notice, setNotice] = useState('')

  const loadGuides = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await api.adminGetGuides()
      setGuides(data)
    } catch (err) {
      setError(err.message || 'Rehberler yüklenirken bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGuides()
  }, [])

  const handleDelete = async (guide) => {
    if (!window.confirm(`"${guide.title}" başlıklı rehberi silmek istediğine emin misin?`)) {
      return
    }

    try {
      setDeletingId(guide.id)
      await api.adminDeleteGuide(guide.id)
      setGuides((prev) => prev.filter((g) => g.id !== guide.id))
      setNotice('Rehber başarıyla silindi.')
      setTimeout(() => setNotice(''), 3000)
    } catch (err) {
      alert(err.message || 'Rehber silinemedi.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleStatus = async (guide) => {
    try {
      const updatedStatus = !guide.isActive
      await api.adminUpdateGuide(guide.id, { isActive: updatedStatus })
      setGuides((prev) =>
        prev.map((g) => (g.id === guide.id ? { ...g, isActive: updatedStatus } : g))
      )
      setNotice(`Rehber durumu ${updatedStatus ? 'Yayında' : 'Taslak'} olarak güncellendi.`)
      setTimeout(() => setNotice(''), 3000)
    } catch (err) {
      alert(err.message || 'Durum güncellenemedi.')
    }
  }

  const filteredGuides = useMemo(() => {
    return guides.filter((g) => {
      const matchesGame =
        selectedGame === 'ALL' ||
        (selectedGame === 'ASSETTO' && g.game === 'Assetto Corsa') ||
        (selectedGame === 'BEAMNG' && g.game === 'BeamNG.drive') ||
        (selectedGame === 'ACTIVE' && g.isActive !== false) ||
        (selectedGame === 'DRAFT' && g.isActive === false)

      const q = search.toLowerCase().trim()
      const matchesSearch =
        !q ||
        g.title?.toLowerCase().includes(q) ||
        g.category?.toLowerCase().includes(q) ||
        g.game?.toLowerCase().includes(q) ||
        g.slug?.toLowerCase().includes(q)

      return matchesGame && matchesSearch
    })
  }, [guides, selectedGame, search])

  return (
    <div className="admin-guides-page">
      {/* Header */}
      <div className="admin-guides-header">
        <div>
          <h1 className="admin-page-title">
            <BookOpen size={24} className="text-violet" /> Rehber Yönetimi
          </h1>
          <p className="admin-page-desc">
            Sitede yayınlanan kurulum ve optimizasyon rehberlerini özelleştirin, yenilerini ekleyin veya düzenleyin.
          </p>
        </div>

        <Link to={adminPath('rehberler/yeni')} className="admin-btn admin-btn--primary">
          <Plus size={18} /> Yeni Rehber Ekle
        </Link>
      </div>

      {notice && (
        <div className="admin-notice">
          <Check size={18} /> {notice}
        </div>
      )}

      {error && (
        <div className="admin-error-box">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="admin-guides-toolbar">
        <div className="admin-guides-search">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Rehber başlığı veya kategori ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="clear-btn"
              onClick={() => setSearch('')}
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="admin-guides-tabs">
          <button
            type="button"
            className={`admin-tab-btn ${selectedGame === 'ALL' ? 'is-active' : ''}`}
            onClick={() => setSelectedGame('ALL')}
          >
            Tümü ({guides.length})
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${selectedGame === 'ASSETTO' ? 'is-active' : ''}`}
            onClick={() => setSelectedGame('ASSETTO')}
          >
            Assetto Corsa
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${selectedGame === 'BEAMNG' ? 'is-active' : ''}`}
            onClick={() => setSelectedGame('BEAMNG')}
          >
            BeamNG.drive
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${selectedGame === 'ACTIVE' ? 'is-active' : ''}`}
            onClick={() => setSelectedGame('ACTIVE')}
          >
            Yayında
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${selectedGame === 'DRAFT' ? 'is-active' : ''}`}
            onClick={() => setSelectedGame('DRAFT')}
          >
            Taslak
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="admin-loading-state">
          <Loader2 className="animate-spin" size={32} />
          <span>Rehberler yükleniyor...</span>
        </div>
      ) : filteredGuides.length === 0 ? (
        <div className="admin-empty-guides">
          <BookOpen size={48} className="empty-icon" />
          <h3>Kriterlere uygun rehber bulunamadı</h3>
          <p>Arama terimini değiştirebilir veya yeni bir rehber oluşturabilirsiniz.</p>
          <Link to={adminPath('rehberler/yeni')} className="admin-btn admin-btn--primary">
            <Plus size={16} /> Yeni Rehber Ekle
          </Link>
        </div>
      ) : (
        <div className="admin-guides-grid">
          {filteredGuides.map((guide) => (
            <div key={guide.id} className="admin-guide-card">
              <div className="admin-guide-card__thumb">
                <img
                  src={guide.coverImage || '/media/images/game-assetto-corsa.png'}
                  alt={guide.title}
                />
                <span className={`guide-status-pill ${guide.isActive !== false ? 'is-active' : 'is-draft'}`}>
                  {guide.isActive !== false ? 'Yayında' : 'Taslak'}
                </span>
              </div>

              <div className="admin-guide-card__content">
                <div className="admin-guide-card__tags">
                  <span className="admin-guide-badge admin-guide-badge--game">
                    {guide.game}
                  </span>
                  <span className="admin-guide-badge admin-guide-badge--cat">
                    {guide.category}
                  </span>
                  <span className="admin-guide-chip">
                    <Clock size={12} /> {guide.time}
                  </span>
                  <span className="admin-guide-chip">
                    <Gauge size={12} /> {guide.difficulty}
                  </span>
                </div>

                <h3 className="admin-guide-card__title">{guide.title}</h3>
                <p className="admin-guide-card__summary">{guide.summary}</p>

                <div className="admin-guide-card__meta">
                  <span>
                    <BookOpen size={13} /> {guide.steps?.length || 0} Adım Anlatım
                  </span>
                  <span>
                    <Eye size={13} /> {guide.stats?.views || '1k'}
                  </span>
                </div>
              </div>

              <div className="admin-guide-card__actions">
                <a
                  href={`/rehberler/${guide.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="admin-action-btn"
                  title="Sayfayı Önizle"
                >
                  <ExternalLink size={15} /> Önizle
                </a>

                <Link
                  to={adminPath(`rehberler/${guide.id}/duzenle`)}
                  className="admin-action-btn admin-action-btn--edit"
                  title="Rehberi Düzenle"
                >
                  <Pencil size={15} /> Düzenle
                </Link>

                <button
                  type="button"
                  className={`admin-action-btn ${guide.isActive !== false ? 'admin-action-btn--draft' : 'admin-action-btn--publish'}`}
                  onClick={() => handleToggleStatus(guide)}
                  title={guide.isActive !== false ? 'Taslağa Al' : 'Yayına Al'}
                >
                  {guide.isActive !== false ? 'Taslak Yap' : 'Yayınla'}
                </button>

                <button
                  type="button"
                  className="admin-action-btn admin-action-btn--delete"
                  onClick={() => handleDelete(guide)}
                  disabled={deletingId === guide.id}
                  title="Rehberi Sil"
                >
                  {deletingId === guide.id ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Trash2 size={15} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
