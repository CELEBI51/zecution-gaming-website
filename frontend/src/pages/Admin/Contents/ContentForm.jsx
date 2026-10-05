import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  Download,
  Eye,
  Loader2,
  Plus,
  Save,
  Star,
  Trash2,
  Upload,
} from 'lucide-react'
import { api, getMediaUrl } from '../../../services/api.js'
import { adminPath } from '../../../config/routes.js'
import {
  getAllProducers,
  saveProducer,
  updateProducer,
  deleteProducer,
  isPermanentPlatformName,
  isProducerFounder,
  isProducerPartner,
  getProducerAvatar,
  saveProducerAvatar,
  getProducerAvatars,
  setServerProducerAvatars,
} from '../../../services/producers.js'
import './ContentForm.css'
import { categoryRows } from '../../../utils/categories.js'

function formatDateForInput(dateVal) {
  if (!dateVal) return ''
  try {
    const d = new Date(dateVal)
    if (isNaN(d.getTime())) return ''
    const pad = (n) => String(n).padStart(2, '0')
    const year = d.getFullYear()
    const month = pad(d.getMonth() + 1)
    const day = pad(d.getDate())
    const hours = pad(d.getHours())
    const minutes = pad(d.getMinutes())
    return `${year}-${month}-${day}T${hours}:${minutes}`
  } catch {
    return ''
  }
}

