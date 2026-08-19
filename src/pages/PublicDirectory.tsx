import { useEffect, useMemo, useState } from 'react'
import type { Partner } from '../types/partner'
import PartnerCard from '../components/PartnerCard'
import PartnerModal from '../components/PartnerModal'
import { subscribeToPartners, totalStock } from '../services/partnerService'

interface Props {
  refreshKey?: number
  onOpenAdmin?: () => void
}

export default function PublicDirectory({ onOpenAdmin }: Props) {
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

  // Toko yang ditampilkan ke publik: aktif dan memiliki stok > 0
  const visiblePartners = useMemo(() => {
    return allPartners
      .filter((p) => p.active && totalStock(p) > 0)
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
  }, [allPartners])

  // Extract distinct areas for filter chips
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
      {/* Top Banner */}
      <header className="top-nav-banner">
        <div className="top-nav-content">
          <div className="brand-logo-badge">
            <span className="brand-icon">🏠</span>
            <span className="brand-title">
              <strong>Happy Snack House</strong> — Direktori Mitra
            </span>
          </div>
          {onOpenAdmin && (
            <button
              className="top-nav-admin-btn"
              onClick={onOpenAdmin}
              title="Akses Admin (atau tekan Ctrl+X)"
            >
              🔐 Admin
            </button>
          )}
        </div>
      </header>

      <main className="container">
        {/* Hero Section with 3D Mascot */}
        <section className="hero-section">
          <div className="mascot-wrapper">
            <img
              src="/assets/mascot.jpg"
              alt="Happy Snack House Mascot"
              className="mascot-img"
            />
          </div>
          <h1 className="hero-title">
            Halo Mitra Happy! <span className="wave-hand">👋</span>
          </h1>
          <p className="hero-subtitle">
            Cari toko & warung mitra resmi penyedia camilan Happy Snack House terdekat.
          </p>

          {/* Search Bar */}
          <div className="search-box-wrapper">
            <span className="search-icon" aria-hidden="true">
              🔍
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama toko, pasar, atau wilayah..."
              aria-label="Cari toko mitra"
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

          {/* Area Filter Chips */}
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

        {/* Directory Section */}
        <section className="directory-section">
          <div className="directory-header-row">
            <h2 className="section-heading">Daftar Toko Mitra</h2>
            <span className="partner-count-badge">
              {filtered.length} Toko Tersedia
            </span>
          </div>

          {loading ? (
            <div className="state-card">
              <div className="loading-spinner" />
              <p>Menghubungkan ke database...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="state-card empty">
              <span className="state-emoji" aria-hidden="true">
                {visiblePartners.length === 0 ? '🍬' : '🔎'}
              </span>
              <h3>
                {visiblePartners.length === 0
                  ? 'Belum ada toko yang terdaftar'
                  : 'Toko tidak ditemukan'}
              </h3>
              <p>
                {visiblePartners.length === 0
                  ? 'Data toko sedang dipersiapkan oleh tim Happy Snack House.'
                  : `Tidak ada hasil untuk pencarian "${query}". Coba kata kunci lain.`}
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

      {/* Brand Footer */}
      <footer className="site-footer">
        <p>
          Terima kasih telah menjadi bagian dari keluarga <strong>Happy Snack House</strong>.{' '}
          <span className="heart-icon">💛</span>
        </p>
      </footer>

      {active && <PartnerModal partner={active} onClose={() => setActive(null)} />}
    </div>
  )
}
