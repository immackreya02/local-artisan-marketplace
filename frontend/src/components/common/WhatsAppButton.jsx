import React from 'react'
import { MessageCircle } from 'lucide-react'
import { communicationService } from '../../services/communicationService'

export default function WhatsAppButton({
  phone,
  productName,
  shopName,
  customMessage,
  label = 'Chat on WhatsApp',
  size = 'md',
  className = ''
}) {
  const handleClick = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    // Default target phone if shop/artisan phone is missing in mock data
    const targetPhone = phone || '919876543210'

    const res = await communicationService.getWhatsAppLink({
      phone: targetPhone,
      productName,
      shopName,
      customMessage
    })

    if (res.success && res.whatsappLink) {
      window.open(res.whatsappLink, '_blank', 'noopener,noreferrer')
    } else {
      // Direct client fallback
      const cleanPhone = targetPhone.replace(/[^\d]/g, '')
      const msg = encodeURIComponent(customMessage || `Hi! I am interested in ${productName || shopName || 'handcrafted items'} on Local Artisan Marketplace.`)
      window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank', 'noopener,noreferrer')
    }
  }

  const btnPadding = size === 'sm' ? '6px 14px' : size === 'lg' ? '12px 24px' : '10px 18px'
  const fontSize = size === 'sm' ? '12px' : size === 'lg' ? '15px' : '14px'

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`whatsapp-btn ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        background: '#25D366',
        color: '#ffffff',
        fontWeight: 600,
        fontSize,
        padding: btnPadding,
        borderRadius: '999px',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)',
        transition: 'transform 0.15s ease, background-color 0.15s ease'
      }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#20ba5a'; e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#25D366'; e.currentTarget.style.transform = 'translateY(0)' }}
      title="Open direct WhatsApp chat"
    >
      <MessageCircle size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
      <span>{label}</span>
    </button>
  )
}
