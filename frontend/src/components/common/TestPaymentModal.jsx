import { useState } from 'react'
import { CreditCard, Smartphone, Building2, CheckCircle2, ShieldCheck, X, Lock, Sparkles, QrCode } from 'lucide-react'
import Button from './Button'

export default function TestPaymentModal({ isOpen, onClose, onSuccess, amount }) {
  const [activeTab, setActiveTab] = useState('upi')
  const [selectedApp, setSelectedApp] = useState('GPay')
  const [upiId, setUpiId] = useState('test@upi')
  const [cardNumber, setCardNumber] = useState('4532 8812 9012 8892')
  const [cardExpiry, setCardExpiry] = useState('12/28')
  const [cardCvv, setCardCvv] = useState('888')
  const [selectedBank, setSelectedBank] = useState('HDFC Bank')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  if (!isOpen) return null

  const handlePay = () => {
    setIsProcessing(true)
    setTimeout(() => {
      setIsProcessing(false)
      setIsSuccess(true)
      setTimeout(() => {
        setIsSuccess(false)
        onSuccess({
          transactionId: `TXN-PAY-${Math.floor(10000000 + Math.random() * 90000000)}`,
          paymentMethod: activeTab.toUpperCase(),
          paidAt: new Date().toISOString()
        })
      }, 1200)
    }, 1500)
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: 16,
        boxSizing: 'border-box'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: '#ffffff',
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4), 0 0 1px rgba(0,0,0,0.1)',
          animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div style={{ background: 'linear-gradient(135deg, #0c2340 0%, #1e3a8a 100%)', color: '#fff', padding: '24px 24px 20px', position: 'relative' }}>
          <button 
            onClick={onClose} 
            disabled={isProcessing}
            style={{ position: 'absolute', right: 18, top: 18, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
          >
            <X size={16} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700 }}>
            <ShieldCheck size={14} color="#60a5fa" /> Razorpay &amp; PhonePe Sandbox
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: '#ffffff', letterSpacing: '-0.5px' }}>
            ₹{amount?.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Local Artisan Marketplace</span> • <span style={{ background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>Test Pay</span>
          </div>
        </div>

        {/* Modal Body */}
        {isSuccess ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ width: 68, height: 68, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle2 size={44} color="#16a34a" />
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Payment Approved!</h3>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Simulated Sandbox Payment Successful</p>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 12 }}>Redirecting to order confirmation...</div>
          </div>
        ) : (
          <div style={{ padding: '20px 24px 24px' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 12, padding: 4, marginBottom: 18 }}>
              {[
                { id: 'upi', label: 'UPI / QR', icon: Smartphone },
                { id: 'card', label: 'Card', icon: CreditCard },
                { id: 'netbanking', label: 'NetBanking', icon: Building2 },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  style={{
                    flex: 1,
                    padding: '9px 8px',
                    fontSize: 12,
                    fontWeight: 600,
                    border: 'none',
                    borderRadius: 9,
                    background: activeTab === id ? '#ffffff' : 'transparent',
                    color: activeTab === id ? '#1e40af' : '#64748b',
                    boxShadow: activeTab === id ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>

            {/* UPI Options */}
            {activeTab === 'upi' && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 10 }}>Select Instant App</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                  {[
                    { name: 'Google Pay', color: '#4285F4' },
                    { name: 'PhonePe', color: '#5f259f' },
                    { name: 'Paytm', color: '#00baf2' }
                  ].map(({ name, color }) => (
                    <button
                      key={name}
                      onClick={() => { setSelectedApp(name); setUpiId(`${name.toLowerCase().replace(/\s+/g, '')}@upi`) }}
                      style={{
                        border: selectedApp === name ? `2px solid ${color}` : '1px solid #e2e8f0',
                        borderRadius: 12,
                        padding: '12px 8px',
                        textAlign: 'center',
                        fontSize: 12,
                        fontWeight: 600,
                        background: selectedApp === name ? `${color}0D` : '#ffffff',
                        color: selectedApp === name ? color : '#334155',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>VPA / UPI ID</div>
                <input 
                  type="text" 
                  value={upiId} 
                  onChange={(e) => setUpiId(e.target.value)} 
                  className="form-input" 
                  style={{ fontSize: 13, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px' }}
                />
              </div>
            )}

            {/* Card Options */}
            {activeTab === 'card' && (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Card Number</div>
                  <input type="text" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} className="form-input" style={{ fontSize: 13, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Expiry Date</div>
                    <input type="text" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} className="form-input" style={{ fontSize: 13, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>CVV</div>
                    <input type="text" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} className="form-input" style={{ fontSize: 13, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px' }} />
                  </div>
                </div>
              </div>
            )}

            {/* NetBanking Options */}
            {activeTab === 'netbanking' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {['HDFC Bank', 'ICICI Bank', 'SBI Bank', 'Axis Bank'].map((b) => (
                  <button
                    key={b}
                    onClick={() => setSelectedBank(b)}
                    style={{
                      border: selectedBank === b ? '2px solid #1e40af' : '1px solid #e2e8f0',
                      borderRadius: 12,
                      padding: 14,
                      fontSize: 12,
                      fontWeight: 600,
                      textAlign: 'center',
                      background: selectedBank === b ? '#eff6ff' : '#ffffff',
                      color: selectedBank === b ? '#1e40af' : '#334155',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {b}
                  </button>
                ))}
              </div>
            )}

            {/* Simulated Mode Info Banner */}
            <div style={{ marginTop: 18, padding: '10px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, fontSize: 11, color: '#15803d', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
              <Sparkles size={14} color="#16a34a" /> 
              <span>Sandbox Test Active: Click below to simulate instant payment approval.</span>
            </div>

            {/* Action Submit Button */}
            <button
              onClick={handlePay}
              disabled={isProcessing}
              style={{
                width: '100%',
                marginTop: 16,
                padding: '14px 20px',
                background: isProcessing ? '#94a3b8' : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                color: '#ffffff',
                fontSize: 15,
                fontWeight: 700,
                border: 'none',
                borderRadius: 12,
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.2s ease'
              }}
            >
              <Lock size={15} />
              {isProcessing ? 'Authorizing Payment...' : `Test Pay ₹${amount?.toLocaleString('en-IN')}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

