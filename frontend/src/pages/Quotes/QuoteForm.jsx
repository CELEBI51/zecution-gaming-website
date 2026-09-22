import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, CheckCircle2, Loader2 } from 'lucide-react'
import { api } from '../../services/api.js'
import { quoteTypes } from './quoteLabels.js'
import './Quotes.css'

export default function QuoteForm() {
  const [params] = useSearchParams()
  const [form, setForm] = useState({ name: '', email: '', game: '', type: quoteTypes[params.get('type')] ? params.get('type') : 'VEHICLE', description: '', referenceUrl: '', budget: '', desiredDate: '', website: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState(null)
  const [photos, setPhotos] = useState([])
  const [previews, setPreviews] = useState([])
  const [photoError, setPhotoError] = useState('')
  useEffect(() => {
    const urls = photos.map(file => URL.createObjectURL(file))
    setPreviews(urls)
    return () => urls.forEach(url => URL.revokeObjectURL(url))
  }, [photos])
  function addPhotos(event) {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    setPhotoError('')
    if (photos.length + files.length > 5) return setPhotoError('En fazla 5 fotoğraf ekleyebilirsiniz.')
    if (files.some(file => file.size > 5 * 1024 * 1024)) return setPhotoError('Her fotoğraf en fazla 5 MB olabilir.')
    if (files.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) return setPhotoError('Yalnızca JPG, PNG ve WebP fotoğrafları kabul edilir.')
    setPhotos(prev => [...prev, ...files])
  }
  const submissionId = useRef(null)
  const inFlight = useRef(false)
  const resultRef = useRef(null)
  const change = event => setForm(prev => ({ ...prev, [event.target.name]: event.target.value }))
  async function submit(event) {
    event.preventDefault()
    if (inFlight.current) return
    inFlight.current = true
    setSaving(true)
    setError('')
    try {
      submissionId.current ||= crypto.randomUUID()
      const result = await api.createQuote({ ...form, submissionId: submissionId.current }, photos)
      setReceipt(result)
      setPhotos([])
      requestAnimationFrame(() => { resultRef.current?.focus(); resultRef.current?.scrollIntoView({ block: 'center' }) })
    } catch (err) {
      setError(err.details?.map(detail => detail.message).join(' · ') || err.message || 'Talep gönderilemedi. Bilgileriniz korunuyor; tekrar deneyebilirsiniz.')
    } finally {
      inFlight.current = false
      setSaving(false)
    }
  }
  return (
    <div className="quote-page">
      <header className="quote-header">
        <Link to="/" className="quote-brand"><img src="/media/images/logo.jpg" alt="" /><span>Zecution Gaming</span></Link>
        <Link to="/"><ArrowLeft size={16} /> Ana sayfa</Link>
      </header>
      <main className="quote-layout">
        <section className="quote-intro">
          <span className="quote-eyebrow">Senin fikrin. Senin modun.</span>
          <h1>Birlikte<br />hayata geçirelim.</h1>
          <p>İstediğin aracı, haritayı veya 3D modeli anlat. Projenin kapsamını inceleyelim ve sana uygun bir teklif hazırlayalım.</p>
          <ol className="quote-steps"><li>Talebini ve referanslarını paylaş.</li><li>Detayları ve yapılabilirliğini inceleyelim.</li><li>Kapsam ve fiyat için seninle iletişime geçelim.</li></ol>
          <p className="quote-hint">Bu form bir sipariş veya ödeme işlemi değildir. Fiyat ve teslim tarihi inceleme sonrasında netleşir.</p>
        </section>
        {receipt ? (
          <section className="quote-card quote-success" ref={resultRef} tabIndex={-1} role="status">
            <CheckCircle2 size={40} /><h2>Talebiniz alındı.</h2>
            <p>İnceleme sonrası verdiğiniz e-posta adresi üzerinden sizinle iletişime geçeceğiz.</p>
            <p className="quote-hint">Talep numaranız</p><code>{receipt.id}</code>
            <Link className="quote-button" to="/modlar">Modları keşfet <ArrowUpRight size={18} /></Link>
          </section>
        ) : (
          <form className="quote-card quote-form" onSubmit={submit}>
            <h2>Mod Talebi / Teklif Al</h2><p className="quote-hint">* işaretli alanlar zorunludur.</p>
            {error && <div className="quote-error" role="alert">{error}</div>}
            <fieldset disabled={saving}>
              <div className="quote-grid">
                <label>Adınız *<input name="name" autoComplete="name" required minLength={2} maxLength={120} value={form.name} onChange={change} /></label>
                <label>E-posta *<input name="email" type="email" autoComplete="email" required maxLength={254} value={form.email} onChange={change} /></label>
                <label>Oyun / Proje *<input name="game" list="quote-games" placeholder="Örn: Assetto Corsa" required minLength={2} maxLength={120} value={form.game} onChange={change} /><datalist id="quote-games"><option value="Assetto Corsa" /><option value="Euro Truck Simulator 2" /><option value="BeamNG.drive" /><option value="Oyun dışı 3D model projesi" /></datalist></label>
                <label>Talep türü *<select aria-label="Talep türü" name="type" value={form.type} onChange={change}>{Object.entries(quoteTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              </div>
              <label>Talebin detayları *<textarea aria-label="Talebin detayları" name="description" rows={7} required minLength={20} maxLength={10000} placeholder="Marka/model, istediğin özellikler, mevcut dosyalar ve projenin kapsamı…" value={form.description} onChange={change} /><small>En az 20 karakter. Ne kadar detay paylaşırsan o kadar net değerlendirebiliriz.</small></label>
              <label>Referans bağlantısı <span>(isteğe bağlı)</span><input name="referenceUrl" type="url" maxLength={2000} placeholder="https://…" value={form.referenceUrl} onChange={change} /><small>Görsel, video veya referans klasörü bağlantısı paylaşabilirsin.</small></label>
              <div className="quote-grid">
                <label>Bütçe <span>(isteğe bağlı)</span><input name="budget" maxLength={120} placeholder="Örn: 3.000–5.000 TL" value={form.budget} onChange={change} /></label>
                <label>İstenen teslim tarihi <span>(isteğe bağlı)</span><input name="desiredDate" type="date" value={form.desiredDate} onChange={change} /></label>
              </div>
              <div className="quote-photo-field">
                <label htmlFor="quote-photos">Fotoğraflar (isteğe bağlı) · {photos.length}/5</label>
                <input id="quote-photos" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={addPhotos} disabled={photos.length >= 5 || saving} aria-describedby="quote-photo-help" />
                <p id="quote-photo-help" className="quote-hint">En fazla 5 fotoğraf. Her biri en fazla 5 MB; JPG, PNG veya WebP. En fazla 40 megapiksel.</p>
                {photoError && <p className="quote-error" role="alert">{photoError}</p>}
                <div className="quote-photo-grid">{photos.map((file, index) => <div className="quote-photo-preview" key={index}>
                  {previews[index] && <img src={previews[index]} alt={file.name} />}
                  <small>{file.name}</small>
                  <button type="button" onClick={() => { setPhotos(prev => prev.filter((_, i) => i !== index)); setPhotoError('') }} aria-label={file.name + ' fotoğrafını kaldır'}>Kaldır</button>
                </div>)}</div>
              </div>
              <div className="quote-trap" aria-hidden="true"><label>Web sitesi<input name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={change} /></label></div>
              <p className="quote-hint">Paylaştığın bilgiler talebini değerlendirmek ve seninle iletişim kurmak için yönetim ekibine iletilir.</p>
              <button className="quote-button" type="submit">{saving ? <><Loader2 className="animate-spin" size={18} /> Gönderiliyor…</> : <>Talebi Gönder <ArrowUpRight size={18} /></>}</button>
            </fieldset>
          </form>
        )}
      </main>
    </div>
  )
}
