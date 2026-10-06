import React, { useState } from 'react'
import { ShieldCheck, MessageSquare, Mail, X } from 'lucide-react'
import { communicationService } from '../../services/communicationService'

export default function OTPModal({ isOpen, onClose, onVerified }) {
  const [step, setStep] = useState('request') // 'request' | 'verify'
  const [otpInput, setOtpInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [devOtp, setDevOtp] = useState('')

  if (!isOpen) return null

  const handleSendOTP = async () => {
    setLoading(true)
    setError('')
    setSuccessMsg('')
    const res = await communicationService.sendOTP()
    setLoading(false)

    if (res.success) {
      setStep('verify')
      setSuccessMsg('OTP code sent to your registered Email & Phone SMS!')
      if (res.otpCodeDev) {
        setDevOtp(res.otpCodeDev)
      }
    } else {
      setError(res.message || 'Failed to send OTP')
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    if (!otpInput || otpInput.length < 4) {
      setError('Please enter the 6-digit OTP code')
      return
    }

    setLoading(true)
    setError('')
    const res = await communicationService.verifyOTP(otpInput)
    setLoading(false)

    if (res.success) {
      setSuccessMsg('Verification successful!')
      setTimeout(() => {
        if (onVerified) onVerified()
        onClose()
      }, 1000)
    } else {
      setError(res.message || 'Invalid or expired OTP code')
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--color-card-bg)',
          borderRadius: '16px',
          border: '1px solid var(--color-ink-10)',
          boxShadow: 'var(--shadow-md)',
          padding: '24px',
          position: 'relative'
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--color-ink-40)' }}
        >
          <X size={18} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'var(--color-terracotta-10)',
              color: 'var(--color-terracotta)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-ink)' }}>Security OTP Verification</h3>
          <p style={{ fontSize: '13px', color: 'var(--color-ink-50)', marginTop: '4px' }}>
            Multi-channel verification via SMS & Email
          </p>
        </div>

        {error && (
          <div className="form-error-box" style={{ marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{ fontSize: '13px', color: 'var(--color-forest)', background: 'var(--color-forest-10)', padding: '10px 12px', borderRadius: '8px', marginBottom: '16px', textAlign: 'center' }}>
            {successMsg}
          </div>
        )}

        {step === 'request' ? (
          <div>
            <div style={{ background: 'var(--color-cream-dark)', padding: '12px', borderRadius: '8px', fontSize: '12px', color: 'var(--color-ink-60)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Mail size={12} color="var(--color-terracotta)" />
                <span>Sends 6-digit PIN to your registered Email</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageSquare size={12} color="var(--color-forest)" />
                <span>Sends SMS & WhatsApp alert to registered Mobile</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSendOTP}
              disabled={loading}
              className="btn btn-primary btn-full"
            >
              {loading ? 'Sending OTP Code...' : 'Send OTP Verification Code'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleVerifyOTP}>
            {devOtp && (
              <div style={{ fontSize: '11px', background: 'var(--color-amber-bg)', color: 'var(--color-amber-text)', padding: '6px 10px', borderRadius: '6px', marginBottom: '12px', textAlign: 'center' }}>
                <strong>Dev Mode OTP Code:</strong> {devOtp}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" style={{ textAlign: 'center' }}>Enter 6-Digit OTP Code</label>
              <input
                type="text"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/[^\d]/g, ''))}
                placeholder="1 2 3 4 5 6"
                className="form-input"
                style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '22px', fontWeight: 700 }}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || otpInput.length < 6}
              className="btn btn-primary btn-full"
              style={{ marginTop: '12px' }}
            >
              {loading ? 'Verifying...' : 'Verify OTP Code'}
            </button>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={handleSendOTP}
                disabled={loading}
                style={{ fontSize: '12px', color: 'var(--color-terracotta)', fontWeight: 500 }}
              >
                Resend Code
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
