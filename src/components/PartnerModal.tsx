import { useEffect, useMemo, useState } from 'react'
import type { Partner } from '../types/partner'
import ProductStockList from './ProductStockList'
import { parseMapInput } from '../utils/mapsHelper'

interface Props {
  partner: Partner
  onClose: () => void
}

/**
 * Build the best possible Google Maps directions URL.
 * Priority:
 * 1. Coordinates (from iframe / embed / coordinate string) → exact lat,lng
 * 2. Partner address → text-based directions search
 * 3. Partner name + area → text-based directions search
 * 4. Raw mapsUrl (share link) → at least opens Google Maps
 */
function getDirectionsUrl(partner: Partner, parsedMap: ReturnType<typeof parseMapInput>): string {
  // Best: exact coordinates
  if (parsedMap.coords) {
    return `https://www.google.com/maps/dir/?api=1&destination=${parsedMap.coords.lat},${parsedMap.coords.lng}`
  }

  // Good: use partner address for directions
  if (partner.address && partner.address.trim()) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(partner.address.trim())}`
  }

  // OK: use partner name + area
  const destination = `${partner.name}, ${partner.area}`.trim()
  if (destination) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
  }

  // Fallback: raw mapsUrl or parsedMap navigationUrl
  return parsedMap.navigationUrl || partner.mapsUrl || ''
}

export default function PartnerModal({ partner, onClose }: Props) {
  const [toplesOpen, setToplesOpen] = useState(false)
  const parsedMap = parseMapInput(partner.mapsUrl)
  const directionsUrl = useMemo(() => getDirectionsUrl(partner, parsedMap), [partner, parsedMap])

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
        className={`partner-modal${parsedMap.hasEmbed ? ' has-map-embed' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={partner.name}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-row">
          <div className="modal-header-info">
            <h2 className="modal-title">{partner.name}</h2>
            <p className="modal-area">📍 {partner.area}</p>
          </div>
          <div className="modal-header-actions">
            {directionsUrl && (
              <a
                className="nav-route-btn"
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Buka Rute Navigasi di Google Maps"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="nav-icon"
                >
                  <polygon points="3 11 22 2 13 21 11 13 3 11" />
                </svg>
                <span>Buka Rute Navigasi</span>
              </a>
            )}
            <button className="icon-btn-close" onClick={onClose} aria-label="Tutup">
              ✕
            </button>
          </div>
        </div>

        {/* Embedded Map / Street View Iframe */}
        {parsedMap.hasEmbed && parsedMap.embedUrl && (
          <div className="modal-map-container">
            <iframe
              src={parsedMap.embedUrl}
              title={`Peta Lokasi ${partner.name}`}
              className="modal-map-iframe"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="modal-map-footer">
              <span className="map-footer-hint">
                💡 Klik <strong>"Buka Rute Navigasi"</strong> untuk panduan rute GPS langsung dari lokasi Anda.
              </span>
              {directionsUrl && (
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="map-footer-link"
                >
                  Petunjuk Arah GPS &rarr;
                </a>
              )}
            </div>
          </div>
        )}

        {partner.address && (
          <div className="modal-address">
            <strong>Alamat:</strong> {partner.address}
          </div>
        )}

        <div className={`modal-actions${parsedMap.hasEmbed ? ' is-compact' : ''}`}>
          {!parsedMap.hasEmbed && directionsUrl && (
            <a
              className="action-btn-primary"
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="action-icon" aria-hidden="true">📍</span>
              Rute Google Maps
            </a>
          )}
          <button
            type="button"
            className={`action-btn-secondary${toplesOpen ? ' is-active' : ''}${parsedMap.hasEmbed ? ' full-width' : ''}`}
            onClick={() => setToplesOpen((v) => !v)}
            aria-expanded={toplesOpen}
          >
            <span className="action-icon" aria-hidden="true">🥫</span>
            {toplesOpen ? 'Tutup Daftar Toples' : 'Lihat Stok Toples'}
          </button>
        </div>

        {toplesOpen && <ProductStockList partner={partner} />}
      </div>
    </div>
  )
}


