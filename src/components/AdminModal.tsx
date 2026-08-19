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
    setError('PIN salah.')
    setShake(true)
    setPin('')
    setTimeout(() => setShake(false), 350)
  }

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <form
        className={`admin-pin-modal${shake ? ' is-shaking' : ''}`}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="admin-lock-icon" aria-hidden="true">
          🔐
        </div>
        <h2 className="admin-pin-title">Admin Access</h2>
        <p className="admin-pin-sub">Masukkan PIN Admin</p>
        <input
          className="pin-input"
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={12}
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          aria-label="PIN Admin"
        />
        <p className="pin-error">{error}</p>
        <button type="submit" className="btn-primary">
          Masuk
        </button>
        <button type="button" className="btn-secondary" onClick={onClose}>
          Batal
        </button>
      </form>
    </div>
  )
}
