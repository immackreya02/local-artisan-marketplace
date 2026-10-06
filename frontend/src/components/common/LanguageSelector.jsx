import React, { useState, useRef, useEffect } from 'react'
import { Globe, ChevronDown, Check } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'

export default function LanguageSelector({ className = '', compact = false }) {
  const { language, setLanguage, LANGUAGES } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0]

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`lang-selector-wrap ${className}`} ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="icon-btn"
        style={{
          width: 'auto',
          padding: compact ? '4px 8px' : '6px 12px',
          borderRadius: '999px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--color-cream-dark)',
          border: '1px solid var(--color-ink-10)',
          color: 'var(--color-ink)',
          fontSize: '13px',
          fontWeight: 500
        }}
        title="Select Language"
      >
        <span style={{ fontSize: '14px' }}>{currentLang.flag}</span>
        <span>{compact ? currentLang.code.toUpperCase() : currentLang.nativeName}</span>
        <ChevronDown size={13} color="var(--color-ink-50)" />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            marginTop: '6px',
            width: '180px',
            background: 'var(--color-dropdown-bg)',
            border: '1px solid var(--color-ink-10)',
            borderRadius: '14px',
            boxShadow: 'var(--shadow-md)',
            padding: '6px 0',
            zIndex: 110
          }}
        >
          <div style={{ padding: '6px 12px 8px', fontSize: '11px', fontWeight: 600, color: 'var(--color-terracotta)', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--color-ink-08)' }}>
            Select Language
          </div>

          {LANGUAGES.map((l) => {
            const isSelected = l.code === language
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => {
                  setLanguage(l.code)
                  setIsOpen(false)
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 14px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: isSelected ? 'var(--color-terracotta-10)' : 'transparent',
                  color: isSelected ? 'var(--color-terracotta)' : 'var(--color-ink)',
                  fontWeight: isSelected ? 600 : 400,
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{l.flag}</span>
                  <span>{l.nativeName}</span>
                </div>
                {isSelected && <Check size={14} color="var(--color-terracotta)" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
