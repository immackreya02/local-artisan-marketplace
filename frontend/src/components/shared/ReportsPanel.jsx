import { useState } from 'react'
import { FileBarChart2, Download, FileText } from 'lucide-react'
import StatCard from '../common/StatCard'
import Button from '../common/Button'
import { exportReportToExcel, exportReportToPDF } from '../../utils/exportReport'

// Shared, presentational Reports UI. Both Artisan Reports and Admin
// Reports pass in their own summaryStats + reportTypeOptions + an
// onGenerate(fromDate, toDate, reportType) function that derives rows
// from THEIR OWN scoped context data (see reportGenerator.js) - this
// component itself holds no order/product data of its own.
export default function ReportsPanel({ title, subtitle, summaryStats, reportTypeOptions, onGenerate, onExportPDF, filenamePrefix, scopeNote }) {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [reportType, setReportType] = useState(reportTypeOptions[0].value)
  const [result, setResult] = useState(null) // null = not generated yet; [] = generated but empty
  const [reportLabel, setReportLabel] = useState('')

  const subtitleText = `${fromDate || 'Start'} to ${toDate || 'Today'}${scopeNote ? ` · ${scopeNote}` : ''}`
  const filename = `${filenamePrefix || 'report'}-${reportType}-${fromDate || 'all'}-${toDate || 'all'}`

  const handleGenerate = () => {
    try {
      const rows = onGenerate(fromDate, toDate, reportType) || []
      setResult(rows)
      setReportLabel(reportTypeOptions.find((r) => r.value === reportType)?.label || 'Report')
    } catch (err) {
      console.error('Report Generation Error:', err)
      alert('Failed to generate report table: ' + (err.message || 'Unknown error'))
    }
  }

  const handleExportExcelDirect = () => {
    try {
      const rows = onGenerate(fromDate, toDate, reportType) || []
      const label = reportTypeOptions.find((r) => r.value === reportType)?.label || 'Report'
      exportReportToExcel({ title: label, rows, filename })
    } catch (err) {
      console.error('Direct Excel Export Error:', err)
      alert('Failed to export Excel: ' + (err.message || 'Unknown error'))
    }
  }

  const handleExportPDFDirect = () => {
    try {
      if (onExportPDF && onExportPDF(fromDate, toDate, reportType)) {
        return
      }
      const rows = onGenerate(fromDate, toDate, reportType) || []
      const label = reportTypeOptions.find((r) => r.value === reportType)?.label || 'Report'
      exportReportToPDF({ title: label, subtitle: subtitleText, rows, filename })
    } catch (err) {
      console.error('Direct PDF Export Error:', err)
      alert('Failed to export PDF: ' + (err.message || 'Unknown error'))
    }
  }

  const handleExportPDFResult = () => {
    try {
      if (onExportPDF && onExportPDF(fromDate, toDate, reportType)) {
        return
      }
      exportReportToPDF({ title: reportLabel, subtitle: subtitleText, rows: result || [], filename })
    } catch (err) {
      console.error('Result PDF Export Error:', err)
      alert('Failed to export PDF: ' + (err.message || 'Unknown error'))
    }
  }

  return (
    <div>
      <h1 className="page-title">{title}</h1>
      <p className="page-subtitle">{subtitle}</p>

      <div className="grid-4 mb-6">
        {summaryStats.map((s) => (
          <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} />
        ))}
      </div>

      <div className="form-section">
        <h3 className="form-section-title"><FileBarChart2 size={16} color="#C1673B" /> Generate Report</h3>
        <div className="grid-3">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">From Date</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="form-input" />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">To Date</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="form-input" />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Report Type</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="form-select">
              {reportTypeOptions.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-4 flex-wrap">
          <Button onClick={handleGenerate}>Generate Report Table</Button>
          <Button variant="outline" onClick={handleExportExcelDirect}>
            <Download size={14} /> Export Excel
          </Button>
          <Button variant="outline" onClick={handleExportPDFDirect}>
            <FileText size={14} /> Export PDF
          </Button>
        </div>
      </div>

      {result !== null && (
        <div className="form-section">
          <div className="flex justify-between mb-4 flex-wrap gap-3">
            <div>
              <h3 className="form-section-title" style={{ marginBottom: 2 }}>{reportLabel}</h3>
              <p style={{ fontSize: 12, color: 'var(--color-ink-45)' }}>{subtitleText}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => exportReportToExcel({ title: reportLabel, rows: result, filename })}>
                <Download size={13} /> Export Excel
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDFResult}>
                <FileText size={13} /> Export PDF
              </Button>
            </div>
          </div>

          {result.length === 0 ? (
            <div className="empty-state">No data available for the selected period.</div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>{Object.keys(result[0] || {}).map((col) => <th key={col}>{col}</th>)}</tr>
                </thead>
                <tbody>
                  {result.map((row, i) => (
                    <tr key={i}>
                      {Object.keys(result[0] || {}).map((col) => (
                        <td key={col}>
                          {typeof row[col] === 'number' && (col === 'Amount' || col === 'Revenue' || col === 'Price')
                            ? `₹${row[col].toLocaleString('en-IN')}`
                            : String(row[col] ?? '—')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

