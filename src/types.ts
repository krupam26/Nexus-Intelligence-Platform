import type { Evidence } from './lib/matching'

export type PageKey =
  | 'overview'
  | 'suppliers'
  | 'studio'
  | 'matching'
  | 'equivalence'
  | 'optimization'
  | 'analytics'
  | 'history'
  | 'notifications'
  | 'settings'
  | 'profile'

export type IntegrationStatus = 'Live API' | 'Batch SFTP' | 'Manual Upload' | 'Paused'

export interface Supplier {
  id: string
  code: string
  name: string
  type: string
  integration: IntegrationStatus
  region: string
  contact: string
  email: string
  reliability: number // 0-100 historical fulfilment
  since: string
  color: string
}

export interface Listing {
  id: string
  supplierId: string
  name: string
  address: string
  city: string
  lat?: number
  lng?: number
  description: string
  amenities: string[]
  stars?: number
  phone?: string
  datasetId?: string
}

export interface Dataset {
  id: string
  supplierId: string
  name: string
  fileName: string
  format: 'CSV' | 'Excel' | 'JSON'
  uploadedAt: string
  records: number
  valid: number
  status: 'Processed' | 'Failed' | 'Mapped' | 'Uploaded'
  normalized: number
}

export interface MatchDecision {
  status: 'confirmed' | 'rejected' | 'review'
  by: string
  at: string
  note?: string
}

export interface MatchPair {
  id: string
  a: Listing
  b: Listing
  evidence: Evidence
  autoStatus: 'matched' | 'review' | 'unmatched' | 'duplicate'
  status: 'matched' | 'review' | 'unmatched' | 'duplicate' | 'rejected'
  sameSupplier: boolean
  manual: boolean
  lowConfidence: boolean
  decision?: MatchDecision
}

export interface Settings {
  autoThreshold: number
  reviewThreshold: number
  currency: 'INR'
  taxRate: number
}

export interface AuditEntry {
  id: string
  at: string
  actor: string
  action: string
  target: string
  detail?: string
  category: 'match' | 'supplier' | 'dataset' | 'optimization' | 'system'
}

export interface Notification {
  id: string
  at: string
  kind: 'match' | 'upload-failed' | 'review' | 'optimization' | 'system'
  title: string
  body: string
  read: boolean
  link?: PageKey
}

export type MealPlan = 'Room only' | 'Breakfast included' | 'Half board' | 'Full board' | 'All inclusive'

export interface Offer {
  id: string
  propertyId: string
  supplierId: string
  categoryId: string
  roomName: string
  roomType: string | null
  bed: string | null
  capacity: number | null
  sizeSqm: number | null
  view: string | null
  amenities: string[]
  mealPlan: MealPlan | null
  refundable: boolean | null
  cancelDeadlineHrs: number | null
  cancelChargePct: number | null
  taxesIncluded: boolean | null
  extraCharges: string[]
  price: number
  availability: number | null
}

export interface RoomCategory {
  id: string
  label: string
  roomType: string
  bed: string
  capacity: number
  sizeSqm: number
  view: string
  amenities: string[]
}

export interface UnifiedProperty {
  id: string
  name: string
  city: string
  stars: number
  listingIds: string[]
  categories: RoomCategory[]
}
