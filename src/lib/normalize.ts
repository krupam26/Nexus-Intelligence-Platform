import { jaroWinkler } from './similarity'

export const STANDARD_FIELDS = [
  { key: 'name', label: 'Property Name', synonyms: ['hotel_name', 'property', 'property_name', 'hotelname', 'name', 'hotel', 'accommodation', 'establishment'] },
  { key: 'address', label: 'Address', synonyms: ['hotel_address', 'location', 'address', 'addr', 'street', 'street_address', 'address_line'] },
  { key: 'city', label: 'City', synonyms: ['city', 'town', 'destination', 'city_name', 'locality'] },
  { key: 'lat', label: 'Latitude', synonyms: ['lat', 'latitude', 'geo_lat', 'y'] },
  { key: 'lng', label: 'Longitude', synonyms: ['lng', 'lon', 'long', 'longitude', 'geo_lng', 'geo_lon', 'x'] },
  { key: 'description', label: 'Description', synonyms: ['desc', 'description', 'overview', 'about', 'summary', 'hotel_desc'] },
  { key: 'amenities', label: 'Amenities', synonyms: ['amenities', 'facilities', 'features', 'hotel_facilities'] },
  { key: 'stars', label: 'Star Rating', synonyms: ['stars', 'star_rating', 'category', 'rating', 'class', 'star'] },
  { key: 'phone', label: 'Phone', synonyms: ['phone', 'tel', 'telephone', 'contact', 'phone_number'] },
  { key: 'roomType', label: 'Room Type', synonyms: ['room_desc', 'room_type', 'room', 'roomname', 'room_name', 'room_category'] },
  { key: 'mealPlan', label: 'Meal Plan', synonyms: ['meal_plan', 'board', 'board_basis', 'meal', 'meals', 'board_type'] },
  { key: 'price', label: 'Price', synonyms: ['rate', 'price', 'amount', 'net_rate', 'tariff', 'cost', 'net_price'] },
] as const

export type FieldKey = (typeof STANDARD_FIELDS)[number]['key'] | 'ignore'
export type Row = Record<string, string>

export function headerKey(h: string) {
  return h.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

export function autoMap(header: string): { field: FieldKey; confidence: number } {
  const k = headerKey(header)
  let best: { field: FieldKey; confidence: number } = { field: 'ignore', confidence: 0 }
  for (const f of STANDARD_FIELDS) {
    for (const s of f.synonyms) {
      const score = s === k ? 0.99 : k.includes(s) && s.length > 3 ? 0.9 : jaroWinkler(k, s) * 0.92
      if (score > best.confidence) best = { field: f.key, confidence: score }
    }
  }
  return best.confidence >= 0.8 ? best : { field: 'ignore', confidence: best.confidence }
}

export function parseCSV(text: string): { headers: string[]; rows: Row[] } {
  const out: string[][] = []
  let row: string[] = []
  let cell = ''
  let q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) {
      if (c === '"' && text[i + 1] === '"') (cell += '"'), i++
      else if (c === '"') q = false
      else cell += c
    } else if (c === '"') q = true
    else if (c === ',') row.push(cell), (cell = '')
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cell)
      out.push(row)
      row = []
      cell = ''
    } else cell += c
  }
  if (cell || row.length) row.push(cell), out.push(row)
  const lines = out.filter((r) => r.some((x) => x.trim()))
  return tableToRows(lines)
}

export function tableToRows(lines: unknown[][]): { headers: string[]; rows: Row[] } {
  if (!lines.length) return { headers: [], rows: [] }
  const headers = lines[0].map((h, i) => String(h ?? '').trim() || `Column ${i + 1}`)
  const rows = lines.slice(1).map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] == null ? '' : String(r[i]).trim()])))
  return { headers, rows }
}

export function parseJSON(text: string): { headers: string[]; rows: Row[] } {
  const data = JSON.parse(text)
  const arr: Record<string, unknown>[] = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : Array.isArray(data?.hotels) ? data.hotels : Object.values(data).find(Array.isArray) ?? []
  const headers = [...new Set(arr.flatMap((o) => Object.keys(o ?? {})))]
  const rows = arr.map((o) => Object.fromEntries(headers.map((h) => [h, o?.[h] == null ? '' : Array.isArray(o[h]) ? (o[h] as unknown[]).join('; ') : String(o[h])])))
  return { headers, rows }
}

