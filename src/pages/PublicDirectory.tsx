import { useMemo, useState } from 'react'
import type { Partner } from '../types/partner'
import PartnerCard from '../components/PartnerCard'
import PartnerModal from '../components/PartnerModal'
import { getVisiblePartners } from '../services/partnerService'

interface Props {
  refreshKey: number
}

export default function PublicDirectory({ refreshKey }: Props) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState<Partner | null>(null)

  // refreshKey changes whenever admin data changes, so this recomputes.
  const partners = useMemo(() => getVisiblePartners(), [refreshKey])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return partners
    return partners.filter(
      (p) => p.name.toLowerCase().includes(q) || p.area.toLowerCase().includes(q)
    )
  }, [partners, query])

  return (
    <div className="app-shell">
      <div className="container">
        <header className="site-header">
          <div className="brand-row">
            <span className="brand-mark" aria-hidden="true" />
            <span className="brand-name">Happy Snack House</span>
          </div>
          <h1 className="site-title">Temukan HSH di Dekatmu</h1>
          <p className="site-subtitle">
            Temukan toko/warung yang menyediakan produk Happy Snack House.
          </p>

          {partners.length > 4 && (
            <div className="search-bar">
              <span className="search-icon" aria-hidden="true">
                🔍
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nama toko atau wilayah..."
                aria-label="Cari toko"
              />
            </div>
          )}
        </header>

        {filtered.length === 0 ? (
          <div className="state-block">
            <span className="state-emoji" aria-hidden="true">
              {partners.length === 0 ? '🍬' : '🔎'}
            </span>
            <p>
              {partners.length === 0
                ? 'Belum ada toko yang terdaftar.'
                : 'Toko yang kamu cari belum ditemukan.'}
            </p>
          </div>
        ) : (
          <ul className="partner-list">
            {filtered.map((partner) => (
              <PartnerCard key={partner.id} partner={partner} onOpen={setActive} />
            ))}
          </ul>
        )}
      </div>

      {active && <PartnerModal partner={active} onClose={() => setActive(null)} />}
    </div>
  )
}
