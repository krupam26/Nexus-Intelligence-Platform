import type { Offer, RoomCategory, Supplier } from '../types'
import { equivalenceToCategory } from './equivalence'

export const PARAMS = [
  { key: 'price', label: 'Price', hint: 'Lower effective price (incl. taxes and fees) scores higher' },
  { key: 'equivalence', label: 'Product equivalence', hint: 'How closely the room matches the requested category' },
  { key: 'reliability', label: 'Supplier reliability', hint: 'Historical fulfilment and booking success rate' },
  { key: 'flexibility', label: 'Cancellation flexibility', hint: 'Refundability, deadline and penalty' },
  { key: 'confidence', label: 'Data confidence', hint: 'Match confidence and attribute completeness' },
  { key: 'availability', label: 'Availability', hint: 'Rooms left, where the supplier provides it' },
] as const

export type ParamKey = (typeof PARAMS)[number]['key']
export type Weights = Record<ParamKey, number>

export interface Constraints {
  refundable: boolean
  breakfast: boolean
  maxBudget: number | null
  minEquivalence: number
}

export function effectivePrice(o: Offer, taxRate: number) {
  let p = o.price
  if (o.taxesIncluded === false) p *= 1 + taxRate / 100
  for (const c of o.extraCharges) {
    const m = c.replace(/,/g, '').match(/(\d+)/)
    if (m) p += Number(m[1])
  }
  return Math.round(p)
}

function flexibility(o: Offer) {
  if (!o.refundable) return 0
  const deadline = o.cancelDeadlineHrs == null ? 0.5 : Math.min(o.cancelDeadlineHrs / 72, 1)
  const penalty = o.cancelChargePct == null ? 0.5 : 1 - o.cancelChargePct / 100
  return 0.3 + 0.35 * deadline + 0.35 * penalty
}

function completeness(o: Offer) {
  const fields = [o.roomType, o.bed, o.capacity, o.sizeSqm, o.view, o.mealPlan, o.refundable, o.cancelDeadlineHrs ?? (o.refundable === false ? 0 : null), o.taxesIncluded, o.availability]
  return fields.filter((f) => f != null).length / fields.length
}

export interface Ranked {
  offer: Offer
  supplier: Supplier
  effective: number
  scores: Record<ParamKey, number>
  contributions: Record<ParamKey, number>
  total: number
  violations: string[]
  rank: number
}

export function optimize(offers: Offer[], suppliers: Supplier[], category: RoomCategory, weights: Weights, constraints: Constraints, taxRate: number, matchConfidence: (o: Offer) => number): Ranked[] {
  const wSum = Object.values(weights).reduce((a, b) => a + b, 0) || 1
  const prices = offers.map((o) => effectivePrice(o, taxRate))
  const min = Math.min(...prices)
  const rows = offers.map((o, i) => {
    const supplier = suppliers.find((s) => s.id === o.supplierId)!
    const eq = equivalenceToCategory(o, category)
    const scores: Record<ParamKey, number> = {
      price: min / prices[i],
      equivalence: eq,
      reliability: (supplier?.reliability ?? 50) / 100,
      flexibility: flexibility(o),
      confidence: 0.6 * matchConfidence(o) + 0.4 * completeness(o),
      availability: o.availability == null ? 0.5 : Math.min(o.availability / 8, 1),
    }
    const contributions = Object.fromEntries(Object.entries(scores).map(([k, v]) => [k, (v * weights[k as ParamKey]) / wSum])) as Record<ParamKey, number>
    const total = Object.values(contributions).reduce((a, b) => a + b, 0) * 100
    const violations: string[] = []
    if (constraints.refundable && !o.refundable) violations.push('Must be refundable')
    if (constraints.breakfast && !(o.mealPlan && o.mealPlan !== 'Room only')) violations.push('Must include breakfast')
    if (constraints.maxBudget && prices[i] > constraints.maxBudget) violations.push('Over budget')
    if (eq * 100 < constraints.minEquivalence) violations.push(`Equivalence below ${constraints.minEquivalence}%`)
    return { offer: o, supplier, effective: prices[i], scores, contributions, total, violations, rank: 0 }
  })
  rows.sort((a, b) => (a.violations.length ? 1 : 0) - (b.violations.length ? 1 : 0) || b.total - a.total)
  rows.forEach((r, i) => (r.rank = i + 1))
  return rows
}
