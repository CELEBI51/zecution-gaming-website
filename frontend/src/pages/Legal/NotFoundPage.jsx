import { Link } from 'react-router-dom'
import LegalLayout from './LegalLayout.jsx'

export default function NotFoundPage() {
  return (
    <LegalLayout
      title="Aradığınız Sayfa Bulunamadı (404)"
      description="Ulaşmaya çalıştığınız sayfa taşınmış, kaldırılmış veya adres çubuğuna yanlış yazılmış olabilir. Aşağıdaki bağlantılardan Zecution Gaming içeriklerine kesintisiz devam edebilirsiniz."
      lastUpdated={null}
      seoTitle="Sayfa Bulunamadı (404)"
      seoDescription="Aradığınız sayfa Zecution Gaming üzerinde bulunamadı. Ana sayfa, mod galerisi ve kurulum rehberlerine göz atabilirsiniz."
    >
      <section className="legal-section">
        <h2>Hızlı Yönlendirme Bağlantıları</h2>
        <p>
          İstediğiniz içeriğe hızlıca ulaşmak için aşağıdaki ana bölümlerimizden birini seçebilirsiniz:
        </p>

        <h3>Mod Galerisi</h3>
        <p>
          Assetto Corsa, ETS2 ve BeamNG.drive için tüm araç ve harita modlarını{' '}
          <Link to="/modlar" className="legal-inline-link">
            Mod Galerisi
          </Link>{' '}
          sayfasında keşfedebilirsiniz.
        </p>

        <h3>Kurulum Rehberleri</h3>
        <p>
          Content Manager, CSP, Pure grafik motoru ve direksiyon FFB ayar rehberlerini{' '}
          <Link to="/rehberler" className="legal-inline-link">
            Rehberler
          </Link>{' '}
          sayfasında inceleyebilirsiniz.
        </p>

        <h3>Dijital Mağaza</h3>
        <p>
          Özel üretim yüksek detaylı araç paketlerini ve VIP içerikleri{' '}
          <Link to="/magaza" className="legal-inline-link">
            Mağaza
          </Link>{' '}
          bölümümüzde görüntüleyebilirsiniz.
        </p>

        <div style={{ marginTop: '0.75rem' }}>
          <Link to="/" className="contact-submit-btn" style={{ textDecoration: 'none' }}>
            Ana Sayfaya Dön
          </Link>
        </div>
      </section>
    </LegalLayout>
  )
}
