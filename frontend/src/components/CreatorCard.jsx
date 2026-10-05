import React from 'react'
import { Link } from 'react-router-dom'
import { Crown, Wrench, ArrowUpRight } from 'lucide-react'
import { isProducerFounder, isProducerPartner, getProducerAvatar, getProducerRoleInfo } from '../services/producers.js'
import { getMediaUrl } from '../services/api.js'
import './CreatorCard.css'

export default function CreatorCard({
  name = 'Zecution Gaming',
  role,
  badge,
  avatar,
  posts = 0,
  joinYear = '2024',
  actionText,
  actionIcon: ActionIcon,
  onAction,
  actionHref,
  style,
  className = '',
}) {
  const cleanName = name ? String(name).replace(/👑/g, '').trim() : 'Zecution Gaming'
  const roleInfo = getProducerRoleInfo(cleanName)
  const isFounder = roleInfo.key === 'KURUCU'
  const isPartner = roleInfo.key === 'PARTNER'

  const displayName = isFounder ? `${cleanName} 👑` : cleanName
  const displayRole = role || roleInfo.roleTitle
  const displayBadge = badge || roleInfo.badge
  const badgeClass = roleInfo.badgeClass
  const rawAvatar = avatar || getProducerAvatar(cleanName) || (isFounder ? '/media/images/logo.jpg' : null)
  const displayAvatar = rawAvatar ? getMediaUrl(rawAvatar) : null

  const postsText = typeof posts === 'number'
    ? `${posts} Gönderi`
    : (String(posts).includes('Gönderi') ? posts : `${posts} Gönderi`)

  const renderAvatar = () => {
    if (displayAvatar) {
      return (
        <img
          src={displayAvatar}
          alt={displayName}
          className="creator-card-avatar"
          onError={(e) => {
            e.currentTarget.src = '/media/images/logo.jpg'
          }}
        />
      )
    }

    const initials = cleanName
      .split(' ')
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'ZG'

    return (
      <div className="creator-card-avatar creator-card-avatar--monogram">
        <span>{initials}</span>
      </div>
    )
  }

  const defaultActionText = isFounder
    ? 'Kurulum Hizmeti İste'
    : 'Yapımcının Diğer Modları'

  const finalActionText = actionText || defaultActionText
  const FinalIcon = ActionIcon || (isFounder ? Wrench : ArrowUpRight)

  return (
    <div className={`creator-card ${isFounder ? 'creator-card--founder' : ''} ${className}`} style={style}>
      <div className="creator-card-avatar-wrap">
        {renderAvatar()}
        <span className="creator-card-online-dot" title="Çevrimiçi" />
      </div>

      <h3 className="creator-card-name">
        {displayName}
      </h3>

      <span className="creator-card-role">{displayRole}</span>

      <span className={`creator-card-badge ${badgeClass}`}>
        {isFounder && <Crown size={12} className="creator-crown-icon" />}
        {displayBadge}
      </span>

      <div className="creator-card-details">
        <div className="creator-card-detail-row">
          <span>Gönderi:</span>
          <strong>{postsText}</strong>
        </div>
        <div className="creator-card-detail-row">
          <span>Katılım:</span>
          <strong>{joinYear}</strong>
        </div>
      </div>

      {(onAction || actionHref) && (
        <div className="creator-card-cta">
          {actionHref ? (
            actionHref.startsWith('http') || actionHref.startsWith('//') ? (
              <a
                href={actionHref}
                target="_blank"
                rel="noreferrer"
                className="creator-card-btn"
                onClick={onAction}
              >
                <FinalIcon size={14} />
                <span>{finalActionText}</span>
              </a>
            ) : (
              <Link
                to={actionHref}
                className="creator-card-btn"
                onClick={onAction}
              >
                <FinalIcon size={14} />
                <span>{finalActionText}</span>
              </Link>
            )
          ) : (
            <button
              type="button"
              className="creator-card-btn"
              onClick={onAction}
            >
              <FinalIcon size={14} />
              <span>{finalActionText}</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
