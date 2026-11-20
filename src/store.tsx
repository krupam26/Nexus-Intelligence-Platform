import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AUDIT, DATASETS, LISTINGS, NOTIFICATIONS, SUPPLIERS } from './data/seed'
import { clusterListings, computeMatches, pairId } from './lib/matching'
import type { AuditEntry, Dataset, Listing, MatchDecision, MatchPair, Notification, PageKey, Settings, Supplier } from './types'

const STORAGE_KEY = 'nexus-state-v1'
export const CURRENT_USER = { name: 'Ananya Iyer', role: 'Inventory Intelligence Lead', email: 'ananya.iyer@tbo.example', initials: 'AI' }

interface Persisted {
  suppliers: Supplier[]
  listings: Listing[]
  datasets: Dataset[]
  decisions: Record<string, MatchDecision>
  manual: string[]
  audit: AuditEntry[]
  notifications: Notification[]
  settings: Settings
  lastMatchRun: string
}

const DEFAULTS: Persisted = {
  suppliers: SUPPLIERS,
  listings: LISTINGS,
  datasets: DATASETS,
  decisions: {},
  manual: [],
  audit: AUDIT,
  notifications: NOTIFICATIONS,
  settings: { autoThreshold: 85, reviewThreshold: 60, currency: 'INR', taxRate: 18 },
  lastMatchRun: AUDIT.find((a) => a.action === 'Matching run completed')!.at,
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {}
  return DEFAULTS
}

export interface Route {
  page: PageKey
  params: Record<string, string>
}

interface Toast {
  id: number
  text: string
  tone: 'ok' | 'warn' | 'err'
}

