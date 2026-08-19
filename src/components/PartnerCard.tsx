import type { Partner } from '../types/partner'
import { totalStock } from '../services/partnerService'

interface Props {
  partner: Partner
  onOpen: (partner: Partner) => void
}

export default function PartnerCard({ partner, onOpen }: Props) {
  const stock = totalStock(partner)

  return (
    <li>
      <button className="partner-card" onClick={() => onOpen(partner)}>
        <div className="partner-card-body">
          <p className="partner-card-name">{partner.name}</p>
          <p className="partner-card-area">📍 {partner.area}</p>
        </div>
        <div className="stock-badge" aria-label={`${stock} toples tersedia`}>
          {stock}
        </div>
      </button>
    </li>
  )
}
