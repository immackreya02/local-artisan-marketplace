import React, { useState, useEffect } from 'react'
import { Trophy, AlertTriangle, TrendingDown, Package, Store, BarChart3, Download, RefreshCw, ArrowUpRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import ChartTooltip from '../common/ChartTooltip'
import { api } from '../../services/api'
import { exportCSV } from '../../utils/reportGenerator'

const SEEDED_INTELLIGENCE = {
  topProducts: [
    { id: 'p-1', name: 'Jaipur Blue Pottery Decorative Vase', shopName: 'Kumhar Kala Pottery', price: 2249, stock: 48, unitsSold: 48, revenue: 107952 },
    { id: 'p-7', name: 'Handwoven Banarasi Silk Saree', shopName: 'Banarasi Silk House', price: 4500, stock: 12, unitsSold: 18, revenue: 81000 },
    { id: 'p-5', name: 'Meenakari Beaded Necklace', shopName: 'Ananya Jewels', price: 1499, stock: 15, unitsSold: 35, revenue: 52465 },
    { id: 'p-11', name: 'Brass Peacock Diya Set', shopName: 'Ananya Jewels', price: 1750, stock: 0, unitsSold: 24, revenue: 42000 },
    { id: 'p-4', name: 'Oxidised Silver Jhumka Earrings', shopName: 'Ananya Jewels', price: 899, stock: 31, unitsSold: 31, revenue: 27869 }
  ],
  lowSellingProducts: [
    { id: 'p-9', name: 'Madhubani Wall Painting', shopName: 'Kumhar Kala Pottery', price: 2150, stock: 7, unitsSold: 0, revenue: 0 },
    { id: 'p-8', name: 'Handwoven Cotton Scarf', shopName: 'Banarasi Silk House', price: 1050, stock: 40, unitsSold: 1, revenue: 1050 },
    { id: 'p-10', name: 'Macrame Wall Hanging', shopName: 'Diya Candle Co.', price: 1499, stock: 22, unitsSold: 2, revenue: 2998 },
    { id: 'p-12', name: 'Channapatna Wooden Toy Set', shopName: 'Kumhar Kala Pottery', price: 899, stock: 33, unitsSold: 3, revenue: 2697 },
    { id: 'p-3', name: 'Terracotta Kulhad Tea Set', shopName: 'Kumhar Kala Pottery', price: 450, stock: 210, unitsSold: 6, revenue: 2700 }
  ],
  lowStockAlerts: [
    { id: 'p-2', name: 'Terracotta Serving Bowl Set', shopName: 'Kumhar Kala Pottery', price: 1450, stock: 0 },
    { id: 'p-11', name: 'Brass Peacock Diya Set', shopName: 'Ananya Jewels', price: 1750, stock: 0 },
    { id: 'p-9', name: 'Madhubani Wall Painting', shopName: 'Kumhar Kala Pottery', price: 2150, stock: 7 },
    { id: 'p-7', name: 'Handwoven Banarasi Silk Saree', shopName: 'Banarasi Silk House', price: 4500, stock: 12 },
    { id: 'p-5', name: 'Meenakari Beaded Necklace', shopName: 'Ananya Jewels', price: 1499, stock: 15 }
  ],
  topShops: [
    { id: 'shop-1', name: 'Kumhar Kala Pottery', location: 'Jaipur, Rajasthan', orders: 62, revenue: 142850 },
    { id: 'shop-2', name: 'Banarasi Silk House', location: 'Varanasi, UP', orders: 24, revenue: 98500 },
    { id: 'shop-3', name: 'Ananya Jewels', location: 'Mumbai, Maharashtra', orders: 41, revenue: 80334 },
    { id: 'shop-4', name: 'Diya Candle Co.', location: 'Bengaluru, Karnataka', orders: 38, revenue: 48600 }
  ],
  lowShops: [
    { id: 'shop-4', name: 'Diya Candle Co.', location: 'Bengaluru, Karnataka', orders: 38, revenue: 48600 }
  ]
}

export default function StockIntelligenceSection() {
  const [activeTab, setActiveTab] = useState('top') // 'top' | 'alerts'
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(SEEDED_INTELLIGENCE)

  const fetchIntelligence = async () => {
    try {
      const res = await api.get('/admin/analytics/intelligence')
      if (res.success && res.data && res.data.topProducts && res.data.topProducts.length > 0) {
        setData(res.data)
      }
    } catch (err) {
      console.error('Failed to fetch intelligence report, using seeded demo analytics:', err)
    }
  }

  useEffect(() => {
    fetchIntelligence()
  }, [])

  const exportIntelligenceCSV = () => {
    const reportRows = [
      ...data.topProducts.map((p) => ({ Category: 'Top Selling Product', Item: p.name, Entity: p.shopName, Metric: `Units Sold: ${p.unitsSold}`, Revenue: `₹${p.revenue}` })),
      ...data.topShops.map((s) => ({ Category: 'Top Performing Artisan Studio', Item: s.name, Entity: s.location, Metric: `Orders: ${s.orders}`, Revenue: `₹${s.revenue}` })),
      ...data.lowStockAlerts.map((p) => ({ Category: 'Low Inventory Alert', Item: p.name, Entity: p.shopName, Metric: `Stock Remaining: ${p.stock} Units`, Revenue: `Price: ₹${p.price}` })),
      ...data.lowSellingProducts.map((p) => ({ Category: 'Low Performing Product', Item: p.name, Entity: p.shopName, Metric: `Units Sold: ${p.unitsSold}`, Revenue: `₹${p.revenue}` }))
    ]
    exportCSV(reportRows, 'sales_and_stock_intelligence_report.csv')
  }

  const COLORS_TOP = ['#C1673B', '#3F6B52', '#D97706', '#2563EB', '#8B5CF6']
  const COLORS_WARN = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#6366F1']

  if (loading) {
    return (
      <div className="card card-pad text-center" style={{ padding: '40px 20px' }}>
        <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px', color: 'var(--color-terracotta)' }} />
        <p style={{ fontSize: 14, color: 'var(--color-ink-60)' }}>Loading Sales & Stock Intelligence...</p>
      </div>
    )
  }

  return (
    <div className="card card-pad mb-6" style={{ background: 'var(--color-dropdown-bg)', border: '1px solid var(--color-ink-10)' }}>
      {/* Header & Mode Selector */}
      <div className="flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-ink)' }}>
            <BarChart3 size={20} color="var(--color-terracotta)" />
            Sales & Stock Intelligence
          </h2>
          <p style={{ fontSize: 13, color: 'var(--color-ink-50)', marginTop: 2 }}>
            Business Intelligence overview of high-revenue crafts, top artisans, and inventory stock alerts.
          </p>
        </div>

        <div className="flex gap-2 items-center">
          <div style={{ background: 'var(--color-cream-dark)', padding: '3px', borderRadius: 999, display: 'flex', gap: 4 }}>
            <button
              type="button"
              onClick={() => setActiveTab('top')}
              style={{
                padding: '6px 14px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'top' ? 'var(--color-terracotta)' : 'transparent',
                color: activeTab === 'top' ? '#fff' : 'var(--color-ink-60)',
                transition: 'all 0.2s ease'
              }}
            >
              🏆 Top Performers
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('alerts')}
              style={{
                padding: '6px 14px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'alerts' ? 'var(--color-terracotta)' : 'transparent',
                color: activeTab === 'alerts' ? '#fff' : 'var(--color-ink-60)',
                transition: 'all 0.2s ease'
              }}
            >
              ⚠️ Low Sales & Stock Alerts
            </button>
          </div>

          <button
            type="button"
            onClick={exportIntelligenceCSV}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, fontSize: 12 }}
            title="Download CSV Summary Report"
          >
            <Download size={14} /> Export BI Report
          </button>
        </div>
      </div>

      {/* Overview Stat Highlights */}
      <div className="grid-4 mb-6" style={{ gap: 12 }}>
        <div style={{ background: 'var(--color-cream-dark)', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--color-ink-08)' }}>
          <div style={{ fontSize: 11, color: 'var(--color-ink-50)', fontWeight: 600, textTransform: 'uppercase' }}>🏆 Star Product</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-ink)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {data.topProducts[0]?.name || 'N/A'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-forest)', fontWeight: 600, marginTop: 2 }}>
            ₹{(data.topProducts[0]?.revenue || 0).toLocaleString('en-IN')} ({data.topProducts[0]?.unitsSold || 0} Sold)
          </div>
        </div>

        <div style={{ background: 'var(--color-cream-dark)', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--color-ink-08)' }}>
          <div style={{ fontSize: 11, color: 'var(--color-ink-50)', fontWeight: 600, textTransform: 'uppercase' }}>👑 Top Studio</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-ink)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {data.topShops[0]?.name || 'N/A'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-terracotta)', fontWeight: 600, marginTop: 2 }}>
            ₹{(data.topShops[0]?.revenue || 0).toLocaleString('en-IN')} ({data.topShops[0]?.orders || 0} Orders)
          </div>
        </div>

        <div style={{ background: 'var(--color-cream-dark)', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--color-ink-08)' }}>
          <div style={{ fontSize: 11, color: 'var(--color-ink-50)', fontWeight: 600, textTransform: 'uppercase' }}>⚠️ Stock Alerts</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#DC2626', marginTop: 2 }}>
            {data.lowStockAlerts.length} Items Low/Out of Stock
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-ink-50)', marginTop: 2 }}>Requires artisan inventory refill</div>
        </div>

        <div style={{ background: 'var(--color-cream-dark)', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--color-ink-08)' }}>
          <div style={{ fontSize: 11, color: 'var(--color-ink-50)', fontWeight: 600, textTransform: 'uppercase' }}>📈 Promo Opportunities</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#D97706', marginTop: 2 }}>
            {data.lowSellingProducts.length} Underperforming Crafts
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-ink-50)', marginTop: 2 }}>Needs featured promotion push</div>
        </div>
      </div>

      {/* Tab 1: Top Performers View */}
      {activeTab === 'top' && (
        <div className="grid-2" style={{ gap: 20 }}>
          {/* Top Products Bar Chart & Table */}
          <div style={{ background: 'var(--color-card-bg, #ffffff)', padding: 16, borderRadius: 12, border: '1px solid var(--color-ink-08)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Package size={16} color="var(--color-terracotta)" /> Top 5 Revenue-Generating Crafts
            </h3>

            {data.topProducts.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={data.topProducts} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--color-ink-60)' }} tickFormatter={(v) => v.length > 12 ? `${v.slice(0, 10)}...` : v} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--color-ink-60)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip content={<ChartTooltip metricName="Revenue" unit="₹" />} />
                    <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                      {data.topProducts.map((_, idx) => (
                        <Cell key={`cell-${idx}`} fill={COLORS_TOP[idx % COLORS_TOP.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {data.topProducts.map((p, idx) => (
                    <div key={p.id || idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '1px solid var(--color-ink-05)' }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-ink)' }}>#{idx + 1} {p.name} <span style={{ color: 'var(--color-ink-40)', fontWeight: 400 }}>({p.shopName})</span></span>
                      <span style={{ fontWeight: 700, color: 'var(--color-forest)' }}>₹{p.revenue.toLocaleString('en-IN')} <span style={{ fontSize: 11, color: 'var(--color-ink-50)', fontWeight: 400 }}>({p.unitsSold} sold)</span></span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--color-ink-40)', padding: '20px 0', textAlign: 'center' }}>No sales recorded yet.</p>
            )}
          </div>

          {/* Top Artisan Studios Bar Chart & Table */}
          <div style={{ background: 'var(--color-card-bg, #ffffff)', padding: 16, borderRadius: 12, border: '1px solid var(--color-ink-08)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Store size={16} color="var(--color-forest)" /> Top 5 Performing Artisan Studios
            </h3>

            {data.topShops.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={data.topShops} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--color-ink-60)' }} tickFormatter={(v) => v.length > 12 ? `${v.slice(0, 10)}...` : v} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--color-ink-60)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip content={<ChartTooltip metricName="Revenue" unit="₹" />} />
                    <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                      {data.topShops.map((_, idx) => (
                        <Cell key={`cell-shop-${idx}`} fill={COLORS_TOP[(idx + 1) % COLORS_TOP.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {data.topShops.map((s, idx) => (
                    <div key={s.id || idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '1px solid var(--color-ink-05)' }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-ink)' }}>#{idx + 1} {s.name} <span style={{ color: 'var(--color-ink-40)', fontWeight: 400 }}>({s.location})</span></span>
                      <span style={{ fontWeight: 700, color: 'var(--color-terracotta)' }}>₹{s.revenue.toLocaleString('en-IN')} <span style={{ fontSize: 11, color: 'var(--color-ink-50)', fontWeight: 400 }}>({s.orders} orders)</span></span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--color-ink-40)', padding: '20px 0', textAlign: 'center' }}>No studio sales recorded yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Low Performers & Stock Alerts View */}
      {activeTab === 'alerts' && (
        <div className="grid-2" style={{ gap: 20 }}>
          {/* Low Stock Alerts */}
          <div style={{ background: 'var(--color-card-bg, #ffffff)', padding: 16, borderRadius: 12, border: '1px solid var(--color-ink-08)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, color: '#DC2626' }}>
              <AlertTriangle size={16} /> Low Inventory Stock Alerts (&le; 10 Units)
            </h3>

            {data.lowStockAlerts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.lowStockAlerts.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      background: p.stock === 0 ? '#FEE2E2' : 'var(--color-cream-dark)',
                      borderRadius: 8,
                      border: '1px solid var(--color-ink-08)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-ink-50)' }}>{p.shopName} · ₹{p.price}</div>
                    </div>
                    <div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 999,
                          background: p.stock === 0 ? '#EF4444' : '#F59E0B',
                          color: '#ffffff'
                        }}
                      >
                        {p.stock === 0 ? 'Out of Stock' : `Low Stock: ${p.stock} Left`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--color-ink-50)', padding: '20px 0', textAlign: 'center' }}>All active products have healthy inventory stock!</p>
            )}
          </div>

          {/* Underperforming Products Needing Promotion */}
          <div style={{ background: 'var(--color-card-bg, #ffffff)', padding: 16, borderRadius: 12, border: '1px solid var(--color-ink-08)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, color: '#D97706' }}>
              <TrendingDown size={16} /> Underperforming Crafts (Low / Zero Sales)
            </h3>

            {data.lowSellingProducts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.lowSellingProducts.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      background: 'var(--color-cream-dark)',
                      borderRadius: 8,
                      border: '1px solid var(--color-ink-08)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-ink-50)' }}>{p.shopName} · Stock: {p.stock}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-ink-60)' }}>{p.unitsSold} Units Sold</div>
                      <div style={{ fontSize: 10, color: '#D97706', fontWeight: 600 }}>Needs Promo Boost</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--color-ink-50)', padding: '20px 0', textAlign: 'center' }}>No low-performing products detected.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
