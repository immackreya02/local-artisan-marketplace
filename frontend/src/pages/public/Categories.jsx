import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import PublicLayout from '../../components/layout/PublicLayout'
import { api } from '../../services/api'
import { categories as fallbackCategories } from '../../data/mockData'

import { getCategoryImage } from '../../utils/categoryImages'

export default function Categories() {
  const [categories, setCategories] = useState(fallbackCategories)

  useEffect(() => {
    api.get('/categories')
      .then((res) => {
        const list = Array.isArray(res) ? res : (res.categories || res.data || [])
        if (list.length > 0) {
          const normalized = list.map((c) => ({
            id: c.slug || c._id || c.id,
            name: c.name,
            products: c.productCount !== undefined ? c.productCount : (c.products || 0),
            desc: c.description || '',
          }))
          setCategories(normalized)
        }
      })
      .catch(() => {})
  }, [])

  return (
    <PublicLayout>
      <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
        <p className="breadcrumb">Home / Categories</p>
        <h1 className="page-title" style={{ fontSize: 30 }}>Explore Categories</h1>
        <p className="page-subtitle">Browse handmade products by craft. Pick a category to see everything in it.</p>

        <div className="grid-4">
          {categories.map((c) => (
            <Link key={c.id} to={`/marketplace?category=${c.id}`} className="category-tile" style={{ textAlign: 'left', padding: 0, overflow: 'hidden', borderRadius: 16, border: '1px solid var(--color-ink-10)' }}>
              <img src={getCategoryImage(c.id)} alt={c.name} style={{ height: 140, width: '100%', objectFit: 'cover' }} />
              <div style={{ padding: 16 }}>
                <div className="category-tile-name" style={{ fontSize: 16, fontWeight: 600 }}>{c.name}</div>
                <div className="category-tile-count mb-2" style={{ color: 'var(--color-terracotta)', fontWeight: 500 }}>{(c.products || 0).toLocaleString()} items</div>
                <p style={{ fontSize: 12, color: 'var(--color-ink-50)', lineHeight: 1.5 }}>{c.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PublicLayout>
  )
}
