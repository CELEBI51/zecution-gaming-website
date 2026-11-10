import { Link } from 'react-router-dom'
import LegalLayout from './LegalLayout.jsx'

export default function TermsOfUse() {
  return (
    <LegalLayout
      title="Kullanım Koşulları, Telif ve Sorumluluk Reddi"
      description="Zecution Gaming (zecution.com) web sitesinin, kurulum rehberlerinin, 3D model ve simülasyon modu galerisinin kullanım şartları, fikri mülkiyet hakları ve DMCA telif bildirim prosedürü."
      seoTitle="Kullanım Koşulları ve Telif Hakları"
      seoDescription="Zecution Gaming kullanım koşulları, oyun modları sorumluluk reddi, 3D model lisans kuralları ve DMCA telif hakkı bildirim prosedürü."
    >
      <section className="legal-section">
        <h2>1. Taraflar ve Koşulların Kabulü</h2>
        <p>
          Bu Kullanım Koşulları ve Sorumluluk Reddi Beyanı, <strong>https://zecution.com</strong> alan adlı web sitesini (&quot;Site&quot; veya &quot;Platform&quot;) ziyaret eden, üye olan, rehberlerden yararlanan, mod indiren veya mod/teklif başvurusunda bulunan tüm gerçek ve tüzel kişiler (&quot;Kullanıcı&quot;) ile <strong>Zecution Gaming</strong> arasındaki kullanım şartlarını düzenler.
        </p>
        <p>
          Siteye erişim sağlayarak veya sitedeki herhangi bir içeriği kullanarak bu koşulları okuduğunuzu, anladığınızı ve bunlarla bağlı kalmayı kabul ettiğinizi beyan etmiş olursunuz.
        </p>
      </section>

      <section className="legal-section">
        <h2>2. Oyun Modları, Ticari Markalar ve Resmi Bağımsızlık Beyanı</h2>
        <p>
          Zecution Gaming; <strong>Assetto Corsa</strong>, <strong>BeamNG.drive</strong> ve <strong>Euro Truck Simulator 2 (ETS2)</strong> gibi simülasyon oyunları için topluluk tabanlı 3D araç modelleri, harita tasarımları, fizik geliştirme çalışmaları ve kurulum rehberleri sunan bağımsız bir dijital tasarım ve içerik platformudur.
        </p>

        <h3>Marka ve Oyun Yapımcıları Hakkında Yasal Uyarı</h3>
        <p>
          Sitemizde adı geçen oyun isimleri (Assetto Corsa / Kunos Simulazioni, BeamNG.drive / BeamNG GmbH, Euro Truck Simulator 2 / SCS Software) ve otomobil marka/logoları ilgili hak sahiplerinin tescilli ticari markalarıdır. Zecution Gaming&apos;in söz konusu oyun geliştiricileri veya otomobil üreticileri ile resmi bir ortaklığı, sponsorluğu veya temsilciliği bulunmamaktadır. Marka ve model isimleri yalnızca simülasyon içi uyumluluğu ve sanatsal 3D model referansını tanımlamak amacıyla adil kullanım (nominative fair use) kapsamında belirtilmektedir.
        </p>
      </section>

      <section className="legal-section">
        <h2>3. Fikri Mülkiyet, Lisans ve DMCA / Uyar-Kaldır Politikası</h2>
        <p>
          Zecution Gaming üzerinde yer alan içerikler iki ana kategoriden oluşmaktadır:
        </p>

        <h3>Zecution Gaming Özgün İçerikleri ve Rehberleri</h3>
        <p>
          Sitemizdeki tüm kurulum rehberleri, makaleler, arayüz tasarımları, videolar ve &quot;Zecution Gaming&quot; imzalı özel 3D araç/harita çalışmaları telif hakları kapsamında korunmaktadır. İzinsiz olarak kopyalanamaz, başka sitelerde ücretli olarak satılamaz veya kaynak gösterilmeden yeniden dağıtılamaz.
        </p>

        <h3>Topluluk ve Üretici Mod Paylaşımları</h3>
        <p>
          &quot;Modunu Yayınla&quot; sistemi üzerinden bağımsız mod üreticileri tarafından gönderilen modlarda, içerik üreticisinin (Producer) adı ve sosyal medya bağlantıları açıkça belirtilir. Gönderici, yüklediği modun telif ve paylaşım haklarına sahip olduğunu beyan ve taahhüt eder.
        </p>

        <h3>DMCA / Telif Hakkı İhlal Bildirimi (Uyar-Kaldır Prensibi)</h3>
        <p>
          Fikri mülkiyet haklarına saygı duyuyoruz. Sitemizde yer alan herhangi bir 3D modelin, dokunun (texture), ses dosyasının veya mod arşivinin telif hakkınızı ihlal ettiğini düşünüyorsanız, hak sahibi olduğunuzu gösteren kanıt veya orijinal çalışma bağlantısı, ihlal iddiasına konu olan içeriğin zecution.com üzerindeki tam URL adresi ve iletişim bilgilerinizle birlikte{' '}
          <a href="mailto:iletisim@zecution.com" className="legal-inline-link">
            iletisim@zecution.com
          </a>{' '}
          adresine veya{' '}
          <Link to="/iletisim" className="legal-inline-link">
            İletişim Formumuza
          </Link>{' '}
          bildirimde bulunabilirsiniz.
        </p>
        <p>
          Geçerli telif bildirimleri <strong>en geç 24 - 48 saat içerisinde</strong> titizlikle incelenir ve hak ihlali tespit edilen içerikler derhal yayından kaldırılır veya üretici talebine göre kaynak/bağlantı güncellemesi yapılır.
        </p>
      </section>

      <section className="legal-section">
        <h2>4. Üyelik, Yorumlar ve Topluluk Kuralları</h2>
        <p>
          Sitemize üye olan veya içeriklere yorum bırakan kullanıcılar; yorum alanlarında küfür, hakaret, nefret söylemi, yasa dışı içerik, korsan oyun/yazılım (crack/warez) paylaşımı veya reklam/spam linki yayınlamamayı kabul eder. &quot;Modunu Yayınla&quot; formunu kullanan üreticiler, paylaştıkları arşiv dosyalarının (ZIP/RAR/7z) zararlı yazılım veya virüs içermediğini taahhüt eder. Topluluk kurallarını ihlal eden yorumlar yönetici onayından geçmez ve ilgili kullanıcı hesapları askıya alınabilir.
        </p>
      </section>

      <section className="legal-section">
        <h2>5. Özel 3D Modelleme, Teklif ve Dijital Mağaza Hizmetleri</h2>
        <p>
          Sitemiz üzerinden sunulan &quot;Kişiye Özel Araç Modu&quot;, &quot;3D Model Tasarımı&quot;, &quot;Sıfırdan Kurulum Hizmeti&quot; ve mağaza vitrinindeki dijital ürünler, müşteri ile yapılan kapsam görüşmesine ve üçüncü taraf güvenli satış platformlarının (Patreon, Gumroad, Shopier vb.) kurallarına tabidir. Özel siparişlerde teslim süresi, revizyon hakları ve kullanım lisansı proje başlangıcında yazılı olarak kararlaştırılır.
        </p>
      </section>

      <section className="legal-section">
        <h2>6. Sorumluluk Sınırlandırması</h2>
        <p>
          Sitemizdeki tüm kurulum rehberleri (Content Manager, Custom Shaders Patch, Pure, direksiyon FFB ayarları vb.) ve mod dosyaları test edilerek paylaşılmaktadır. Bununla birlikte, oyun dosyalarınıza üçüncü taraf mod veya grafik yaması kurmadan önce orijinal oyun klasörünüzün yedeğini almanız önerilir. Kullanıcı hatasından, uyumsuz oyun sürümünden veya üçüncü taraf indirme servislerinden kaynaklanabilecek veri kayıplarından Zecution Gaming sorumlu tutulamaz.
        </p>
      </section>

      <section className="legal-section">
        <h2>7. Değişiklikler ve Yürürlük</h2>
        <p>
          Zecution Gaming, işbu Kullanım Koşullarını yasal düzenlemelere ve hizmet kapsamındaki yeniliklere paralel olarak önceden bildirimde bulunmaksızın güncelleme hakkını saklı tutar. Güncel metin her zaman bu sayfada yayınlandığı andan itibaren geçerlidir.
        </p>
      </section>
    </LegalLayout>
  )
}
