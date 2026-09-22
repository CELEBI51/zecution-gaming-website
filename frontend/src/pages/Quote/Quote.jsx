import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, CarFront, Map, Wrench, Box, Check, CheckCircle2, Send } from 'lucide-react'
import { createPrototypeQuote, quoteTypes } from '../../services/quotePrototype.js'
import './Quote.css'

const icons = [CarFront, Map, Wrench, Box]
const initialForm = { name: '', email: '', game: 'Assetto Corsa', otherGame: '', type: 'VEHICLE', title: '', description: '', referenceUrl: '', budget: '', deadline: '' }

export default function Quote() {
  const [form, setForm] = useState(initialForm)
  const [saved, setSaved] = useState(null)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const lock = useRef(false)
  const successRef = useRef(null)
  const change = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }))

  function submit(event) {
    event.preventDefault()
    if (lock.current) return
    setError('')
    if (!form.name.trim() || !form.title.trim() || form.description.trim().length < 20 || (form.game === 'Diğer' && !form.otherGame.trim())) {
      setError('Adını, proje başlığını ve oyununu belirt; açıklaman en az 20 karakter olsun.')
      return
    }
    if (form.referenceUrl && !/^https?:\/\//i.test(form.referenceUrl)) {
      setError('Referans bağlantısı https:// veya http:// ile başlamalıdır.')
      return
    }
    lock.current = true
    setSending(true)
    try {
      const { otherGame, ...fields } = form
      const quote = createPrototypeQuote({ ...fields, name: form.name.trim(), email: form.email.trim(), title: form.title.trim(), description: form.description.trim(), game: form.game === 'Diğer' ? otherGame.trim() : form.game })
      setSaved(quote)
      window.scrollTo({ top: 0, behavior: 'instant' })
      requestAnimationFrame(() => successRef.current?.focus())
    } catch {
      setError('Prototip kaydedilemedi. Tarayıcı oturum depolamasına izin verildiğinden emin olup tekrar dene. Bilgilerin formda duruyor.')
    } finally {
      lock.current = false
      setSending(false)
    }
  }

  return <div className="quote-page">
    <header className="quote-header">
      <Link to="/" className="quote-brand"><img src="/media/images/logo.jpg" alt="" /><span>ZECUTION <small>GAMING</small></span></Link>
      <Link to="/" className="quote-back"><ArrowLeft size={16} /> Ana sayfaya dön</Link>
    </header>
    <div className="quote-prototype"><span>PROTOTİP</span> Bu form gerçek talep göndermez. Deneme kayıtları yalnızca bu tarayıcı sekmesinde tutulur.</div>
    {saved ? <main className="quote-success" ref={successRef} tabIndex={-1}>
      <CheckCircle2 size={52} strokeWidth={1.3} />
      <p className="quote-kicker">FORM ÖNİZLEMESİ TAMAMLANDI</p>
      <h1>Fikrin kayda geçti.</h1>
      <p><strong>{saved.title}</strong> için deneme talebin oluşturuldu. Gerçek bir başvuru veya e-posta gönderilmedi.</p>
      <div className="quote-receipt"><span>Deneme numarası</span><strong>DEMO-{saved.id.slice(0, 8).toUpperCase()}</strong><span>Başlangıç durumu</span><strong>Yeni</strong></div>
      <Link className="quote-submit" to="/admin/mod-talepleri">Admin panelinde görüntüle <ArrowUpRight size={18} /></Link>
      <p className="quote-caption">Admin oturumu gerekir. Bu bağlantıyı aynı sekmede açarak deneme kaydını görebilirsin.</p>
      <button className="quote-text-button" onClick={() => { setForm(initialForm); setSaved(null) }}>Yeni bir form dene</button>
    </main> : <main className="quote-layout">
      <aside className="quote-intro">
        <p className="quote-kicker"><span /> SANA ÖZEL BİR PROJE</p>
        <h1>Sen hayal et.<br /><em>Biz modelleyelim.</em></h1>
        <p className="quote-lead">İstediğin aracı, pisti veya mod fikrini anlat. Projenin kapsamını birlikte netleştirelim.</p>
        <div className="quote-visual">
          <img src="/media/images/1.3-multijet-soyo-daikoku.png" alt="Gece pistinde kişiselleştirilmiş araç modu" />
          <div><span>HER PROJE AYRI BİR HİKÂYE.</span><strong>Sıradaki seninki olsun.</strong></div>
          <span className="quote-visual-tag">CUSTOM BUILT / ZG</span>
        </div>
        <div className="quote-process">
          <h2>Formdan sonra ne olacak?</h2>
          <p><Check size={16} /> Fikrini ve referanslarını inceleyeceğiz.</p>
          <p><Check size={16} /> Kapsam, fiyat ve süreyi seninle paylaşacağız.</p>
          <p><Check size={16} /> Sen onayladığında projeye başlayacağız.</p>
          <small>Bu akış, formun yayına alınacak sürümü içindir. Form doldurmak sipariş veya ödeme oluşturmaz.</small>
        </div>
      </aside>

      <form className="quote-form" onSubmit={submit}>
        <div className="quote-form-heading"><div><p className="quote-kicker">MOD TALEBİ</p><h2>Projeni anlatalım.</h2></div><span>Yaklaşık 3 dakika</span></div>
        <p className="quote-required-note">* işaretli alanlar zorunludur.</p>
        <fieldset className="quote-section"><legend>Ne üzerinde çalışalım? *</legend>
          <div className="quote-types">{quoteTypes.map((type, index) => { const Icon = icons[index]; return <label className={`quote-type ${form.type === type.value ? 'is-selected' : ''}`} key={type.value}>
            <input type="radio" name="type" value={type.value} checked={form.type === type.value} onChange={change} />
            <Icon size={22} strokeWidth={1.5} /><span><strong>{type.label}</strong><small>{type.hint}</small></span><span className="quote-radio" aria-hidden="true">{form.type === type.value && <Check size={11} />}</span>
          </label> })}</div>
        </fieldset>
        <fieldset className="quote-section"><legend>Proje detayları</legend>
          <div className="quote-fields">
            <label>Oyun / platform *<select name="game" value={form.game} onChange={change}><option>Assetto Corsa</option><option>BeamNG.drive</option><option>Euro Truck Simulator 2</option><option>Oyun bağımsız / 3D model</option><option>Diğer</option></select></label>
            {form.game === 'Diğer' && <label>Oyun / platform adı *<input name="otherGame" value={form.otherGame} onChange={change} required maxLength={100} placeholder="Hangi platform için?" /></label>}
            <label className="quote-full">Projenin adı *<input name="title" value={form.title} onChange={change} required maxLength={160} placeholder={form.type === 'MAP' ? 'Örn. Sahil yolundan ilham alan bir drift pisti' : 'Örn. 1998 BMW E36 — kişiye özel araç modu'} /></label>
            <label className="quote-full">Aklındaki detaylar *<textarea name="description" value={form.description} onChange={change} required minLength={20} maxLength={5000} rows={5} placeholder="Model, yıl, renk, jantlar, iç mekân, fizik veya istediğin diğer özellikler… Mevcut bir mod düzenlenecekse neyi değiştirmek istediğini belirt." /><span className="quote-input-hint">En az 20 karakter <span>{form.description.length} / 5000</span></span></label>
            <label className="quote-full">Referans bağlantısı <small>İsteğe bağlı</small><input type="url" name="referenceUrl" value={form.referenceUrl} onChange={change} maxLength={2000} placeholder="https://… görsel, video veya paylaşılan klasör" /><span className="quote-input-hint">Birden fazla referans için paylaşılan bir klasör bağlantısı ekleyebilirsin.</span></label>
            <label>Düşündüğün bütçe <small>İsteğe bağlı</small><select name="budget" value={form.budget} onChange={change}><option value="">Birlikte belirleyelim</option>5.000 TL altı</option><option>5.000 – 10.000 TL</option><option>10.000 – 25.000 TL</option><option>25.000 TL ve üzeri</option></select></label>
            <label>Hedef teslim tarihi <small>İsteğe bağlı</small><input type="date" name="deadline" min={new Date().toLocaleDateString('en-CA')} value={form.deadline} onChange={change} /><span className="quote-input-hint">Kesin teslim tarihi proje kapsamıyla belirlenir.</span></label>
          </div>
        </fieldset>
        <fieldset className="quote-section"><legend>Sana nasıl ulaşalım?</legend><div className="quote-fields">
          <label>Adın *<input name="name" autoComplete="given-name" value={form.name} onChange={change} required maxLength={100} placeholder="Adın veya kullanmak istediğin isim" /></label>
          <label>E-posta adresin *<input type="email" name="email" autoComplete="email" value={form.email} onChange={change} required maxLength={254} placeholder="ornek@eposta.com" /></label>
        </div></fieldset>
        {error && <p className="quote-error" role="alert">{error}</p>}
        <button className="quote-submit" type="submit" disabled={sending}><Send size={17} /> {sending ? 'Kaydediliyor…' : 'Deneme talebi oluştur'}<ArrowUpRight size={19} /></button>
        <p className="quote-caption">Bu bir prototiptir. Lütfen örnek bilgilerle dene; gerçek talep veya e-posta gönderilmez.</p>
      </form>
    </main>}
    <footer className="quote-footer"><span>© {new Date().getFullYear()} Zecution Gaming</span><span>Fikirden ilk sürüşe.</span></footer>
  </div>
}
