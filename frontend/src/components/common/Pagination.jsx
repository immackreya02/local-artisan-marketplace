import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, totalPages, onChange }) {
  const pages = Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1)
  return (
    <div className="pagination">
      <button onClick={() => onChange(Math.max(1, page - 1))} className="pagination-btn" disabled={page === 1}>
        <ChevronLeft size={15} />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`pagination-btn${p === page ? ' active' : ''}`}
        >
          {p}
        </button>
      ))}
      {totalPages > 3 && <span className="pagination-ellipsis">…</span>}
      <button onClick={() => onChange(Math.min(totalPages, page + 1))} className="pagination-btn" disabled={page === totalPages}>
        <ChevronRight size={15} />
      </button>
    </div>
  )
}
