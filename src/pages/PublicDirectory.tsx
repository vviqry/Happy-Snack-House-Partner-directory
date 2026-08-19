import { useEffect, useMemo, useState } from 'react'
import type { Partner } from '../types/partner'
import PartnerCard from '../components/PartnerCard'
import PartnerModal from '../components/PartnerModal'
import { subscribeToPartners, totalStock } from '../services/partnerService'

interface Props {
  refreshKey?: number
}

export default function PublicDirectory({ refreshKey: _ }: Props) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState<Partner | null>(null)
  const [allPartners, setAllPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeToPartners((data) => {
      setAllPartners(data)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // Toko yang ditampilkan ke publik: aktif dan memiliki stok > 0
  const visiblePartners = useMemo(() => {
    return allPartners
      .filter((p) => p.active && totalStock(p) > 0)
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
  }, [allPartners])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return visiblePartners
    return visiblePartners.filter(
      (p) => p.name.toLowerCase().includes(q) || p.area.toLowerCase().includes(q)
    )
  }, [visiblePartners, query])

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

          {visiblePartners.length > 4 && (
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

        {loading ? (
          <div className="state-block">
            <p>Memuat data dari server...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="state-block">
            <span className="state-emoji" aria-hidden="true">
              {visiblePartners.length === 0 ? '🍬' : '🔎'}
            </span>
            <p>
              {visiblePartners.length === 0
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
