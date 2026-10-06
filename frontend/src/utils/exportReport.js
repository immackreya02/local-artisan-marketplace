// ============================================================
// exportReport.js
// Real file downloads generated entirely in the browser from
// whatever report rows are currently on screen - no backend.
// ============================================================
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function exportReportToExcel({ title = 'Report', rows = [], filename = 'report' }) {
  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    alert('No data available to export for the selected filter or date range.')
    return
  }
  try {
    const sanitizedRows = rows.map((r) => {
      const clean = {}
      Object.keys(r).forEach((k) => {
        const val = r[k]
        if (val === null || val === undefined) clean[k] = ''
        else if (typeof val === 'object') clean[k] = JSON.stringify(val)
        else clean[k] = val
      })
      return clean
    })

    const worksheet = XLSX.utils.json_to_sheet(sanitizedRows)
    const workbook = XLSX.utils.book_new()
    const safeSheetName = (title || 'Report').replace(/[:\\/?*\[\]]/g, ' ').trim().slice(0, 31) || 'Report'
    XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName)
    const cleanFilename = (filename || 'export').toLowerCase().replace(/[^a-z0-9_-]/gi, '_')
    XLSX.writeFile(workbook, `${cleanFilename}.xlsx`)
  } catch (err) {
    console.error('Export Excel Error:', err)
    alert('Failed to generate Excel file: ' + (err.message || 'Unknown error'))
  }
}

export function exportReportToPDF({ title = 'Report', subtitle = '', rows = [], filename = 'report' }) {
  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    alert('No data available to export for the selected filter or date range.')
    return
  }
  try {
    const doc = new jsPDF('p', 'mm', 'a4')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(193, 103, 59) // terracotta accent
    doc.text(title || 'Report', 14, 18)

    let startY = 24
    if (subtitle) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(120, 110, 100)
      doc.text(subtitle, 14, 25)
      startY = 31
    }

    doc.setDrawColor(193, 103, 59)
    doc.setLineWidth(0.4)
    doc.line(14, startY - 2, 196, startY - 2)

    const columns = Object.keys(rows[0])
    const body = rows.map((row) =>
      columns.map((col) => {
        const val = row[col]
        if (val === null || val === undefined) return '—'
        if (typeof val === 'object') return JSON.stringify(val)
        return String(val)
      })
    )

    autoTable(doc, {
      head: [columns],
      body,
      startY: startY + 3,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [193, 103, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    })

    const cleanFilename = (filename || 'export').toLowerCase().replace(/[^a-z0-9_-]/gi, '_')
    doc.save(`${cleanFilename}.pdf`)
  } catch (err) {
    console.error('Export PDF Error:', err)
    alert('Failed to generate PDF file: ' + (err.message || 'Unknown error'))
  }
}