export default function ContentForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  // Form durumları
  const [formData, setFormData] = useState({
    title: '',
    section: 'STORE',
    status: 'PUBLISHED',
    saleMethod: 'CONTACT',
    gameId: '',
    categoryId: '',
    producer: 'Zecution Gaming',
    shortDescription: '',
    description: '',
    price: '',
    priceLabel: 'Fiyat için iletişime geç',
    downloadUrl: '',
    isFeatured: false,
    viewCount: 0,
    downloadCount: 0,
    publishedAt: formatDateForInput(new Date()),
    slug: '',
  })

  const [games, setGames] = useState([])
  const [categories, setCategories] = useState([])
  const [mediaList, setMediaList] = useState([])
  const [features, setFeatures] = useState([])

  // Yapımcı Yönetimi
  const [producersList, setProducersList] = useState(() => getAllProducers())
  const [isAddingNewProducer, setIsAddingNewProducer] = useState(false)
  const [newProducerName, setNewProducerName] = useState('')
  const [isEditingProducer, setIsEditingProducer] = useState(false)
  const [editingProducerName, setEditingProducerName] = useState('')
  const [producerAvatarsMap, setProducerAvatarsMap] = useState(() => getProducerAvatars())
  const [uploadingProducerAvatar, setUploadingProducerAvatar] = useState(false)

  // Veri yükleme
  useEffect(() => {
    let isMounted = true

    async function initialize() {
      try {
        const [gamesRes, categoriesRes, contentsRes, settingsRes] = await Promise.all([
          api.getGames().catch(() => []),
          api.getAdminCategories().catch(() => []),
          api.getContents({ limit: 100 }).catch(() => ({ items: [] })),
          api.getSettings().catch(() => ({})),
        ])

        if (!isMounted) return
        setGames(gamesRes)
        setCategories(categoriesRes)
        if (settingsRes?.producer_avatars) {
          setServerProducerAvatars(settingsRes.producer_avatars)
          setProducerAvatarsMap(getProducerAvatars())
        }
        if (contentsRes?.items) {
          setProducersList(getAllProducers(contentsRes.items))
        }

        if (isEdit) {
          const content = await api.getAdminContentById(id)
          if (!isMounted) return

          setFormData({
            title: content.title || '',
            section: content.section || 'STORE',
            status: content.status || 'DRAFT',
            saleMethod: content.saleMethod || 'CONTACT',
            gameId: content.gameId || '',
            categoryId: content.categoryId || '',
            producer: content.producer || 'Zecution Gaming',
            shortDescription: content.shortDescription || '',
            description: content.description || '',
            price: content.price !== null ? String(content.price) : '',
            priceLabel: content.priceLabel || '',
            downloadUrl: content.downloadUrl || '',
            isFeatured: Boolean(content.isFeatured),
            viewCount: content.viewCount || 0,
            downloadCount: content.downloadCount || 0,
            publishedAt: formatDateForInput(content.publishedAt || content.createdAt),
            slug: content.slug || '',
          })

          setMediaList(content.media || [])
          setFeatures(content.features || [])
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'İçerik yüklenirken hata oluştu')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    initialize()

    return () => {
      isMounted = false
    }
  }, [id, isEdit])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'section' ? { categoryId: '' } : {}),
    }))
  }

  // Formu kaydet
  const handleSave = async (e) => {
    if (e) e.preventDefault()
    if (!formData.title.trim()) {
      setError('İçerik başlığı zorunludur.')
      return
    }
    if (invalidCategory) {
      setError('Seçili kategori içerik kabul etmiyor. Aktif bir alt kategori seçiniz.')
      return
    }
    setError('')
    setNotice('')
    setSaving(true)

    const payload = {
      ...formData,
      gameId: formData.gameId || null,
      categoryId: formData.categoryId || null,
      status: formData.status || 'PUBLISHED',
      saleMethod: formData.section === 'STORE' ? 'CONTACT' : 'FREE',
      price: formData.section === 'STORE' && formData.price ? Number(formData.price) : null,
      priceLabel: formData.section === 'STORE' ? formData.priceLabel : null,
      downloadUrl: formData.section === 'GALLERY' ? formData.downloadUrl : null,
      publishedAt: formData.publishedAt ? new Date(formData.publishedAt).toISOString() : null,
    }

    if (formData.producer) {
      saveProducer(formData.producer)
    }

    try {
      let savedContent
      if (isEdit) {
        savedContent = await api.updateContent(id, payload)
        setNotice('İçerik başarıyla güncellendi!')
      } else {
        savedContent = await api.createContent(payload)
        setNotice('İçerik başarıyla oluşturuldu!')
        // Düzenleme moduna yönlendir
        navigate(adminPath(`icerikler/${savedContent.id}/duzenle`), { replace: true })
      }
    } catch (err) {
      setError(err.message || 'Kayıt sırasında bir hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  // Görsel Yükleme
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    if (!isEdit) {
      alert('Görsel yüklemeden önce lütfen içeriği kaydediniz.')
      return
    }

    try {
      setUploading(true)
      const uploaded = await api.uploadMedia(id, files)
      setMediaList((prev) => [...prev, ...uploaded])
      setNotice(`${files.length} görsel başarıyla yüklendi.`)
    } catch (err) {
      alert(err.message || 'Görsel yüklenemedi')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleSetCover = async (mediaId) => {
    try {
      const updated = await api.setMediaCover(mediaId)
      setMediaList(updated)
      setNotice('Kapak görseli güncellendi.')
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDeleteMedia = async (mediaId) => {
    if (!window.confirm('Bu görseli silmek istediğinizden emin misiniz?')) return
    try {
      await api.deleteMedia(mediaId)
      setMediaList((prev) => prev.filter((m) => m.id !== mediaId))
    } catch (err) {
      alert(err.message)
    }
  }

  const handleUploadProducerAvatar = async (file) => {
    if (!file) return
    const currentProducer = (formData.producer || 'Zecution Gaming').replace(/👑/g, '').trim()
    setUploadingProducerAvatar(true)
    try {
      const url = await api.uploadProducerAvatar(file)
      if (url) {
        saveProducerAvatar(currentProducer, url)
        setProducerAvatarsMap((prev) => ({ ...prev, [currentProducer]: url }))

        try {
          const currentSettings = await api.getAdminSettings()
          let existingAvatars = {}
          try {
            existingAvatars = JSON.parse(currentSettings.producer_avatars || '{}')
          } catch {
            existingAvatars = {}
          }
          existingAvatars[currentProducer] = url
          await api.updateSettings({
            ...currentSettings,
            producer_avatars: JSON.stringify(existingAvatars),
          })
          setServerProducerAvatars(existingAvatars)
        } catch (settingsErr) {
          console.error('Ayarlar kaydedilemedi:', settingsErr)
        }
      }
    } catch (err) {
      alert(err.message || 'Profil fotoğrafı yüklenemedi.')
    } finally {
      setUploadingProducerAvatar(false)
    }
  }

  // Dinamik Özellik Yönetimi
  const handleAddFeatureRow = () => {
    setFeatures((prev) => [...prev, { label: '', value: '', isNew: true }])
  }

  const handleFeatureChange = (index, field, value) => {
    setFeatures((prev) => {
      const copy = [...prev]
      copy[index][field] = value
      return copy
    })
  }

  const handleSaveFeature = async (index) => {
    const feat = features[index]
    if (!feat.label || !feat.value) return alert('Başlık ve değer alanlarını doldurunuz')
    if (!isEdit) return alert('Özellik eklemeden önce lütfen içeriği kaydediniz')

    try {
      if (feat.id) {
        await api.updateFeature(feat.id, { label: feat.label, value: feat.value })
      } else {
        const created = await api.addFeature(id, { label: feat.label, value: feat.value })
        setFeatures((prev) => {
          const copy = [...prev]
          copy[index] = created
          return copy
        })
      }
      setNotice('Özellik kaydedildi.')
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDeleteFeature = async (index) => {
    const feat = features[index]
    if (feat.id) {
      try {
        await api.deleteFeature(feat.id)
      } catch (err) {
        return alert(err.message)
      }
    }
    setFeatures((prev) => prev.filter((_, i) => i !== index))
  }

  // Bölüme göre filtrelenmiş kategoriler
  const categoryTree = categoryRows(categories.filter((c) => c.section === formData.section))
  const availableCategories = categoryTree.filter((c) => !c.hasChildren && c.branchActive)
  const invalidCategory = formData.categoryId && !availableCategories.some(c => c.id === formData.categoryId)

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: '#ffffff8c' }}>
        <Loader2 className="animate-spin" size={28} style={{ margin: '0 auto 0.5rem' }} />
        <span>Yükleniyor...</span>
      </div>
    )
  }

  return (
    <div>
      <div className="admin-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <button
            type="button"
            onClick={() => navigate(adminPath('icerikler'))}
            style={{
              display: 'grid',
              placeItems: 'center',
              width: '2.2rem',
              height: '2.2rem',
              borderRadius: '0.45rem',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={16} />
          </button>
          <h1>{isEdit ? `Düzenle: ${formData.title}` : 'Yeni İçerik Ekle'}</h1>
          {isEdit && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '999px',
                  background: 'rgba(168, 85, 247, 0.15)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  color: '#d8b4fe',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}
                title="Toplam Tıklanma / Görüntülenme"
              >
                <Eye size={13} />
                {(formData.viewCount || 0).toLocaleString('tr-TR')} tıklanma
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '999px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#6ee7b7',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}
                title="Toplam Doğrudan İndirme"
              >
                <Download size={13} />
                {(formData.downloadCount || 0).toLocaleString('tr-TR')} indirme
              </span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.65rem 1.25rem',
            background: 'linear-gradient(135deg, #7f22c9 0%, #a838f5 100%)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.88rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 15px rgba(127, 34, 201, 0.4)',
          }}
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          <span>{isEdit ? 'Değişiklikleri Kaydet' : 'İçeriği Oluştur'}</span>
        </button>
      </div>

      <div className="admin-content-area content-form-shell">
        {notice && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '0.5rem', color: '#4ade80', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
            {notice}
          </div>
        )}
        {error && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.5rem', color: '#f87171', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {isEdit && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              padding: '0.9rem 1.25rem',
              marginBottom: '1.25rem',
              background: 'rgba(168, 85, 247, 0.08)',
              border: '1px solid rgba(168, 85, 247, 0.25)',
              borderRadius: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    width: '2.4rem',
                    height: '2.4rem',
                    borderRadius: '0.5rem',
                    background: 'rgba(168, 85, 247, 0.2)',
                    color: '#c084fc',
                  }}
                >
                  <Eye size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.74rem', color: '#ffffff73', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Tıklanma / Görüntülenme
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                    {(formData.viewCount || 0).toLocaleString('tr-TR')}{' '}
                    <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#c084fc' }}>kez</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    width: '2.4rem',
                    height: '2.4rem',
                    borderRadius: '0.5rem',
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                  }}
                >
                  <Download size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.74rem', color: '#ffffff73', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    İndirme Sayısı
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                    {(formData.downloadCount || 0).toLocaleString('tr-TR')}{' '}
                    <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#34d399' }}>kez</span>
                  </div>
                </div>
              </div>
            </div>
            {formData.slug && (
              <a
                href={formData.section === 'STORE' ? `/magaza/${formData.slug}` : `/modlar/${formData.slug}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#d8b4fe',
                  textDecoration: 'none',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '0.45rem',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  transition: 'background 0.2s',
                }}
              >
                Sitede Görüntüle ↗
              </a>
            )}
          </div>
        )}

        <div className="content-form-card">
            <h2 className="content-form-heading">Genel Bilgiler</h2>
            <div className="form-field">
              <label htmlFor="title">İçerik Başlığı *</label>
              <input
                id="title"
                name="title"
                type="text"
                required
                placeholder="Örn: Volkswagen Polo 1.4 TDI"
                value={formData.title}
                onChange={handleChange}
              />
            </div>


            <div className="form-field">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <label htmlFor="producer" style={{ margin: 0 }}>Yapımcı</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {!isAddingNewProducer && !isEditingProducer ? (
                    <>
                      <button
                        type="button"
                        style={{
                          fontSize: '0.78rem',
                          padding: '0.2rem 0.65rem',
                          color: '#c084fc',
                          background: 'rgba(177, 60, 255, 0.1)',
                          border: '1px solid rgba(177, 60, 255, 0.4)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          setIsAddingNewProducer(true)
                          setIsEditingProducer(false)
                        }}
                      >
                        + Yeni Yapımcı Ekle
                      </button>
                      <button
                        type="button"
                        style={{
                          fontSize: '0.78rem',
                          padding: '0.2rem 0.65rem',
                          color: '#38bdf8',
                          background: 'rgba(56, 189, 248, 0.1)',
                          border: '1px solid rgba(56, 189, 248, 0.4)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          setEditingProducerName(formData.producer || 'Cml Gaming')
                          setIsEditingProducer(true)
                          setIsAddingNewProducer(false)
                        }}
                        title="Seçili yapımcının adını düzenle veya düzelt"
                      >
                        ✏️ Yapımcıyı Düzenle
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      style={{
                        fontSize: '0.78rem',
                        padding: '0.2rem 0.65rem',
                        color: '#94a3b8',
                        background: 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        setIsAddingNewProducer(false)
                        setIsEditingProducer(false)
                      }}
                    >
                      Listeden Seç / İptal
                    </button>
                  )}
                </div>
              </div>

              {!isAddingNewProducer && !isEditingProducer ? (
                <>
                  <select
                    id="producer"
                    name="producer"
                    value={formData.producer || 'Zecution Gaming'}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setIsAddingNewProducer(true)
                      } else {
                        handleChange(e)
                      }
                    }}
                  >
                    {producersList.map((p) => (
                      <option key={p} value={p}>
                        {p.toLowerCase().includes('zecution') ? 'Zecution Gaming 👑 (Kurucu)' : p}
                      </option>
                    ))}
                    <option value="__add_new__">+ Yeni Yapımcı Ekle...</option>
                  </select>

                  {/* Seçili Yapımcının Profil Fotoğrafı */}
                  {(() => {
                    const selClean = (formData.producer || 'Zecution Gaming').replace(/👑/g, '').trim()
                    const avatarUrl = getProducerAvatar(selClean, producerAvatarsMap)
                    const initials = selClean
                      .split(' ')
                      .map((w) => w[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join('')
                      .toUpperCase() || 'ZG'

                    return (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: '0.65rem',
                          padding: '0.65rem 0.85rem',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '8px',
                          gap: '0.75rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ position: 'relative', width: '2.5rem', height: '2.5rem', flexShrink: 0 }}>
                            {avatarUrl ? (
                              <img
                                src={getMediaUrl(avatarUrl)}
                                alt={selClean}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                  border: '2px solid #a855f7',
                                }}
                                onError={(e) => {
                                  e.currentTarget.src = '/media/images/logo.jpg'
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  borderRadius: '50%',
                                  background: '#191522',
                                  border: '2px solid #7c3aed',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#fff',
                                  fontWeight: 800,
                                  fontSize: '0.85rem',
                                }}
                              >
                                {initials}
                              </div>
                            )}
                            <span
                              style={{
                                position: 'absolute',
                                bottom: '0',
                                right: '0',
                                width: '0.55rem',
                                height: '0.55rem',
                                borderRadius: '50%',
                                background: '#22c55e',
                                border: '1.5px solid #121212',
                              }}
                            />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
                              {selClean} Profil Fotoğrafı
                            </div>
                            <div style={{ fontSize: '0.72rem', color: avatarUrl ? '#4ade80' : '#ffffff73' }}>
                              {avatarUrl ? '✓ Özel fotoğraf yüklü' : 'Varsayılan monogram (baş harfler)'}
                            </div>
                          </div>
                        </div>

                        <label
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.35rem 0.75rem',
                            background: 'rgba(168, 85, 247, 0.15)',
                            border: '1px solid rgba(168, 85, 247, 0.4)',
                            borderRadius: '5px',
                            color: '#c084fc',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: uploadingProducerAvatar ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {uploadingProducerAvatar ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                          <span>{avatarUrl ? 'Fotoğrafı Değiştir' : 'Fotoğraf Yükle'}</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/jpg"
                            style={{ display: 'none' }}
                            disabled={uploadingProducerAvatar}
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleUploadProducerAvatar(e.target.files[0])
                              }
                            }}
                          />
                        </label>
                      </div>
                    )
                  })()}
                </>
              ) : isEditingProducer ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(56, 189, 248, 0.05)', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                  <div style={{ fontSize: '0.8rem', color: '#7dd3fc', fontWeight: '500' }}>
                    Yapımcıyı Düzenle: <strong>{formData.producer}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder="Yeni veya düzeltilmiş adı yazın..."
                      value={editingProducerName}
                      onChange={(e) => setEditingProducerName(e.target.value)}
                      autoFocus
                      style={{ flex: 1, minWidth: '180px' }}
                    />
                    <button
                      type="button"
                      className="btn btn--primary"
                      style={{ padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}
                      onClick={() => {
                        const clean = editingProducerName.trim().replace(/👑/g, '').trim()
                        if (clean) {
                          const oldName = formData.producer || 'Zecution Gaming'
                          if (isPermanentPlatformName(oldName)) {
                            alert('Zecution Gaming kurucu yapımcıdır, adı değiştirilemez.')
                            return
                          }
                          updateProducer(oldName, clean)
                          setProducersList((prev) => prev.map((p) => (p.toLowerCase() === oldName.toLowerCase() ? clean : p)))
                          setFormData((prev) => ({ ...prev, producer: clean }))
                          setIsEditingProducer(false)
                        }
                      }}
                    >
                      Kaydet
                    </button>
                    {!isPermanentPlatformName(formData.producer) && (
                      <button
                        type="button"
                        style={{
                          padding: '0.5rem 0.85rem',
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          color: '#f87171',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          whiteSpace: 'nowrap',
                        }}
                        onClick={() => {
                          const target = formData.producer
                          if (window.confirm(`"${target}" yapımcısını listeden silmek istediğinize emin misiniz?`)) {
                            deleteProducer(target)
                            setProducersList((prev) => prev.filter((p) => p.toLowerCase() !== target.toLowerCase()))
                            setFormData((prev) => ({ ...prev, producer: 'Zecution Gaming' }))
                            setIsEditingProducer(false)
                          }
                        }}
                      >
                        Sil
                      </button>
                    )}
                    <button
                      type="button"
                      style={{
                        padding: '0.5rem 0.85rem',
                        background: 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#cbd5e1',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        whiteSpace: 'nowrap',
                      }}
                      onClick={() => setIsEditingProducer(false)}
                    >
                      İptal
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Yeni yapımcı adını yazın..."
                    value={newProducerName}
                    onChange={(e) => setNewProducerName(e.target.value)}
                    autoFocus
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn--primary"
                    style={{ padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}
                    onClick={() => {
                      const clean = newProducerName.trim().replace(/👑/g, '').trim()
                      if (clean) {
                        saveProducer(clean)
                        setProducersList((prev) => Array.from(new Set([...prev, clean])))
                        setFormData((prev) => ({ ...prev, producer: clean }))
                        setNewProducerName('')
                        setIsAddingNewProducer(false)
                      }
                    }}
                  >
                    Kaydet & Seç
                  </button>
                </div>
              )}
              <span style={{ fontSize: '0.75rem', color: '#ffffff80', marginTop: '0.35rem', display: 'block' }}>
                Seçtiğiniz yapımcı mod sayfasında özel kartıyla (gönderi sayısı, katılım yılı ve rozeti) gösterilir.
              </span>
            </div>

            <div className="form-field">
              <label htmlFor="shortDescription">Kısa Kart Açıklaması</label>
              <textarea
                id="shortDescription"
                name="shortDescription"
                rows={2}
                placeholder="Kartlarda görünecek 1-2 cümlelik açıklama..."
                value={formData.shortDescription}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label htmlFor="description">Detaylı Açıklama</label>
              <textarea
                id="description"
                name="description"
                rows={5}
                placeholder="Detay sayfasında görünecek kapsamlı açıklama..."
                value={formData.description}
                onChange={handleChange}
              />
            </div>
          </div>


        <div className="content-form-card">
            <h2 className="content-form-heading">Bölüm ve Kategori</h2>
            <div className="form-grid-2">
              <div className="form-field">
                <label htmlFor="section">Yayın Bölümü *</label>
                <select id="section" name="section" value={formData.section} onChange={handleChange}>
                  <option value="STORE">Mağaza (Ücretli / Sipariş)</option>
                  <option value="GALLERY">Mod Galerisi (İndirilebilir Modlar)</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="status">Yayın Durumu *</label>
                <select id="status" name="status" value={formData.status} onChange={handleChange}>
                  <option value="PUBLISHED">Yayında (Sitede Görünür)</option>
                  <option value="DRAFT">Taslak (Yalnızca Admin)</option>
                  <option value="ARCHIVED">Arşiv (Gizli)</option>
                </select>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-field">
                <label htmlFor="gameId">İlişkili Oyun</label>
                <select id="gameId" name="gameId" value={formData.gameId} onChange={handleChange}>
                  <option value="">Oyuna Bağlı Değil (3D Model vb.)</option>
                  {games.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="categoryId">Kategori</label>
                <small style={{ color: '#aaa' }}>Yalnızca alt kategorisi olmayan aktif kategorilere içerik eklenebilir.</small>
                <select id="categoryId" name="categoryId" value={formData.categoryId} onChange={handleChange}>
                  <option value="">Kategori Seçiniz</option>
                  {invalidCategory && <option value={formData.categoryId} disabled>Geçersiz kategori — alt kategori seçiniz</option>}
                  {availableCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.pathLabel}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-field">
                <label htmlFor="publishedAt">
                  Yayınlanma / Yapılış Tarihi *
                </label>
                <input
                  id="publishedAt"
                  name="publishedAt"
                  type="datetime-local"
                  value={formData.publishedAt}
                  onChange={handleChange}
                  style={{ colorScheme: 'dark' }}
                />
                <small style={{ color: '#aaa', fontSize: '0.78rem', marginTop: '0.2rem' }}>
                  Modun yapılış veya yayınlanma tarihi. Modları daha sonradan sisteme yükleseniz bile buraya girdiğiniz tarihe göre sıralanır.
                </small>
              </div>

              <div className="form-field" style={{ justifyContent: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', marginTop: '1.2rem' }}>
                  <input
                    name="isFeatured"
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={handleChange}
                    style={{ width: '1.2rem', height: '1.2rem' }}
                  />
                  <span>Öne Çıkarılan İçerik (Vitrin)</span>
                </label>
              </div>
            </div>
          </div>


        <div className="content-form-card">
            <h2 className="content-form-heading">{formData.section === 'STORE' ? 'Ücret Bilgileri' : 'Mod İndirme Bağlantısı'}</h2>

            {formData.section === 'STORE' && (
            <div className="form-grid-2">
              <div className="form-field">
                <label htmlFor="price">Fiyat (TL)</label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  placeholder="Örn: 250"
                  value={formData.price}
                  onChange={handleChange}
                />
              </div>

              <div className="form-field">
                <label htmlFor="priceLabel">Fiyat Etiketi / Buton Metni</label>
                <input
                  id="priceLabel"
                  name="priceLabel"
                  type="text"
                  placeholder="Örn: Fiyat için iletişime geç"
                  value={formData.priceLabel}
                  onChange={handleChange}
                />
              </div>
            </div>
            )}

            {formData.section === 'GALLERY' && (
            <div className="form-field">
              <label htmlFor="downloadUrl">Ücretsiz Mod İndirme Bağlantısı (Varsa)</label>
              <input
                id="downloadUrl"
                name="downloadUrl"
                type="url"
                placeholder="https://drive.google.com/... veya dosya linki"
                value={formData.downloadUrl}
                onChange={handleChange}
              />
            </div>
            )}
          </div>


        <div className="content-form-card">
            <h2 className="content-form-heading">Görseller</h2>
            {!isEdit ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#ffffff8c' }}>
                <p>Görsel yükleyebilmek için lütfen önce içeriği oluşturup kaydediniz.</p>
                <button
                  type="button"
                  onClick={handleSave}
                  style={{
                    padding: '0.65rem 1.25rem',
                    background: '#7f22c9',
                    color: '#fff',
                    borderRadius: '0.5rem',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  İçeriği Şimdi Kaydet
                </button>
              </div>
            ) : (
              <div>
                <div
                  style={{
                    border: '2px dashed rgba(255, 255, 255, 0.15)',
                    borderRadius: '0.85rem',
                    padding: '2rem',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                    id="media-file-input"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="media-file-input" style={{ cursor: 'pointer' }}>
                    <Upload size={32} style={{ color: '#d880ff', margin: '0 auto 0.75rem' }} />
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                      Görsel veya Video Yüklemek İçin Tıklayın veya Dosyaları Sürükleyin
                    </div>
                    <small style={{ color: '#ffffff73' }}>
                      PNG, JPG, WebP veya MP4, WebM (Cloudinary otomatik optimize eder)
                    </small>
                  </label>
                  {uploading && (
                    <div style={{ marginTop: '1rem', color: '#d880ff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <Loader2 className="animate-spin" size={18} />
                      <span>Medyalar işleniyor ve yükleniyor...</span>
                    </div>
                  )}
                </div>

                {mediaList.length > 0 && (
                  <div className="media-gallery-grid">
                    {mediaList.map((media) => {
                      const isVideo = media.mediaType === 'VIDEO' || /\.(mp4|webm|mov)(\?|$)/i.test(media.filePath)
                      return (
                        <div className="media-card" key={media.id}>
                          {isVideo ? (
                            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                              <img src={getMediaUrl(media.filePath || media.thumbnailPath)} alt="" />
                              <span style={{ position: 'absolute', bottom: '6px', left: '6px', background: 'rgba(0,0,0,0.7)', color: '#d880ff', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>VIDEO</span>
                            </div>
                          ) : (
                            <img src={getMediaUrl(media.filePath || media.thumbnailPath)} alt="" />
                          )}
                          {media.isCover && <span className="media-card-badge">Kapak</span>}
                          <div className="media-card-actions">
                            {!media.isCover && !isVideo && (
                              <button
                                type="button"
                                className="media-action-btn"
                                title="Kapak Görseli Yap"
                                onClick={() => handleSetCover(media.id)}
                              >
                                <Star size={14} />
                              </button>
                            )}
                            <button
                              type="button"
                              className="media-action-btn media-action-btn--delete"
                              title="Sil"
                              onClick={() => handleDeleteMedia(media.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>


        {/* Teknik özellikler */}
          <div className="content-form-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>Araç / Ürün Özellikleri</h3>
                <small style={{ color: '#ffffff73' }}>Örn: Motor - 1.4 TDI, Model - Detaylı kokpit vb.</small>
              </div>
              <button
                type="button"
                onClick={handleAddFeatureRow}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.85rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  borderRadius: '0.5rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Plus size={15} /> Satır Ekle
              </button>
            </div>

            {features.length === 0 ? (
              <p style={{ color: '#ffffff73', textAlign: 'center', padding: '2rem' }}>
                Henüz teknik özellik eklenmedi. "Satır Ekle" butonuna basarak ekleyebilirsiniz.
              </p>
            ) : (
              <div className="features-list">
                {features.map((feat, index) => (
                  <div className="feature-row" key={feat.id || index}>
                    <input
                      type="text"
                      placeholder="Özellik Adı (Örn: Motor)"
                      value={feat.label}
                      onChange={(e) => handleFeatureChange(index, 'label', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Değer (Örn: 1.4 TDI)"
                      value={feat.value}
                      onChange={(e) => handleFeatureChange(index, 'value', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveFeature(index)}
                      title="Kaydet"
                      style={{
                        padding: '0.65rem 0.85rem',
                        background: 'rgba(34, 197, 94, 0.2)',
                        border: '1px solid rgba(34, 197, 94, 0.4)',
                        color: '#4ade80',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                      }}
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteFeature(index)}
                      title="Sil"
                      style={{
                        padding: '0.65rem 0.85rem',
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#f87171',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

      </div>
    </div>
  )
}
