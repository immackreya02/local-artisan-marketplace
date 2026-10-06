import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Clock, CheckCircle2, XCircle, Search, Download, Eye, FileText } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatCard from '../../components/common/StatCard'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Pagination from '../../components/common/Pagination'
import { useOrders } from '../../hooks/useOrders'
import { useShops } from '../../hooks/useShops'

import { exportReportToExcel, exportReportToPDF } from '../../utils/exportReport'
import { buildOrdersRows } from '../../utils/reportGenerator'

const PAGE_SIZE = 8

export default function AdminOrders() {
  const { orders } = useOrders()
  const { getShopById } = useShops()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All')
  const [page, setPage] = useState(1)

  const filtered = orders.filter((o) => (status === 'All' || o.status === status) && (o.id.toLowerCase().includes(query.toLowerCase()) || o.customerName.toLowerCase().includes(query.toLowerCase())))
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleExportExcel = () => {
    const rows = buildOrdersRows(filtered)
    exportReportToExcel({ title: 'Orders Report', rows, filename: 'admin-orders' })
  }

  const handleExportPDF = () => {
    const rows = buildOrdersRows(filtered)
    exportReportToPDF({ title: 'Orders Report', subtitle: 'Platform-wide order records', rows, filename: 'admin-orders' })
  }

  return (
    <DashboardLayout role="admin">
      <div className="dashboard-header-row">
        <div>
          <h1 className="page-title">Orders Management</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Monitor and manage all marketplace orders.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}><Download size={14} /> Export Excel</Button>
          <Button variant="outline" onClick={handleExportPDF}><FileText size={14} /> Export PDF</Button>
        </div>
      </div>

      <div className="grid-4 mb-6">
        <StatCard icon={Package} label="Total Orders" value={orders.length} />
        <StatCard icon={Clock} label="Pending Orders" value={orders.filter((o) => ['Pending', 'Processing'].includes(o.status)).length} />
        <StatCard icon={CheckCircle2} label="Completed Orders" value={orders.filter((o) => o.status === 'Delivered').length} />
        <StatCard icon={XCircle} label="Cancelled Orders" value={orders.filter((o) => o.status === 'Cancelled').length} />
      </div>

      <div className="flex-wrap-gap-3 mb-4">
        <div className="promo-input flex-1" style={{ minWidth: 220 }}>
          <Search size={14} className="form-input-icon" />
          <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} placeholder="Search by Order ID, customer or product" />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="form-select" style={{ width: 'auto' }}>
          {['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>Order ID</th><th>Customer</th><th>Artisan / Product</th><th>Amount</th><th>Date</th><th>Payment</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {pageItems.map((o) => {
              const shop = getShopById(o.shopId)
              return (
                <tr key={o.id}>
                  <td style={{ fontWeight: 500, color: 'var(--color-terracotta)' }}>#{o.id}</td>
                  <td>{o.customerName}</td>
                  <td style={{ color: 'var(--color-ink-60)' }}><div>{shop?.name}</div><div style={{ fontSize: 12, color: 'var(--color-ink-40)' }}>{o.items[0]?.name}</div></td>
                  <td style={{ fontWeight: 500 }}>₹{o.amount.toLocaleString('en-IN')}</td>
                  <td style={{ color: 'var(--color-ink-50)' }}>{o.date}</td>
                  <td><Badge>{o.payment}</Badge></td>
                  <td><Badge>{o.status}</Badge></td>
                  <td><Link to={`/admin/orders/${o.id}`}><Button size="sm" variant="outline"><Eye size={12} /> View</Button></Link></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="breadcrumb mt-3">Showing {pageItems.length} of {filtered.length} orders</p>
      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
    </DashboardLayout>
  )
}
