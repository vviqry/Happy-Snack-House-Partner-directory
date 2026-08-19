import type { PartnerProductStock } from './product'

export interface Partner {
  id: string
  name: string
  area: string
  address: string
  mapsUrl: string
  image?: string
  active: boolean
  createdAt: number
  products: PartnerProductStock[]
}

export type PartnerDraft = Omit<Partner, 'id' | 'createdAt'>
