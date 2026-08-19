export interface Product {
  id: string
  name: string
  image: string
  active: boolean
}

export interface PartnerProductStock {
  productId: string
  stock: number
}
