import type { Partner, PartnerDraft } from '../types/partner'
import { SEED_PARTNERS } from '../data/seed'
import { readJSON, writeJSON } from './storageService'

const KEY = 'partners'

function loadAll(): Partner[] {
  return readJSON<Partner[]>(KEY, SEED_PARTNERS)
}

function saveAll(partners: Partner[]): void {
  writeJSON(KEY, partners)
}

function genId(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${base || 'mitra'}-${suffix}`
}

// Total toples is always derived from product stock — never stored as a
// separate number — so it can never drift out of sync.
export function totalStock(partner: Partner): number {
  return partner.products.reduce((sum, p) => sum + Math.max(0, p.stock), 0)
}

export function getAllPartners(): Partner[] {
  return loadAll()
}

// What the public directory is allowed to see: active partners that have
// at least one product in stock.
export function getVisiblePartners(): Partner[] {
  return loadAll()
    .filter((p) => p.active && totalStock(p) > 0)
    .sort((a, b) => a.createdAt - b.createdAt)
}

export function getPartnerById(id: string): Partner | undefined {
  return loadAll().find((p) => p.id === id)
}

export function createPartner(draft: PartnerDraft): Partner {
  const partners = loadAll()
  const partner: Partner = {
    ...draft,
    id: genId(draft.name),
    createdAt: Date.now(),
  }
  saveAll([...partners, partner])
  return partner
}

export function updatePartner(id: string, draft: PartnerDraft): Partner | undefined {
  const partners = loadAll()
  const idx = partners.findIndex((p) => p.id === id)
  if (idx === -1) return undefined
  const updated: Partner = { ...partners[idx], ...draft }
  const next = [...partners]
  next[idx] = updated
  saveAll(next)
  return updated
}

export function setPartnerActive(id: string, active: boolean): void {
  const partners = loadAll()
  saveAll(partners.map((p) => (p.id === id ? { ...p, active } : p)))
}

export function deletePartner(id: string): void {
  const partners = loadAll()
  saveAll(partners.filter((p) => p.id !== id))
}
