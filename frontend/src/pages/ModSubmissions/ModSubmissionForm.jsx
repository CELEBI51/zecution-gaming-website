import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Loader2,
  Sparkles,
  UploadCloud,
  FileText,
  User,
  Layers,
  Image as ImageIcon,
  ShieldCheck,
} from 'lucide-react'
import { api } from '../../services/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import './ModSubmissionForm.css'

export default function ModSubmissionForm() {
  const { user, openAuthModal } = useAuth()

  const [form, setForm] = useState({
    producerName: user?.username || '',
    discord: '',
    title: '',
    game: 'Assetto Corsa',
    category: 'Araç',
    version: '',
    description: '',
    downloadUrl: '',
    trailerUrl: '',
    saleType: 'FREE',
    suggestedPrice: '',
    hasPermission: false,
    website: '', // Honeypot
  })

  // Kullanıcı oturum açtıysa otomatik doldur
  useEffect(() => {
    if (user && !form.producerName) {
      setForm((prev) => ({
        ...prev,
        producerName: user.username || '',
      }))
    }
  }, [user, form.producerName])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState(null)
  const [photos, setPhotos] = useState([])
  const [previews, setPreviews] = useState([])
  const [photoError, setPhotoError] = useState('')

  useEffect(() => {
    const urls = photos.map((file) => URL.createObjectURL(file))
    setPreviews(urls)
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [photos])

  function handlePhotoAdd(event) {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    setPhotoError('')

    if (photos.length + files.length > 5) {
      return setPhotoError('En fazla 5 fotoğraf ekleyebilirsiniz.')
    }
    if (files.some((file) => file.size > 5 * 1024 * 1024)) {
      return setPhotoError('Her fotoğraf en fazla 5 MB olabilir.')
    }
    if (files.some((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) {
      return setPhotoError('Yalnızca JPG, PNG ve WebP fotoğrafları kabul edilir.')
    }

    setPhotos((prev) => [...prev, ...files])
  }

  const submissionId = useRef(null)
  const inFlight = useRef(false)
  const resultRef = useRef(null)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (inFlight.current) return

    if (!user) {
      openAuthModal('login')
      return
    }

    if (!form.hasPermission) {
      setError('Lütfen modun telif/dağıtım izinlerine sahip olduğunuzu onaylayınız.')
      return
    }

    inFlight.current = true
    setSaving(true)
    setError('')

    try {
      submissionId.current ||= crypto.randomUUID()
      const payload = {
        ...form,
        submissionId: submissionId.current,
        hasPermission: String(form.hasPermission),
      }

      const result = await api.createModSubmission(payload, photos)
      setReceipt(result)
      setPhotos([])
      requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    } catch (err) {
      const msg =
        err?.details?.map((d) => d.message).join(' · ') ||
        err?.message ||
        'Başvuru gönderilemedi. Lütfen bilgilerinizi kontrol edip tekrar deneyiniz.'
      setError(msg)
    } finally {
      inFlight.current = false
      setSaving(false)
    }
  }

  return (
    <div className="modsub-page">
      <header className="modsub-header">
        <Link to="/" className="modsub-brand">
          <img src="/media/images/logo.jpg" alt="Zecution Gaming Logo" />
          <span>Zecution Gaming</span>
        </Link>
        <Link to="/modlar">
          <ArrowLeft size={16} /> Mod Galerisi
        </Link>
      </header>

      <main className="modsub-layout">
        {/* Sol Tanıtım Bölümü */}
        <section className="modsub-intro">
          <div className="modsub-eyebrow">
            <Sparkles size={14} />
            <span>Mod Üretici Başvurusu</span>
          </div>
          <h1>
            Sen Üret, <br />
            <span>Zecution’da</span> Yayınlansın.
          </h1>
          <p>
            Yarattığın araçları, pistleri, sesleri veya fizik paketlerini binlerce simülasyon ve yarış tutkunuyla buluştur.
            Başvurunu gönder, editörlerimiz incelesin ve platformumuzda yerini alsın.
          </p>

          <ol className="modsub-steps">
            <li>
              <div className="modsub-step-text">
                <strong>Modunu ve Dosyalarını Paylaş</strong>
                <span>Modunun detaylarını, indirme linkini ve tanıtım görsellerini form üzerinden ilet.</span>
              </div>
            </li>
            <li>
              <div className="modsub-step-text">
                <strong>Teknik İnceleme ve Test</strong>
                <span>Ekibimiz modun kararlılığını, kalitesini ve telif kurallarını kısa sürede test eder.</span>
              </div>
            </li>
            <li>
              <div className="modsub-step-text">
                <strong>Sitede Yayına Alınsın</strong>
                <span>Onaylanan modun kendi adınla / stüdyonla Zecution Gaming mod kütüphanesinde listelensin.</span>
              </div>
            </li>
          </ol>
        </section>

        {/* Sağ Form Bölümü */}
        {receipt ? (
          <section className="modsub-card modsub-success" ref={resultRef} tabIndex={-1} role="status">
            <div className="modsub-success-icon">
              <CheckCircle2 size={36} />
            </div>
            <h2>Başvurunuz Alındı!</h2>
            <p>
              Tebrikler! <strong>{form.title || 'Modunuz'}</strong> için yayınlama başvurusu başarıyla tarafımıza ulaştı.
              Ekibimiz inceledikten sonra belirttiğiniz iletişim adresleri üzerinden size dönüş yapacaktır.
            </p>

            <div className="modsub-tracking-box">
              <span>Başvuru Takip Kodu</span>
              <code>{receipt.id}</code>
            </div>

            <Link className="modsub-button" to="/modlar" style={{ textDecoration: 'none' }}>
              Mod Galerisine Dön <ArrowUpRight size={18} />
            </Link>
          </section>
        ) : (
          <form className="modsub-card modsub-form" onSubmit={handleSubmit}>
            <div className="modsub-card-header">
              <h2>Mod Yayınlama İsteği</h2>
              <p className="modsub-hint">
                * işaretli alanlar zorunludur. Dosyalarınızı ModsFire, Google Drive, Mega veya benzeri bir güvenilir sağlayıcıya yükleyip linkini paylaşabilirsiniz.
              </p>
            </div>

            {error && (
              <div className="modsub-error" role="alert">
                {error}
              </div>
            )}

            <fieldset disabled={saving} style={{ border: 0, padding: 0, margin: 0 }}>
              {/* Bal Tuzağı (Spam Bot Koruması) */}
              <input
                type="text"
                name="website"
                className="modsub-trap"
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={handleChange}
              />

              {/* 1. YAPIMCI BİLGİLERİ */}
              <div className="modsub-section-title">
                <User size={16} /> Yapımcı & İletişim Bilgileri
              </div>

              {!user ? (
                <div className="modsub-auth-notice">
                  <div className="modsub-auth-notice-content">
                    <div className="modsub-auth-notice-icon">
                      <User size={22} />
                    </div>
                    <div className="modsub-auth-notice-body">
                      <h4>Üye Girişi Gereklidir</h4>
                      <p>
                        Mod yayınlama başvurusu göndermek için üye girişi yapmalısınız. İletişim e-postanız ve başvuru takibiniz üyelik hesabınızla eşleştirilecektir.
                      </p>
                      <div className="modsub-auth-notice-actions">
                        <button
                          type="button"
                          className="modsub-auth-btn modsub-auth-btn--primary"
                          onClick={() => openAuthModal('login')}
                        >
                          Giriş Yap
                        </button>
                        <button
                          type="button"
                          className="modsub-auth-btn modsub-auth-btn--secondary"
                          onClick={() => openAuthModal('register')}
                        >
                          Kayıt Ol
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="modsub-user-card">
                    <div className="modsub-user-card-icon">
                      <ShieldCheck size={24} />
                    </div>
                    <div className="modsub-user-card-body">
                      <div className="modsub-user-card-title">
                        <strong>Giriş Yapılan Üye Hesabı</strong>
                        <span className="modsub-user-badge">Doğrulanmış Üyelik</span>
                      </div>
                      <div className="modsub-user-card-email">
                        <span>Kullanıcı Adı: <strong>@{user.username}</strong></span>
                        <span style={{ opacity: 0.4 }}>•</span>
                        <span>İletişim E-postası: <strong>{user.email}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="modsub-grid">
                    <label>
                      Yapımcı / Ekip Adı *
                      <input
                        name="producerName"
                        required
                        minLength={2}
                        maxLength={120}
                        placeholder={user.username || 'Adınız veya modding ekibiniz'}
                        value={form.producerName}
                        onChange={handleChange}
                      />
                      <small>Sitede modun yapımcısı olarak bu isim görünecektir.</small>
                    </label>

                    <label>
                      Discord Kullanıcı Adı / Sunucu Linki <span>(isteğe bağlı)</span>
                      <input
                        name="discord"
                        maxLength={100}
                        placeholder=""
                        value={form.discord}
                        onChange={handleChange}
                      />
                      <small>Hızlı iletişim ve destek için ekleyebilirsiniz.</small>
                    </label>
                  </div>
                </>
              )}

              {/* 2. MOD DETAYLARI */}
              <div className="modsub-section-title">
                <Layers size={16} /> Mod Bilgileri
              </div>

              <label>
                Mod Başlığı / Adı *
                <input
                  name="title"
                  required
                  minLength={2}
                  maxLength={150}
                  placeholder="Örn: BMW M3 E92 Street Edition [Custom Sound]"
                  value={form.title}
                  onChange={handleChange}
                />
              </label>

              <div className="modsub-grid">
                <label>
                  Oyun / Platform *
                  <input
                    name="game"
                    list="sub-games-list"
                    required
                    minLength={2}
                    maxLength={120}
                    placeholder="Örn: Assetto Corsa"
                    value={form.game}
                    onChange={handleChange}
                  />
                  <datalist id="sub-games-list">
                    <option value="Assetto Corsa" />
                    <option value="Euro Truck Simulator 2" />
                    <option value="BeamNG.drive" />
                    <option value="City Car Driving" />
                    <option value="GTA V" />
                    <option value="Diğer" />
                  </datalist>
                </label>

                <label>
                  Mod Türü / Kategori *
                  <select name="category" value={form.category} onChange={handleChange}>
                    <option value="Araç">Araç</option>
                    <option value="Harita / Pist">Harita / Pist</option>
                    <option value="Fizik / Motor">Fizik / Motor</option>
                    <option value="Ses Paketi">Ses Paketi</option>
                    <option value="3D Model">3D Model</option>
                    <option value="Arayüz / HUD">Arayüz / HUD</option>
                    <option value="Mod Paketi">Mod Paketi</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </label>
              </div>

              <div className="modsub-grid">
                <label>
                  Sürüm Numarası <span>(isteğe bağlı)</span>
                  <input
                    name="version"
                    maxLength={50}
                    placeholder="Örn: v1.0.2"
                    value={form.version}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  Yayın / Satış Türü *
                  <select name="saleType" value={form.saleType} onChange={handleChange}>
                    <option value="FREE">Ücretsiz Mod (Herkese Açık İndirme)</option>
                    <option value="CONTACT">Satılık / Özel Mod (Fiyat Belirle)</option>
                  </select>
                </label>
              </div>

              {form.saleType === 'CONTACT' && (
                <label>
                  İstenen / Belirlenen Fiyat <span>(isteğe bağlı)</span>
                  <input
                    name="suggestedPrice"
                    maxLength={100}
                    placeholder="Örn: 150 TL veya 10 $"
                    value={form.suggestedPrice}
                    onChange={handleChange}
                  />
                </label>
              )}

              <label>
                İndirme Bağlantısı (URL) *
                <input
                  name="downloadUrl"
                  type="url"
                  required
                  maxLength={2000}
                  placeholder="https://modsfire.com/... veya https://drive.google.com/..."
                  value={form.downloadUrl}
                  onChange={handleChange}
                />
                <small>Mod arşiv dosyanızın (.zip, .rar veya .7z) ModsFire, Google Drive veya bulut indirme linki.</small>
              </label>

              <label>
                Tanıtım Videosu Bağlantısı <span>(isteğe bağlı)</span>
                <input
                  name="trailerUrl"
                  type="url"
                  maxLength={2000}
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={form.trailerUrl}
                  onChange={handleChange}
                />
              </label>

              <label>
                Mod Açıklaması, Özellikler ve Kurulum Rehberi *
                <textarea
                  name="description"
                  rows={6}
                  required
                  minLength={20}
                  maxLength={10000}
                  placeholder="Modun özellikleri, içerdiği ekstralar, CSP/CSP sürüm gereksinimleri, kurulum talimatları ve varsa teşekkür/credits bilgisi…"
                  value={form.description}
                  onChange={handleChange}
                />
                <small>En az 20 karakter. Ne kadar detay verirseniz modunuz o kadar öne çıkar.</small>
              </label>

              {/* 3. EKRAN GÖRÜNTÜLERİ */}
              <div className="modsub-section-title">
                <ImageIcon size={16} /> Önizleme Görselleri
              </div>

              <div className="modsub-photo-field">
                <label htmlFor="sub-photos" style={{ marginBottom: '0.5rem' }}>
                  Ekran Görüntüleri (İsteğe Bağlı) · {photos.length}/5
                </label>
                <input
                  id="sub-photos"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoAdd}
                  disabled={photos.length >= 5 || saving}
                />
                <p className="modsub-hint" style={{ marginTop: '0.45rem' }}>
                  En fazla 5 adet ekran görüntüsü ekleyebilirsiniz. JPG, PNG veya WebP; dosya başı en çok 5 MB.
                </p>

                {photoError && <p className="modsub-error" style={{ marginTop: '0.75rem' }}>{photoError}</p>}

                {photos.length > 0 && (
                  <div className="modsub-photo-grid">
                    {photos.map((file, idx) => (
                      <div className="modsub-photo-preview" key={idx}>
                        {previews[idx] && <img src={previews[idx]} alt={file.name} />}
                        <small title={file.name}>{file.name}</small>
                        <button
                          type="button"
                          onClick={() => {
                            setPhotos((prev) => prev.filter((_, i) => i !== idx))
                            setPhotoError('')
                          }}
                        >
                          Kaldır
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. TELİF VE ONAY KUTUSU */}
              <label className="modsub-checkbox-label">
                <input
                  type="checkbox"
                  name="hasPermission"
                  checked={form.hasPermission}
                  onChange={handleChange}
                  required
                />
                <span>
                  Bu modun haklarına veya dağıtım izinlerine sahip olduğumu; başkasına ait telifli materyalleri izinsiz içermediğini ve Zecution Gaming kurallarına uygun olduğunu onaylıyorum. *
                </span>
              </label>

              {/* GÖNDER BUTONU */}
              {!user ? (
                <button
                  type="button"
                  className="modsub-button"
                  onClick={() => openAuthModal('login')}
                >
                  <User size={19} />
                  <span>Başvuru Yapmak İçin Giriş Yapın</span>
                </button>
              ) : (
                <button type="submit" className="modsub-button" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Başvuru Gönderiliyor...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={19} />
                      <span>Mod Yayınlama Başvurusunu Gönder</span>
                    </>
                  )}
                </button>
              )}
            </fieldset>
          </form>
        )}
      </main>
    </div>
  )
}
