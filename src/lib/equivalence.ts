import type { Offer, RoomCategory } from '../types'
import { amenityKey, jaccard } from './similarity'

export type Classification = 'Exact Equivalent' | 'Similar Product' | 'Partially Equivalent' | 'Non-Equivalent' | 'Requires Verification'

export interface AttrRow {
  key: string
  label: string
  group: 'room' | 'meal' | 'policy'
  a: string
  b: string
  state: 'match' | 'diff' | 'missing' | 'close'
  critical: boolean
}

const fmt = (v: unknown, suffix = '') => (v == null || v === '' ? '—' : `${v}${suffix}`)
const yn = (v: boolean | null) => (v == null ? '—' : v ? 'Yes' : 'No')

function cmp(a: unknown, b: unknown, close?: (a: any, b: any) => boolean): AttrRow['state'] {
  if (a == null || b == null) return 'missing'
  if (a === b) return 'match'
  if (close && close(a, b)) return 'close'
  return 'diff'
}

export function compareOffers(a: Offer, b: Offer) {
  const am = jaccard(a.amenities.map(amenityKey), b.amenities.map(amenityKey))
  const rows: AttrRow[] = [
    { key: 'roomName', label: 'Room name', group: 'room', a: a.roomName, b: b.roomName, state: a.roomName === b.roomName ? 'match' : 'close', critical: false },
    { key: 'roomType', label: 'Room type', group: 'room', a: fmt(a.roomType), b: fmt(b.roomType), state: cmp(a.roomType, b.roomType), critical: true },
    { key: 'bed', label: 'Bed configuration', group: 'room', a: fmt(a.bed), b: fmt(b.bed), state: cmp(a.bed, b.bed), critical: true },
    { key: 'capacity', label: 'Room capacity', group: 'room', a: fmt(a.capacity, ' guests'), b: fmt(b.capacity, ' guests'), state: cmp(a.capacity, b.capacity), critical: true },
    { key: 'size', label: 'Room size', group: 'room', a: fmt(a.sizeSqm, ' m²'), b: fmt(b.sizeSqm, ' m²'), state: cmp(a.sizeSqm, b.sizeSqm, (x: number, y: number) => Math.abs(x - y) / Math.max(x, y) <= 0.1), critical: false },
    { key: 'view', label: 'Room view', group: 'room', a: fmt(a.view), b: fmt(b.view), state: cmp(a.view, b.view, (x: string, y: string) => x.toLowerCase().includes(y.toLowerCase()) || y.toLowerCase().includes(x.toLowerCase())), critical: false },
    { key: 'amenities', label: 'Amenities', group: 'room', a: `${a.amenities.length} listed`, b: `${b.amenities.length} listed`, state: am >= 0.85 ? 'match' : am >= 0.5 ? 'close' : 'diff', critical: false },
    { key: 'meal', label: 'Meal plan', group: 'meal', a: fmt(a.mealPlan), b: fmt(b.mealPlan), state: cmp(a.mealPlan, b.mealPlan), critical: true },
    { key: 'refundable', label: 'Refundable', group: 'policy', a: yn(a.refundable), b: yn(b.refundable), state: cmp(a.refundable, b.refundable), critical: true },
    { key: 'deadline', label: 'Cancellation deadline', group: 'policy', a: a.refundable === false ? 'n/a' : fmt(a.cancelDeadlineHrs, 'h before check-in'), b: b.refundable === false ? 'n/a' : fmt(b.cancelDeadlineHrs, 'h before check-in'), state: a.refundable === false && b.refundable === false ? 'match' : a.refundable === false || b.refundable === false ? 'diff' : cmp(a.cancelDeadlineHrs, b.cancelDeadlineHrs, (x: number, y: number) => Math.abs(x - y) <= 24), critical: false },
    { key: 'charge', label: 'Cancellation charges', group: 'policy', a: fmt(a.cancelChargePct, '%'), b: fmt(b.cancelChargePct, '%'), state: cmp(a.cancelChargePct, b.cancelChargePct), critical: false },
    { key: 'taxes', label: 'Taxes included', group: 'policy', a: yn(a.taxesIncluded), b: yn(b.taxesIncluded), state: cmp(a.taxesIncluded, b.taxesIncluded), critical: false },
    { key: 'extra', label: 'Additional charges', group: 'policy', a: a.extraCharges.join(', ') || 'None', b: b.extraCharges.join(', ') || 'None', state: a.extraCharges.join() === b.extraCharges.join() ? 'match' : 'diff', critical: false },
  ]

  const room = rows.filter((r) => r.group === 'room' && r.key !== 'roomName')
  const roomScore = room.reduce((s, r) => s + (r.state === 'match' ? 1 : r.state === 'close' ? 0.7 : r.state === 'missing' ? 0.5 : 0) * (r.critical ? 2 : 1), 0) / room.reduce((s, r) => s + (r.critical ? 2 : 1), 0)
  const cond = rows.filter((r) => r.group !== 'room')
  const condScore = cond.reduce((s, r) => s + (r.state === 'match' ? 1 : r.state === 'close' ? 0.7 : r.state === 'missing' ? 0.5 : 0), 0) / cond.length
  const missingCritical = rows.filter((r) => r.critical && r.state === 'missing')
  const criticalRoomDiff = rows.filter((r) => r.group === 'room' && r.critical && r.state === 'diff')
  const conditionDiff = rows.filter((r) => (r.key === 'meal' || r.key === 'refundable') && r.state === 'diff')
  const score = Math.round((0.6 * roomScore + 0.4 * condScore) * 100)

  let classification: Classification
  if (missingCritical.length >= 2 || (missingCritical.length && roomScore < 0.85)) classification = 'Requires Verification'
  else if (criticalRoomDiff.length >= 2 || roomScore < 0.55) classification = 'Non-Equivalent'
  else if (criticalRoomDiff.length === 0 && conditionDiff.length === 0 && roomScore >= 0.9 && condScore >= 0.8) classification = 'Exact Equivalent'
  else if (criticalRoomDiff.length === 0 && conditionDiff.length === 0) classification = 'Similar Product'
  else classification = 'Partially Equivalent'

  return { rows, roomScore, condScore, score, classification, verdict: verdict(rows, classification, roomScore) }
}

