import { Link } from 'react-router-dom'
import LegalLayout, { SOCIAL_LINKS } from './LegalLayout.jsx'

export default function AboutPage() {
  return (
    <LegalLayout
      title="Hakkımızda — Zecution Gaming Kimdir?"
      description="Otomobil tutkusunu yüksek hassasiyetli 3D modelleme, gerçekçi simülasyon fiziği ve kapsamlı Türkçe teknik rehberlerle dijital dünyaya taşıyan bağımsız tasarım ve içerik stüdyosu."
      lastUpdated={null}
      seoTitle="Hakkımızda"
      seoDescription="Zecution Gaming kimdir? Assetto Corsa, BeamNG.drive ve ETS2 için özel 3D araç modelleme, fizik geliştirme ve Türkçe simülasyon rehberleri stüdyosu."
    >
      <section className="legal-section">
        <h2>1. Hikayemiz ve Misyonumuz</h2>
        <p>
          <strong>Zecution Gaming (zecution.com)</strong>, simülasyon oyunları ve dijital otomotiv tasarımı alanında Türkiye&apos;deki kaliteli içerik, gerçekçi araç fiziği ve anlaşılır Türkçe teknik rehber eksikliğini gidermek amacıyla kurulmuş bağımsız bir dijital üretim ve topluluk platformudur.
        </p>
        <p>
          Yalnızca hazır modelleri oyuna aktaran bir sayfa olmanın ötesine geçerek; her otomobilin kendine has ruhunu, motor ses karakteristiğini, süspansiyon geometrisini ve iç-dış mekan işçiliğini <strong>Assetto Corsa</strong>, <strong>BeamNG.drive</strong> ve <strong>Euro Truck Simulator 2 (ETS2)</strong> dünyasına birebir yansıtmayı hedefliyoruz.
        </p>
        <p>
          Bugün Zecution Gaming; on binlerce simülasyon tutkununun takip ettiği YouTube, Instagram, TikTok ve Discord topluluğuyla hem ücretsiz mod arşivi hem kişiye özel 3D araç üretim stüdyosu hem de kapsamlı bir Türkçe simülasyon bilgi merkezi olarak faaliyet göstermektedir.
        </p>
      </section>

      <section className="legal-section">
        <h2>2. Neler Üretiyoruz? Uzmanlık Alanlarımız</h2>

        <h3>Özel Araç Modları ve Gerçekçi Fizik</h3>
        <p>
          Tofaş Doğan SLX ve Adana/Ankara işi ikonik yerli kültür araçlarından BMW E36 Cabrio, Honda S2000 AP2 V2 ve ticari minibüs/tır modlarına kadar; PBR materyal kaplamaları, çalışan kadranlar, Extra FX animasyonları ve gerçekçi aktarma organı verileriyle donatılmış modlar geliştiriyoruz.
        </p>

        <h3>3D Modelleme ve Kişiye Özel Projeler</h3>
        <p>
          Blender, 3ds Max ve Kunos Editor (ksEditor) iş akışlarımızla; gerçek hayattaki aracını dijital ortamda birebir plakası, jantı, ses sistemi ve basıklığıyla görmek isteyen otomobil tutkunları için kişiye özel 3D modelleme ve oyun içi entegrasyon hizmeti sunuyoruz.
        </p>

        <h3>Simülasyon Bilgi Merkezi ve Rehberler</h3>
        <p>
          Simülasyon dünyasına yeni adım atan veya performans sorunları yaşayan oyuncular için; Content Manager, Custom Shaders Patch (CSP), Pure grafik motoru, RainFX yağmur fiziği, direksiyon Force Feedback (Logitech, Thrustmaster, Moza) ve FPS optimizasyonu konularında adım adım Türkçe rehberler hazırlıyoruz.
        </p>

        <h3>Açık Üretici Ekosistemi ve Topluluk</h3>
        <p>
          &quot;Modunu Yayınla&quot; altyapımız sayesinde Türkiye&apos;deki yetenekli bağımsız mod üreticilerinin çalışmalarını kalite ve güvenlik kontrolünden geçirerek kendi isimleri ve sosyal medya profilleriyle binlerce oyuncuya ulaştırmalarına aracılık ediyoruz.
        </p>
      </section>

      <section className="legal-section">
        <h2>3. Kalite ve Güven Standartlarımız</h2>
        <p>
          Platformumuzda yayınlanan her içerik ve rehber aşağıdaki temel ilkelere göre denetlenir:
        </p>

        <h3>Test Edilmiş ve Güvenli İçerik</h3>
        <p>
          Sitemizde paylaşılan tüm araç/harita modları ve grafik ayarları, yayınlanmadan önce ekibimiz tarafından güncel Content Manager ve CSP sürümlerinde bizzat test edilir; zararlı yazılım veya bozuk dosya barındırmaz.
        </p>

        <h3>FPS ve Optimizasyon Odaklılık</h3>
        <p>
          Görsel kaliteden ödün vermeden orta ve giriş seviyesi bilgisayarlarda da akıcı (60+ FPS) sürüş deneyimi sunacak poligon (LOD) ve doku optimizasyonuna özen gösterilir.
        </p>

        <h3>Üretici Emeğine Saygı</h3>
        <p>
          Her mod sayfasında içeriği hazırlayan geliştiricinin (Producer) kimliği açıkça gösterilir ve fikri mülkiyet hakları korunur.
        </p>

        <h3>Adım Adım Teknik Destek</h3>
        <p>
          Yalnızca dosya indirme linki vermekle kalmıyor; kurulum dizininden olası siyah ekran, ses çıkmama veya CSP hatası çözümlerine kadar tüm teknik detayları rehberlerimizde açıkça anlatıyoruz.
        </p>
      </section>

      <section className="legal-section">
        <h2>4. Teknik Altyapı ve Hizmetlerimiz</h2>

        <h3>Mod Galerisi</h3>
        <p>
          Assetto Corsa, ETS2 ve BeamNG.drive için kategorilere ayrılmış, yüksek hızlı indirme seçenekli araç ve harita arşivimize{' '}
          <Link to="/modlar" className="legal-inline-link">
            Mod Galerisi
          </Link>{' '}
          sayfasından ulaşabilirsiniz.
        </p>

        <h3>Kurulum Rehberleri</h3>
        <p>
          CSP, Pure, RainFX, grafik paketleri, trafik kurulumu ve direksiyon ayarları için hazırladığımız tüm Türkçe kılavuzları{' '}
          <Link to="/rehberler" className="legal-inline-link">
            Rehberler
          </Link>{' '}
          bölümünde inceleyebilirsiniz.
        </p>

        <h3>Özel Sipariş ve Kurulum Hizmeti</h3>
        <p>
          Kişiye özel araç modu üretimi, 3D modelleme talepleri ve uzaktan bağlantı ile sıfırdan anahtar teslim oyun kurulumu için{' '}
          <Link to="/teklif-al" className="legal-inline-link">
            Teklif Al
          </Link>{' '}
          formumuzu kullanabilirsiniz.
        </p>
      </section>

      <section className="legal-section">
        <h2>5. Resmi Topluluk Kanallarımız ve İletişim</h2>
        <p>
          Yeni çıkan araç modlarımızdan, canlı sürüş etkinliklerimizden ve güncel grafik rehberlerimizden haberdar olmak için resmi sosyal medya hesaplarımızı takip edebilir, iş birliği veya destek talepleriniz için{' '}
          <Link to="/iletisim" className="legal-inline-link">
            İletişim Sayfamızdan
          </Link>{' '}
          veya <strong>iletisim@zecution.com</strong> e-posta adresimizden bize ulaşabilirsiniz.
        </p>
        <p>
          Resmi Hesaplarımız:{' '}
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
    </LegalLayout>
  )
}
