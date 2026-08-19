import { useState } from 'react'
import type { Partner, PartnerDraft } from '../types/partner'
import { getActiveProducts } from '../services/productService'

interface Props {
  initial?: Partner
  onSave: (draft: PartnerDraft) => void
  onClose: () => void
}

export default function PartnerForm({ initial, onSave, onClose }: Props) {
  const products = getActiveProducts()

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
        <div className="modal-close">
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Tutup">
            ✕
          </button>
        </div>
        <h2 className="modal-title">{initial ? 'Edit Mitra' : 'Tambah Mitra'}</h2>

        <div className="field">
          <label htmlFor="pf-name">Nama Toko</label>
          <input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Kedai YBS" />
        </div>

        <div className="field">
          <label htmlFor="pf-area">Wilayah / Area</label>
          <input
            id="pf-area"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="Guguak, Lima Puluh Kota"
          />
        </div>

        <div className="field">
          <label htmlFor="pf-address">Alamat singkat</label>
          <textarea
            id="pf-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Jl. ... (opsional, tidak ditampilkan ke customer)"
          />
        </div>

        <div className="field">
          <label htmlFor="pf-maps">Google Maps URL</label>
          <input
            id="pf-maps"
            value={mapsUrl}
            onChange={(e) => setMapsUrl(e.target.value)}
            placeholder="https://maps.app.goo.gl/..."
          />
        </div>

        <div className="field">
          <label htmlFor="pf-image">Foto toko (opsional, URL)</label>
          <input id="pf-image" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." />
        </div>

        <div className="field">
          <label>Produk yang tersedia</label>
          <div className="product-picker">
            {products.map((p) => (
              <div className="product-picker-row" key={p.id}>
                <input
                  type="checkbox"
                  id={`prod-${p.id}`}
                  checked={selected.has(p.id)}
                  onChange={() => toggleProduct(p.id)}
                />
                <label htmlFor={`prod-${p.id}`} className="pname">
                  {p.name}
                </label>
                {selected.has(p.id) && (
                  <input
                    type="number"
                    min={0}
                    value={stockByProduct[p.id] ?? 0}
                    onChange={(e) => setStock(p.id, Number(e.target.value))}
                    aria-label={`Stok toples ${p.name}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {error && <p className="field-error">{error}</p>}

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Batal
          </button>
          <button type="submit" className="btn-primary">
            Simpan Mitra
          </button>
        </div>
      </form>
    </div>
  )
}
