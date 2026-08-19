import type { Product } from '../types/product'

// Master product catalog. Add new HSH products here — the rest of the
// app (cards, stock lists, admin forms) picks them up automatically.
export const MASTER_PRODUCTS: Product[] = [
  {
    id: 'fruity-candy',
    name: 'Fruity Candy',
    image: '/products/fruity-candy.svg',
    active: true,
  },
  {
    id: 'manco-crunch',
    name: 'Manco Crunch',
    image: '/products/manco-crunch.svg',
    active: true,
  },
]
