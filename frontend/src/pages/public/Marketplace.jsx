import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Package, Grid3x3, Store, Users, X } from 'lucide-react'
import PublicLayout from '../../components/layout/PublicLayout'
import SearchBar from '../../components/common/SearchBar'
import ProductCard from '../../components/common/ProductCard'
import Pagination from '../../components/common/Pagination'
import StatCard from '../../components/common/StatCard'
import { categories as mockCategories } from '../../data/mockData'
import { useShops } from '../../hooks/useShops'
import { useProducts } from '../../hooks/useProducts'
import { getPublicProducts } from '../../utils/productVisibility'
import { AVAILABILITY_TYPES } from '../../utils/productAvailability'
import { api } from '../../services/api'

const PAGE_SIZE = 9

const PRICE_RANGES = [
  { key: 'under-500', label: 'Under ₹500' },
  { key: '500-2000', label: '₹500 – ₹2,000' },
  { key: '2000-5000', label: '₹2,000 – ₹5,000' },
  { key: 'above-5000', label: 'Above ₹5,000' }
]

const RATING_OPTIONS = [
  { rating: 4, label: '4★ & up' },
  { rating: 3, label: '3★ & up' },
  { rating: 2, label: '2★ & up' }
]

export default function Marketplace() {
  const [params, setParams] = useSearchParams()

  // Parse initial category params (comma separated)
  const [selectedCategories, setSelectedCategories] = useState(() => {
    const raw = params.get('category')
    return raw ? raw.split(',').filter(Boolean) : []
  })
  const [selectedAvailability, setSelectedAvailability] = useState([])
  const [selectedPriceRanges, setSelectedPriceRanges] = useState([])
  const [selectedRatings, setSelectedRatings] = useState([])
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const { shops } = useShops()
  const { products } = useProducts()
  const [categoriesList, setCategoriesList] = useState(mockCategories)

  // Sync category param from URL if it changes externally
  useEffect(() => {
    const raw = params.get('category')
    if (raw) {
      const parsed = raw.split(',').filter(Boolean)
      setSelectedCategories(parsed)
    } else {
      setSelectedCategories([])
    }
  }, [params])

  useEffect(() => {
    api.get('/categories')
      .then((res) => {
        const list = Array.isArray(res) ? res : (res.categories || res.data || [])
        if (list.length > 0) {
          const normalized = list.map((c) => ({
            id: c.slug || c._id || c.id,
            slug: c.slug,
            _id: c._id,
            name: c.name,
            products: c.productCount !== undefined ? c.productCount : (c.products || 0),
          }))
          setCategoriesList(normalized)
        }
      })
      .catch(() => {})
  }, [])

  const updateCategoryParams = (nextCats) => {
    const newParams = new URLSearchParams(params)
    if (nextCats.length > 0) {
      newParams.set('category', nextCats.join(','))
    } else {
      newParams.delete('category')
    }
    setParams(newParams)
  }

  const toggleCategory = (catId) => {
    setPage(1)
    const exists = selectedCategories.includes(catId)
    const next = exists ? selectedCategories.filter((id) => id !== catId) : [...selectedCategories, catId]
    setSelectedCategories(next)
    updateCategoryParams(next)
  }

  const toggleAvailability = (type) => {
    setPage(1)
    setSelectedAvailability((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const togglePriceRange = (key) => {
    setPage(1)
    setSelectedPriceRanges((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const toggleRating = (r) => {
    setPage(1)
    setSelectedRatings((prev) =>
      prev.includes(r) ? prev.filter((val) => val !== r) : [...prev, r]
    )
  }

  const clearAllFilters = () => {
    setSelectedCategories([])
    setSelectedAvailability([])
    setSelectedPriceRanges([])
    setSelectedRatings([])
    setQuery('')
    setParams({})
    setPage(1)
  }

  // Calculate dynamic category list with actual public product counts
  const categoriesWithCounts = useMemo(() => {
    const publicProducts = getPublicProducts(products, shops)
    return categoriesList.map((cat) => {
      const matchCount = publicProducts.filter((p) => {
        return p.categorySlug === cat.slug ||
               p.categoryId === cat._id ||
               p.category?.toLowerCase() === cat.name?.toLowerCase() ||
               p.categoryName?.toLowerCase() === cat.name?.toLowerCase() ||
               p.category === cat.id
      }).length
      return {
        ...cat,
        products: matchCount
      }
    })
  }, [categoriesList, products, shops])

  // Multi-select product filter engine
  const filtered = useMemo(() => {
    const publicProducts = getPublicProducts(products, shops)
    return publicProducts.filter((p) => {
      // 1. Category Filter (matches ANY selected category)
      if (selectedCategories.length > 0) {
        const matchesCat = selectedCategories.some((catId) => {
          return p.categorySlug === catId ||
                 p.categoryId === catId ||
                 p.category === catId ||
                 p.categoryName?.toLowerCase() === catId.toLowerCase() ||
                 p.category?.toLowerCase() === catId.toLowerCase()
        })
        if (!matchesCat) return false
      }

      // 2. Search query filter
      if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false

      // 3. Availability filter (matches ANY selected availability)
      if (selectedAvailability.length > 0) {
        const pAvail = p.availabilityType || p.availability || 'Ready to Ship'
        const cleanP = pAvail.toLowerCase().replace(/[\s\-_]+/g, '')
        const matchesAvail = selectedAvailability.some((avail) => {
          const cleanF = avail.toLowerCase().replace(/[\s\-_]+/g, '')
          return cleanP === cleanF
        })
        if (!matchesAvail) return false
      }

      // 4. Price range filter (matches ANY selected price range)
      if (selectedPriceRanges.length > 0) {
        const matchesPrice = selectedPriceRanges.some((rangeKey) => {
          if (rangeKey === 'under-500') return p.price < 500
          if (rangeKey === '500-2000') return p.price >= 500 && p.price <= 2000
          if (rangeKey === '2000-5000') return p.price >= 2000 && p.price <= 5000
          if (rangeKey === 'above-5000') return p.price > 5000
          return false
        })
        if (!matchesPrice) return false
      }

      // 5. Rating filter (matches ANY selected rating bracket)
      if (selectedRatings.length > 0) {
        const matchesRating = selectedRatings.some((r) => (p.rating || 0) >= r)
        if (!matchesRating) return false
      }

      return true
    })
  }, [products, shops, selectedCategories, query, selectedAvailability, selectedPriceRanges, selectedRatings])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const activeFilterCount = selectedCategories.length + selectedAvailability.length + selectedPriceRanges.length + selectedRatings.length

  return (
    <PublicLayout>
      <div className="container" style={{ paddingTop: 32 }}>
        <p className="breadcrumb">Home / Browse Products</p>
        <h1 className="page-title" style={{ fontSize: 30 }}>Browse Products</h1>
        <p className="page-subtitle">Discover authentic products from local artisans with multi-filter search.</p>

        <div className="grid-4 mb-6">
          <StatCard icon={Package} label="Total Products" value={products.length.toLocaleString()} />
          <StatCard icon={Grid3x3} label="Categories" value={categoriesWithCounts.length} />
          <StatCard icon={Store} label="Total Shops" value={shops.length} />
          <StatCard icon={Users} label="Active Shops" value={shops.filter((s) => s.status === 'Active').length} />
        </div>

        <div className="flex gap-3 mb-8">
          <SearchBar value={query} onChange={(v) => { setQuery(v); setPage(1) }} placeholder="Search for pottery, jewellery, textiles..." />
        </div>

        <div className="marketplace-layout">
          <aside className="filters-panel">
            <div className="flex justify-between items-center mb-4">
              <h3 className="form-section-title" style={{ marginBottom: 0 }}>
                Filters {activeFilterCount > 0 && <span className="text-xs bg-terracotta text-white px-2 py-0.5 rounded-full" style={{ background: 'var(--color-terracotta)', color: '#fff', fontSize: 11, padding: '2px 7px', borderRadius: 999 }}>{activeFilterCount}</span>}
              </h3>
              {(activeFilterCount > 0 || query) && (
                <button onClick={clearAllFilters} style={{ fontSize: 12, color: 'var(--color-terracotta)', fontWeight: 500 }}>
                  Clear all
                </button>
              )}
            </div>

            {/* Availability Multi-select */}
            <div className="filters-block">
              <h4 className="filter-title">Availability</h4>
              {AVAILABILITY_TYPES.map((t) => {
                const isChecked = selectedAvailability.includes(t)
                return (
                  <label key={t} className="filter-option" style={{ cursor: 'pointer' }}>
                    <span className="filter-option-label">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleAvailability(t)}
                        style={{ accentColor: 'var(--color-terracotta)' }}
                      />
                      {t}
                    </span>
                  </label>
                )
              })}
            </div>

            {/* Category Multi-select */}
            <div className="filters-block">
              <h4 className="filter-title">Category</h4>
              {categoriesWithCounts.map((c) => {
                const isChecked = selectedCategories.includes(c.id) || selectedCategories.includes(c.slug)
                return (
                  <label key={c.id} className="filter-option" style={{ cursor: 'pointer' }}>
                    <span className="filter-option-label">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCategory(c.id)}
                        style={{ accentColor: 'var(--color-terracotta)' }}
                      />
                      {c.name}
                    </span>
                    <span className="filter-option-count">{c.products}</span>
                  </label>
                )
              })}
            </div>

            {/* Price Range Multi-select */}
            <div className="filters-block">
              <h4 className="filter-title">Price Range</h4>
              {PRICE_RANGES.map((item) => {
                const isChecked = selectedPriceRanges.includes(item.key)
                return (
                  <label key={item.key} className="filter-option" style={{ cursor: 'pointer' }}>
                    <span className="filter-option-label">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePriceRange(item.key)}
                        style={{ accentColor: 'var(--color-terracotta)' }}
                      />
                      {item.label}
                    </span>
                  </label>
                )
              })}
            </div>

            {/* Rating Multi-select */}
            <div className="filters-block">
              <h4 className="filter-title">Rating</h4>
              {RATING_OPTIONS.map((item) => {
                const isChecked = selectedRatings.includes(item.rating)
                return (
                  <label key={item.rating} className="filter-option" style={{ cursor: 'pointer' }}>
                    <span className="filter-option-label">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleRating(item.rating)}
                        style={{ accentColor: 'var(--color-terracotta)' }}
                      />
                      {item.label}
                    </span>
                  </label>
                )
              })}
            </div>
          </aside>

          <div>
            {/* Active Filter Chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 align-center">
                <span style={{ fontSize: 12, color: 'var(--color-ink-50)', fontWeight: 500, alignSelf: 'center' }}>Active Filters:</span>
                
                {selectedCategories.map((catId) => {
                  const catObj = categoriesList.find((c) => c.id === catId || c.slug === catId)
                  return (
                    <span key={catId} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '3px 10px', borderRadius: 14, background: 'var(--color-terracotta-10)', color: 'var(--color-terracotta)', fontWeight: 500 }}>
                      Category: {catObj ? catObj.name : catId}
                      <X size={13} style={{ cursor: 'pointer' }} onClick={() => toggleCategory(catId)} />
                    </span>
                  )
                })}

                {selectedAvailability.map((avail) => (
                  <span key={avail} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '3px 10px', borderRadius: 14, background: 'var(--color-forest-10)', color: 'var(--color-forest)', fontWeight: 500 }}>
                    {avail}
                    <X size={13} style={{ cursor: 'pointer' }} onClick={() => toggleAvailability(avail)} />
                  </span>
                ))}

                {selectedPriceRanges.map((key) => {
                  const range = PRICE_RANGES.find((r) => r.key === key)
                  return (
                    <span key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '3px 10px', borderRadius: 14, background: 'var(--color-cream-dark)', color: 'var(--color-ink-70)', fontWeight: 500 }}>
                      Price: {range ? range.label : key}
                      <X size={13} style={{ cursor: 'pointer' }} onClick={() => togglePriceRange(key)} />
                    </span>
                  )
                })}

                {selectedRatings.map((r) => (
                  <span key={r} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '3px 10px', borderRadius: 14, background: '#fef3c7', color: '#b45309', fontWeight: 500 }}>
                    {r}★ &amp; up
                    <X size={13} style={{ cursor: 'pointer' }} onClick={() => toggleRating(r)} />
                  </span>
                ))}

                <button onClick={clearAllFilters} style={{ fontSize: 12, color: 'var(--color-terracotta)', underline: 'none', marginLeft: 4, fontWeight: 500 }}>
                  Reset
                </button>
              </div>
            )}

            <p className="results-count">Showing {filtered.length} products</p>

            {pageItems.length === 0 ? (
              <div className="empty-state">
                No products match your selected filter criteria. Try expanding your search or clearing some filters.
              </div>
            ) : (
              <div className="grid-3">
                {pageItems.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
            {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}

