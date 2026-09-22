import { useEffect, useState } from 'react'
import { Edit2, FolderTree, Loader2, Plus, Trash2, X } from 'lucide-react'
import { api } from '../../../services/api.js'

export default function CategoryManager() {
  const [categories, setCategories] = useState([])
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    section: 'STORE',
    gameId: '',
    parentId: '',
    sortOrder: 0,
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const [cats, gms] = await Promise.all([
        api.getAdminCategories(),
        api.getGames(),
      ])
      setCategories(cats)
      setGames(gms)
    } catch (err) {
      setError(err.message || 'Kategoriler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const openCreateModal = () => {
    setEditingCategory(null)
    setFormData({
      name: '',
      slug: '',
      section: 'STORE',
      gameId: '',
      parentId: '',
      sortOrder: 0,
    })
    setModalOpen(true)
  }

  const openEditModal = (cat) => {
    setEditingCategory(cat)
    setFormData({
      name: cat.name || '',
      slug: cat.slug || '',
      section: cat.section || 'STORE',
      gameId: cat.gameId || '',
      parentId: cat.parentId || '',
      sortOrder: cat.sortOrder || 0,
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')

    const payload = {
      ...formData,
      gameId: formData.gameId || null,
      parentId: formData.parentId || null,
      sortOrder: Number(formData.sortOrder) || 0,
    }

    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, payload)
        setNotice('Kategori güncellendi.')
      } else {
        await api.createCategory(payload)
        setNotice('Yeni kategori eklendi.')
      }
      setModalOpen(false)
      loadData()
    } catch (err) {
      alert(err.message || 'Kategori kaydedilemedi')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) return
    try {
      await api.deleteCategory(id)
      setNotice('Kategori silindi.')
      loadData()
    } catch (err) {
      alert(err.message || 'Kategori silinemedi')
    }
  }

  return (
    <div>
      <div className="admin-topbar">
        <div>
          <h1>Kategori Yönetimi</h1>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.65rem 1.1rem',
            background: 'linear-gradient(135deg, #7f22c9 0%, #a838f5 100%)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.85rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(127, 34, 201, 0.4)',
          }}
        >
          <Plus size={16} /> Yeni Kategori Ekle
        </button>
      </div>

      <div className="admin-content-area" style={{ maxWidth: '54rem' }}>
        {notice && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '0.5rem', color: '#4ade80', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
            {notice}
          </div>
        )}
        {error && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.5rem', color: '#f87171', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <div style={{ background: '#121212', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '0.75rem', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#ffffff8c' }}>
              <Loader2 className="animate-spin" size={26} style={{ margin: '0 auto 0.5rem' }} />
              <span>Kategoriler yükleniyor...</span>
            </div>
          ) : categories.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#ffffff8c' }}>
              Kategori bulunamadı.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#ffffff8c' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Kategori Adı</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Slug</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Bölüm</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Oyun</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '0.85rem 1rem', color: '#fff', fontWeight: 600 }}>
                      {cat.parent ? `↳ ${cat.name}` : cat.name}
                      {cat.parent && <span style={{ color: '#ffffff59', fontSize: '0.75rem', marginLeft: '0.5rem' }}>({cat.parent.name})</span>}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#ffffff73', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {cat.slug}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '0.3rem', background: cat.section === 'STORE' ? 'rgba(177, 60, 255, 0.15)' : 'rgba(59, 130, 246, 0.15)', color: cat.section === 'STORE' ? '#d880ff' : '#60a5fa' }}>
                        {cat.section === 'STORE' ? 'Mağaza' : 'Mod Galerisi'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#ffffffb3' }}>
                      {cat.game?.name || '-'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          type="button"
                          onClick={() => openEditModal(cat)}
                          style={{ padding: '0.45rem', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#fff', borderRadius: '0.4rem', cursor: 'pointer' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(cat.id)}
                          style={{ padding: '0.45rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', borderRadius: '0.4rem', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal */}
        {modalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ width: '100%', maxWidth: '28rem', background: '#121212', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '1rem', padding: '1.75rem', position: 'relative', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                  {editingCategory ? 'Kategoriyi Düzenle' : 'Yeni Kategori Ekle'}
                </h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: '#ffffff8c', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ffffffcc' }}>Kategori Adı *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Araç Modları"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ padding: '0.7rem 0.9rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '0.5rem', color: '#fff', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ffffffcc' }}>Bölüm *</label>
                  <select
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    style={{ padding: '0.7rem 0.9rem', background: '#1a1a1a', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '0.5rem', color: '#fff', outline: 'none' }}
                  >
                    <option value="STORE">Mağaza</option>
                    <option value="GALLERY">Mod Galerisi</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ffffffcc' }}>Bağlı Oyun (Varsa)</label>
                  <select
                    value={formData.gameId}
                    onChange={(e) => setFormData({ ...formData, gameId: e.target.value })}
                    style={{ padding: '0.7rem 0.9rem', background: '#1a1a1a', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '0.5rem', color: '#fff', outline: 'none' }}
                  >
                    <option value="">Oyuna Bağlı Değil</option>
                    {games.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ffffffcc' }}>Üst Kategori (Alt Kategori ise)</label>
                  <select
                    value={formData.parentId}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                    style={{ padding: '0.7rem 0.9rem', background: '#1a1a1a', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '0.5rem', color: '#fff', outline: 'none' }}
                  >
                    <option value="">Ana Kategori (Üst Kategori Yok)</option>
                    {categories
                      .filter((c) => !c.parentId && (!editingCategory || c.id !== editingCategory.id))
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.section === 'STORE' ? 'Mağaza' : 'Galeri'})
                        </option>
                      ))}
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    style={{ padding: '0.65rem 1rem', background: 'rgba(255, 255, 255, 0.08)', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '0.65rem 1.25rem', background: '#7f22c9', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 700 }}
                  >
                    {editingCategory ? 'Kaydet' : 'Oluştur'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
