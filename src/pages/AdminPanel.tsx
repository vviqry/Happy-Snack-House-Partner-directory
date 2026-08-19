import { useEffect, useState } from 'react'
import type { Partner, PartnerDraft } from '../types/partner'
import PartnerForm from '../components/PartnerForm'
import ConfirmDialog from '../components/ConfirmDialog'
import { getProductById } from '../services/productService'
import {
  addPartner,
  deletePartner,
  setPartnerActive,
  subscribeToPartners,
  totalStock,
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
      alert('Gagal menyimpan ke server Firestore. Pastikan Firestore rules sudah aktif.')
    }
  }

  async function handleStockChange(partner: Partner, productId: string, delta: number) {
    try {
      const nextProducts = partner.products.map((p) =>
        p.productId === productId ? { ...p, stock: Math.max(0, p.stock + delta) } : p
      )
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
    <div className="app-shell">
      <div className="container">
        <div className="admin-topbar">
          <span className="admin-topbar-title">
            <span className="dot" aria-hidden="true" />
            Admin Mode (Cloud Firestore)
          </span>
          <button className="chip-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            className="btn-add"
            style={{ flex: 1 }}
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            + Tambah Mitra
          </button>
          {partners.length === 0 && !loading && (
            <button
              className="chip-btn"
              onClick={handleSeedData}
              disabled={seeding}
              style={{ whiteSpace: 'nowrap' }}
            >
              {seeding ? 'Memuat...' : '🌱 Isi Data Awal'}
            </button>
          )}
        </div>

        {loading ? (
          <div className="state-block">
            <p>Menghubungkan ke Firestore database...</p>
          </div>
        ) : partners.length === 0 ? (
          <div className="state-block">
            <span className="state-emoji" aria-hidden="true">
              🗂️
            </span>
            <p>Belum ada mitra di database Firestore. Tambahkan mitra pertama atau klik "Isi Data Awal".</p>
          </div>
        ) : (
          <ul className="admin-list">
            {partners.map((partner) => {
              const expanded = expandedId === partner.id
              return (
                <li className="admin-row" key={partner.id}>
                  <div className="admin-row-top">
                    <div>
                      <p className="admin-row-name">{partner.name}</p>
                      <p className="admin-row-area">
                        {partner.area} · {totalStock(partner)} toples
                      </p>
                    </div>
                    <span className={`status-pill ${partner.active ? 'active' : 'inactive'}`}>
                      {partner.active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>

                  <div className="admin-row-actions">
                    <button
                      className="chip-btn"
                      onClick={() => setExpandedId(expanded ? null : partner.id)}
                    >
                      {expanded ? 'Tutup Stok' : 'Kelola Stok'}
                    </button>
                    <button
                      className="chip-btn"
                      onClick={() => {
                        setEditing(partner)
                        setFormOpen(true)
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="chip-btn"
                      onClick={() => handleToggleActive(partner)}
                    >
                      {partner.active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button
                      className="chip-btn danger"
                      onClick={() => setConfirmDeleteId(partner.id)}
                    >
                      Hapus
                    </button>
                  </div>

                  {expanded && (
                    <div className="admin-stock-editor">
                      {(!partner.products || partner.products.length === 0) && (
                        <p className="field-hint">Belum ada produk. Klik Edit untuk menambahkan.</p>
                      )}
                      {partner.products?.map((ps) => {
                        const product = getProductById(ps.productId)
                        if (!product) return null
                        return (
                          <div className="stock-editor-row" key={ps.productId}>
                            <label>{product.name}</label>
                            <div className="stepper">
                              <button
                                type="button"
                                onClick={() => handleStockChange(partner, ps.productId, -1)}
                                aria-label={`Kurangi stok ${product.name}`}
                              >
                                −
                              </button>
                              <span>{ps.stock}</span>
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
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

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
          message="Yakin ingin menghapus mitra ini dari database?"
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={() => handleDelete(confirmDeleteId)}
        />
      )}
    </div>
  )
}
