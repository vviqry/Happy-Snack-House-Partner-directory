import { useEffect, useState } from 'react'
import type { Partner, PartnerDraft } from '../types/partner'
import type { Product } from '../types/product'
import {
  subscribeToProducts,
  addProduct,
  deleteProduct,
  getActiveProducts,
  getProductById,
} from '../services/productService'

interface Props {
  initial?: Partner
  onSave: (draft: PartnerDraft) => void
  onClose: () => void
}

export default function PartnerForm({ initial, onSave, onClose }: Props) {
  const [products, setProducts] = useState<Product[]>(() => getActiveProducts())
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [newProductName, setNewProductName] = useState('')
  const [addingProduct, setAddingProduct] = useState(false)

  const [name, setName] = useState(initial?.name ?? '')
  const [area, setArea] = useState(initial?.area ?? '')
  const [address, setAddress] = useState(initial?.address ?? '')
  const [mapsUrl, setMapsUrl] = useState(initial?.mapsUrl ?? '')
  const [image, setImage] = useState(initial?.image ?? '')

  // Initialize stock and selected map, resolving legacy product IDs
  const [stockByProduct, setStockByProduct] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {}
    for (const p of initial?.products ?? []) {
      const resolved = getProductById(p.productId)
      const targetId = resolved ? resolved.id : p.productId
      map[targetId] = Math.max(0, Number(p.stock) || 0)
    }
    return map
  })

  const [selected, setSelected] = useState<Set<string>>(() => {
    const set = new Set<string>()
    for (const p of initial?.products ?? []) {
      const resolved = getProductById(p.productId)
      const targetId = resolved ? resolved.id : p.productId
      if (p.stock > 0) {
        set.add(targetId)
      }
    }
    return set
  })

  const [error, setError] = useState('')

  // Subscribe to products from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToProducts((list) => {
      const activeList = list.filter((p) => p.active)
      setProducts(activeList)

      // Sync initial data if any legacy ID needs matching to newly loaded active products
      if (initial?.products) {
        setStockByProduct((prev) => {
          const next = { ...prev }
          for (const item of initial.products) {
            const resolved = getProductById(item.productId)
            if (resolved) {
              if (next[resolved.id] === undefined) {
                next[resolved.id] = Math.max(0, Number(item.stock) || 0)
              }
            }
          }
          return next
        })

        setSelected((prev) => {
          const next = new Set(prev)
          for (const item of initial.products) {
            const resolved = getProductById(item.productId)
            if (resolved && item.stock > 0) {
              next.add(resolved.id)
            }
          }
          return next
        })
      }
    })
    return () => unsubscribe()
  }, [initial])

  function toggleProduct(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        setStockByProduct((s) => ({ ...s, [id]: 0 }))
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
      const newId = await addProduct(newProductName.trim())
      setSelected((prev) => new Set(prev).add(newId))
      setStockByProduct((prev) => ({ ...prev, [newId]: 0 }))
      setNewProductName('')
      setShowAddProduct(false)
    } catch (err) {
      console.error('Gagal menambahkan produk:', err)
      alert('Gagal menambahkan produk baru.')
    } finally {
      setAddingProduct(false)
    }
  }

  async function handleDeleteProduct(e: React.MouseEvent, productId: string, productName: string) {
    e.stopPropagation()
    if (window.confirm(`Hapus produk "${productName}" dari database?`)) {
      try {
        await deleteProduct(productId)
        setSelected((prev) => {
          const next = new Set(prev)
          next.delete(productId)
          return next
        })
        setStockByProduct((prev) => {
          const next = { ...prev }
          delete next[productId]
          return next
        })
      } catch (err) {
        console.error('Gagal menghapus produk:', err)
      }
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

    const validProductIds = new Set(products.map((p) => p.id))
    const validProducts = Array.from(selected)
      .filter((productId) => validProductIds.has(productId))
      .map((productId) => ({
        productId,
        stock: Math.max(0, Number(stockByProduct[productId]) || 0),
      }))

    const draft: PartnerDraft = {
      name: name.trim(),
      area: area.trim(),
      address: address.trim(),
      mapsUrl: mapsUrl.trim(),
      image: image.trim(),
      active: initial?.active ?? true,
      products: validProducts,
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
                      <button
                        type="button"
                        className="product-delete-badge"
                        onClick={(e) => handleDeleteProduct(e, p.id, p.name)}
                        title={`Hapus produk "${p.name}"`}
                        aria-label={`Hapus produk ${p.name}`}
                      >
                        ✕
                      </button>
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
