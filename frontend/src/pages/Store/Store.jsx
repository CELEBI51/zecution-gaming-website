import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowUpRight,
  Filter,
  Loader2,
  PackageOpen,
  X,
} from 'lucide-react'
import { api, getMediaUrl } from '../../services/api.js'
import './Store.css'

const INSTAGRAM_URL = 'https://www.instagram.com/zecution_gaming/'

function Store() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [categories, setCategories] = useState([{ id: 'all', label: 'Tüm Ürünler' }])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function loadStoreData() {
      try {
        setLoading(true)
        setError(null)

        const [categoryData, contentData] = await Promise.all([
          api.getCategories({ section: 'store' }),
          api.getContents({ section: 'store', limit: 100 }),
        ])

        if (!isMounted) return

        const formattedCategories = [{ id: 'all', label: 'Tüm Ürünler' }]
        for (const category of categoryData) {
          formattedCategories.push({
            id: category.slug,
            label: category.name,
            parent: category.parent?.slug || null,
          })
        }
        setCategories(formattedCategories)

        const formattedProducts = (contentData.items || []).map((item) => ({
          id: item.id,
          slug: item.slug,
          name: item.title,
          category: item.category?.slug || 'vehicles',
          parentCategory: item.category?.parent?.slug || null,
          gameName: item.game?.name || 'Assetto Corsa',
          image: getMediaUrl(item.coverImage?.thumbnailPath || item.coverImage?.filePath),
          description: item.shortDescription || item.description || '',
          priceLabel: item.priceLabel || (item.price ? `${item.price} ₺` : 'Fiyat için iletişime geç'),
          detailPath: `/magaza/${item.slug}`,
        }))

        setProducts(formattedProducts)
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'Ürünler yüklenirken bir sorun oluştu')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadStoreData()
    return () => {
      isMounted = false
    }
  }, [])

  const filteredProducts = useMemo(
    () => products.filter((product) => {
      if (activeCategory === 'all') return true
      return product.category === activeCategory || product.parentCategory === activeCategory
    }),
    [products, activeCategory],
  )

  const activeCategoryInfo = categories.find((category) => category.id === activeCategory)
  const parentCategoryInfo = activeCategoryInfo?.parent
    ? categories.find((category) => category.id === activeCategoryInfo.parent)
    : null
  const activeCategoryTitle = parentCategoryInfo
    ? `${parentCategoryInfo.label} / ${activeCategoryInfo.label}`
    : activeCategoryInfo?.label || 'Tüm Ürünler'

  const selectCategory = (categoryId) => {
    setActiveCategory(categoryId)
    setFiltersOpen(false)
  }

  return (
    <div className="store-page">
      <header className="store-header">
        <a className="store-brand" href="/" aria-label="Zecution Gaming ana sayfa">
          <img src="/media/images/logo.jpg" alt="Zecution Gaming" />
          <span>
            <strong>Zecution Gaming</strong>
            <small>Assetto Corsa Mağazası</small>
          </span>
        </a>
        <a className="store-back" href="/">
          <ArrowLeft size={17} /> Ana sayfa
        </a>
      </header>

      <main>
        <section className="store-intro">
          <div>
            <span className="store-eyebrow">Premium mod koleksiyonu</span>
            <h1>Assetto Corsa<br />Mağazası</h1>
          </div>
          <p>
            Zecution Gaming tarafından hazırlanan ücretli araç modlarını ve grafikleri incele.
            Satın almak istediğin ürün için bizimle doğrudan iletişime geç.
          </p>
        </section>

        <section className="store-catalog" aria-labelledby="catalog-title">
          <button
            className="mobile-filter-button"
            type="button"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((current) => !current)}
          >
            <Filter size={18} /> Kategoriler
            {filtersOpen ? <X size={18} /> : null}
          </button>

          <aside className={`store-filters ${filtersOpen ? 'is-open' : ''}`}>
            <div className="filter-heading">
              <Filter size={18} />
              <div>
                <span>Filtrele</span>
                <strong>Kategoriler</strong>
              </div>
            </div>
            <div className="filter-list">
              {categories.map(({ id, label, parent }) => {
                const isActive = activeCategory === id
                const count = id === 'all'
                  ? products.length
                  : products.filter(
                    (product) => product.category === id || product.parentCategory === id,
                  ).length

                return (
                  <button
                    key={id}
                    type="button"
                    className={`${parent ? 'is-child' : ''} ${isActive ? 'is-active' : ''}`}
                    aria-pressed={isActive}
                    onClick={() => selectCategory(id)}
                  >
                    <span>{label}</span>
                    <small>{count}</small>
                  </button>
                )
              })}
            </div>
          </aside>

          <div className="store-results">
            <div className="catalog-heading">
              <div>
                <span className="store-eyebrow">Koleksiyon</span>
                <h2 id="catalog-title">{activeCategoryTitle}</h2>
              </div>
              <span>{filteredProducts.length} ürün</span>
            </div>

            {loading ? (
              <div className="store-loading">
                <Loader2 className="animate-spin" size={28} />
                <span>Ürünler yükleniyor...</span>
              </div>
            ) : error ? (
              <div className="store-empty">
                <PackageOpen size={34} />
                <h3>Bir hata oluştu</h3>
                <p>{error}</p>
              </div>
            ) : filteredProducts.length ? (
              <div className="product-grid">
                {filteredProducts.map((product, index) => (
                  <article className="product-card" key={product.id} style={{ '--product-delay': `${index * 70}ms` }}>
                    <div className="product-media">
                      <img src={product.image} alt={product.name} loading="lazy" />
                      <span>{product.gameName}</span>
                    </div>
                    <div className="product-copy">
                      <span className="product-type">Araç modu</span>
                      <h3>{product.name}</h3>
                      <p>{product.description}</p>
                      <div className="product-footer">
                        <strong>{product.priceLabel}</strong>
                        <a href={product.detailPath || INSTAGRAM_URL}>
                          Detaylar <ArrowUpRight size={17} />
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="store-empty">
                <PackageOpen size={34} />
                <h3>Bu kategoride henüz ürün yok.</h3>
                <p>Yeni modlar hazırlandığında burada yayınlanacak.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="store-footer">
        <span>© {new Date().getFullYear()} Zecution Gaming</span>
        <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
          Satın alma için iletişim <ArrowUpRight size={16} />
        </a>
      </footer>
    </div>
  )
}

export default Store
