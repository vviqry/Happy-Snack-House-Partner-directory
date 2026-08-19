import type { Product } from '../types/product'
import { MASTER_PRODUCTS } from '../data/products'

// Product catalog is static config for now, but reading it through a
// service (instead of importing the data file everywhere) means it can
// move to remote data later without touching components.
export function getActiveProducts(): Product[] {
  return MASTER_PRODUCTS.filter((p) => p.active)
}

export function getProductById(id: string): Product | undefined {
  return MASTER_PRODUCTS.find((p) => p.id === id)
}
