import React from 'react'

export default function ChartTooltip({ active, payload, label, unit = '₹', metricName = 'Revenue' }) {
  if (!active || !payload || !payload.length) return null

  const dataPoint = payload[0].payload || {}
  const rawVal = payload[0].value
  const displayLabel = dataPoint.period || dataPoint.fullDate || label || dataPoint.m || 'Period'

  const isCurrency = unit === '₹'
  const formattedValue = isCurrency
    ? `₹${Number(rawVal || 0).toLocaleString('en-IN')}`
    : `${Number(rawVal || 0).toLocaleString('en-IN')}${unit ? ' ' + unit : ''}`

  const orderCount = dataPoint.orders !== undefined ? dataPoint.orders : null
  const seriesName = payload[0].name && payload[0].name !== 'v' ? payload[0].name : metricName

  return (
    <div
      style={{
        backgroundColor: '#1E293B',
        color: '#F8FAFC',
        padding: '10px 14px',
        borderRadius: '8px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        fontSize: '12px',
        fontFamily: 'inherit',
        minWidth: '135px'
      }}
    >
      <div style={{ color: '#94A3B8', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
        {displayLabel}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <span style={{ color: '#E2E8F0', fontWeight: 500 }}>{seriesName}:</span>
        <span style={{ color: '#38BDF8', fontWeight: 700, fontSize: '14px' }}>{formattedValue}</span>
      </div>
      {orderCount !== null && metricName !== 'Orders' && seriesName !== 'Orders' && (
        <div style={{ color: '#CBD5E1', fontSize: '11px', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94A3B8' }}>Total Orders:</span>
          <span style={{ fontWeight: 600 }}>{orderCount} {orderCount === 1 ? 'order' : 'orders'}</span>
        </div>
      )}
    </div>
  )
}
