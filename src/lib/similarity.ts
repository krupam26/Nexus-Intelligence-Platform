// Lightweight, explainable similarity primitives used by the matching engine.

const NAME_STOP = new Set(['the', 'hotel', 'hotels', 'and', 'a', 'an', 'of', 'by', 'at', 'luxury', 'collection'])
const ADDRESS_ABBR: Record<string, string> = {
  rd: 'road',
  st: 'street',
  marg: 'road',
  mg: 'mahatma gandhi',
  nr: 'near',
  opp: 'opposite',
  ave: 'avenue',
  hwy: 'highway',
  e: 'east',
  w: 'west',
  bengaluru: 'bangalore',
  bombay: 'mumbai',
  ndls: 'new delhi',
}
const ADDRESS_STOP = new Set(['india', 'the', 'no', 'and', 'of'])

export function clean(s: string) {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function nameTokens(s: string) {
  return clean(s)
    .replace(/\bbengaluru\b/g, 'bangalore')
    .split(' ')
    .filter((t) => t && !NAME_STOP.has(t))
}

export function addressTokens(s: string) {
  return clean(s)
    .split(' ')
    .flatMap((t) => (ADDRESS_ABBR[t] ?? t).split(' '))
    .filter((t) => t && !ADDRESS_STOP.has(t) && !/^\d{6}$/.test(t))
}

export function jaroWinkler(a: string, b: string) {
  if (a === b) return 1
  if (!a.length || !b.length) return 0
  const range = Math.max(0, Math.floor(Math.max(a.length, b.length) / 2) - 1)
  const aM = new Array(a.length).fill(false)
  const bM = new Array(b.length).fill(false)
  let matches = 0
  for (let i = 0; i < a.length; i++) {
    const lo = Math.max(0, i - range)
    const hi = Math.min(i + range + 1, b.length)
    for (let j = lo; j < hi; j++) {
      if (bM[j] || a[i] !== b[j]) continue
      aM[i] = bM[j] = true
      matches++
      break
    }
  }
  if (!matches) return 0
  let k = 0
  let transpositions = 0
  for (let i = 0; i < a.length; i++) {
    if (!aM[i]) continue
    while (!bM[k]) k++
    if (a[i] !== b[k]) transpositions++
    k++
  }
  const m = matches
  const jaro = (m / a.length + m / b.length + (m - transpositions / 2) / m) / 3
  let prefix = 0
  while (prefix < 4 && a[prefix] === b[prefix]) prefix++
  return jaro + prefix * 0.1 * (1 - jaro)
}

/** Dice coefficient where tokens count as shared if they are near-identical (typos, plurals). */
export function fuzzyDice(A: string[], B: string[]) {
  if (!A.length || !B.length) return 0
  const used = new Set<number>()
  let shared = 0
  for (const a of A) {
    let best = -1
    let bestScore = 0
    B.forEach((b, j) => {
      if (used.has(j)) return
      const s = a === b ? 1 : jaroWinkler(a, b)
      if (s > bestScore) {
        bestScore = s
        best = j
      }
    })
    if (best >= 0 && bestScore >= 0.9) {
      used.add(best)
      shared += bestScore
    }
  }
  return (2 * shared) / (A.length + B.length)
}

export function jaccard(A: Iterable<string>, B: Iterable<string>) {
  const a = new Set(A)
  const b = new Set(B)
  if (!a.size && !b.size) return 0
  let inter = 0
  a.forEach((x) => b.has(x) && inter++)
  return inter / (a.size + b.size - inter)
}

/**
 * Compares names after removing location words (city, neighbourhood, street) that both
 * listings share in their address. This isolates the brand core: "Novotel Juhu Beach" vs
 * "JW Marriott Juhu" becomes "novotel" vs "jw marriott".
 */
export function nameSimilarity(a: string, b: string, locationContext = '') {
  const loc = new Set([...addressTokens(locationContext), 'mumbai', 'delhi', 'new', 'bangalore', 'goa', 'jaipur', 'india'])
  const strip = (t: string[]) => {
    const r = t.filter((x) => !loc.has(x))
    return r.length ? r : t
  }
  const core = rawNameSimilarity(strip(nameTokens(a)), strip(nameTokens(b)))
  const full = rawNameSimilarity(nameTokens(a), nameTokens(b))
  return 0.65 * core + 0.35 * full
}

function rawNameSimilarity(A: string[], B: string[]) {
  const sortedJW = jaroWinkler([...A].sort().join(' '), [...B].sort().join(' '))
  // Containment rewards "Taj Palace" vs "The Taj Palace, New Delhi".
  const setA = new Set(A)
  const inter = B.filter((t) => setA.has(t)).length
  const containment = Math.min(A.length, B.length) ? inter / Math.min(A.length, B.length) : 0
  return Math.min(1, 0.45 * fuzzyDice(A, B) + 0.25 * sortedJW + 0.3 * containment)
}

export function addressSimilarity(a: string, b: string) {
  const A = addressTokens(a)
  const B = addressTokens(b)
  const setA = new Set(A)
  const inter = B.filter((t) => setA.has(t)).length
  const containment = Math.min(A.length, B.length) ? inter / Math.min(A.length, B.length) : 0
  return Math.min(1, 0.6 * fuzzyDice(A, B) + 0.4 * containment)
}

export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function geoScore(meters: number) {
  if (meters <= 100) return 1
  if (meters >= 1500) return 0
  return 1 - (meters - 100) / 1400
}

const DESC_STOP = new Set(['with', 'from', 'this', 'that', 'offers', 'located', 'property', 'hotel', 'guests', 'your', 'into'])
export function descriptionSimilarity(a: string, b: string) {
  const t = (s: string) => clean(s).split(' ').filter((w) => w.length > 3 && !DESC_STOP.has(w))
  return jaccard(t(a), t(b))
}

export function amenityKey(a: string) {
  const c = clean(a).replace(/\s/g, '')
  if (/wifi|wireless|internet/.test(c)) return 'wifi'
  if (/pool/.test(c)) return 'pool'
  if (/spa/.test(c)) return 'spa'
  if (/gym|fitness/.test(c)) return 'gym'
  if (/parking|valet/.test(c)) return 'parking'
  if (/restaurant|dining/.test(c)) return 'restaurant'
  if (/bar|lounge/.test(c)) return 'bar'
  if (/airport|shuttle|transfer/.test(c)) return 'airport-transfer'
  if (/beach/.test(c)) return 'beach'
  if (/business|meeting|conference/.test(c)) return 'business'
  if (/roomservice|24h|24hr|24hour/.test(c)) return 'room-service'
  if (/ac|aircon|airconditioning/.test(c)) return 'ac'
  return c
}
