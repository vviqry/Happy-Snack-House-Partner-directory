import type { Partner } from '../types/partner'
import { getProductById } from '../services/productService'

interface Props {
  partner: Partner
}

export default function ProductStockList({ partner }: Props) {
  const productMap = new Map<string, { name: string; stock: number }>()

  for (const item of partner.products || []) {
    if (!item || item.stock <= 0) continue
    const product = getProductById(item.productId)
    const key = product ? product.id : item.productId
    const name = product ? product.name : (item.productId || 'Camilan')

    const existing = productMap.get(key)
    if (existing) {
      existing.stock = Math.max(existing.stock, item.stock)
    } else {
      productMap.set(key, { name, stock: item.stock })
    }
  }

  const items = Array.from(productMap.entries())

  if (items.length === 0) {
    return <p className="field-hint">Belum ada stok produk saat ini.</p>
  }

  return (
    <div className="toples-panel">
      {items.map(([productId, item]) => (
        <div className="toples-row" key={productId}>
          <span className="toples-thumb" aria-hidden="true">🍬</span>
          <span className="toples-name">{item.name}</span>
          <span className="toples-count"><strong>{item.stock}</strong> Toples</span>
        </div>
      ))}
    </div>
  )
}