function verdict(rows: AttrRow[], c: Classification, roomScore: number) {
  const diffs = rows.filter((r) => r.state === 'diff')
  const missing = rows.filter((r) => r.state === 'missing')
  const roomPart =
    roomScore >= 0.9 ? 'have matching room configurations' : roomScore >= 0.7 ? 'have broadly similar room configurations' : 'describe materially different rooms'
  const label = (r: AttrRow) => r.label.toLowerCase()
  const diffText = diffs.filter((d) => d.key !== 'roomName').map(label)
  let s = `Both listings belong to the same property and ${roomPart}.`
  if (diffText.length) s += ` However, ${listJoin(diffText)} ${diffText.length > 1 ? 'differ' : 'differs'}.`
  if (missing.length) s += ` One supplier does not provide ${listJoin(missing.map(label))}, so those attributes cannot be verified.`
  const end: Record<Classification, string> = {
    'Exact Equivalent': ' These products can be treated as exact equivalents and compared on price alone.',
    'Similar Product': ' The products are interchangeable for most travellers, but minor differences should be disclosed.',
    'Partially Equivalent': ' These products should not be considered exact equivalents. Compare them only after adjusting for the inclusion and policy differences.',
    'Non-Equivalent': ' These are different products and must not be presented as like-for-like alternatives.',
    'Requires Verification': ' A human should verify the missing details before these products are compared.',
  }
  return s + end[c]
}

function listJoin(xs: string[]) {
  if (xs.length <= 1) return xs.join('')
  return `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`
}

/** How closely an offer matches the canonical category spec (0-1). */
export function equivalenceToCategory(o: Offer, c: RoomCategory) {
  const checks: [boolean | null, number][] = [
    [o.roomType == null ? null : o.roomType === c.roomType, 2],
    [o.bed == null ? null : o.bed === c.bed, 2],
    [o.capacity == null ? null : o.capacity === c.capacity, 2],
    [o.sizeSqm == null ? null : Math.abs(o.sizeSqm - c.sizeSqm) / c.sizeSqm <= 0.1, 1],
    [o.view == null ? null : o.view.toLowerCase().includes(c.view.toLowerCase()), 1],
  ]
  let s = 0
  let w = 0
  for (const [v, wt] of checks) {
    s += (v == null ? 0.5 : v ? 1 : 0) * wt
    w += wt
  }
  const am = jaccard(o.amenities.map(amenityKey), c.amenities.map(amenityKey))
  return (s / w) * 0.8 + am * 0.2
}
