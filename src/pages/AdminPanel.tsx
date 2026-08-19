import { useEffect, useState } from 'react'
import type { Partner, PartnerDraft } from '../types/partner'
import PartnerForm from '../components/PartnerForm'
import ConfirmDialog from '../components/ConfirmDialog'
import { getProductById, subscribeToProducts, seedProducts } from '../services/productService'
import {
  addPartner,
  deletePartner,
  setPartnerActive,
  subscribeToPartners,
  totalStock,
  sanitizePartnerProducts,
  updatePartner,
  seedInitialPartners,
} from '../services/partnerService'
import { endAdminSession } from '../services/authService'

interface Props {
  onDataChanged: () => void
  onLogout: () => void
}

export default function AdminPanel({ onDataChanged, onLogout }: Props) {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Partner | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeToPartners((data) => {
      setPartners(data)
      setLoading(false)
      onDataChanged()
    })
    return () => unsubscribe()
  }, [onDataChanged])

  // Subscribe to Firestore products & seed if empty
  useEffect(() => {
    seedProducts().catch(console.error)
    const unsub = subscribeToProducts()
    return () => unsub()
  }, [])

  async function handleSave(draft: PartnerDraft) {
    try {
      if (editing) {
        await updatePartner(editing.id, draft)
      } else {
        await addPartner({
          ...draft,
          createdAt: Date.now(),
        })
      }
      setFormOpen(false)
      setEditing(null)
    } catch (err) {
      console.error('Gagal menyimpan partner:', err)
      alert('Gagal menyimpan ke server Firestore.')
    }
  }

  async function handleStockChange(partner: Partner, productId: string, delta: number) {
    try {
      const currentList = sanitizePartnerProducts(partner.products)
      let matched = false
      const nextProducts = currentList.map((p) => {
        if (p.productId === productId) {
          matched = true
          return { ...p, stock: Math.max(0, p.stock + delta) }
        }
        return p
      })
      if (!matched && delta > 0) {
        nextProducts.push({ productId, stock: delta })
      }
      await updatePartner(partner.id, { products: nextProducts })
    } catch (err) {
      console.error('Gagal update stok:', err)
    }
  }

  async function handleToggleActive(partner: Partner) {
    try {
      await setPartnerActive(partner.id, !partner.active)
    } catch (err) {
      console.error('Gagal toggle active:', err)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deletePartner(id)
      setConfirmDeleteId(null)
    } catch (err) {
      console.error('Gagal menghapus partner:', err)
    }
  }

  async function handleSeedData() {
    setSeeding(true)
    try {
      await seedInitialPartners()
    } catch (err) {
      console.error('Gagal menambahkan data awal:', err)
    } finally {
      setSeeding(false)
    }
  }

  function handleLogout() {
    endAdminSession()
    onLogout()
  }

  return (
    <div className="app-shell brand-theme admin-view">
      {/* Top Banner */}
      <header className="top-nav-banner">
        <div className="top-nav-content">
          <div className="brand-logo-badge">
            <span className="brand-icon">🏠</span>
            <span className="brand-title">
              <strong>Happy Snack House</strong> — Admin Mode
            </span>
          </div>
          <button className="top-nav-logout-btn" onClick={handleLogout}>
            Keluar Mode Admin
          </button>
        </div>
      </header>

      <main className="container">
        <div className="admin-header-row">
          <div>
            <h1 className="admin-page-title">Kelola Mitra & Stok</h1>
            <p className="admin-page-sub">
              Tersambung ke Cloud Firestore Database (Real-time)
            </p>
          </div>
        </div>

        <div className="admin-actions-bar">
          <button
            className="action-btn-primary"
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <span>+</span> Tambah Mitra Baru
          </button>

          {partners.length === 0 && !loading && (
            <button
              className="action-btn-secondary"
              onClick={handleSeedData}
              disabled={seeding}
            >
              {seeding ? 'Memuat...' : '🌱 Isi Data Awal (Seed)'}
            </button>
          )}
        </div>

        {loading ? (
          <div className="state-card">
            <div className="loading-spinner" />
            <p>Menghubungkan ke Firestore database...</p>
          </div>
        ) : partners.length === 0 ? (
          <div className="state-card empty">
            <span className="state-emoji" aria-hidden="true">
              🗂️
            </span>
            <h3>Belum Ada Mitra di Database</h3>
            <p>Klik tombol "+ Tambah Mitra Baru" atau "🌱 Isi Data Awal" untuk mulai.</p>
          </div>
        ) : (
          <ul className="admin-cards-list">
            {partners.map((partner) => {
              const expanded = expandedId === partner.id
              const stock = totalStock(partner)
              return (
                <li className="admin-partner-card" key={partner.id}>
                  <div className="admin-card-header">
                    <div className="admin-card-info">
                      <div className="admin-card-icon-box">🏠</div>
                      <div>
                        <h3 className="admin-card-name">{partner.name}</h3>
                        <p className="admin-card-meta">
                          📍 {partner.area} · <span className="stock-highlight">{stock} toples</span>
                        </p>
                      </div>
                    </div>
                    <span className={`status-pill ${partner.active ? 'active' : 'inactive'}`}>
                      {partner.active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>

                  <div className="admin-card-buttons">
                    <button
                      className={`chip-btn ${expanded ? 'is-active' : ''}`}
                      onClick={() => setExpandedId(expanded ? null : partner.id)}
                    >
                      📦 {expanded ? 'Tutup Stok' : 'Kelola Stok'}
                    </button>
                    <button
                      className="chip-btn"
                      onClick={() => {
                        setEditing(partner)
                        setFormOpen(true)
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="chip-btn"
                      onClick={() => handleToggleActive(partner)}
                    >
                      {partner.active ? '⏸️ Nonaktifkan' : '▶️ Aktifkan'}
                    </button>
                    <button
                      className="chip-btn danger"
                      onClick={() => setConfirmDeleteId(partner.id)}
                    >
                      🗑️ Hapus
                    </button>
                  </div>

                  {expanded && (
                    <div className="admin-stock-editor">
                      <div className="stock-editor-header">
                        <h4>Stok Toples per Produk:</h4>
                      </div>
                      {(!partner.products || partner.products.length === 0) && (
                        <p className="field-hint">Belum ada produk. Klik Edit untuk menambahkan produk.</p>
                      )}
                      <div className="stock-editor-grid">
                        {partner.products?.map((ps) => {
                          const product = getProductById(ps.productId)
                          if (!product) return null
                          return (
                            <div className="stock-editor-item" key={ps.productId}>
                              <span className="stock-product-name">{product.name}</span>
                              <div className="stepper">
                                <button
                                  type="button"
                                  onClick={() => handleStockChange(partner, ps.productId, -1)}
                                  aria-label={`Kurangi stok ${product.name}`}
                                >
                                  −
                                </button>
                                <span className="stepper-val">{ps.stock}</span>
                                <button
                                  type="button"
                                  onClick={() => handleStockChange(partner, ps.productId, 1)}
                                  aria-label={`Tambah stok ${product.name}`}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </main>

      {formOpen && (
        <PartnerForm
          initial={editing ?? undefined}
          onSave={handleSave}
          onClose={() => {
            setFormOpen(false)
            setEditing(null)
          }}
        />
      )}

      {confirmDeleteId && (
        <ConfirmDialog
          message="Yakin ingin menghapus mitra ini dari Firestore database?"
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={() => handleDelete(confirmDeleteId)}
        />
      )}
    </div>
  )
}