function useStoreValue() {
  const [state, setState] = useState<Persisted>(load)
  const [route, setRoute] = useState<Route>(() => parseHash())
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastId = useRef(0)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    const on = () => setRoute(parseHash())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])

  const navigate = useCallback((page: PageKey, params: Record<string, string> = {}) => {
    const q = new URLSearchParams(params).toString()
    window.location.hash = `/${page}${q ? `?${q}` : ''}`
    document.querySelector('main')?.scrollTo({ top: 0 })
  }, [])

  const toast = useCallback((text: string, tone: Toast['tone'] = 'ok') => {
    const id = ++toastId.current
    setToasts((t) => [...t, { id, text, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  const matches = useMemo(() => computeMatches(state.listings, state.settings, state.decisions, state.manual), [state.listings, state.settings, state.decisions, state.manual])
  const clusters = useMemo(() => clusterListings(state.listings, matches), [state.listings, matches])

  const log = (s: Persisted, e: Omit<AuditEntry, 'id' | 'at' | 'actor'> & { actor?: string }): AuditEntry[] => [
    { id: `au-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, at: new Date().toISOString(), actor: e.actor ?? CURRENT_USER.name, ...e },
    ...s.audit,
  ]
  const notify = (s: Persisted, n: Omit<Notification, 'id' | 'at' | 'read'>): Notification[] => [
    { id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, at: new Date().toISOString(), read: false, ...n },
    ...s.notifications,
  ]

  const actions = {
    decide(pair: MatchPair, status: MatchDecision['status'], note?: string) {
      const verb = { confirmed: 'Match confirmed', rejected: 'Match rejected', review: 'Marked for review' }[status]
      setState((s) => ({
        ...s,
        decisions: { ...s.decisions, [pair.id]: { status, by: CURRENT_USER.name, at: new Date().toISOString(), note } },
        audit: log(s, { action: verb, target: `${pair.a.name} ↔ ${pair.b.name}`, detail: `Score ${(pair.evidence.overall * 100).toFixed(1)}%${note ? ` · ${note}` : ''}`, category: 'match' }),
      }))
      toast(verb, status === 'rejected' ? 'warn' : 'ok')
    },
    undoDecision(pair: MatchPair) {
      setState((s) => {
        const d = { ...s.decisions }
        delete d[pair.id]
        return { ...s, decisions: d, audit: log(s, { action: 'Decision reverted', target: `${pair.a.name} ↔ ${pair.b.name}`, category: 'match' }) }
      })
    },
    manualMatch(a: Listing, b: Listing, note: string) {
      const id = pairId(a.id, b.id)
      setState((s) => ({
        ...s,
        manual: s.manual.includes(id) ? s.manual : [...s.manual, id],
        decisions: { ...s.decisions, [id]: { status: 'confirmed', by: CURRENT_USER.name, at: new Date().toISOString(), note: note || 'Manual link' } },
        audit: log(s, { action: 'Manual match created', target: `${a.name} ↔ ${b.name}`, detail: note, category: 'match' }),
      }))
      toast('Records linked manually')
    },
    runMatching() {
      setState((s) => {
        const m = computeMatches(s.listings, s.settings, s.decisions, s.manual)
        const review = m.filter((p) => p.status === 'review').length
        const matched = m.filter((p) => p.status === 'matched').length
        let next = { ...s, lastMatchRun: new Date().toISOString() }
        next.audit = log(s, { action: 'Matching run completed', target: `${s.listings.length} listings`, detail: `${m.length} candidate pairs · ${matched} matched · ${review} need review`, category: 'match' })
        next.notifications = notify(s, { kind: review ? 'review' : 'match', title: 'Matching run complete', body: `${matched} matched pairs, ${review} awaiting human verification.`, link: 'matching' })
        return next
      })
    },
    addSupplier(sup: Omit<Supplier, 'id'>) {
      setState((s) => {
        const id = `SUP-${sup.code}`
        return { ...s, suppliers: [...s.suppliers, { ...sup, id }], audit: log(s, { action: 'Supplier added', target: sup.name, category: 'supplier' }) }
      })
      toast(`${sup.name} added`)
    },
    updateSupplier(id: string, patch: Partial<Supplier>) {
      setState((s) => ({
        ...s,
        suppliers: s.suppliers.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        audit: log(s, { action: 'Supplier updated', target: patch.name ?? s.suppliers.find((x) => x.id === id)?.name ?? id, detail: Object.keys(patch).join(', '), category: 'supplier' }),
      }))
      toast('Supplier updated')
    },
    removeSupplier(id: string) {
      setState((s) => {
        const sup = s.suppliers.find((x) => x.id === id)
        return {
          ...s,
          suppliers: s.suppliers.filter((x) => x.id !== id),
          listings: s.listings.filter((l) => l.supplierId !== id),
          datasets: s.datasets.filter((d) => d.supplierId !== id),
          audit: log(s, { action: 'Supplier removed', target: sup?.name ?? id, detail: 'Listings and datasets removed from workspace', category: 'supplier' }),
        }
      })
      toast('Supplier removed', 'warn')
    },
    addDataset(ds: Dataset, listings: Listing[]) {
      setState((s) => {
        const sup = s.suppliers.find((x) => x.id === ds.supplierId)
        const failed = ds.status === 'Failed'
        return {
          ...s,
          datasets: [ds, ...s.datasets],
          listings: [...s.listings, ...listings],
          audit: log(s, { action: failed ? 'Dataset failed' : 'Dataset processed', target: `${ds.id} · ${sup?.name}`, detail: `${ds.normalized} records normalized, ${ds.records - ds.valid} rejected`, category: 'dataset' }),
          notifications: notify(s, failed ? { kind: 'upload-failed', title: `${ds.fileName} failed`, body: 'No valid records could be processed.', link: 'studio' } : { kind: 'match', title: `${ds.normalized} listings added from ${sup?.name}`, body: 'Run matching to reconcile new records with existing inventory.', link: 'matching' }),
        }
      })
    },
    logOptimization(target: string, detail: string) {
      setState((s) => ({
        ...s,
        audit: log(s, { action: 'Optimization run', target, detail, category: 'optimization' }),
        notifications: notify(s, { kind: 'optimization', title: 'Optimization complete', body: `${target}: ${detail}`, link: 'optimization' }),
      }))
    },
    logExport(name: string) {
      setState((s) => ({ ...s, audit: log(s, { action: 'Report exported', target: name, category: 'system' }) }))
    },
    markRead(id: string) {
      setState((s) => ({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }))
    },
    markAllRead() {
      setState((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) }))
    },
    clearNotification(id: string) {
      setState((s) => ({ ...s, notifications: s.notifications.filter((n) => n.id !== id) }))
    },
    updateSettings(patch: Partial<Settings>) {
      setState((s) => ({ ...s, settings: { ...s.settings, ...patch }, audit: log(s, { action: 'Settings changed', target: 'Matching configuration', detail: Object.entries(patch).map(([k, v]) => `${k}=${v}`).join(', '), category: 'system' }) }))
    },
    resetWorkspace() {
      localStorage.removeItem(STORAGE_KEY)
      setState(DEFAULTS)
      toast('Workspace reset to demo data')
    },
  }

  return { ...state, matches, clusters, route, navigate, toast, toasts, ...actions }
}

function parseHash(): Route {
  const h = window.location.hash.replace(/^#\/?/, '')
  const [p, q] = h.split('?')
  const pages: PageKey[] = ['overview', 'suppliers', 'studio', 'matching', 'equivalence', 'optimization', 'analytics', 'history', 'notifications', 'settings', 'profile']
  const page = (pages.includes(p as PageKey) ? p : 'overview') as PageKey
  return { page, params: Object.fromEntries(new URLSearchParams(q ?? '')) }
}

type Store = ReturnType<typeof useStoreValue>
const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const v = useStoreValue()
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>
}

export function useStore() {
  const v = useContext(Ctx)
  if (!v) throw new Error('StoreProvider missing')
  return v
}

/** Per-supplier data quality derived from actual listing completeness and duplicates. */
export function supplierStats(sup: Supplier, listings: Listing[], matches: MatchPair[], clusters: Listing[][]) {
  const ls = listings.filter((l) => l.supplierId === sup.id)
  const fields: [string, (l: Listing) => boolean][] = [
    ['Coordinates', (l) => l.lat != null && l.lng != null],
    ['Description', (l) => l.description.trim().length > 20],
    ['Amenities', (l) => l.amenities.length >= 3],
    ['Star rating', (l) => l.stars != null],
    ['Phone', (l) => !!l.phone],
    ['Postal code', (l) => /\d{6}/.test(l.address)],
  ]
  const missing = fields.map(([label, fn]) => ({ label, count: ls.filter((l) => !fn(l)).length })).filter((m) => m.count > 0)
  const filled = ls.length ? fields.reduce((s, [, fn]) => s + ls.filter(fn).length, 0) / (ls.length * fields.length) : 0
  const dupes = matches.filter((m) => m.sameSupplier && m.a.supplierId === sup.id && m.status === 'duplicate').length
  const properties = clusters.filter((c) => c.some((l) => l.supplierId === sup.id)).length
  const quality = ls.length ? Math.round(filled * 85 + (1 - dupes / Math.max(ls.length, 1)) * 15) : 0
  return { listings: ls, count: ls.length, properties, completeness: Math.round(filled * 100), missing, dupes, quality }
}

export function qualityLabel(q: number) {
  if (q >= 80) return { label: 'Excellent', tone: 'green' as const }
  if (q >= 65) return { label: 'Good', tone: 'blue' as const }
  if (q >= 45) return { label: 'Fair', tone: 'amber' as const }
  return { label: 'Poor', tone: 'red' as const }
}
