import { useEffect, useState } from 'react'
import {
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  Check,
  Clock,
  Copy,
  Folder,
  Gauge,
  Lightbulb,
  Wrench,
  X,
} from 'lucide-react'
import './GuideModal.css'

export default function GuideModal({ guide, onClose }) {
  const [copiedPath, setCopiedPath] = useState(false)
  const [copiedStep, setCopiedStep] = useState(null)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  if (!guide) return null

  const handleCopy = (text, type = 'target') => {
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'target') {
        setCopiedPath(true)
        setTimeout(() => setCopiedPath(false), 2000)
      } else {
        setCopiedStep(type)
        setTimeout(() => setCopiedStep(null), 2000)
      }
    })
  }

  const handleSetupInquiry = () => {
    const message = `Merhaba Zecution Gaming, "${guide.title}" rehberi hakkında sıfırdan profesyonel kurulum desteği almak istiyorum.`
    navigator.clipboard?.writeText(message).catch(() => {})
    window.open('https://www.instagram.com/zecution_gaming/', '_blank')
  }

  return (
    <div className="guide-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="guide-title">
      <div className="guide-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="guide-modal-header">
          <div className="guide-modal-header-meta">
            <span className={`guide-game-pill guide-game-pill--${guide.gameCode}`}>
              {guide.game}
            </span>
            <span className="guide-meta-chip">
              <Clock size={13} /> {guide.time}
            </span>
            <span className="guide-meta-chip">
              <Gauge size={13} /> {guide.difficulty}
            </span>
            <span className="guide-category-badge">{guide.category}</span>
          </div>

          <button
            type="button"
            className="guide-modal-close"
            onClick={onClose}
            aria-label="Rehberi kapat"
          >
            <X size={20} />
          </button>
        </div>

        {/* Title & Summary */}
        <div className="guide-modal-body">
          <h2 id="guide-title" className="guide-modal-title">
            {guide.title}
          </h2>
          <p className="guide-modal-summary">{guide.summary}</p>

          {/* Target Directory Box */}
          {guide.targetPath && (
            <div className="guide-target-box">
              <div className="guide-target-info">
                <Folder size={18} className="guide-target-icon" />
                <div>
                  <span className="guide-target-label">Varsayılan Dizin / Konum:</span>
                  <code className="guide-target-code">{guide.targetPath}</code>
                </div>
              </div>
              <button
                type="button"
                className={`guide-copy-btn ${copiedPath ? 'is-copied' : ''}`}
                onClick={() => handleCopy(guide.targetPath, 'target')}
                title="Dizini Kopyala"
              >
                {copiedPath ? (
                  <>
                    <Check size={15} /> Kopyalandı!
                  </>
                ) : (
                  <>
                    <Copy size={15} /> Kopyala
                  </>
                )}
              </button>
            </div>
          )}

          {/* Highlights */}
          {guide.highlights && guide.highlights.length > 0 && (
            <div className="guide-highlights">
              {guide.highlights.map((h, i) => (
                <span key={i} className="guide-highlight-tag">
                  #{h}
                </span>
              ))}
            </div>
          )}

          {/* Steps Timeline */}
          <div className="guide-steps-section">
            <h3 className="guide-section-title">
              <BookOpen size={18} /> Adım Adım Kurulum ve Yapılandırma
            </h3>

            <div className="guide-steps-list">
              {guide.steps.map((s, idx) => (
                <div key={idx} className="guide-step-card">
                  <div className="guide-step-num-col">
                    <span className="guide-step-number">{s.stepNumber}</span>
                    {idx !== guide.steps.length - 1 && <span className="guide-step-line" />}
                  </div>
                  <div className="guide-step-content">
                    <h4 className="guide-step-heading">{s.title}</h4>
                    <p className="guide-step-desc">{s.description}</p>
                    {s.codeOrPath && (
                      <div className="guide-step-code-row">
                        <code>{s.codeOrPath}</code>
                        <button
                          type="button"
                          className="guide-step-copy"
                          onClick={() => handleCopy(s.codeOrPath, `step-${idx}`)}
                          title="Komutu veya yolu kopyala"
                        >
                          {copiedStep === `step-${idx}` ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pro Tips Box */}
          {guide.tips && guide.tips.length > 0 && (
            <div className="guide-tips-box">
              <div className="guide-box-header">
                <Lightbulb size={20} className="guide-tip-icon" />
                <h4>Önemli İpuçları & Püf Noktaları</h4>
              </div>
              <ul className="guide-tips-list">
                {guide.tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Troubleshooting */}
          {guide.troubleshooting && guide.troubleshooting.length > 0 && (
            <div className="guide-troubleshoot-box">
              <div className="guide-box-header">
                <AlertCircle size={20} className="guide-alert-icon" />
                <h4>Sık Karşılaşılan Hatalar & Çözümleri</h4>
              </div>
              <div className="guide-troubleshoot-list">
                {guide.troubleshooting.map((item, i) => (
                  <div key={i} className="guide-troubleshoot-item">
                    <div className="guide-troubleshoot-prob">
                      <strong>Sorun:</strong> {item.problem}
                    </div>
                    <div className="guide-troubleshoot-sol">
                      <strong>Çözüm:</strong> {item.solution}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Help & Service Callout */}
          <div className="guide-help-card">
            <div className="guide-help-copy">
              <div className="guide-help-badge">
                <Wrench size={15} /> Destek & Hizmet
              </div>
              <h4>Vaktin yok mu veya hata mı alıyorsun?</h4>
              <p>
                Uzaktan bağlantı ile Assetto Corsa, Content Manager, CSP ve tüm modlarını sıfırdan biz kuralım.
              </p>
            </div>
            <button
              type="button"
              className="guide-help-btn"
              onClick={handleSetupInquiry}
            >
              Kurulum Desteği Al <ArrowUpRight size={16} />
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="guide-modal-footer">
          <span className="guide-modal-footer-brand">Zecution Gaming © Bilgi Merkezi</span>
          <button type="button" className="guide-modal-footer-close" onClick={onClose}>
            Kapat
          </button>
        </div>
      </div>
    </div>
  )
}
