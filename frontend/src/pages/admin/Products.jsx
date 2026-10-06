import { useState } from 'react'
import { Package, CheckCircle2, XCircle, Clock, Search, Download, Eye, Pencil, Trash2, FileText } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatCard from '../../components/common/StatCard'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Pagination from '../../components/common/Pagination'
import { useProducts } from '../../hooks/useProducts'
import { useShops } from '../../hooks/useShops'
import { categories } from '../../data/mockData'
import { isProductPurchasable, getManagementAvailabilityBadge } from '../../utils/productAvailability'

import { exportReportToExcel, exportReportToPDF } from '../../utils/exportReport'

const PAGE_SIZE = 8

export default function AdminProducts() {
  const { products, deleteProduct } = useProducts()
  const { getShopById } = useShops()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All')
  const [page, setPage] = useState(1)

  const filtered = products.filter((p) => (status === 'All' || p.status === status) && p.name.toLowerCase().includes(query.toLowerCase()))
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const getRows = () => filtered.map((p) => {
    const shop = getShopById(p.shopId)
    return {
      Product: p.name,
      SKU: p.sku || '—',
      Shop: shop?.name || '—',
      Price: p.price,
      Stock: p.stock,
      Status: p.status
    }
  })

  const handleExportExcel = () => {
    exportReportToExcel({ title: 'Products Report', rows: getRows(), filename: 'admin-products' })
  }

  const handleExportPDF = () => {
    exportReportToPDF({ title: 'Products Report', subtitle: 'Platform-wide product listings', rows: getRows(), filename: 'admin-products' })
  }

  return (
    <DashboardLayout role="admin">
      <div className="dashboard-header-row">
        <div>
          <h1 className="page-title">Product Management</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Manage all marketplace products.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}><Download size={14} /> Export Excel</Button>
          <Button variant="outline" onClick={handleExportPDF}><FileText size={14} /> Export PDF</Button>
        </div>
      </div>

      <div className="grid-4 mb-6">
        <StatCard icon={Package} label="Total Products" value={products.length} />
        <StatCard icon={CheckCircle2} label="Active" value={products.filter((p) => p.status === 'Active').length} />
        <StatCard icon={XCircle} label="Out of Stock" value={products.filter((p) => (!p.availabilityType || p.availabilityType === 'Ready to Ship') && !isProductPurchasable(p)).length} />
        <StatCard icon={Clock} label="Pending Review" value={products.filter((p) => p.status === 'Pending').length} />
      </div>

      <div className="flex-wrap-gap-3 mb-4">
        <div className="promo-input flex-1" style={{ minWidth: 220 }}>
          <Search size={14} className="form-input-icon" />
          <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} placeholder="Search products..." />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="form-select" style={{ width: 'auto' }}>
          {['All', 'Active', 'Inactive', 'Pending', 'Draft'].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>Product</th><th>Artisan</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {pageItems.map((p) => {
              const shop = getShopById(p.shopId)
              return (
                <tr key={p.id}>
                  <td><div style={{ fontWeight: 500 }}>{p.name}</div><div style={{ fontSize: 12, color: 'var(--color-ink-40)' }}>SKU: {p.sku}</div></td>
                  <td style={{ color: 'var(--color-ink-60)' }}>{shop?.name}</td>
                  <td style={{ color: 'var(--color-ink-60)' }}>{categories.find((c) => c.id === p.category)?.name}</td>
                  <td>₹{p.price.toLocaleString('en-IN')}</td>
                  <td>{p.stock}</td>
                  <td>
                    <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                      <Badge>{p.status}</Badge>
                      {getManagementAvailabilityBadge(p) && (
                        <span className={`badge ${getManagementAvailabilityBadge(p).tone}`}>{getManagementAvailabilityBadge(p).label}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button className="icon-btn icon-btn-sm" disabled style={{ opacity: 0.4, cursor: 'not-allowed' }}><Eye size={13} /></button>
                      <button className="icon-btn icon-btn-sm" disabled style={{ opacity: 0.4, cursor: 'not-allowed' }}><Pencil size={13} /></button>
                      <button onClick={() => deleteProduct(p.id)} className="icon-btn icon-btn-sm btn-danger-text"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="breadcrumb mt-3">Showing {pageItems.length} of {filtered.length} products</p>
      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
    </DashboardLayout>
  )
}
