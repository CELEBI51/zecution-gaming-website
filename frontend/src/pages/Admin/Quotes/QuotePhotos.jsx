import { useEffect, useState } from 'react'
import { api } from '../../../services/api.js'

export default function QuotePhotos({ quoteId, photos }) {
  const [images, setImages] = useState([])
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  useEffect(() => {
    let active = true
    const urls = []
    setError('')
    setImages([])
    Promise.all(photos.map(async photo => {
      const blob = await api.getQuotePhoto(quoteId, photo.id)
      if (!active) return null
      const url = URL.createObjectURL(blob)
      urls.push(url)
      return { ...photo, url }
    })).then(result => { if (active) setImages(result.filter(Boolean)) }).catch(() => { if (active) setError('Fotoğraflar yüklenemedi.') })
    return () => { active = false; urls.forEach(url => URL.revokeObjectURL(url)) }
  }, [quoteId, photos, reload])
  return <section><h3>Fotoğraflar ({photos.length})</h3>
    {error ? <p role="alert">{error} <button type="button" className="quote-admin-button" onClick={() => setReload(n => n + 1)}>Tekrar dene</button></p> : !images.length ? <p role="status">Fotoğraflar yükleniyor…</p> : <div className="quote-admin-photos">{images.map(photo => <a href={photo.url} target="_blank" rel="noopener noreferrer" key={photo.id}><img src={photo.url} alt={photo.name} /><small>{photo.name}</small></a>)}</div>}
  </section>
}