// ---------------- Normalization ----------------

export const RULES = [
  { key: 'names', label: 'Standardize property names', example: 'GRAND HYATT  MUMBAI → Grand Hyatt Mumbai' },
  { key: 'addresses', label: 'Normalize addresses', example: 'Off WEH, Nr. Stn Rd → Off Western Express Highway, Near Station Road' },
  { key: 'rooms', label: 'Standardize room descriptions', example: 'DLX KG SV → Deluxe King Sea View' },
  { key: 'amenities', label: 'Normalize amenities', example: 'wifi|Swimming pool → Wi-Fi; Pool' },
  { key: 'prices', label: 'Standardize price formats', example: 'INR 12,000.00 → 12000' },
  { key: 'missing', label: 'Clean missing and inconsistent values', example: 'N/A, -, null → empty · BB → Breakfast included' },
] as const
export type RuleKey = (typeof RULES)[number]['key']

const MISSING = /^(n\/?a|null|none|nil|-+|\?|undefined|tbd|unknown)$/i
const SMALL = new Set(['and', 'of', 'the', 'at', 'by', 'a', 'on', 'in'])
function titleCase(s: string) {
  return s
    .toLowerCase()
    .split(' ')
    .map((w, i) => (i > 0 && SMALL.has(w) ? w : w.replace(/(^|[-/(])([a-z])/g, (_, p, c) => p + c.toUpperCase())))
    .join(' ')
    .replace(/\b(Itc|Jw|Mg|Bkc|Ndls|Ii|Iii)\b/g, (m) => m.toUpperCase())
}
const ADDR: [RegExp, string][] = [
  [/\bweh\b/gi, 'Western Express Highway'],
  [/\bhwy\b\.?/gi, 'Highway'],
  [/\brd\b\.?/gi, 'Road'],
  [/\bst\b\.?(?=\s|,|$)/gi, 'Street'],
  [/\bnr\b\.?/gi, 'Near'],
  [/\bopp\b\.?/gi, 'Opposite'],
  [/\bstn\b\.?/gi, 'Station'],
  [/\bave\b\.?/gi, 'Avenue'],
  [/\(e\)/gi, 'East'],
  [/\(w\)/gi, 'West'],
  [/\bbombay\b/gi, 'Mumbai'],
]
const ROOM: [RegExp, string][] = [
  [/\bdlx\b/gi, 'Deluxe'],
  [/\bsup\b|\bsupr\b/gi, 'Superior'],
  [/\bstd\b/gi, 'Standard'],
  [/\bexe?c?\b/gi, 'Executive'],
  [/\bste\b/gi, 'Suite'],
  [/\bkg\b|\bk\b/gi, 'King'],
  [/\bqn\b|\bq\b/gi, 'Queen'],
  [/\btwn\b|\btw\b/gi, 'Twin'],
  [/\bdbl\b/gi, 'Double'],
  [/\bsv\b/gi, 'Sea View'],
  [/\bcv\b/gi, 'City View'],
  [/\bgv\b/gi, 'Garden View'],
  [/\brm\b/gi, 'Room'],
]
const AMENITY: [RegExp, string][] = [
  [/wi-?fi|wireless|internet/i, 'Wi-Fi'],
  [/pool/i, 'Pool'],
  [/spa/i, 'Spa'],
  [/gym|fitness/i, 'Fitness Centre'],
  [/parking|valet/i, 'Parking'],
  [/restaurant|dining/i, 'Restaurant'],
  [/\bbar\b|lounge/i, 'Bar'],
  [/airport|shuttle|transfer/i, 'Airport Transfer'],
  [/beach/i, 'Beach Access'],
  [/business|meeting|conference/i, 'Business Centre'],
  [/\bac\b|a\/c|air ?con/i, 'Air Conditioning'],
]
const MEAL: [RegExp, string][] = [
  [/^(ro|ep|room ?only|no meals?)$/i, 'Room only'],
  [/^(bb|cp|b&b|bed and breakfast|breakfast( included)?|with breakfast)$/i, 'Breakfast included'],
  [/^(hb|map|half ?board)$/i, 'Half board'],
  [/^(fb|ap|full ?board)$/i, 'Full board'],
  [/^(ai|all ?inclusive)$/i, 'All inclusive'],
]

export function normalizeValue(field: FieldKey, raw: string, rules: Set<RuleKey>): { value: string; invalid?: boolean } {
  let v = raw.replace(/\s+/g, ' ').trim()
  if (rules.has('missing') && MISSING.test(v)) return { value: '' }
  if (!v) return { value: '' }
  switch (field) {
    case 'name':
      if (rules.has('names')) v = titleCase(v.replace(/\bhtl\b\.?/gi, 'Hotel').replace(/[,;]+$/, '')).replace(/\s*&\s*/g, ' & ')
      return { value: v }
    case 'address':
      if (rules.has('addresses')) {
        for (const [re, rep] of ADDR) v = v.replace(re, rep)
        v = v.replace(/\s*,\s*/g, ', ').replace(/,+/g, ',').replace(/\s+/g, ' ')
        if (v === v.toUpperCase() || v === v.toLowerCase()) v = titleCase(v)
      }
      return { value: v }
    case 'city':
      return { value: rules.has('names') ? titleCase(v.replace(/^bombay$/i, 'Mumbai').replace(/^bengaluru$/i, 'Bangalore')) : v }
    case 'roomType':
      if (rules.has('rooms')) {
        for (const [re, rep] of ROOM) v = v.replace(re, rep)
        v = titleCase(v.replace(/[-_/]+/g, ' ').replace(/\s+/g, ' '))
      }
      return { value: v }
    case 'amenities':
      if (rules.has('amenities')) {
        const parts = v.split(/[;,|/]+/).map((p) => p.trim()).filter(Boolean)
        const canon = parts.map((p) => AMENITY.find(([re]) => re.test(p))?.[1] ?? titleCase(p))
        v = [...new Set(canon)].join('; ')
      }
      return { value: v }
    case 'price': {
      if (!rules.has('prices')) return { value: v }
      const n = Number(v.replace(/(inr|rs\.?|₹|usd|\$)/gi, '').replace(/,/g, '').trim())
      return Number.isFinite(n) && n > 0 ? { value: String(Math.round(n)) } : { value: v, invalid: true }
    }
    case 'mealPlan':
      if (rules.has('missing')) v = MEAL.find(([re]) => re.test(v))?.[1] ?? v
      return { value: v }
    case 'stars': {
      if (!rules.has('missing')) return { value: v }
      const stars = (v.match(/\*/g) ?? []).length || Number(v.match(/\d(\.\d)?/)?.[0])
      return stars >= 1 && stars <= 5 ? { value: String(Math.round(stars)) } : { value: '', invalid: false }
    }
    case 'lat':
    case 'lng': {
      const n = Number(v)
      const lim = field === 'lat' ? 90 : 180
      return Number.isFinite(n) && Math.abs(n) <= lim ? { value: String(n) } : { value: v, invalid: true }
    }
    default:
      return { value: v }
  }
}

export interface ProcessedRow {
  raw: Row
  out: Partial<Record<FieldKey, string>>
  changed: Set<FieldKey>
  issues: string[]
  status: 'valid' | 'invalid' | 'duplicate'
}

export function processRows(rows: Row[], mapping: Record<string, FieldKey>, rules: Set<RuleKey>) {
  const mapped = Object.entries(mapping).filter(([, f]) => f !== 'ignore') as [string, Exclude<FieldKey, 'ignore'>][]
  const seen = new Set<string>()
  let missingFields = 0
  const result: ProcessedRow[] = rows.map((raw) => {
    const out: Partial<Record<FieldKey, string>> = {}
    const changed = new Set<FieldKey>()
    const issues: string[] = []
    for (const [col, field] of mapped) {
      const original = raw[col] ?? ''
      const n = normalizeValue(field, original, rules)
      // Combine multiple source columns mapped to one field.
      out[field] = out[field] ? `${out[field]} ${n.value}`.trim() : n.value
      if (n.value !== original.trim()) changed.add(field)
      if (!n.value) missingFields++
      if (n.invalid) issues.push(`Invalid ${field}`)
    }
    if (!out.name) issues.push('Missing property name')
    if (!out.address && !out.city) issues.push('Missing location')
    const key = `${(out.name ?? '').toLowerCase()}|${(out.address ?? out.city ?? '').toLowerCase()}|${(out.roomType ?? '').toLowerCase()}`
    let status: ProcessedRow['status'] = issues.length ? 'invalid' : 'valid'
    if (status === 'valid') {
      if (seen.has(key)) status = 'duplicate'
      seen.add(key)
    }
    return { raw, out, changed, issues, status }
  })
  const report = {
    total: rows.length,
    valid: result.filter((r) => r.status === 'valid').length,
    invalid: result.filter((r) => r.status === 'invalid').length,
    duplicates: result.filter((r) => r.status === 'duplicate').length,
    missingFields,
    normalized: result.filter((r) => r.status === 'valid' && r.changed.size > 0).length,
    cellsChanged: result.reduce((s, r) => s + r.changed.size, 0),
  }
  return { rows: result, report }
}

const KNOWN_CITIES = ['Mumbai', 'New Delhi', 'Delhi', 'Bangalore', 'Bengaluru', 'Goa', 'Jaipur', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Udaipur', 'Agra', 'Kochi']
export function inferCity(out: Partial<Record<FieldKey, string>>) {
  if (out.city) return out.city
  const hay = `${out.address ?? ''} ${out.name ?? ''}`.toLowerCase()
  return KNOWN_CITIES.find((c) => hay.includes(c.toLowerCase())) ?? 'Unknown'
}

// --------------- Demo datasets ---------------
export const SAMPLE_FILES = [
  {
    label: 'Format A · Hotel_* columns',
    fileName: 'lotus_hotels_resend.csv',
    text: `Hotel_Name,Hotel_Address,City,Lat,Lng,Room_Desc,Meal_Plan,Rate,Facilities,Star_Rating
GRAND HYATT MUMBAI,"Off WEH, Santacruz (E), Mumbai 400055",Bombay,19.0774,72.8511,DLX KG CV,BB,"INR 11,800.00",wifi|Swimming pool|Spa|gym,5*
The Leela Palace,"23 Old Airport Rd, Kodihalli",Bengaluru,12.9607,77.6485,Premier Rm KG,HB,"₹17,250",WiFi|Pool|Spa,*****
taj palace new delhi,"2 Sardar Patel Marg, Diplomatic Enclave",New Delhi,28.5961,77.1713,SUP KG GV,CP,14100,wi-fi|pool|spa|restaurant,5 Star
Htl Marine Plaza,"29 Marine Drive, Nr. Churchgate Stn",Mumbai,18.9322,72.8238,STD DBL SV,RO,8900,WiFi|Rooftop pool|Bar,5
Fairmont Jaipur,"2 Riico, Kukas, Delhi Rd",Jaipur,27.0329,75.8885,DLX TWN,BB,N/A,wifi|pool|spa,5
GRAND HYATT MUMBAI,"Off WEH, Santacruz (E), Mumbai 400055",Bombay,19.0774,72.8511,DLX KG CV,BB,"INR 11,800.00",wifi|Swimming pool|Spa|gym,5*
,"Calangute Beach Rd",Goa,,,STD DBL,RO,4200,wifi,3
Novotel Juhu Beach,"Balraj Sahani Marg, Juhu",Mumbai,19.1031,72.8264,SUP QN SV,RO,"Rs. 9,650",WiFi|pool|beach,5`,
  },
  {
    label: 'Format B · Property / Board / Price',
    fileName: 'partner_feed_export.json',
    text: JSON.stringify(
      {
        hotels: [
          { Property: 'ITC Rajputana', Location: 'Palace Rd, Gopalbari, Jaipur', Town: 'Jaipur', Room_Type: 'EXEC TWN', Board: 'Breakfast', Price: '9,400', Amenities: ['Wi-Fi', 'Pool', 'Fitness'], Stars: '5' },
          { Property: 'Taj Mahal Palace', Location: 'Apollo Bunder, Colaba, Mumbai 400001', Town: 'Mumbai', Room_Type: 'Luxury Rm KG SV', Board: 'RO', Price: '₹24,500', Amenities: ['wifi', 'pool', 'spa'], Stars: '5' },
          { Property: 'The Oberoi Bangalore', Location: '37-39 MG Rd', Town: 'Bangalore', Room_Type: 'DLX KG GV', Board: 'MAP', Price: 'null', Amenities: ['WiFi', 'Spa'], Stars: '-' },
          { Property: 'Alila Diwa Goa', Location: 'Adao Waddo, Majorda', Town: 'Goa', Room_Type: 'DLX KG', Board: 'BB', Price: '11200', Amenities: ['wifi', 'infinity pool', 'spa'], Stars: '5' },
        ],
      },
      null,
      2,
    ),
  },
]
