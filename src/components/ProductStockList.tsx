import type { Partner } from '../types/partner'
import { getProductById } from '../services/productService'

interface Props {
  partner: Partner
}

export default function ProductStockList({ partner }: Props) {
  const inStock = (partner.products || [])
    .filter((p) => p.stock > 0)
    .map((p) => ({ ...p, product: getProductById(p.productId) }))
    .filter((p) => p.product)

  if (inStock.length === 0) {
    return <p className="field-hint">Belum ada stok produk saat ini.</p>
  }

  return (
    <div className="toples-panel">
      <p className="toples-heading">🍬 Produk & Toples Tersedia</p>
      <div className="toples-list">
        {inStock.map((item) => (
          <div className="toples-row" key={item.productId}>
            <div className="toples-left">
              <span className="toples-thumb" aria-hidden="true">
                🍬
              </span>
              <span className="toples-name">{item.product!.name}</span>
            </div>
            <span className="toples-count">{item.stock} Toples</span>
          </div>
        ))}
      </div>
    </div>
  )
}
