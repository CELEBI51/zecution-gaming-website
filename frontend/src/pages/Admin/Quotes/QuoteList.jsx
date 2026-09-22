import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../../../services/api.js'
import { quoteTypes, quoteStatuses, formatQuoteDate } from '../../Quotes/quoteLabels.js'
import './QuoteAdmin.css'

export default function QuoteList() {
  const [params, setParams] = useSearchParams()
  const status = quoteStatuses[params.get('status')] ? params.get('status') : ''
  const search = params.get('search') || ''
  const page = Math.max(1, Number(params.get('page')) || 1)
  const [input, setInput] = useState(search)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    api.getQuotes({ ...(status ? { status } : {}), search, page }).then(data => { if (active) setResult(data) }).catch(err => { if (active) setError(err.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [status, search, page, reload])
  const filter = values => setParams({ status, search, page: '1', ...values })
  return <div className="quote-admin">
    <div className="admin-topbar"><h1>Mod Talepleri</h1><button className="quote-admin-button" onClick={() => setReload(n => n + 1)} disabled={loading}>Yenile</button></div>
    <div className="admin-content-area">
      <form className="quote-admin-filters" onSubmit={event => { event.preventDefault(); filter({ search: input }) }}>
        <label>Durum<select aria-label="Durum" value={status} onChange={event => filter({ status: event.target.value })}><option value="">Tüm durumlar</option>{Object.entries(quoteStatuses).map(([value, text]) => <option value={value} key={value}>{text}</option>)}</select></label>
        <label>Talep ara<input type="search" maxLength={120} value={input} onChange={event => setInput(event.target.value)} placeholder="Ad, e-posta veya oyun" /></label>
        <button className="quote-admin-button" type="submit">Ara</button>
      </form>
      {loading ? <p role="status">Talepler yükleniyor…</p> : error ? <p role="alert" className="quote-admin-error">{error}</p> : <>
        <p className="quote-admin-muted">{result?.pagination.total || 0} talep · En yeni talepler önce gösterilir.</p>
        {result?.items.length ? <div className="quote-admin-table"><table><thead><tr><th>Talep sahibi</th><th>Oyun / Tür</th><th>Durum</th><th>Tarih</th><th>İşlem</th></tr></thead><tbody>{result.items.map(item => <tr key={item.id}>
          <td><strong>{item.name}</strong><small>{item.email}</small></td><td>{item.game}<small>{quoteTypes[item.type]}</small></td><td><span className={`quote-status quote-status--${item.status.toLowerCase()}`}>{quoteStatuses[item.status]}</span></td><td>{formatQuoteDate(item.createdAt)}</td><td><Link className="quote-admin-button" to={`/admin/talepler/${item.id}`}>İncele</Link></td>
        </tr>)}</tbody></table></div> : <div className="quote-admin-card"><h2>Talep bulunamadı</h2><p>Yeni talepler burada görünecek. Filtreleri değiştirebilir veya teklif formunu açabilirsiniz.</p><Link to="/teklif-al" className="quote-admin-button">Teklif formunu aç</Link></div>}
        <div className="quote-admin-pagination"><button disabled={page <= 1} onClick={() => filter({ page: String(page - 1) })}>Önceki</button><span>Sayfa {page} / {Math.max(1, result?.pagination.totalPages || 1)}</span><button disabled={page >= (result?.pagination.totalPages || 1)} onClick={() => filter({ page: String(page + 1) })}>Sonraki</button></div>
      </>}
    </div>
  </div>
}
