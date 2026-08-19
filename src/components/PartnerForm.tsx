import { useEffect, useState } from 'react'
import type { Partner, PartnerDraft } from '../types/partner'
import type { Product } from '../types/product'
import { subscribeToProducts, addProduct } from '../services/productService'

interface Props {
  initial?: Partner
  onSave: (draft: PartnerDraft) => void
  onClose: () => void
}

export default function PartnerForm({ initial, onSave, onClose }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [newProductName, setNewProductName] = useState('')
  const [addingProduct, setAddingProduct] = useState(false)

  const [name, setName] = useState(initial?.name ?? '')
  const [area, setArea] = useState(initial?.area ?? '')
  const [address, setAddress] = useState(initial?.address ?? '')
  const [mapsUrl, setMapsUrl] = useState(initial?.mapsUrl ?? '')
  const [image, setImage] = useState(initial?.image ?? '')
  const [stockByProduct, setStockByProduct] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {}
    for (const p of initial?.products ?? []) map[p.productId] = p.stock
    return map
  })
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set((initial?.products ?? []).map((p) => p.productId))
  )
  const [error, setError] = useState('')

  // Subscribe to products from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToProducts((list) => {
      setProducts(list.filter((p) => p.active))
    })
    return () => unsubscribe()
  }, [])

  function toggleProduct(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
        if (!(id in stockByProduct)) {
          setStockByProduct((s) => ({ ...s, [id]: 0 }))
        }
      }
      return next
    })
  }

  function setStock(id: string, value: number) {
    setStockByProduct((prev) => ({ ...prev, [id]: Math.max(0, value) }))
  }

  async function handleAddProduct() {
    if (!newProductName.trim()) return
    setAddingProduct(true)
    try {
      await addProduct(newProductName.trim())
      setNewProductName('')
      setShowAddProduct(false)
    } catch (err) {
      console.error('Gagal menambahkan produk:', err)
      alert('Gagal menambahkan produk baru.')
    } finally {
      setAddingProduct(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Nama toko wajib diisi.')
      return
    }
    if (!area.trim()) {
      setError('Wilayah/area wajib diisi.')
      return
    }
    if (!mapsUrl.trim()) {
      setError('Google Maps URL wajib diisi.')
      return
    }

    const draft: PartnerDraft = {
      name: name.trim(),
      area: area.trim(),
      address: address.trim(),
      mapsUrl: mapsUrl.trim(),
      image: image.trim(),
      active: initial?.active ?? true,
      products: Array.from(selected).map((productId) => ({
        productId,
        stock: stockByProduct[productId] ?? 0,
      })),
    }
    onSave(draft)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="form-modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="modal-header-row">
          <div className="modal-badge-icon">🏪</div>
          <button type="button" className="icon-btn-close" onClick={onClose} aria-label="Tutup">
            ✕
          </button>
        </div>

        <h2 className="modal-title">{initial ? 'Edit Data Mitra' : 'Tambah Mitra Baru'}</h2>
        <p className="modal-sub-title">Lengkapi informasi toko dan jumlah stok toples.</p>

        <div className="form-fields-container">
          <div className="field">
            <label htmlFor="pf-name">Nama Toko / Warung *</label>
            <input
              id="pf-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Toko Berkah Snack"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="pf-area">Wilayah / Area *</label>
            <input
              id="pf-area"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Contoh: Tebet, Jakarta Selatan"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="pf-maps">Google Maps URL *</label>
            <input
              id="pf-maps"
              value={mapsUrl}
              onChange={(e) => setMapsUrl(e.target.value)}
              placeholder="https://maps.app.goo.gl/..."
              required
            />
          </div>

          <div className="field">
            <label htmlFor="pf-address">Alamat Lengkap (Opsional)</label>
            <textarea
              id="pf-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Jl. Tebet Raya No. 12..."
              rows={2}
            />
          </div>

          <div className="field">
            <label>Pilihan Produk & Stok Toples</label>
            <div className="product-picker-box">
              {products.map((p) => {
                const isChecked = selected.has(p.id)
                return (
                  <div className="product-picker-row" key={p.id}>
                    <label className="product-picker-left">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleProduct(p.id)}
                      />
                      <span className="product-picker-name">{p.name}</span>
                    </label>
                    <div className="product-picker-right">
                      <input
                        type="number"
                        min={0}
                        value={stockByProduct[p.id] ?? 0}
                        onChange={(e) => setStock(p.id, Number(e.target.value))}
                        disabled={!isChecked}
                        aria-label={`Stok toples ${p.name}`}
                        className="stock-num-input"
                      />
                      <span className="stock-unit">Toples</span>
                    </div>
                  </div>
                )
              })}

              {/* Add Product inline form */}
              {showAddProduct ? (
                <div className="add-product-inline">
                  <input
                    type="text"
                    placeholder="Nama produk baru..."
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    autoFocus
                    className="add-product-input"
                  />
                  <div className="add-product-btns">
                    <button
                      type="button"
                      className="action-btn-secondary small"
                      onClick={() => { setShowAddProduct(false); setNewProductName('') }}
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      className="action-btn-primary small"
                      onClick={handleAddProduct}
                      disabled={addingProduct || !newProductName.trim()}
                    >
                      {addingProduct ? 'Menyimpan...' : 'Simpan Produk'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="add-product-btn"
                  onClick={() => setShowAddProduct(true)}
                >
                  + Tambah Produk
                </button>
              )}
            </div>
          </div>
        </div>

        {error && <p className="field-error">{error}</p>}

        <div className="form-actions-row">
          <button type="button" className="action-btn-secondary" onClick={onClose}>
            Batal
          </button>
          <button type="submit" className="action-btn-primary">
            Simpan Mitra
          </button>
        </div>
      </form>
    </div>
  )
}
