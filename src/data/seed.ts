import type { Partner } from '../types/partner'

// One demo mitra so the directory isn't empty on first run.
// Admin can edit or delete this from the Admin Panel.
export const SEED_PARTNERS: Partner[] = [
  {
    id: 'kedai-ybs',
    name: 'Kedai YBS',
    area: 'Guguak, Lima Puluh Kota',
    address: 'Guguak, Kabupaten Lima Puluh Kota, Sumatera Barat',
    mapsUrl: 'https://maps.app.goo.gl/yVxc5ApXmAceoMsa7',
    image: '',
    active: true,
    createdAt: Date.now(),
    products: [{ productId: 'fruity-candy', stock: 3 }],
  },
]
