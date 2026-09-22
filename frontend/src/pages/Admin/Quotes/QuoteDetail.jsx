import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../../services/api.js'
import { quoteTypes, quoteStatuses, formatQuoteDate } from '../../Quotes/quoteLabels.js'
import './QuoteAdmin.css'
import QuotePhotos from './QuotePhotos.jsx'

export default function QuoteDetail() {
  const { id } = useParams()
  const [quote, setQuote] = useState(null)
  const [status, setStatus] = useState('NEW')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [reload, setReload] = useState(0)
  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setNotice('')
    setQuote(null)
    api.getQuote(id).then(data => {
      if (!active) return
      setQuote(data); setStatus(data.status); setNotes(data.adminNotes)
    }).catch(err => { if (active) setError(err.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, reload])
  async function save(event) {
    event.preventDefault()
    if (saving) return
    setSaving(true); setError(''); setNotice('')
    try {
      const updated = await api.updateQuote(id, { status, adminNotes: notes })
      setQuote(prev => ({ ...prev, ...updated }))
      setNotice('Durum ve yönetici notu kaydedildi.')
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }
  return <div className="quote-admin">
    <div className="admin-topbar"><h1>Talep Detayı</h1><Link to="/admin/talepler" className="quote-admin-button">← Tüm talepler</Link></div>
    <div className="admin-content-area">
      {error && <p className="quote-admin-error" role="alert">{error}</p>}
      {notice && <p className="quote-admin-notice" role="status">{notice}</p>}
      {loading ? <p role="status">Talep yükleniyor…</p> : !quote ? <button className="quote-admin-button" onClick={() => setReload(n => n + 1)}>Tekrar dene</button> : <div className="quote-admin-detail">
        <section className="quote-admin-card">
          <h2>{quote.name}</h2><a href={`mailto:${quote.email}`}>{quote.email}</a>
          <dl className="quote-admin-facts"><div><dt>Oyun / Proje</dt><dd>{quote.game}</dd></div><div><dt>Talep türü</dt><dd>{quoteTypes[quote.type]}</dd></div><div><dt>Bütçe</dt><dd>{quote.budget || 'Belirtilmedi'}</dd></div><div><dt>İstenen tarih</dt><dd>{quote.desiredDate ? quote.desiredDate.split('-').reverse().join('.') : 'Belirtilmedi'}</dd></div><div><dt>Alınma tarihi</dt><dd>{formatQuoteDate(quote.createdAt)}</dd></div><div><dt>Talep numarası</dt><dd>{quote.id}</dd></div></dl>
          <h3>Talebin detayları</h3><p className="quote-admin-description">{quote.description}</p>
          {quote.photos?.length > 0 && <QuotePhotos quoteId={quote.id} photos={quote.photos} />}
          {quote.referenceUrl && <p><a className="quote-admin-reference" href={quote.referenceUrl} target="_blank" rel="noopener noreferrer">Referansı aç ↗<small>{quote.referenceUrl}</small></a></p>}
        </section>
        <form className="quote-admin-card" onSubmit={save}>
          <h2>Talep yönetimi</h2><fieldset disabled={saving}>
            <label>Durum<select aria-label="Durum" value={status} onChange={event => setStatus(event.target.value)}>{Object.entries(quoteStatuses).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>
            <label>Yönetici notu<textarea aria-label="Yönetici notu" rows={10} maxLength={10000} value={notes} onChange={event => setNotes(event.target.value)} placeholder="Görüşme notları, teklif tutarı ve takip edilecek detaylar…" /></label>
            <p className="quote-admin-muted">Bu not yalnızca yönetim ekibine görünür. Durum değişiklikleri müşteriye otomatik mesaj göndermez.</p>
            <button className="quote-admin-button quote-admin-button--primary" type="submit">{saving ? 'Kaydediliyor…' : 'Değişiklikleri Kaydet'}</button>
          </fieldset>
        </form>
      </div>}
    </div>
  </div>
}
