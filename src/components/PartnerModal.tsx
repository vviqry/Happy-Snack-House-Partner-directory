import { useEffect, useState } from 'react'
import type { Partner } from '../types/partner'
import ProductStockList from './ProductStockList'

interface Props {
  partner: Partner
  onClose: () => void
}

export default function PartnerModal({ partner, onClose }: Props) {
  const [toplesOpen, setToplesOpen] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="partner-modal"
        role="dialog"
        aria-modal="true"
        aria-label={partner.name}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-row">
          <div />
          <button className="icon-btn-close" onClick={onClose} aria-label="Tutup">
            ✕
          </button>
        </div>

        <h2 className="modal-title">{partner.name}</h2>
        <p className="modal-area">📍 {partner.area}</p>

        <div className="modal-actions">
          {partner.mapsUrl && (
            <a
              className="action-btn-primary"
              href={partner.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="action-icon" aria-hidden="true">📍</span>
              Rute Google Maps
            </a>
          )}
          <button
            type="button"
            className={`action-btn-secondary${toplesOpen ? ' is-active' : ''}`}
            onClick={() => setToplesOpen((v) => !v)}
            aria-expanded={toplesOpen}
          >
            <span className="action-icon" aria-hidden="true">📦</span>
            Toples
          </button>
        </div>

        {toplesOpen && <ProductStockList partner={partner} />}
      </div>
    </div>
  )
}
