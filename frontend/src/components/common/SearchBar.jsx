import { Search } from 'lucide-react'

export default function SearchBar({ value, onChange, placeholder = 'Search…', onSubmit, dark = false }) {
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit?.(value) }}
      className={`search-bar${dark ? ' dark' : ''}`}
    >
      <Search size={16} className="search-bar-icon" />
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
      />
    </form>
  )
}
