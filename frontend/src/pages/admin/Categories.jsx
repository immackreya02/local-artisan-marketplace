import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Layers, Package, Trophy, CheckCircle2, XCircle, X, Download, FileText } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatCard from '../../components/common/StatCard'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import { api } from '../../services/api'
import { categories as fallbackCategories } from '../../data/mockData'
import { exportReportToExcel, exportReportToPDF } from '../../utils/exportReport'

const ICON_OPTIONS = [
  'Amphora', 'Scissors', 'Gem', 'Lamp', 'Palette', 'TreePine', 'Hammer', 'Briefcase', 'Gift'
]

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'Amphora',
    active: true,
    slug: ''
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const res = await api.get('/categories?all=true')
      const list = Array.isArray(res) ? res : (res.categories || res.data || [])
      if (list.length > 0) {
        const normalized = list.map((c) => ({
          id: c._id || c.id || c.slug,
          slug: c.slug || '',
          name: c.name,
          products: c.productCount || 0,
          desc: c.description || '',
          icon: c.icon || 'Amphora',
          active: c.active !== undefined ? c.active : true,
          raw: c
        }))
        setCategories(normalized)
      } else {
        setCategories(fallbackCategories.map(c => ({ ...c, desc: c.desc || '', active: true, products: c.products || 0 })))
      }
    } catch {
      setCategories(fallbackCategories.map(c => ({ ...c, desc: c.desc || '', active: true, products: c.products || 0 })))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const getRows = () => categories.map((c) => ({
    Category: c.name,
    Slug: c.slug || '—',
    Description: c.desc || '—',
    'Product Count': c.products,
    Status: c.active ? 'Active' : 'Inactive'
  }))

  const handleExportExcel = () => {
    exportReportToExcel({ title: 'Categories Report', rows: getRows(), filename: 'admin-categories' })
  }

  const handleExportPDF = () => {
    exportReportToPDF({ title: 'Categories Report', subtitle: 'Craft category management records', rows: getRows(), filename: 'admin-categories' })
  }

  const openAddModal = () => {
    setEditingCategory(null)
    setFormData({ name: '', description: '', icon: 'Amphora', active: true, slug: '' })
    setError('')
    setShowModal(true)
  }

  const openEditModal = (cat) => {
    setEditingCategory(cat)
    setFormData({
      name: cat.name,
      description: cat.desc || '',
      icon: cat.icon || 'Amphora',
      active: cat.active !== undefined ? cat.active : true,
      slug: cat.slug || ''
    })
    setError('')
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError('Category name is required')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        icon: formData.icon,
        active: formData.active,
        slug: formData.slug.trim()
      }

      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, payload)
      } else {
        await api.post('/categories', payload)
      }

      setShowModal(false)
      await fetchCategories()
    } catch (err) {
      setError(err.message || 'Failed to save category')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleActive = async (cat) => {
    try {
      const newActive = !cat.active
      await api.put(`/categories/${cat.id}`, { active: newActive })
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, active: newActive } : c))
    } catch (err) {
      console.error('Failed to toggle active status:', err)
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this category? Products in this category will remain, but category reference will be unlinked.')) return
    try {
      await api.del(`/categories/${id}`)
    } catch {}
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }

  const totalProducts = categories.reduce((s, c) => s + (c.products || 0), 0)
  const mostPopular = [...categories].sort((a, b) => (b.products || 0) - (a.products || 0))[0]

  return (
    <DashboardLayout role="admin">
      <div className="dashboard-header-row">
        <div>
          <h1 className="page-title">Category Management</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Create, edit, and manage marketplace craft categories.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}><Download size={14} /> Export Excel</Button>
          <Button variant="outline" onClick={handleExportPDF}><FileText size={14} /> Export PDF</Button>
          <Button onClick={openAddModal}><Plus size={14} /> Add Category</Button>
        </div>
      </div>

      <div className="grid-3 mb-6">
        <StatCard icon={Layers} label="Total Categories" value={categories.length} />
        <StatCard icon={Package} label="Total Products" value={totalProducts.toLocaleString()} />
        <StatCard icon={Trophy} label="Most Popular Category" value={mostPopular?.name || '—'} />
      </div>

      <div className="grid-3">
        {categories.map((c) => (
          <div key={c.id} className="category-mgmt-card" style={{ opacity: c.active ? 1 : 0.65 }}>
            <div className="category-mgmt-top">
              <div className="category-mgmt-icon" style={{ background: c.active ? 'var(--color-terracotta-10, #FDF4E7)' : '#f0f0f0' }}>
                <Layers size={16} color={c.active ? '#C1673B' : '#888'} />
              </div>
              <div className="flex gap-1" style={{ alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => toggleActive(c)}
                  className="icon-btn icon-btn-sm"
                  title={c.active ? 'Deactivate Category' : 'Activate Category'}
                  style={{ color: c.active ? '#2e7d32' : '#d32f2f' }}
                >
                  {c.active ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                </button>
                <button type="button" onClick={() => openEditModal(c)} className="icon-btn icon-btn-sm" title="Edit Category">
                  <Pencil size={13} />
                </button>
                <button type="button" onClick={() => remove(c.id)} className="icon-btn icon-btn-sm btn-danger-text" title="Delete Category">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center" style={{ margin: '8px 0 4px' }}>
              <h3 style={{ fontWeight: 600, margin: 0 }}>{c.name}</h3>
              <Badge tone={c.active ? 'success' : 'neutral'}>{c.active ? 'Active' : 'Inactive'}</Badge>
            </div>
            <p style={{ fontSize: 12, color: 'var(--color-ink-50)', margin: '4px 0 12px', minHeight: 36 }}>{c.desc || 'No description provided.'}</p>
            <span style={{ fontSize: 14, color: 'var(--color-terracotta)', fontWeight: 500 }}>{(c.products || 0).toLocaleString()} products</span>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="card card-pad" style={{ width: '100%', maxWidth: 480, backgroundColor: '#fff', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
            <div className="flex justify-between items-center mb-4" style={{ borderBottom: '1px solid var(--color-ink-10)', paddingBottom: 12 }}>
              <h3 className="form-section-title" style={{ margin: 0, fontSize: 16 }}>
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-40)' }}>
                <X size={18} />
              </button>
            </div>

            {error && <div className="form-error-box mb-4">{error}</div>}

            <form onSubmit={handleSave}>
              <div className="form-group mb-3">
                <label className="form-label">Category Name *</label>
                <input
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Terracotta & Claycraft"
                  required
                />
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe the craft category..."
                />
              </div>

              <div className="grid-2 mb-3" style={{ gap: 12 }}>
                <div>
                  <label className="form-label">Icon Motif</label>
                  <select
                    className="form-select"
                    value={formData.icon}
                    onChange={(e) => setFormData(f => ({ ...f, icon: e.target.value }))}
                  >
                    {ICON_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={formData.active ? 'true' : 'false'}
                    onChange={(e) => setFormData(f => ({ ...f, active: e.target.value === 'true' }))}
                  >
                    <option value="true">Active (Visible in Marketplace)</option>
                    <option value="false">Inactive (Hidden)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-5">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : (editingCategory ? 'Update Category' : 'Create Category')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

