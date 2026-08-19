import { useMemo, useState } from 'react'
import type { Partner, PartnerDraft } from '../types/partner'
import PartnerForm from '../components/PartnerForm'
import ConfirmDialog from '../components/ConfirmDialog'
import { getProductById } from '../services/productService'
import {
  createPartner,
  deletePartner,
  getAllPartners,
  setPartnerActive,
  totalStock,
  updatePartner,
} from '../services/partnerService'
import { endAdminSession } from '../services/authService'

interface Props {
  onDataChanged: () => void
  onLogout: () => void
}

export default function AdminPanel({ onDataChanged, onLogout }: Props) {
  const [version, setVersion] = useState(0)
  const partners = useMemo(() => getAllPartners(), [version])

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Partner | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  function bump() {
    setVersion((v) => v + 1)
    onDataChanged()
  }

  function handleSave(draft: PartnerDraft) {
    if (editing) {
      updatePartner(editing.id, draft)
    } else {
      createPartner(draft)
    }
    setFormOpen(false)
    setEditing(null)
    bump()
  }

  function handleStockChange(partner: Partner, productId: string, delta: number) {
    const nextProducts = partner.products.map((p) =>
      p.productId === productId ? { ...p, stock: Math.max(0, p.stock + delta) } : p
    )
    updatePartner(partner.id, { ...partner, products: nextProducts })
    bump()
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
            Admin Mode
          </span>
          <button className="chip-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <button
          className="btn-add"
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          + Tambah Mitra
        </button>

        {partners.length === 0 ? (
          <div className="state-block">
            <span className="state-emoji" aria-hidden="true">
              🗂️
            </span>
            <p>Belum ada mitra. Tambahkan mitra pertama.</p>
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
                      onClick={() => {
                        setPartnerActive(partner.id, !partner.active)
                        bump()
                      }}
                    >
                      {partner.active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button className="chip-btn danger" onClick={() => setConfirmDeleteId(partner.id)}>
                      Hapus
                    </button>
                  </div>

                  {expanded && (
                    <div className="admin-stock-editor">
                      {partner.products.length === 0 && (
                        <p className="field-hint">Belum ada produk. Klik Edit untuk menambahkan.</p>
                      )}
                      {partner.products.map((ps) => {
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
          message="Yakin ingin menghapus mitra ini?"
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={() => {
            deletePartner(confirmDeleteId)
            setConfirmDeleteId(null)
            bump()
          }}
        />
      )}
    </div>
  )
}
