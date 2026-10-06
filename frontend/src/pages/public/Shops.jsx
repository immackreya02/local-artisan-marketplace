import { useMemo, useState } from 'react'
import { MapPin } from 'lucide-react'
import PublicLayout from '../../components/layout/PublicLayout'
import SearchBar from '../../components/common/SearchBar'
import ShopCard from '../../components/common/ShopCard'
import Button from '../../components/common/Button'
import { useShops } from '../../hooks/useShops'

// Public directory of artisan shops. Only approved (Active) shops are
// shown here - a shop still awaiting Admin approval stays hidden from
// customers until it's approved, same as a real marketplace would do.
export default function Shops() {
  const { shops } = useShops()
  const [query, setQuery] = useState('')

  // Local Artisan Discovery: a simple city dropdown derived from each
  // shop's existing `location` field (e.g. "Jaipur, Rajasthan" -> "Jaipur").
  // No maps/GPS/geolocation - just a plain filter over existing data.
  const [pendingLocation, setPendingLocation] = useState('')
  const [appliedLocation, setAppliedLocation] = useState('')

  const activeShops = shops.filter((s) => s.status === 'Active')
  const cities = useMemo(
    () => [...new Set(activeShops.map((s) => s.location.split(',')[0].trim()))].sort(),
    [activeShops]
  )

  const filtered = activeShops.filter((s) => {
    const matchesQuery = s.name.toLowerCase().includes(query.toLowerCase()) || s.category.toLowerCase().includes(query.toLowerCase())
    const matchesLocation = !appliedLocation || s.location.split(',')[0].trim() === appliedLocation
    return matchesQuery && matchesLocation
  })

  return (
    <PublicLayout>
      <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
        <p className="breadcrumb">Home / Shops</p>
        <h1 className="page-title" style={{ fontSize: 30 }}>Artisan Shops</h1>
        <p className="page-subtitle">Browse verified local artisan storefronts across India.</p>

        <div className="flex gap-3 mb-4 flex-wrap">
          <SearchBar value={query} onChange={setQuery} placeholder="Search shops by name or craft..." />
        </div>

        <div className="flex gap-2 mb-8 flex-wrap" style={{ alignItems: 'center' }}>
          <div className="form-input-wrap" style={{ width: 'auto', minWidth: 200 }}>
            <MapPin size={14} className="form-input-icon" />
            <select value={pendingLocation} onChange={(e) => setPendingLocation(e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 14, flex: 1 }}>
              <option value="">All Locations</option>
              {cities.map((city) => <option key={city} value={city}>{city}</option>)}
            </select>
          </div>
          <Button size="sm" onClick={() => setAppliedLocation(pendingLocation)}>Search</Button>
          {appliedLocation && (
            <button
              onClick={() => { setPendingLocation(''); setAppliedLocation('') }}
              style={{ fontSize: 12, color: 'var(--color-terracotta)', fontWeight: 500 }}
            >
              Clear location filter
            </button>
          )}
        </div>

        <p className="results-count">
          Showing {filtered.length} shops{appliedLocation ? ` in ${appliedLocation}` : ''}
        </p>

        {filtered.length === 0 ? (
          <div className="empty-state">No shops match your search.</div>
        ) : (
          <div className="grid-4">
            {filtered.map((s) => <ShopCard key={s.id} shop={s} />)}
          </div>
        )}
      </div>
    </PublicLayout>
  )
}
