import { Link } from 'react-router-dom'

const LINKS = [
  { to: '/hakkimizda', label: 'Hakkımızda' },
  { to: '/iletisim', label: 'İletişim' },
  { to: '/gizlilik-politikasi', label: 'Gizlilik Politikası' },
  { to: '/cerez-politikasi', label: 'Çerez Politikası' },
  { to: '/kullanim-kosullari', label: 'Kullanım Koşulları' },
  { to: '/kvkk', label: 'KVKK' },
]

export default function LegalFooterLinks() {
  return (
    <nav
      aria-label="Yasal ve kurumsal bağlantılar"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '0.85rem 1.25rem',
        fontSize: '0.82rem',
        color: 'rgba(255, 255, 255, 0.62)',
      }}
    >
      {LINKS.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          style={{
            color: 'rgba(255, 255, 255, 0.68)',
            textDecoration: 'none',
            transition: 'color 0.15s ease',
          }}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
