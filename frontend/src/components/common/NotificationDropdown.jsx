import React, { useState, useEffect, useRef } from 'react'
import { Bell, Check, Trash2, Mail, MessageSquare, PhoneCall, X } from 'lucide-react'
import { api } from '../../services/api'

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('lam_token') || localStorage.getItem('token') || localStorage.getItem('artisan_token')
      if (!token) return

      const data = await api.get('/notifications')
      if (data && data.success && data.data) {
        setNotifications(data.data)
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 5000) // Poll every 5s for fast updates
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`, {})
      fetchNotifications()
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all', {})
      fetchNotifications()
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }

  const deleteNotification = async (id, e) => {
    e.stopPropagation()
    try {
      await api.del(`/notifications/${id}`)
      fetchNotifications()
    } catch (err) {
      console.error('Error deleting notification:', err)
    }
  }

  return (
    <div className="notif-dropdown-wrap" ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="icon-btn"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell size={18} color="var(--color-ink-60)" />
        {unreadCount > 0 && (
          <span
            className="notif-badge"
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              background: '#C1673B',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 700,
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="notif-popover"
          style={{
            position: 'absolute',
            right: 0,
            marginTop: '8px',
            width: '360px',
            maxWidth: '90vw',
            background: 'var(--color-dropdown-bg)',
            border: '1px solid var(--color-ink-10)',
            borderRadius: '16px',
            boxShadow: 'var(--shadow-md)',
            zIndex: 100,
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--color-ink-08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--color-cream-dark)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={16} color="var(--color-terracotta)" />
              <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-ink)' }}>Notifications</span>
              {unreadCount > 0 && (
                <span style={{ fontSize: '11px', background: 'var(--color-terracotta-10)', color: 'var(--color-terracotta)', padding: '2px 8px', borderRadius: '99px', fontWeight: 600 }}>
                  {unreadCount} new
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  style={{ fontSize: '12px', color: 'var(--color-terracotta)', fontWeight: 500 }}
                  title="Mark all as read"
                >
                  Mark read
                </button>
              )}
              <button type="button" onClick={() => setIsOpen(false)} style={{ color: 'var(--color-ink-40)' }}>
                <X size={16} />
              </button>
            </div>
          </div>

          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-ink-40)', fontSize: '13px' }}>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item._id}
                  onClick={() => !item.read && markAsRead(item._id)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--color-ink-08)',
                    background: item.read ? 'transparent' : 'var(--color-terracotta-5)',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-ink)' }}>{item.title}</div>
                    <button
                      type="button"
                      onClick={(e) => deleteNotification(item._id, e)}
                      style={{ color: 'var(--color-ink-40)', padding: '2px' }}
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--color-ink-60)', marginTop: '4px', lineHeight: 1.4 }}>
                    {item.message}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-ink-40)' }}>
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
