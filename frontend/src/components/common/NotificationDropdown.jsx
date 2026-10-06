import React, { useState, useEffect, useRef } from 'react'
import { Bell, Check, Trash2, Mail, MessageSquare, PhoneCall, Sparkles, X } from 'lucide-react'
import { communicationService } from '../../services/communicationService'

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const dropdownRef = useRef(null)

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('artisan_token')
      if (!token) return

      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success && data.data) {
        setNotifications(data.data)
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 15000) // Poll every 15s
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
      const token = localStorage.getItem('artisan_token')
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchNotifications()
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('artisan_token')
      await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchNotifications()
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }

  const deleteNotification = async (id, e) => {
    e.stopPropagation()
    try {
      const token = localStorage.getItem('artisan_token')
      await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchNotifications()
    } catch (err) {
      console.error('Error deleting notification:', err)
    }
  }

  const handleTestDispatch = async () => {
    setSendingTest(true)
    const res = await communicationService.testDispatch({
      title: 'Order Status Update',
      message: 'Your artisan order #LAM-2026-8849 is out for delivery! Track on WhatsApp & Email.'
    })
    setSendingTest(false)
    if (res.success) {
      fetchNotifications()
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
                <button
                  type="button"
                  onClick={handleTestDispatch}
                  disabled={sendingTest}
                  style={{ marginTop: '12px', fontSize: '12px', color: 'var(--color-terracotta)', fontWeight: 600, border: '1px solid var(--color-ink-10)', padding: '6px 12px', borderRadius: '99px' }}
                >
                  {sendingTest ? 'Dispatching...' : '🚀 Trigger Test Notification'}
                </button>
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

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span title="In-App Notification" style={{ fontSize: '10px', background: 'var(--color-cream-dark)', color: 'var(--color-ink-60)', padding: '2px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Bell size={10} /> App
                      </span>
                      <span title="Email Sent" style={{ fontSize: '10px', background: 'var(--color-emerald-bg)', color: 'var(--color-emerald-text)', padding: '2px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Mail size={10} /> Email
                      </span>
                      <span title="WhatsApp Alert" style={{ fontSize: '10px', background: 'rgba(37, 211, 102, 0.15)', color: '#16a34a', padding: '2px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <MessageSquare size={10} /> WA
                      </span>
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--color-ink-40)' }}>
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div
            style={{
              padding: '10px 16px',
              background: 'var(--color-cream-dark)',
              borderTop: '1px solid var(--color-ink-08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span style={{ fontSize: '11px', color: 'var(--color-ink-50)' }}>Channels: WhatsApp • Email • SMS</span>
            <button
              type="button"
              onClick={handleTestDispatch}
              disabled={sendingTest}
              style={{ fontSize: '11px', color: 'var(--color-terracotta)', fontWeight: 600 }}
            >
              {sendingTest ? 'Sending...' : '+ Test Alert'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
