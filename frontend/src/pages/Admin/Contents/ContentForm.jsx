import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  Loader2,
  Plus,
  Save,
  Star,
  Trash2,
  Upload,
} from 'lucide-react'
import { api, getMediaUrl } from '../../../services/api.js'
import './ContentForm.css'
import { categoryRows } from '../../../utils/categories.js'

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
    status: 'DRAFT',
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
  })

  const [games, setGames] = useState([])
  const [categories, setCategories] = useState([])
  const [mediaList, setMediaList] = useState([])
  const [features, setFeatures] = useState([])

  // Veri yükleme
  useEffect(() => {
    let isMounted = true

    async function initialize() {
      try {
        const [gamesRes, categoriesRes] = await Promise.all([
          api.getGames(),
          api.getAdminCategories(),
        ])

        if (!isMounted) return
        setGames(gamesRes)
        setCategories(categoriesRes)

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
      status: isEdit ? formData.status : 'DRAFT',
      saleMethod: formData.section === 'STORE' ? 'CONTACT' : 'FREE',
      price: formData.section === 'STORE' && formData.price ? Number(formData.price) : null,
      priceLabel: formData.section === 'STORE' ? formData.priceLabel : null,
      downloadUrl: formData.section === 'GALLERY' ? formData.downloadUrl : null,
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
        navigate(`/admin/icerikler/${savedContent.id}/duzenle`, { replace: true })
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
            onClick={() => navigate('/admin/icerikler')}
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
              <label htmlFor="producer">Yapımcı</label>
              <input
                id="producer"
                name="producer"
                type="text"
                value={formData.producer}
                onChange={handleChange}
              />
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

              {isEdit && (
              <div className="form-field">
                <label htmlFor="status">Yayın Durumu *</label>
                <select id="status" name="status" value={formData.status} onChange={handleChange}>
                  <option value="DRAFT">Taslak (Yalnızca Admin)</option>
                  <option value="PUBLISHED">Yayında (Sitede Görünür)</option>
                  <option value="ARCHIVED">Arşiv (Gizli)</option>
                </select>
              </div>
              )}
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

              <div className="form-field" style={{ justifyContent: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}>
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
                              <img src={getMediaUrl(media.thumbnailPath || media.filePath)} alt="" />
                              <span style={{ position: 'absolute', bottom: '6px', left: '6px', background: 'rgba(0,0,0,0.7)', color: '#d880ff', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>VIDEO</span>
                            </div>
                          ) : (
                            <img src={getMediaUrl(media.thumbnailPath || media.filePath)} alt="" />
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
