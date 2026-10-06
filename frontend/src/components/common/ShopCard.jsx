import { Link } from 'react-router-dom'
import { Store, BadgeCheck } from 'lucide-react'
import Swatch from './Swatch'
import Rating from './Rating'
import Button from './Button'

export default function ShopCard({ shop }) {
  const imageUrl = shop.image && (shop.image.startsWith('http') || shop.image.startsWith('/')) ? shop.image : null

  return (
    <div className="shop-card">
      {imageUrl ? (
        <img src={imageUrl} alt={shop.name} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }} />
      ) : (
        <Swatch seed={shop.id} icon={Store} rounded="rounded-lg" style={{ width: 64, height: 64 }} />
      )}
      <div className="shop-card-name">
        {shop.name} {shop.verified && <BadgeCheck size={15} color="#3F6B52" />}
      </div>
      <div className="shop-card-meta">{shop.category} · {shop.location.split(',')[0]}</div>
      <Rating value={shop.rating} count={shop.reviewCount} />
      <Link to={`/shop/${shop.id}`} className="w-full mt-2">
        <Button variant="outline" size="sm" className="btn-full">Visit Shop</Button>
      </Link>
    </div>
  )
}
