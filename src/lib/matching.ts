import type { Listing, MatchPair, MatchDecision, Settings } from '../types'
import { addressSimilarity, addressTokens, amenityKey, clean, descriptionSimilarity, geoScore, haversineMeters, jaccard, nameSimilarity } from './similarity'

export const EVIDENCE_WEIGHTS = { name: 0.35, address: 0.2, geo: 0.25, description: 0.08, attributes: 0.12 }

export function scorePair(a: Listing, b: Listing) {
  const name = nameSimilarity(a.name, b.name, sharedLocation(a, b))
  const address = addressSimilarity(a.address, b.address)
  const hasGeo = a.lat != null && a.lng != null && b.lat != null && b.lng != null
  const distance = hasGeo ? haversineMeters(a.lat!, a.lng!, b.lat!, b.lng!) : null
  const geo = distance == null ? null : geoScore(distance)
  const description = a.description && b.description ? descriptionSimilarity(a.description, b.description) : null
  const amen = jaccard(a.amenities.map(amenityKey), b.amenities.map(amenityKey))
  const stars = a.stars && b.stars ? (a.stars === b.stars ? 1 : Math.abs(a.stars - b.stars) === 1 ? 0.4 : 0) : 0.5
  const attributes = 0.65 * amen + 0.35 * stars

  // Redistribute weight of missing evidence so incomplete supplier data is not over-penalised.
  const parts: [number | null, number][] = [
    [name, EVIDENCE_WEIGHTS.name],
    [address, EVIDENCE_WEIGHTS.address],
    [geo, EVIDENCE_WEIGHTS.geo],
    [description, EVIDENCE_WEIGHTS.description],
    [attributes, EVIDENCE_WEIGHTS.attributes],
  ]
  const totalW = parts.reduce((s, [v, w]) => (v == null ? s : s + w), 0)
  let overall = parts.reduce((s, [v, w]) => (v == null ? s : s + v * w), 0) / totalW
  // Hard geographic veto: two listings > 2.5km apart are almost never the same property.
  if (distance != null && distance > 2500) overall = Math.min(overall, 0.45)
  return { name, address, geo, distance, description, attributes, overall }
}

function sharedLocation(a: Listing, b: Listing) {
  const A = new Set(addressTokens(`${a.address} ${a.city}`))
  return addressTokens(`${b.address} ${b.city}`).filter((t) => A.has(t)).join(' ')
}

export type Evidence = ReturnType<typeof scorePair>

export function pairId(a: string, b: string) {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

export function computeMatches(listings: Listing[], settings: Settings, decisions: Record<string, MatchDecision>, manual: string[]): MatchPair[] {
  const out: MatchPair[] = []
  const byCity = new Map<string, Listing[]>()
  for (const l of listings) {
    const k = clean(l.city).replace('bengaluru', 'bangalore').replace('new delhi', 'delhi')
    byCity.set(k, [...(byCity.get(k) ?? []), l])
  }
  const manualSet = new Set(manual)
  const seen = new Set<string>()
  for (const group of byCity.values()) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i]
        const b = group[j]
        const id = pairId(a.id, b.id)
        const ev = scorePair(a, b)
        const isManual = manualSet.has(id)
        if (ev.overall < 0.3 && !isManual && !decisions[id]) continue
        seen.add(id)
        out.push(buildPair(id, a, b, ev, settings, decisions[id], isManual))
      }
    }
  }
  // Manual links across cities (e.g. supplier mis-tagged city).
  for (const id of manual) {
    if (seen.has(id)) continue
    const [x, y] = id.split('|')
    const a = listings.find((l) => l.id === x)
    const b = listings.find((l) => l.id === y)
    if (a && b) out.push(buildPair(id, a, b, scorePair(a, b), settings, decisions[id], true))
  }
  return out.sort((p, q) => q.evidence.overall - p.evidence.overall)
}

function buildPair(id: string, a: Listing, b: Listing, ev: Evidence, s: Settings, d: MatchDecision | undefined, manual: boolean): MatchPair {
  const sameSupplier = a.supplierId === b.supplierId
  const score = ev.overall * 100
  let auto: MatchPair['autoStatus']
  if (sameSupplier) auto = score >= s.reviewThreshold ? 'duplicate' : 'unmatched'
  else auto = score >= s.autoThreshold ? 'matched' : score >= s.reviewThreshold ? 'review' : 'unmatched'
  let status: MatchPair['status'] = auto
  if (d?.status === 'confirmed') status = sameSupplier ? 'duplicate' : 'matched'
  else if (d?.status === 'rejected') status = 'rejected'
  else if (d?.status === 'review') status = 'review'
  else if (manual) status = sameSupplier ? 'duplicate' : 'matched'
  return { id, a, b, evidence: ev, autoStatus: auto, status, sameSupplier, manual, decision: d, lowConfidence: !sameSupplier && score >= s.reviewThreshold && score < (s.reviewThreshold + s.autoThreshold) / 2 }
}

/** Union-find clustering of listings joined by accepted matches. */
export function clusterListings(listings: Listing[], pairs: MatchPair[]) {
  const parent = new Map<string, string>()
  listings.forEach((l) => parent.set(l.id, l.id))
  const find = (x: string): string => {
    const p = parent.get(x)!
    if (p === x) return x
    const r = find(p)
    parent.set(x, r)
    return r
  }
  for (const p of pairs) {
    if (p.status === 'matched' || p.status === 'duplicate') {
      if (!parent.has(p.a.id) || !parent.has(p.b.id)) continue
      parent.set(find(p.a.id), find(p.b.id))
    }
  }
  const groups = new Map<string, Listing[]>()
  for (const l of listings) {
    const r = find(l.id)
    groups.set(r, [...(groups.get(r) ?? []), l])
  }
  return [...groups.values()]
}
