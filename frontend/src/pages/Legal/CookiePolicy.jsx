import { useState } from 'react'
import { Link } from 'react-router-dom'
import LegalLayout from './LegalLayout.jsx'

export default function CookiePolicy() {
  const [resetNotice, setResetNotice] = useState('')

  const handleResetConsent = () => {
    try {
      localStorage.removeItem('zecution_cookie_consent')
      window.dispatchEvent(new CustomEvent('zecution:open-cookie-banner'))
      setResetNotice('Çerez tercihleriniz sıfırlandı. Sayfanın alt kısmındaki çerez tercih panelinden seçiminizi güncelleyebilirsiniz.')
    } catch {
      setResetNotice('Tarayıcı ayarlarınız üzerinden çerezleri temizleyebilirsiniz.')
    }
  }

  return (
    <LegalLayout
      title="Çerez (Cookie) Politikası"
      description="Zecution Gaming (zecution.com) web sitesinde kullanıcı deneyimini iyileştirmek, güvenliği sağlamak ve Google AdSense reklamlarını sunmak için kullanılan çerezler hakkında detaylı rehber."
      seoTitle="Çerez Politikası"
      seoDescription="Zecution Gaming çerez (cookie) politikası, kullanılan çerez türleri, Google AdSense reklam çerezleri ve tarayıcı çerez yönetimi."
    >
      <section className="legal-section">
        <h2>1. Çerez (Cookie) ve Yerel Depolama Nedir?</h2>
        <p>
          Çerezler (cookies), bir web sitesini ziyaret ettiğinizde tarayıcınız aracılığıyla bilgisayarınıza veya mobil cihazınıza kaydedilen küçük metin dosyalarıdır. Çerezlerin yanı sıra modern web teknolojilerinin bir parçası olan <strong>Yerel Depolama (localStorage)</strong> alanı da oturum durumunuzu ve çerez tercihlerinizi hatırlamak amacıyla kullanılmaktadır.
        </p>
        <p>
          Bu teknolojiler, sitemizin düzgün çalışmasını sağlamak, güvenliğinizi korumak, tercihlerinizi hatırlamak ve ilgi alanlarınıza uygun içerik ile reklamlar sunmak için endüstri standardı olarak kullanılır.
        </p>
      </section>

      <section className="legal-section">
        <h2>2. Sitemizde Kullanılan Çerez Kategorileri</h2>
        <p>
          Zecution Gaming üzerinde hem birinci taraf (doğrudan sitemiz tarafından oluşturulan) hem de üçüncü taraf (Google AdSense gibi iş ortaklarımız tarafından sağlanan) çerezler kullanılmaktadır:
        </p>

        <h3>Zorunlu Oturum ve Güvenlik Çerezleri (zecution_user_token, CSRF)</h3>
        <p>
          Kayıtlı üyelerin güvenli şekilde oturum açmasını, yorum/profil işlemlerini yapmasını ve form gönderimlerinde (Teklif Al, Mod Gönder) siteler arası istek sahteciliğinin (CSRF) önlenmesini sağlar. Oturum süresince veya 7 gün boyunca saklanır.
        </p>

        <h3>Tercih Çerezleri (zecution_cookie_consent)</h3>
        <p>
          Ziyaretçinin çerez ve reklam onay tercihini (Kabul / Sadece Zorunlu) hafızada tutarak her sayfa geçişinde tekrar onay sorulmasını önler. Saklama süresi 1 yıldır.
        </p>

        <h3>Google AdSense Reklam ve Hedefleme Çerezleri (__gads, __gpi, IDE)</h3>
        <p>
          Google tarafından reklamların gösterilmesi, reklam sıklığının ayarlanması, reklam performansının ölçülmesi ve ilgi alanına dayalı reklam sunulması için kullanılır. Saklama süresi çerez türüne göre 6 ay ile 13 ay arasında değişmektedir.
        </p>

        <h3>Performans ve İstatistik Çerezleri</h3>
        <p>
          Hangi modların ve kurulum rehberlerinin daha çok okunduğunu anonim olarak analiz etmemize ve site hızını iyileştirmemize yardımcı olur.
        </p>
      </section>

      <section className="legal-section">
        <h2>3. Google AdSense ve Üçüncü Taraf Çerezleri</h2>
        <p>
          Sitemizde <strong>Google AdSense</strong> reklam servisi kullanılmaktadır. Google, sitemizde veya internetteki diğer sitelerde yaptığınız ziyaretlere dayanarak reklam sunmak için çerezleri (örneğin DoubleClick DART çerezi) kullanır.
        </p>

        <h3>Kişiselleştirilmiş Reklamlar</h3>
        <p>
          Çerez onay çubuğundan &quot;Tümünü Kabul Et&quot; seçeneğini tercih ettiğinizde, ilgi alanlarınıza daha uygun reklamlar gösterilebilir.
        </p>

        <h3>Kişiselleştirilmemiş Reklamlar</h3>
        <p>
          Kişiselleştirilmiş reklam çerezlerini reddetmeniz halinde reklamlar yine gösterilebilir ancak bu reklamlar geçmiş tarama alışkanlıklarınıza göre değil, bulunduğunuz sayfanın konusuna (örneğin otomotiv ve simülasyon oyunları) göre bağlamsal olarak sunulur.
        </p>

        <h3>Devre Dışı Bırakma</h3>
        <p>
          İstediğiniz zaman{' '}
          <a
            href="https://adssettings.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="legal-inline-link"
          >
            Google Reklam Ayarları
          </a>{' '}
          üzerinden kişiselleştirilmiş reklamları kapatabilirsiniz.
        </p>
      </section>

      <section className="legal-section">
        <h2>4. Çerez Tercihlerini Yönetme ve Tarayıcı Ayarları</h2>
        <p>
          Zecution Gaming üzerindeki çerez tercihlerinizi aşağıdaki butonu kullanarak istediğiniz an sıfırlayabilir ve yeniden yapılandırabilirsiniz:
        </p>

        <div>
          <button
            type="button"
            onClick={handleResetConsent}
            className="contact-submit-btn"
          >
            Çerez Tercihlerimi Sıfırla / Güncelle
          </button>

          {resetNotice && (
            <p style={{ marginTop: '0.75rem', color: '#a7f3d0' }}>{resetNotice}</p>
          )}
        </div>

        <h3>Tarayıcı Üzerinden Çerez Kontrolü</h3>
        <p>
          Kullandığınız internet tarayıcısının ayarlarından da çerezleri tamamen engelleyebilir veya mevcut çerezleri silebilirsiniz: Google Chrome için Ayarlar &gt; Gizlilik ve Güvenlik &gt; Üçüncü taraf çerezleri; Mozilla Firefox için Ayarlar &gt; Gizlilik ve Güvenlik &gt; Çerezler ve Site Verileri; Microsoft Edge için Ayarlar &gt; Çerezler ve site izinleri; Apple Safari için Tercihler &gt; Gizlilik menülerini kullanabilirsiniz.
        </p>
      </section>

      <section className="legal-section">
        <h2>5. Ek Bilgiler</h2>
        <p>
          Kişisel verilerinizin işlenmesiyle ilgili daha kapsamlı bilgi almak için{' '}
          <Link to="/gizlilik-politikasi" className="legal-inline-link">
            Gizlilik Politikası
          </Link>{' '}
          ve{' '}
          <Link to="/kvkk" className="legal-inline-link">
            KVKK Aydınlatma Metni
          </Link>{' '}
          sayfalarımızı inceleyebilir, sorularınız için{' '}
          <Link to="/iletisim" className="legal-inline-link">
            İletişim
          </Link>{' '}
          sayfamızdan bize ulaşabilirsiniz.
        </p>
      </section>
    </LegalLayout>
  )
}
