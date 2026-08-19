import { useEffect, useMemo, useState } from 'react'
import type { Partner } from '../types/partner'
import PartnerCard from '../components/PartnerCard'
import PartnerModal from '../components/PartnerModal'
import { subscribeToPartners, totalStock } from '../services/partnerService'

interface Props {
  refreshKey?: number
}

export default function PublicDirectory(_props: Props) {
  const [query, setQuery] = useState('')
  const [selectedArea, setSelectedArea] = useState<string>('Semua')
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

  const visiblePartners = useMemo(() => {
    return allPartners
      .filter((p) => p.active && totalStock(p) > 0)
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
  }, [allPartners])

  const areas = useMemo(() => {
    const set = new Set<string>()
    for (const p of visiblePartners) {
      if (p.area) {
        const primary = p.area.split(',')[0].trim()
        if (primary) set.add(primary)
      }
    }
    return ['Semua', ...Array.from(set)]
  }, [visiblePartners])

  const filtered = useMemo(() => {
    let result = visiblePartners
    if (selectedArea !== 'Semua') {
      result = result.filter((p) =>
        p.area.toLowerCase().includes(selectedArea.toLowerCase())
      )
    }
    const q = query.trim().toLowerCase()
    if (q) {
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.area.toLowerCase().includes(q)
      )
    }
    return result
  }, [visiblePartners, selectedArea, query])

  return (
    <div className="app-shell brand-theme">
      {/* Clean brand header — no admin elements */}
      <header className="top-nav-banner">
        <div className="top-nav-content">
          <div className="brand-logo-badge">
            <span className="brand-icon">🏠</span>
            <span className="brand-title">
              <strong>Happy Snack House</strong>
            </span>
          </div>
        </div>
      </header>

      <main className="container">
        {/* Hero — customer-facing with authentic transparent Logo.png */}
        <section className="hero-section">
          <div className="logo-wrapper">
            <img
              src="/Logo.png"
              alt="Happy Snack House"
              className="hero-logo"
            />
          </div>
          <h1 className="hero-title">
            Camilan Favoritmu Ada di Sini <span className="candy-bounce">🍬</span>
          </h1>
          <p className="hero-subtitle">
            Temukan toko & warung terdekat yang menyediakan camilan Happy Snack House.
          </p>

          <div className="search-box-wrapper">
            <span className="search-icon" aria-hidden="true">🔍</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama toko atau wilayah..."
              aria-label="Cari toko"
              className="search-input"
            />
            {query && (
              <button
                className="search-clear-btn"
                onClick={() => setQuery('')}
                aria-label="Hapus pencarian"
              >
                ✕
              </button>
            )}
          </div>

          {areas.length > 2 && (
            <div className="filter-chips-row">
              {areas.map((area) => (
                <button
                  key={area}
                  className={`filter-chip ${selectedArea === area ? 'is-active' : ''}`}
                  onClick={() => setSelectedArea(area)}
                >
                  {area}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Store directory */}
        <section className="directory-section">
          <div className="directory-header-row">
            <h2 className="section-heading">Toko Terdekat</h2>
            <span className="partner-count-badge">
              {filtered.length} Toko
            </span>
          </div>

          {loading ? (
            <div className="state-card">
              <div className="loading-spinner" />
              <p>Memuat data toko...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="state-card empty">
              <span className="state-emoji" aria-hidden="true">
                {visiblePartners.length === 0 ? '🍬' : '🔎'}
              </span>
              <h3>
                {visiblePartners.length === 0
                  ? 'Toko belum tersedia'
                  : 'Toko tidak ditemukan'}
              </h3>
              <p>
                {visiblePartners.length === 0
                  ? 'Sedang menyiapkan daftar toko untukmu. Cek lagi nanti ya!'
                  : `Tidak ada hasil untuk "${query}". Coba kata kunci lain.`}
              </p>
            </div>
          ) : (
            <ul className="partner-list">
              {filtered.map((partner) => (
                <PartnerCard key={partner.id} partner={partner} onOpen={setActive} />
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="site-footer">
        <p>
          <strong>Happy Snack House</strong> — Rumahnya Camilan & Momen Ceria!{' '}
          <span className="heart-icon">💛</span>
        </p>
      </footer>

      {active && <PartnerModal partner={active} onClose={() => setActive(null)} />}
    </div>
  )
}
