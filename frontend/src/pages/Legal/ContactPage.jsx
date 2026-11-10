import { useState } from 'react'
import { Link } from 'react-router-dom'
import LegalLayout, { SOCIAL_LINKS } from './LegalLayout.jsx'

const FAQ_ITEMS = [
  {
    q: 'Kişiye özel araç modu veya 3D model yaptırmak için nasıl başvurabilirim?',
    a: 'Üst menüde yer alan "Teklif Al" sayfasındaki formu doldurarak aracınızın marka/model bilgilerini ve referans fotoğraflarını bize iletebilirsiniz. Ekibimiz projeyi inceleyip size geri dönüş sağlar.',
  },
  {
    q: 'Kendi geliştirdiğim bir modu Zecution Gaming üzerinde yayınlayabilir miyim?',
    a: 'Evet. "Modunu Yayınla" sayfası üzerinden modunuzun indirme bağlantısını, görsellerini ve üretici (Producer) bilgilerinizi gönderebilirsiniz. İnceleme sonrası kendi adınızla galeride yayınlanır.',
  },
  {
    q: 'Mod kurulumunda veya CSP / Pure grafik ayarlarında sorun yaşıyorum, ne yapmalıyım?',
    a: 'Öncelikle "Rehberler" bölümümüzdeki adım adım kurulum ve hata çözümü kılavuzlarımızı inceleyebilirsiniz. Uzaktan bağlantı ile birebir sıfırdan kurulum hizmeti almak isterseniz Instagram veya Discord üzerinden bize ulaşabilirsiniz.',
  },
  {
    q: 'Telif hakkı (DMCA) veya reklam ve iş birliği talepleri için nereye başvurmalıyım?',
    a: 'Telif bildirimleri, sponsorluk veya kurumsal iş birliği talepleriniz için doğrudan iletisim@zecution.com e-posta adresimize yazabilir ya da bu sayfadaki iletişim formundan ilgili konu başlığını seçerek mesaj gönderebilirsiniz.',
  },
]

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Genel Soru & Geri Bildirim',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) return
    setSubmitted(true)
  }

  return (
    <LegalLayout
      title="İletişim — Bize Ulaşın"
      description="Soru, görüş, kurulum desteği, özel 3D model projeleri, reklam/iş birliği veya telif hakkı (DMCA) bildirimleriniz için Zecution Gaming ekibiyle doğrudan iletişime geçin."
      lastUpdated={null}
      seoTitle="İletişim ve Destek"
      seoDescription="Zecution Gaming resmi iletişim bilgileri, destek formu, e-posta adresi, Discord sunucusu ve sıkça sorulan sorular."
    >
      <section className="legal-section">
        <h2>1. Doğrudan İletişim Kanalları</h2>
        <p>
          Talebinizin türüne göre aşağıdaki resmi iletişim kanallarımızdan bize haftanın 7 günü ulaşabilirsiniz. E-posta ve form mesajlarına ortalama 24 saat içerisinde yanıt verilmektedir.
        </p>

        <h3>Resmi E-Posta Adresi</h3>
        <p>
          Kurumsal iletişim, reklam/sponsorluk, kullanıcı veri talepleri ve DMCA telif bildirimleri için:{' '}
          <a href="mailto:iletisim@zecution.com" className="legal-inline-link">
            iletisim@zecution.com
          </a>
        </p>

        <h3>Özel Proje ve Üretici Başvuruları</h3>
        <p>
          3D model veya kişiye özel araç modu siparişi için{' '}
          <Link to="/teklif-al" className="legal-inline-link">
            Teklif Al Formu
          </Link>
          , kendi modunuzu sitemizde yayınlamak için ise{' '}
          <Link to="/mod-yayinla" className="legal-inline-link">
            Modunu Yayınla
          </Link>{' '}
          sayfasını kullanabilirsiniz.
        </p>

        <h3>Sosyal Medya ve Topluluk Kanalları</h3>
        <p>
          Anlık duyurular, kurulum yardımlaşması ve hızlı iletişim için resmi hesaplarımız:{' '}
          {SOCIAL_LINKS.map(({ label, href }, index) => (
            <span key={label}>
              <a href={href} target="_blank" rel="noreferrer" className="legal-inline-link">
                {label}
              </a>
              {index < SOCIAL_LINKS.length - 1 ? ' • ' : ''}
            </span>
          ))}
        </p>
      </section>

      <section className="legal-section">
        <h2>2. İletişim ve Bildirim Formu</h2>
        <p>
          Aşağıdaki formu doldurarak ekibimize doğrudan mesaj gönderebilirsiniz:
        </p>

        {submitted ? (
          <div className="contact-success-box">
            <p style={{ margin: '0 0 0.75rem', fontWeight: 700, color: '#ffffff' }}>
              Mesajınız kaydedildi.
            </p>
            <p style={{ margin: '0 0 1rem' }}>
              Talebinizi aldık. Dilerseniz mesajınızı anında doğrudan e-posta istemcinizle de iletmek için aşağıdaki bağlantıyı kullanabilirsiniz:
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <a
                href={`mailto:iletisim@zecution.com?subject=${encodeURIComponent(`[Zecution İletişim] ${formData.subject} - ${formData.name}`)}&body=${encodeURIComponent(`Gönderen: ${formData.name} (${formData.email})\nKonu: ${formData.subject}\n\nMesaj:\n${formData.message}`)}`}
                className="contact-submit-btn"
              >
                E-Posta İle Gönder (iletisim@zecution.com)
              </a>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false)
                  setFormData({ name: '', email: '', subject: 'Genel Soru & Geri Bildirim', message: '' })
                }}
                className="legal-inline-link"
                style={{ background: 'none', cursor: 'pointer', padding: 0 }}
              >
                Yeni Mesaj Yaz
              </button>
            </div>
          </div>
        ) : (
          <form className="contact-plain-form" onSubmit={handleSubmit}>
            <div className="contact-field">
              <label htmlFor="contact-name">Adınız Soyadınız veya Kullanıcı Adınız *</label>
              <input
                id="contact-name"
                name="name"
                type="text"
                required
                placeholder="Örn: Ahmet Yılmaz"
                className="contact-input"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="contact-field">
              <label htmlFor="contact-email">E-Posta Adresiniz *</label>
              <input
                id="contact-email"
                name="email"
                type="email"
                required
                placeholder="ornek@eposta.com"
                className="contact-input"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="contact-field">
              <label htmlFor="contact-subject">Konu Seçiniz *</label>
              <select
                id="contact-subject"
                name="subject"
                className="contact-select"
                value={formData.subject}
                onChange={handleChange}
              >
                <option value="Genel Soru & Geri Bildirim">Genel Soru &amp; Geri Bildirim</option>
                <option value="Kurulum & Teknik Destek">Kurulum &amp; Teknik Destek</option>
                <option value="Özel 3D Model / Araç Modu Talebi">Özel 3D Model / Araç Modu Talebi</option>
                <option value="Reklam, Sponsorluk & İş Birliği">Reklam, Sponsorluk &amp; İş Birliği</option>
                <option value="Telif Hakkı / DMCA Bildirimi">Telif Hakkı / DMCA Bildirimi</option>
                <option value="KVKK & Veri Güvenliği Başvurusu">KVKK &amp; Veri Güvenliği Başvurusu</option>
              </select>
            </div>

            <div className="contact-field">
              <label htmlFor="contact-message">Mesajınız *</label>
              <textarea
                id="contact-message"
                name="message"
                rows={5}
                required
                placeholder="Talebinizi, sorunuzu veya ilgili içerik bağlantısını detaylıca yazabilirsiniz..."
                className="contact-textarea"
                value={formData.message}
                onChange={handleChange}
              />
            </div>

            <p style={{ margin: 0, fontSize: '0.84rem', color: 'rgba(255,255,255,0.6)' }}>
              Bu form üzerinden paylaştığınız bilgiler yalnızca talebinize yanıt vermek amacıyla{' '}
              <Link to="/gizlilik-politikasi" className="legal-inline-link">
                Gizlilik Politikamız
              </Link>{' '}
              kapsamında işlenir.
            </p>

            <button type="submit" className="contact-submit-btn">
              Mesajı Gönder
            </button>
          </form>
        )}
      </section>

      <section className="legal-section">
        <h2>3. Sıkça Sorulan Sorular (SSS)</h2>
        {FAQ_ITEMS.map((item, idx) => (
          <div key={idx}>
            <h3>{item.q}</h3>
            <p>{item.a}</p>
          </div>
        ))}
      </section>
    </LegalLayout>
  )
}
