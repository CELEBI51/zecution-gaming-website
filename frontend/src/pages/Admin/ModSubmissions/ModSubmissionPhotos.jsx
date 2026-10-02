import { useEffect, useState } from 'react'
import { api } from '../../../services/api.js'

export default function ModSubmissionPhotos({ submissionId, photos = [] }) {
  const [images, setImages] = useState([])
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let active = true
    const urls = []
    setError('')
    setImages([])

    if (!photos || photos.length === 0) return

    Promise.all(
      photos.map(async (photo) => {
        try {
          const blob = await api.getModSubmissionPhoto(submissionId, photo.id)
          if (!active) return null
          const url = URL.createObjectURL(blob)
          urls.push(url)
          return { ...photo, url }
        } catch {
          return null
        }
      })
    )
      .then((result) => {
        if (active) setImages(result.filter(Boolean))
      })
      .catch(() => {
        if (active) setError('Fotoğraflar yüklenemedi.')
      })

    return () => {
      active = false
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [submissionId, photos, reload])

  if (!photos || photos.length === 0) {
    return (
      <section style={{ margin: '1.5rem 0' }}>
        <h3 style={{ fontSize: '1rem', color: '#c084fc', marginBottom: '0.5rem' }}>Ekran Görüntüleri</h3>
        <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>Bu başvuru için görsel yüklenmemiş.</p>
      </section>
    )
  }

  return (
    <section style={{ margin: '1.5rem 0' }}>
      <h3 style={{ fontSize: '1rem', color: '#c084fc', marginBottom: '0.75rem' }}>
        Ekran Görüntüleri ({photos.length})
      </h3>
      {error ? (
        <p style={{ color: '#fca5a5', fontSize: '0.85rem' }} role="alert">
          {error}{' '}
          <button
            type="button"
            className="quote-admin-button"
            onClick={() => setReload((n) => n + 1)}
            style={{ marginLeft: '0.5rem' }}
          >
            Tekrar dene
          </button>
        </p>
      ) : images.length === 0 ? (
        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }} role="status">
          Fotoğraflar yükleniyor…
        </p>
      ) : (
        <div className="quote-admin-photos">
          {images.map((photo) => (
            <a href={photo.url} target="_blank" rel="noopener noreferrer" key={photo.id}>
              <img src={photo.url} alt={photo.name} />
              <small>{photo.name}</small>
            </a>
          ))}
        </div>
      )}
    </section>
  )
}
