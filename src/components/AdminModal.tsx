import { useState } from 'react'
import { verifyPin } from '../services/authService'

interface Props {
  onSuccess: () => void
  onClose: () => void
}

export default function AdminModal({ onSuccess, onClose }: Props) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (verifyPin(pin)) {
      onSuccess()
      return
    }
    setError('PIN salah. Silakan coba lagi.')
    setShake(true)
    setPin('')
    setTimeout(() => setShake(false), 350)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className={`admin-pin-modal${shake ? ' is-shaking' : ''}`}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="modal-header-row">
          <div className="admin-lock-badge" aria-hidden="true">
            🔐
          </div>
          <button type="button" className="icon-btn-close" onClick={onClose} aria-label="Tutup">
            ✕
          </button>
        </div>

        <h2 className="admin-pin-title">Akses Admin</h2>
        <p className="admin-pin-sub">Masukkan PIN Admin untuk mengelola data mitra & stok.</p>

        <div className="pin-input-group">
          <input
            className="pin-input"
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={12}
            placeholder="••••••••"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            aria-label="PIN Admin"
          />
        </div>

        {error && <p className="pin-error">{error}</p>}

        <div className="modal-form-actions">
          <button type="submit" className="action-btn-primary full-width">
            Masuk ke Admin
          </button>
        </div>
      </form>
    </div>
  )
}
