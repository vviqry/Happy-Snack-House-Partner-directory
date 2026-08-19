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
      {inStock.map((item) => (
        <div className="toples-row" key={item.productId}>
          <span className="toples-thumb" aria-hidden="true">🍬</span>
          <span className="toples-name">{item.product!.name}</span>
          <span className="toples-count"><strong>{item.stock}</strong> Toples</span>
        </div>
      ))}
    </div>
  )
}
