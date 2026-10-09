import React, { useState, useRef, useEffect } from 'react'
import { Palette, Check } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'

const PALETTES = [
  {
    id: 'terracotta',
    name: 'Warm Terracotta',
    subtitle: 'Warm Earthy Craft',
    icon: '🏺',
    color: '#C1673B'
  },
  {
    id: 'indigo',
    name: 'Royal Indigo',
    subtitle: 'Sleek Cobalt Blue',
    icon: '🔷',
    color: '#1E40AF'
  },
  {
    id: 'emerald',
    name: 'Emerald Green',
    subtitle: 'Deep Forest Green',
    icon: '🌿',
    color: '#047857'
  }
]

export default function PaletteSelector({ className = '' }) {
  const { palette, setPalette } = useTheme()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentPalette = PALETTES.find(p => p.id === palette) || PALETTES[0]

  return (
    <div className={`palette-selector-wrap ${className}`} ref={dropdownRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="palette-pill-btn"
        title={`Theme: ${currentPalette.name}`}
        aria-label="Select Theme Palette"
        style={{
          height: '34px',
          padding: '0 12px',
          borderRadius: '999px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--color-cream-dark)',
          border: '1px solid var(--color-ink-10)',
          color: 'var(--color-ink)',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'all 0.15s ease'
        }}
      >
        <Palette size={14} color="var(--color-terracotta)" />
        <span style={{ fontSize: '13px', lineHeight: 1 }}>{currentPalette.icon}</span>
        <span style={{ fontWeight: 600, color: 'var(--color-terracotta)' }}>
          {currentPalette.name}
        </span>
      </button>

      {open && (
        <div
          className="palette-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 230,
            background: 'var(--color-dropdown-bg, #ffffff)',
            border: '1px solid var(--color-ink-10)',
            borderRadius: 14,
            boxShadow: 'var(--shadow-md, 0 8px 24px rgba(0,0,0,0.15))',
            padding: 8,
            zIndex: 1000,
            animation: 'fadeIn 0.15s ease'
          }}
        >
          <div style={{ padding: '6px 10px 8px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-ink-50)' }}>
            Indian Heritage Palettes
          </div>
          {PALETTES.map((p) => {
            const isSelected = palette === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPalette(p.id)
                  setOpen(false)
                }}
                className={`palette-option ${isSelected ? 'selected' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: 'none',
                  background: isSelected ? 'var(--color-terracotta-10)' : 'transparent',
                  color: isSelected ? 'var(--color-terracotta)' : 'var(--color-ink)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 16 }}>{p.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{p.name}</div>
                    <div style={{ fontSize: 11, opacity: 0.6 }}>{p.subtitle}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: p.color,
                      display: 'inline-block'
                    }}
                  />
                  {isSelected && <Check size={14} color="var(--color-terracotta)" />}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
