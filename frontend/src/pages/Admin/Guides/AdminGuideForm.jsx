import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Check,
  Folder,
  Image as ImageIcon,
  Layers,
  Lightbulb,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  UploadCloud,
  Wrench,
  X,
} from 'lucide-react'
import { FaYoutube } from 'react-icons/fa6'
import { api, getMediaUrl } from '../../../services/api.js'
import { adminPath } from '../../../config/routes.js'
import './AdminGuideForm.css'

const PRESET_IMAGES = [
  { label: 'Pure Yağmurlu Kokpit', url: '/media/images/pure-rain-preview.jpg' },
  { label: 'Tuning & Sim Laboratuvarı', url: '/media/images/cm-csp-preview.jpg' },
  { label: 'Assetto Corsa Araçlar', url: '/media/images/category-assetto-vehicles.jpg' },
  { label: 'BeamNG.drive Görseli', url: '/media/images/game-beamng.jpg' },
  { label: 'Online Sunucular', url: '/media/images/category-assetto-servers.jpg' },
  { label: 'Assetto Corsa Logo Arka Plan', url: '/media/images/game-assetto-corsa.png' },
]

export default function AdminGuideForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // Form Fields
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [game, setGame] = useState('Assetto Corsa')
  const [category, setCategory] = useState('Temel Kurulum')
  const [forumCategory, setForumCategory] = useState('Assetto Corsa / Temel Kurulum')
  const [time, setTime] = useState('8 dk okuma')
  const [difficulty, setDifficulty] = useState('Kolay')
  const [coverImage, setCoverImage] = useState('/media/images/game-assetto-corsa.png')
  const [summary, setSummary] = useState('')
  const [targetPath, setTargetPath] = useState('')
  const [isActive, setIsActive] = useState(true)

  // Dynamic Lists
  const [highlights, setHighlights] = useState(['Content Manager', 'CSP'])
  const [newHighlight, setNewHighlight] = useState('')

  const [requirements, setRequirements] = useState([
    'Steam üzerinden orijinal Assetto Corsa',
    'WinRAR veya 7-Zip arşiv yöneticisi',
  ])
  const [newRequirement, setNewRequirement] = useState('')

  const [uploadingStepIndex, setUploadingStepIndex] = useState(null)
  const [uploadingCover, setUploadingCover] = useState(false)

  const [steps, setSteps] = useState([
    {
      stepNumber: 1,
      title: 'Dosyaları İndirin ve Konumlandırın',
      description: 'Gerekli eklenti ve mod arşivini resmi bağlantıdan indirin. Arşiv içerisindeki dosyaları oyunun kök dizinine çıkartın.',
      images: ['/media/images/cm-csp-preview.jpg'],
      image: '/media/images/cm-csp-preview.jpg',
      tip: 'Yönetici olarak çalıştırmayı unutmayın.',
    },
  ])

  const [tips, setTips] = useState([
    'FPS kaybı yaşamamak için grafik ayarlarında SSLR kalitesini Medium seviyesinde tutun.',
  ])
  const [newTip, setNewTip] = useState('')

  const [troubleshooting, setTroubleshooting] = useState([
    {
      problem: 'Oyuna girerken siyah ekran kalıyor veya oyun çöküyor.',
      solution: 'Custom Shaders Patch menüsünden önceki kararlı sürüme geri dönmeyi deneyin.',
    },
  ])

  // YouTube Video
  const [hasYoutube, setHasYoutube] = useState(true)
  const [youtubeId, setYoutubeId] = useState('PDVR1IeUS0P')
  const [youtubeTitle, setYoutubeTitle] = useState('')
  const [youtubeChannel, setYoutubeChannel] = useState('Zecution Gaming')
  const [youtubeDuration, setYoutubeDuration] = useState('10:00')
  const [youtubeDesc, setYoutubeDesc] = useState('')

  useEffect(() => {
    if (!isEditing) return

    async function fetchGuide() {
      try {
        setLoading(true)
        setError('')
        const g = await api.adminGetGuide(id)
        if (!g) {
          setError('Rehber bulunamadı.')
          return
        }

        setTitle(g.title || '')
        setSlug(g.slug || '')
        setGame(g.game || 'Assetto Corsa')
        setCategory(g.category || 'Temel Kurulum')
        setForumCategory(g.forumCategory || '')
        setTime(g.time || '8 dk okuma')
        setDifficulty(g.difficulty || 'Kolay')
        setCoverImage(g.coverImage || '/media/images/game-assetto-corsa.png')
        setSummary(g.summary || '')
        setTargetPath(g.targetPath || '')
        setIsActive(g.isActive !== false)

        setHighlights(Array.isArray(g.highlights) ? g.highlights : [])
        setRequirements(Array.isArray(g.requirements) ? g.requirements : [])
        setSteps(
          Array.isArray(g.steps) && g.steps.length > 0
            ? g.steps.map((st, i) => {
                const imgs = Array.isArray(st.images) && st.images.length > 0
                  ? st.images
                  : (st.image ? [st.image] : [])
                return {
                  stepNumber: st.stepNumber || i + 1,
                  title: st.title || '',
                  description: st.description || '',
                  images: imgs,
                  image: imgs[0] || '',
                  tip: st.tip || '',
                }
              })
            : [
                {
                  stepNumber: 1,
                  title: '',
                  description: '',
                  images: [],
                  image: '',
                  tip: '',
                },
              ]
        )
        setTips(Array.isArray(g.tips) ? g.tips : [])
        setTroubleshooting(Array.isArray(g.troubleshooting) ? g.troubleshooting : [])

        if (g.youtubeVideo && g.youtubeVideo.id) {
          setHasYoutube(true)
          setYoutubeId(g.youtubeVideo.id)
          setYoutubeTitle(g.youtubeVideo.title || '')
          setYoutubeChannel(g.youtubeVideo.channel || '')
          setYoutubeDuration(g.youtubeVideo.duration || '')
          setYoutubeDesc(g.youtubeVideo.description || '')
        } else {
          setHasYoutube(false)
        }
      } catch (err) {
        setError(err.message || 'Rehber verileri alınamadı.')
      } finally {
        setLoading(false)
      }
    }

    fetchGuide()
  }, [id, isEditing])

  // Extract YouTube ID from full URL if pasted
  const handleYoutubeInput = (val) => {
    let cleanVal = val.trim()
    if (cleanVal.includes('youtube.com/watch?v=')) {
      const match = cleanVal.match(/v=([a-zA-Z0-9_-]+)/)
      if (match && match[1]) cleanVal = match[1]
    } else if (cleanVal.includes('youtu.be/')) {
      const match = cleanVal.match(/youtu\.be\/([a-zA-Z0-9_-]+)/)
      if (match && match[1]) cleanVal = match[1]
    }
    setYoutubeId(cleanVal)
  }

  // Steps Handlers
  const handleAddStep = () => {
    setSteps((prev) => [
      ...prev,
      {
        stepNumber: prev.length + 1,
        title: '',
        description: '',
        images: [],
        image: '',
        tip: '',
      },
    ])
  }

  const handleUpdateStep = (index, field, value) => {
    setSteps((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const handleRemoveStep = (index) => {
    if (steps.length <= 1) {
      alert('En az bir adım bulunmalıdır.')
      return
    }
    setSteps((prev) => {
      const filtered = prev.filter((_, i) => i !== index)
      return filtered.map((s, idx) => ({ ...s, stepNumber: idx + 1 }))
    })
  }

  const handleUploadStepImages = async (stepIndex, fileList) => {
    if (!fileList || fileList.length === 0) return
    try {
      setUploadingStepIndex(stepIndex)
      setError('')
      const res = await api.adminUploadGuideImages(fileList)
      if (res && Array.isArray(res.urls) && res.urls.length > 0) {
        setSteps((prev) => {
          const next = [...prev]
          const curImages = Array.isArray(next[stepIndex].images)
            ? next[stepIndex].images
            : (next[stepIndex].image ? [next[stepIndex].image] : [])
          const merged = [...curImages, ...res.urls]
          next[stepIndex] = {
            ...next[stepIndex],
            images: merged,
            image: merged[0] || '',
          }
          return next
        })
        setNotice(`${res.urls.length} adet görsel başarıyla VDS sunucusuna yüklendi!`)
        setTimeout(() => setNotice(''), 3500)
      }
    } catch (err) {
      setError(err.message || 'Görsel yüklenirken bir hata oluştu.')
    } finally {
      setUploadingStepIndex(null)
    }
  }

  const handleUploadCoverImage = async (file) => {
    if (!file) return
    try {
      setUploadingCover(true)
      setError('')
      const res = await api.adminUploadGuideImages([file])
      if (res && Array.isArray(res.urls) && res.urls.length > 0) {
        setCoverImage(res.urls[0])
        setNotice('Kapak görseli başarıyla VDS sunucusuna yüklendi!')
        setTimeout(() => setNotice(''), 3500)
      }
    } catch (err) {
      setError(err.message || 'Kapak görseli yüklenirken bir hata oluştu.')
    } finally {
      setUploadingCover(false)
    }
  }

  const handleRemoveStepImage = (stepIndex, imgIndex) => {
    setSteps((prev) => {
      const next = [...prev]
      const curImages = Array.isArray(next[stepIndex].images)
        ? next[stepIndex].images
        : (next[stepIndex].image ? [next[stepIndex].image] : [])
      const updated = curImages.filter((_, i) => i !== imgIndex)
      next[stepIndex] = {
        ...next[stepIndex],
        images: updated,
        image: updated[0] || '',
      }
      return next
    })
  }

  const handleAddManualStepImage = (stepIndex, url) => {
    if (!url || !url.trim()) return
    const cleanUrl = url.trim()
    setSteps((prev) => {
      const next = [...prev]
      const curImages = Array.isArray(next[stepIndex].images)
        ? next[stepIndex].images
        : (next[stepIndex].image ? [next[stepIndex].image] : [])
      if (curImages.includes(cleanUrl)) return prev
      const updated = [...curImages, cleanUrl]
      next[stepIndex] = {
        ...next[stepIndex],
        images: updated,
        image: updated[0] || '',
      }
      return next
    })
  }

  // Highlights Handlers
  const handleAddHighlight = () => {
    if (!newHighlight.trim()) return
    setHighlights((prev) => [...prev, newHighlight.trim()])
    setNewHighlight('')
  }

  const handleRemoveHighlight = (idx) => {
    setHighlights((prev) => prev.filter((_, i) => i !== idx))
  }

  // Requirements Handlers
  const handleAddRequirement = () => {
    if (!newRequirement.trim()) return
    setRequirements((prev) => [...prev, newRequirement.trim()])
    setNewRequirement('')
  }

  const handleRemoveRequirement = (idx) => {
    setRequirements((prev) => prev.filter((_, i) => i !== idx))
  }

  // Tips Handlers
  const handleAddTip = () => {
    if (!newTip.trim()) return
    setTips((prev) => [...prev, newTip.trim()])
    setNewTip('')
  }

  const handleRemoveTip = (idx) => {
    setTips((prev) => prev.filter((_, i) => i !== idx))
  }

  // Troubleshooting Handlers
  const handleAddTroubleshoot = () => {
    setTroubleshooting((prev) => [
      ...prev,
      { problem: 'Örnek Hata Başlığı', solution: 'Örnek Çözüm Açıklaması' },
    ])
  }

  const handleUpdateTroubleshoot = (index, field, value) => {
    setTroubleshooting((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const handleRemoveTroubleshoot = (index) => {
    setTroubleshooting((prev) => prev.filter((_, i) => i !== index))
  }

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!title.trim()) {
      alert('Lütfen rehber başlığını girin.')
      return
    }

    try {
      setSaving(true)
      setError('')

      const payload = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        game,
        category,
        forumCategory: forumCategory.trim() || `${game} / ${category}`,
        time: time.trim(),
        difficulty,
        coverImage: coverImage.trim(),
        summary: summary.trim(),
        targetPath: targetPath.trim(),
        isActive,
        highlights,
        requirements,
        steps: steps.map((s, idx) => {
          const imgs = Array.isArray(s.images) && s.images.length > 0
            ? s.images.filter(Boolean)
            : (s.image?.trim() ? [s.image.trim()] : [])
          return {
            stepNumber: idx + 1,
            title: s.title?.trim() || '',
            description: s.description?.trim() || '',
            images: imgs,
            image: imgs[0] || '',
            tip: s.tip?.trim() || '',
          }
        }),
        tips,
        troubleshooting,
        youtubeVideo: hasYoutube && youtubeId.trim()
          ? {
              id: youtubeId.trim(),
              title: youtubeTitle.trim() || `${title} Video Rehberi`,
              channel: youtubeChannel.trim() || 'Zecution Gaming',
              duration: youtubeDuration.trim() || '10:00',
              description: youtubeDesc.trim(),
            }
          : null,
      }

      if (isEditing) {
        await api.adminUpdateGuide(id, payload)
        setNotice('Rehber başarıyla güncellendi.')
      } else {
        await api.adminCreateGuide(payload)
        setNotice('Yeni rehber başarıyla oluşturuldu.')
      }

      setTimeout(() => {
        navigate(adminPath('rehberler'))
      }, 1000)
    } catch (err) {
      setError(err.message || 'Kayıt sırasında bir hata oluştu.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-loading-state">
        <Loader2 className="animate-spin" size={32} />
        <span>Rehber yükleniyor...</span>
      </div>
    )
  }

  return (
    <div className="admin-guide-form-page">
      {/* Header */}
      <div className="admin-form-header">
        <div>
          <Link to={adminPath('rehberler')} className="admin-back-link">
            <ArrowLeft size={16} /> Rehber Listesine Dön
          </Link>
          <h1 className="admin-page-title">
            <BookOpen size={24} className="text-violet" />
            {isEditing ? 'Rehberi Düzenle & Özelleştir' : 'Yeni Rehber Ekle'}
          </h1>
          <p className="admin-page-desc">
            Rehber adımlarını, görsellerini, kod ve klasör yollarını, püf noktalarını ve YouTube video desteğini özelleştirin.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="admin-btn admin-btn--primary"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {isEditing ? 'Değişiklikleri Kaydet' : 'Rehberi Yayınla'}
        </button>
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

      <form onSubmit={handleSubmit} className="admin-guide-form">
        {/* 1. Basic Info */}
        <section className="admin-form-section">
          <div className="admin-section-title">
            <Layers size={18} className="text-violet" />
            <h3>1. Genel Bilgiler & Kategori</h3>
          </div>

          <div className="admin-form-grid">
            <div className="form-group span-2">
              <label>Rehber Başlığı *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Pure Grafik Modu & Yağmur (Rain FX) Kurulum Rehberi"
                required
              />
            </div>

            <div className="form-group">
              <label>Özel URL (Slug)</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="Boş bırakılırsa başlıktan otomatik üretilir"
              />
            </div>

            <div className="form-group">
              <label>İlgili Oyun</label>
              <select value={game} onChange={(e) => setGame(e.target.value)}>
                <option value="Assetto Corsa">Assetto Corsa</option>
                <option value="BeamNG.drive">BeamNG.drive</option>
                <option value="Euro Truck Simulator 2">Euro Truck Simulator 2</option>
                <option value="Assetto Corsa & BeamNG">Assetto Corsa & BeamNG</option>
                <option value="Genel Simülasyon">Genel Simülasyon</option>
              </select>
            </div>

            <div className="form-group">
              <label>Kategori</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Temel Kurulum">Temel Kurulum</option>
                <option value="Grafik & CSP">Grafik & CSP</option>
                <option value="Mod Yükleme">Mod Yükleme</option>
                <option value="Çok Oyunculu">Çok Oyunculu</option>
                <option value="Donanım & Ayarlar">Donanım & Ayarlar</option>
              </select>
            </div>

            <div className="form-group">
              <label>Forum Kategori Başlığı</label>
              <input
                type="text"
                value={forumCategory}
                onChange={(e) => setForumCategory(e.target.value)}
                placeholder="Örn: Assetto Corsa / Grafik Motorları & Hava Durumu"
              />
            </div>

            <div className="form-group">
              <label>Okuma Süresi</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="Örn: 8 dk okuma"
              />
            </div>

            <div className="form-group">
              <label>Zorluk Seviyesi</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="Çok Kolay">Çok Kolay</option>
                <option value="Kolay">Kolay</option>
                <option value="Orta">Orta</option>
                <option value="İleri Seviye">İleri Seviye</option>
              </select>
            </div>

            <div className="form-group">
              <label>Yayın Durumu</label>
              <select
                value={isActive ? 'true' : 'false'}
                onChange={(e) => setIsActive(e.target.value === 'true')}
              >
                <option value="true">Yayında (Herkes Görebilir)</option>
                <option value="false">Taslak (Gizli)</option>
              </select>
            </div>
          </div>
        </section>

        {/* 2. Cover Image & Visual */}
        <section className="admin-form-section">
          <div className="admin-section-title">
            <Folder size={18} className="text-violet" />
            <h3>2. Kapak Görseli & Tanıtım Vitrini</h3>
          </div>

          <div className="form-group">
            <label>Kapak Görseli Yükle veya Belirle</label>

            {/* Bilgisayardan VDS'e Yükleme Butonu */}
            <div className="cover-upload-bar">
              <label className="admin-cover-upload-btn">
                {uploadingCover ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>VDS Sunucusuna Yükleniyor...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={17} />
                    <span>Bilgisayardan Kapak Görseli Yükle (VDS'e Kaydet)</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  style={{ display: 'none' }}
                  disabled={uploadingCover}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleUploadCoverImage(e.target.files[0])
                      e.target.value = ''
                    }
                  }}
                />
              </label>
              <span className="cover-upload-hint">
                PNG, JPG veya WEBP seçin. Görsel doğrudan VDS sunucunuza yüklenip kapak olarak atanır.
              </span>
            </div>

            <div className="cover-url-input-wrap">
              <input
                type="text"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="/media/images/pure-rain-preview.jpg veya https://..."
              />
              {coverImage && (
                <button
                  type="button"
                  className="cover-clear-btn"
                  onClick={() => setCoverImage('')}
                  title="Görseli Temizle"
                >
                  <X size={14} /> Temizle
                </button>
              )}
            </div>
          </div>

          <div className="preset-images-row">
            <span className="preset-label">Veya Hazır Vitrin Görsellerinden Seç:</span>
            {PRESET_IMAGES.map((img, i) => (
              <button
                key={i}
                type="button"
                className={`preset-img-btn ${coverImage === img.url ? 'is-selected' : ''}`}
                onClick={() => setCoverImage(img.url)}
              >
                {img.label}
              </button>
            ))}
          </div>

          {coverImage && (
            <div className="cover-preview-box">
              <span>Görsel Önizlemesi:</span>
              <img
                src={getMediaUrl(coverImage)}
                alt="Kapak Önizleme"
                className="cover-preview-img"
              />
            </div>
          )}
        </section>

        {/* 3. Summary & Target Directory */}
        <section className="admin-form-section">
          <div className="admin-section-title">
            <Wrench size={18} className="text-violet" />
            <h3>3. Giriş Özeti & Hedef Dizin Yolu</h3>
          </div>

          <div className="form-group">
            <label>Giriş & Özet Metni *</label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Rehberin konusunu ve oyuncunun neler kazanacağını anlatan 2-3 cümlelik açıklama..."
              required
            />
          </div>

          <div className="form-group">
            <label>Varsayılan Dizin / Klasör Yolu</label>
            <input
              type="text"
              value={targetPath}
              onChange={(e) => setTargetPath(e.target.value)}
              placeholder="Örn: C:\Program Files (x86)\Steam\steamapps\common\assettocorsa"
            />
            <small>Kullanıcıların tek tıkla kopyalayabileceği hedef oyun dizini.</small>
          </div>
        </section>

        {/* 4. Highlights & Prerequisites */}
        <section className="admin-form-section">
          <div className="admin-section-title">
            <Check size={18} className="text-violet" />
            <h3>4. Ön Gereksinimler & Konu Etiketleri</h3>
          </div>

          {/* Highlights */}
          <div className="form-group">
            <label>Öne Çıkan Etiketler (Hashtags)</label>
            <div className="dynamic-chips-row">
              {highlights.map((h, i) => (
                <span key={i} className="chip-pill">
                  #{h}
                  <button type="button" onClick={() => handleRemoveHighlight(i)}>
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="chip-add-row">
              <input
                type="text"
                value={newHighlight}
                onChange={(e) => setNewHighlight(e.target.value)}
                placeholder="Yeni etiket (örn: RainFX)"
              />
              <button type="button" onClick={handleAddHighlight} className="admin-mini-btn">
                <Plus size={15} /> Ekle
              </button>
            </div>
          </div>

          {/* Requirements */}
          <div className="form-group">
            <label>Kurulum Ön Gereksinimleri (Liste)</label>
            <ul className="admin-checklist">
              {requirements.map((req, i) => (
                <li key={i}>
                  <Check size={14} className="text-green" />
                  <span>{req}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRequirement(i)}
                    className="delete-item-btn"
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="chip-add-row">
              <input
                type="text"
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                placeholder="Yeni gereksinim (örn: Content Manager v0.8+)"
              />
              <button type="button" onClick={handleAddRequirement} className="admin-mini-btn">
                <Plus size={15} /> Gereksinim Ekle
              </button>
            </div>
          </div>
        </section>

        {/* 5. Step-by-Step Illustrated Customizer */}
        <section className="admin-form-section">
          <div className="admin-section-title">
            <BookOpen size={18} className="text-violet" />
            <h3>5. Adım Adım Kurulum Anlatımı ({steps.length} Adım)</h3>
            <button
              type="button"
              onClick={handleAddStep}
              className="admin-mini-btn admin-mini-btn--accent"
            >
              <Plus size={15} /> Yeni Adım Ekle
            </button>
          </div>

          <div className="admin-steps-editor">
            {steps.map((step, idx) => {
              const stepImages = Array.isArray(step.images) && step.images.length > 0
                ? step.images
                : (step.image ? [step.image] : [])

              return (
                <div key={idx} className="admin-step-card">
                  <div className="step-card-header">
                    <span className="step-order-badge">ADIM {step.stepNumber}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveStep(idx)}
                      className="delete-step-btn"
                      title="Bu Adımı Sil"
                    >
                      <Trash2 size={15} /> Adımı Sil
                    </button>
                  </div>

                  <div className="step-card-fields">
                    <div className="form-group">
                      <label>Adım Başlığı *</label>
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) => handleUpdateStep(idx, 'title', e.target.value)}
                        placeholder="Örn: 1. Yöntem: Content Manager ile Otomatik Yükleme (Önerilen)"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Açıklama *</label>
                      <textarea
                        rows={3}
                        value={step.description}
                        onChange={(e) => handleUpdateStep(idx, 'description', e.target.value)}
                        placeholder="Bu adımda yapılması gerekenleri düz ve anlaşılır bir dille açıklayın..."
                        required
                      />
                    </div>

                    {/* Multi-Image Upload & Presets */}
                    <div className="form-group">
                      <div className="step-images-label-row">
                        <label>
                          <ImageIcon size={15} className="text-violet" /> Destekleyici Görseller (Sunucuya Yükle / Çoklu)
                        </label>
                        {stepImages.length > 0 && (
                          <span className="step-images-count-badge">
                            {stepImages.length} Görsel Eklendi
                          </span>
                        )}
                      </div>

                      <div className="step-upload-box">
                        {/* VDS File Upload Button */}
                        <div className="step-upload-actions">
                          <label className={`step-upload-btn ${uploadingStepIndex === idx ? 'is-uploading' : ''}`}>
                            {uploadingStepIndex === idx ? (
                              <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>VDS Sunucuya Yükleniyor...</span>
                              </>
                            ) : (
                              <>
                                <UploadCloud size={16} />
                                <span>VDS Sunucusuna Görsel Yükle (Tekli veya Çoklu Seç)</span>
                              </>
                            )}
                            <input
                              type="file"
                              multiple
                              accept="image/png, image/jpeg, image/webp"
                              disabled={uploadingStepIndex === idx}
                              onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                  handleUploadStepImages(idx, e.target.files)
                                  e.target.value = ''
                                }
                              }}
                              style={{ display: 'none' }}
                            />
                          </label>
                        </div>

                        {/* Manual URL Input */}
                        <div className="step-url-add-row">
                          <input
                            type="text"
                            placeholder="veya doğrudan görsel URL / dizin yolu yapıştırın..."
                            id={`step-manual-url-${idx}`}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleAddManualStepImage(idx, e.target.value)
                                e.target.value = ''
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="admin-mini-btn"
                            onClick={() => {
                              const inp = document.getElementById(`step-manual-url-${idx}`)
                              if (inp && inp.value.trim()) {
                                handleAddManualStepImage(idx, inp.value.trim())
                                inp.value = ''
                              }
                            }}
                          >
                            <Plus size={14} /> Ekle
                          </button>
                        </div>

                        {/* Quick Presets */}
                        <div className="step-image-presets">
                          <span className="preset-label">Hızlı Seçim:</span>
                          {[
                            { label: '+ CM & CSP', url: '/media/images/cm-csp-preview.jpg' },
                            { label: '+ Pure & Yağmur', url: '/media/images/pure-rain-preview.jpg' },
                            { label: '+ Araç & Mod', url: '/media/images/car-track-mod-preview.jpg' },
                            { label: '+ Sunucular', url: '/media/images/category-assetto-servers.jpg' },
                            { label: '+ BeamNG', url: '/media/images/game-beamng.jpg' },
                          ].map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              className="step-preset-btn"
                              onClick={() => handleAddManualStepImage(idx, preset.url)}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>

                        {/* Uploaded Images Gallery for this step */}
                        {stepImages.length > 0 && (
                          <div className="step-uploaded-gallery">
                            {stepImages.map((imgUrl, imgIdx) => (
                              <div key={imgIdx} className="step-gallery-item">
                                <span className="step-gallery-badge">#{imgIdx + 1}</span>
                                <img
                                  src={getMediaUrl(imgUrl)}
                                  alt={`Adım ${step.stepNumber} - Görsel ${imgIdx + 1}`}
                                  onError={(e) => {
                                    e.currentTarget.src = '/media/images/logo.jpg'
                                  }}
                                />
                                <div className="step-gallery-overlay">
                                  <span className="step-gallery-filename" title={imgUrl}>
                                    {imgUrl.split('/').pop()}
                                  </span>
                                  <button
                                    type="button"
                                    className="step-gallery-remove-btn"
                                    onClick={() => handleRemoveStepImage(idx, imgIdx)}
                                    title="Bu görseli adımdan kaldır"
                                  >
                                    <Trash2 size={13} /> Kaldır
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Püf Noktası (Varsa)</label>
                      <input
                        type="text"
                        value={step.tip || ''}
                        onChange={(e) => handleUpdateStep(idx, 'tip', e.target.value)}
                        placeholder="Varsa bu adıma özel püf noktası veya önemli not yazın... (Yoksa boş bırakabilirsiniz)"
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* 6. Tips & Troubleshooting */}
        <section className="admin-form-section">
          <div className="admin-section-title">
            <Lightbulb size={18} className="text-yellow" />
            <h3>6. Püf Noktaları & Sık Karşılaşılan Hatalar</h3>
          </div>

          {/* Tips */}
          <div className="form-group">
            <label>Genel Püf Noktaları</label>
            <ul className="admin-checklist">
              {tips.map((t, i) => (
                <li key={i}>
                  <Lightbulb size={14} className="text-yellow" />
                  <span>{t}</span>
                  <button type="button" onClick={() => handleRemoveTip(i)} className="delete-item-btn">
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="chip-add-row">
              <input
                type="text"
                value={newTip}
                onChange={(e) => setNewTip(e.target.value)}
                placeholder="Yeni püf noktası tavsiyesi..."
              />
              <button type="button" onClick={handleAddTip} className="admin-mini-btn">
                <Plus size={15} /> Tavsiye Ekle
              </button>
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="form-group" style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <label style={{ margin: 0 }}>Hata & Çözüm Listesi</label>
              <button type="button" onClick={handleAddTroubleshoot} className="admin-mini-btn">
                <Plus size={15} /> Yeni Hata Ekle
              </button>
            </div>

            <div className="admin-troubleshoot-editor">
              {troubleshooting.map((item, idx) => (
                <div key={idx} className="troubleshoot-edit-card">
                  <div className="troubleshoot-edit-header">
                    <span>Hata #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTroubleshoot(idx)}
                      className="delete-item-btn"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={item.problem}
                    onChange={(e) => handleUpdateTroubleshoot(idx, 'problem', e.target.value)}
                    placeholder="Hata Tanımı (Örn: Can't patch game executable)"
                  />
                  <textarea
                    rows={2}
                    value={item.solution}
                    onChange={(e) => handleUpdateTroubleshoot(idx, 'solution', e.target.value)}
                    placeholder="Çözüm Anlatımı (Örn: Programı yönetici olarak başlatın)"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. YouTube Video Support */}
        <section className="admin-form-section">
          <div className="admin-section-title">
            <FaYoutube size={20} className="text-red" />
            <h3>7. Gömülü YouTube Video Anlatımı</h3>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={hasYoutube}
                onChange={(e) => setHasYoutube(e.target.checked)}
              />
              <span>Videoyu Aktif Et</span>
            </label>
          </div>

          {hasYoutube && (
            <div className="admin-form-grid">
              <div className="form-group span-2">
                <label>YouTube Video ID veya Linki</label>
                <input
                  type="text"
                  value={youtubeId}
                  onChange={(e) => handleYoutubeInput(e.target.value)}
                  placeholder="Örn: PDVR1IeUS0P veya https://www.youtube.com/watch?v=PDVR1IeUS0P"
                />
                <small>Bağlantıyı direkt yapıştırabilirsiniz; sistem video ID'sini otomatik ayıklar.</small>
              </div>

              <div className="form-group">
                <label>Video Başlığı</label>
                <input
                  type="text"
                  value={youtubeTitle}
                  onChange={(e) => setYoutubeTitle(e.target.value)}
                  placeholder="Assetto Corsa Video Kurulumu"
                />
              </div>

              <div className="form-group">
                <label>Kanal Adı</label>
                <input
                  type="text"
                  value={youtubeChannel}
                  onChange={(e) => setYoutubeChannel(e.target.value)}
                  placeholder="Zecution Gaming Sim Ekibi"
                />
              </div>

              <div className="form-group">
                <label>Video Süresi</label>
                <input
                  type="text"
                  value={youtubeDuration}
                  onChange={(e) => setYoutubeDuration(e.target.value)}
                  placeholder="Örn: 12:30"
                />
              </div>

              <div className="form-group span-2">
                <label>Video Açıklaması</label>
                <textarea
                  rows={2}
                  value={youtubeDesc}
                  onChange={(e) => setYoutubeDesc(e.target.value)}
                  placeholder="Bu videoda kurulumun canlı uygulaması gösterilmektedir..."
                />
              </div>

              {youtubeId && (
                <div className="video-preview-col span-2">
                  <span className="preset-label">Video Canlı Önizleme:</span>
                  <div className="admin-video-embed">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
                      title="YouTube Önizleme"
                      frameBorder="0"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Submit Actions */}
        <div className="admin-form-bottom-actions">
          <Link to={adminPath('rehberler')} className="admin-btn admin-btn--secondary">
            İptal
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="admin-btn admin-btn--primary"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isEditing ? 'Değişiklikleri Kaydet' : 'Rehberi Yayınla'}
          </button>
        </div>
      </form>
    </div>
  )
}
