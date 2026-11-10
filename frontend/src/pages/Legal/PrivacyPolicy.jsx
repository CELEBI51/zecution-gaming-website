import { Link } from 'react-router-dom'
import LegalLayout from './LegalLayout.jsx'

export default function PrivacyPolicy() {
  return (
    <LegalLayout
      title="Gizlilik Politikası"
      description="Zecution Gaming (zecution.com) olarak ziyaretçilerimizin ve üyelerimizin kişisel verilerinin gizliliğine, güvenliğine ve Google AdSense yayıncı politikalarına tam uyumluluğa en üst düzeyde önem veriyoruz."
      seoTitle="Gizlilik Politikası"
      seoDescription="Zecution Gaming gizlilik politikası, kişisel verilerin korunması, çerez kullanımı ve Google AdSense reklam politikaları hakkında detaylı bilgilendirme."
    >
      <section className="legal-section">
        <h2>1. Giriş ve Kapsam</h2>
        <p>
          Bu Gizlilik Politikası, <strong>Zecution Gaming</strong> (&quot;Platform&quot;, &quot;Site&quot; veya &quot;Biz&quot;) tarafından işletilen{' '}
          <strong>https://zecution.com</strong> web sitesini ziyaret ettiğinizde, simülasyon rehberlerimizi okuduğunuzda, mod galerimizden içerik indirdiğinizde, üye olduğunuzda veya özel 3D model/araç modu teklif formlarımızı kullandığınızda bilgilerinizin nasıl toplandığını, işlendiğini, korunduğunu ve kullanıldığını açıklamaktadır.
        </p>
        <p>
          Sitemizi kullanarak bu Gizlilik Politikasında belirtilen veri işleme ve çerez kullanım esaslarını kabul etmiş sayılırsınız.
        </p>
      </section>

      <section className="legal-section">
        <h2>2. Toplanan Bilgiler ve Kayıt Dosyaları (Log Files)</h2>
        <p>
          Zecution Gaming üzerinde sunduğumuz hizmetlerin kalitesini artırmak ve güvenliği sağlamak amacıyla aşağıdaki veri türleri işlenebilmektedir:
        </p>

        <h3>Hesap ve Üyelik Bilgileri</h3>
        <p>
          Sitemize kayıt olurken paylaştığınız kullanıcı adı, e-posta adresi, şifrelenmiş (hashlenmiş) parola bilgisi ve isteğe bağlı profil fotoğrafı.
        </p>

        <h3>İletişim, Teklif ve Mod Başvuru Verileri</h3>
        <p>
          &quot;Teklif Al&quot;, &quot;Modunu Yayınla&quot; veya &quot;İletişim&quot; formları aracılığıyla gönderdiğiniz ad, e-posta, sosyal medya kullanıcı adı, proje açıklamaları ve referans görseller.
        </p>

        <h3>Topluluk Etkileşimleri</h3>
        <p>
          Mod ve ürün sayfalarına bıraktığınız yorumlar, değerlendirme puanları ve beğeni etkileşimleri.
        </p>

        <h3>Standart Kayıt Dosyaları (Log Files)</h3>
        <p>
          Çoğu standart web sunucusunda olduğu gibi; IP adresiniz, internet servis sağlayıcınız (İSS), tarayıcı türünüz, işletim sisteminiz, yönlendiren/çıkış sayfaları, tarih/saat damgaları ve tıklama sayıları güvenlik ve anonim trafik analizi amacıyla kaydedilir. Bu veriler kişisel kimliğinizi doğrudan tespit etmek için kullanılmaz.
        </p>
      </section>

      <section className="legal-section">
        <h2>3. Google AdSense, DoubleClick DART Çerezleri ve Üçüncü Taraf Reklamcılık</h2>
        <p>
          Zecution Gaming, içerik üretimini ve sunucu altyapısını finanse etmek, ziyaretçilerine ücretsiz simülasyon rehberleri ve mod arşivleri sunabilmek amacıyla <strong>Google AdSense</strong> başta olmak üzere üçüncü taraf reklam ağlarından yararlanmaktadır.
        </p>

        <h3>Google ve Üçüncü Taraf Satıcı Çerezleri</h3>
        <p>
          Google dahil üçüncü taraf tedarikçiler (satıcılar), kullanıcıların bu web sitesine (zecution.com) veya internetteki diğer web sitelerine yaptıkları önceki ziyaretlere dayalı olarak reklam yayınlamak için çerezleri (cookies) kullanmaktadır.
        </p>

        <h3>DoubleClick / DART Reklam Çerezi Kullanımı</h3>
        <p>
          Google&apos;ın reklam çerezlerini (DoubleClick / DART çerezi dahil) kullanması, kendisine ve iş ortaklarına kullanıcılarımızın sitemize ve/veya internetteki diğer sitelere yaptıkları ziyaretlere dayalı olarak uygun ve kişiselleştirilmiş reklamlar sunma olanağı tanır.
        </p>

        <h3>Kişiselleştirilmiş Reklamları Devre Dışı Bırakma</h3>
        <p>
          Kullanıcılar,{' '}
          <a
            href="https://adssettings.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="legal-inline-link"
          >
            Google Reklam Ayarları (Ads Settings)
          </a>{' '}
          sayfasını ziyaret ederek kişiselleştirilmiş reklamcılığı istedikleri zaman devre dışı bırakabilirler. Alternatif olarak,{' '}
          <a
            href="https://www.aboutads.info/choices/"
            target="_blank"
            rel="noopener noreferrer"
            className="legal-inline-link"
          >
            www.aboutads.info
          </a>{' '}
          adresini ziyaret ederek üçüncü taraf satıcıların kişiselleştirilmiş reklamcılık için çerez kullanmasını engelleyebilirsiniz.
        </p>
        <p>
          Üçüncü taraf reklam sunucuları veya reklam ağları, zecution.com üzerinde görünen reklamlarda ve bağlantılarda kullanılan çerezler, JavaScript veya Web İşaretçileri (Web Beacons) gibi teknolojileri doğrudan tarayıcınıza gönderebilir. Zecution Gaming&apos;in üçüncü taraf reklamverenler tarafından kullanılan bu çerezler üzerinde doğrudan erişimi veya kontrolü bulunmamaktadır. Çerezler hakkında daha kapsamlı bilgi için{' '}
          <Link to="/cerez-politikasi" className="legal-inline-link">
            Çerez Politikası
          </Link>{' '}
          sayfamızı inceleyebilirsiniz.
        </p>
      </section>

      <section className="legal-section">
        <h2>4. Bilgilerin Kullanım Amaçları</h2>
        <p>
          Topladığımız verileri yalnızca web sitemizi işletmek, bakımını yapmak, hız ve performansını optimize etmek; kullanıcı hesaplarını doğrulamak ve güvenli oturum yönetimi sağlamak; özel 3D araç modelleme, mod geliştirme ve kurulum desteği taleplerinize yanıt vermek; topluluk tarafından gönderilen mod başvurularını incelemek; spam, kötüye kullanım ve siber saldırıları engellemek ve yasal yükümlülüklerimizi yerine getirmek amacıyla kullanırız.
        </p>
      </section>

      <section className="legal-section">
        <h2>5. Veri Güvenliği ve Saklama Süresi</h2>
        <p>
          Kişisel verilerinizin güvenliği bizim için önceliklidir. Sitemizdeki tüm veri iletişimi <strong>256-bit SSL/TLS (HTTPS)</strong> şifreleme protokolü ile korunmaktadır. Kullanıcı parolaları veritabanımızda açık metin olarak asla tutulmaz; endüstri standardı kriptografik özetleme (bcrypt) algoritmalarıyla saklanır.
        </p>
        <p>
          Kişisel verileriniz, ilgili mevzuatta öngörülen süreler boyunca veya işleme amacının gerektirdiği süre zarfında muhafaza edilir; amaç ortadan kalktığında veya talebiniz üzerine silinir, yok edilir ya da anonim hale getirilir.
        </p>
      </section>

      <section className="legal-section">
        <h2>6. Üçüncü Taraf Bağlantılar (Dış Linkler)</h2>
        <p>
          Sitemizde mod indirme bağlantıları (ModsFire, Google Drive, ShareMods vb.), YouTube eğitim videoları ve sosyal medya kanalları (Instagram, Discord, TikTok) gibi üçüncü taraf web sitelerine yönlendiren bağlantılar bulunabilir. Bu dış sitelerin gizlilik uygulamalarından veya içeriklerinden Zecution Gaming sorumlu değildir; ziyaret ettiğiniz her sitenin kendi gizlilik politikasını incelemenizi öneririz.
        </p>
      </section>

      <section className="legal-section">
        <h2>7. Kullanıcı Hakları ve Çocukların Gizliliği</h2>
        <p>
          6698 sayılı KVKK ve GDPR kapsamında; verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini veya silinmesini talep etme ve çerez tercihlerinizi değiştirme hakkına sahipsiniz. Detaylı haklarınız için{' '}
          <Link to="/kvkk" className="legal-inline-link">
            KVKK Aydınlatma Metni
          </Link>{' '}
          sayfamızı ziyaret edebilirsiniz.
        </p>
        <p>
          Zecution Gaming, 13 yaşın altındaki çocuklardan bilerek kişisel tanımlayıcı bilgi toplamaz. Bir ebeveyn veya vasi olarak çocuğunuzun sitemizde kişisel bilgi paylaştığını düşünüyorsanız derhal bizimle iletişime geçebilirsiniz; ilgili veriler sistemlerimizden ivedilikle kaldırılacaktır.
        </p>
      </section>

      <section className="legal-section">
        <h2>8. İletişim</h2>
        <p>
          Gizlilik Politikamız, kişisel verileriniz veya reklam/çerez uygulamalarımız hakkında her türlü soru, görüş ve talebiniz için bize{' '}
          <a href="mailto:iletisim@zecution.com" className="legal-inline-link">
            iletisim@zecution.com
          </a>{' '}
          e-posta adresimizden veya{' '}
          <Link to="/iletisim" className="legal-inline-link">
            İletişim Sayfamızdan
          </Link>{' '}
          ulaşabilirsiniz.
        </p>
      </section>
    </LegalLayout>
  )
}
