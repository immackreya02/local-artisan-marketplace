import { Star } from 'lucide-react'

export default function Rating({ value, count, size = 13 }) {
  return (
    <span className="rating">
      <Star size={size} className="rating-star" fill="currentColor" />
      <span>{value}</span>
      {count != null && <span className="rating-count">({count})</span>}
    </span>
  )
}
