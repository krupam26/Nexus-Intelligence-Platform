import {
  BarChart3,
  Bell,
  Boxes,
  Building2,
  Command,
  Database,
  GitCompareArrows,
  History,
  LayoutGrid,
  Scale,
  Search,
  Settings,
  Sparkles,
  User,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { CURRENT_USER, useStore } from '../store'
import type { PageKey } from '../types'
import { cx, SupplierChip, timeAgo } from './ui'

const NAV: { section: string; items: { key: PageKey; label: string; icon: ReactNode }[] }[] = [
  {
    section: 'Workspace',
    items: [
      { key: 'overview', label: 'Overview', icon: <LayoutGrid size={16} /> },
      { key: 'suppliers', label: 'Supplier Management', icon: <Building2 size={16} /> },
      { key: 'studio', label: 'Data Intelligence Studio', icon: <Database size={16} /> },
    ],
  },
  {
    section: 'Intelligence',
    items: [
      { key: 'matching', label: 'AI Matching Intelligence', icon: <GitCompareArrows size={16} /> },
      { key: 'equivalence', label: 'Product Equivalence Lab', icon: <Boxes size={16} /> },
      { key: 'optimization', label: 'Supplier Optimization', icon: <Scale size={16} /> },
    ],
  },
  {
    section: 'Insights',
    items: [
      { key: 'analytics', label: 'Analytics & Reports', icon: <BarChart3 size={16} /> },
      { key: 'history', label: 'Match History', icon: <History size={16} /> },
      { key: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
    ],
  },
  {
    section: 'System',
    items: [
      { key: 'settings', label: 'Settings', icon: <Settings size={16} /> },
      { key: 'profile', label: 'User Profile', icon: <User size={16} /> },
    ],
  },
]

export function Shell({ children }: { children: ReactNode }) {
  const { route, navigate, matches, notifications } = useStore()
  const reviewCount = matches.filter((m) => m.status === 'review').length
  const unread = notifications.filter((n) => !n.read).length
  const badges: Partial<Record<PageKey, number>> = { matching: reviewCount, notifications: unread }

  return (
    <div className="flex h-full">
      <aside className="flex w-[68px] shrink-0 flex-col bg-night text-white xl:w-[248px]">
        <div className="flex items-center gap-2.5 px-[18px] pt-5 pb-6 xl:px-5">
          <div className="relative grid size-8 place-items-center rounded-lg bg-signal text-night">
            <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M5 19V5l14 14V5" />
            </svg>
          </div>
          <div className="hidden leading-tight xl:block">
            <div className="text-[15px] font-semibold tracking-[0.08em]">NEXUS</div>
            <div className="text-[10.5px] text-white/45">Intelligence Platform</div>
          </div>
        </div>
        <nav className="scroll-thin scroll-night flex-1 space-y-5 overflow-y-auto px-3 pb-4">
          {NAV.map((g) => (
            <div key={g.section}>
              <div className="mb-1.5 hidden px-2.5 font-mono text-[10px] tracking-[0.16em] text-white/35 uppercase xl:block">{g.section}</div>
              <div className="mx-auto mb-2 h-px w-6 bg-night-line xl:hidden" />
              <div className="space-y-0.5">
                {g.items.map((it) => {
                  const active = route.page === it.key
                  return (
                    <button
                      key={it.key}
                      onClick={() => navigate(it.key)}
                      title={it.label}
                      className={cx(
                        'group relative flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] transition-colors',
                        active ? 'bg-night-2 text-white' : 'text-white/60 hover:bg-night-2/60 hover:text-white',
                      )}
                    >
                      {active && <span className="absolute top-2 bottom-2 left-0 w-[3px] rounded-r bg-signal" />}
                      <span className={active ? 'text-signal' : 'text-white/45 group-hover:text-white/80'}>{it.icon}</span>
                      <span className="hidden flex-1 truncate xl:block">{it.label}</span>
                      {!!badges[it.key] && <span className={cx('absolute top-0.5 right-0.5 rounded-full px-1.5 xl:static font-mono text-[10px] leading-[18px]', it.key === 'matching' ? 'bg-signal/15 text-signal' : 'bg-white/10 text-white/80')}>{badges[it.key]}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="m-3 hidden rounded-xl border border-night-line bg-night-2 p-3 xl:block">
          <div className="flex items-center gap-2 text-[12px] font-medium">
            <Sparkles size={14} className="text-signal" /> Human-in-the-loop
          </div>
          <p className="mt-1 text-[11.5px] leading-snug text-white/50">{reviewCount ? `${reviewCount} uncertain matches are waiting for a reviewer.` : 'All uncertain matches have been reviewed.'}</p>
          {!!reviewCount && (
            <button onClick={() => navigate('matching', { filter: 'review' })} className="mt-2 text-[12px] font-medium text-signal hover:underline">
              Open review queue →
            </button>
          )}
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="scroll-thin flex-1 overflow-y-auto">
          <div key={route.page} className="mx-auto max-w-[1360px] px-5 pt-7 pb-16 xl:px-8">
            {children}
          </div>
        </main>
      </div>
      <Toasts />
    </div>
  )
}

function Topbar() {
  const { navigate, notifications, markRead, markAllRead } = useStore()
  const [openN, setOpenN] = useState(false)
  const unread = notifications.filter((n) => !n.read)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const on = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpenN(false)
    document.addEventListener('mousedown', on)
    return () => document.removeEventListener('mousedown', on)
  }, [])

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-line bg-paper/80 px-5 backdrop-blur xl:px-8">
      <GlobalSearch />
      <div className="ml-auto flex items-center gap-2">
        <div ref={ref} className="relative">
          <button onClick={() => setOpenN((o) => !o)} className="relative grid size-9 place-items-center rounded-lg text-ink-2 hover:bg-sunken" aria-label="Notifications">
            <Bell size={17} />
            {!!unread.length && <span className="absolute top-2 right-2 size-2 rounded-full bg-bad ring-2 ring-paper" />}
          </button>
          {openN && (
            <div className="animate-rise absolute right-0 z-40 mt-2 w-[360px] overflow-hidden rounded-xl border border-line bg-surface shadow-xl">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <span className="text-[13px] font-semibold">Notifications</span>
                <button onClick={markAllRead} className="text-[12px] text-accent hover:underline">
                  Mark all read
                </button>
              </div>
              <div className="max-h-[360px] overflow-y-auto">
                {notifications.slice(0, 6).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      markRead(n.id)
                      setOpenN(false)
                      if (n.link) navigate(n.link)
                    }}
                    className="flex w-full gap-3 border-b border-line px-4 py-3 text-left last:border-0 hover:bg-paper"
                  >
                    <span className={cx('mt-1.5 size-2 shrink-0 rounded-full', n.read ? 'bg-transparent' : n.kind === 'upload-failed' ? 'bg-bad' : n.kind === 'review' ? 'bg-warn' : 'bg-accent')} />
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium">{n.title}</span>
                      <span className="block text-[12px] text-muted">{n.body}</span>
                      <span className="mt-1 block font-mono text-[10.5px] text-faint">{timeAgo(n.at)}</span>
                    </span>
                  </button>
                ))}
              </div>
              <button onClick={() => (setOpenN(false), navigate('notifications'))} className="w-full border-t border-line py-2.5 text-[12px] font-medium text-ink-2 hover:bg-paper">
                View all
              </button>
            </div>
          )}
        </div>
        <button onClick={() => navigate('profile')} className="flex items-center gap-2.5 rounded-lg py-1 pr-2 pl-1 hover:bg-sunken">
          <span className="grid size-7 place-items-center rounded-full bg-ink text-[11px] font-semibold text-signal">{CURRENT_USER.initials}</span>
          <span className="hidden text-left leading-tight lg:block">
            <span className="block text-[12.5px] font-medium whitespace-nowrap">{CURRENT_USER.name}</span>
            <span className="block text-[11px] text-muted">Admin</span>
          </span>
        </button>
      </div>
    </header>
  )
}

function GlobalSearch() {
  const { listings, suppliers, clusters, navigate } = useStore()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrap = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }
    const click = (e: MouseEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false)
    window.addEventListener('keydown', key)
    document.addEventListener('mousedown', click)
    return () => {
      window.removeEventListener('keydown', key)
      document.removeEventListener('mousedown', click)
    }
  }, [])

  const results = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return null
    const props = clusters
      .filter((c) => c.some((l) => l.name.toLowerCase().includes(t) || l.city.toLowerCase().includes(t)))
      .slice(0, 4)
      .map((c) => ({ name: [...c].sort((a, b) => b.description.length - a.description.length)[0].name, city: c[0].city, sources: c.length, ids: c.map((l) => l.id) }))
    const sups = suppliers.filter((s) => s.name.toLowerCase().includes(t) || s.id.toLowerCase().includes(t) || s.type.toLowerCase().includes(t)).slice(0, 3)
    const ls = listings.filter((l) => l.name.toLowerCase().includes(t) || l.id.toLowerCase().includes(t) || l.address.toLowerCase().includes(t)).slice(0, 5)
    return { props, sups, ls }
  }, [q, listings, suppliers, clusters])

  const go = (fn: () => void) => {
    fn()
    setOpen(false)
    setQ('')
  }
  const empty = results && !results.props.length && !results.sups.length && !results.ls.length

  return (
    <div ref={wrap} className="relative w-full max-w-[460px]">
      <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => (setQ(e.target.value), setOpen(true))}
        onFocus={() => setOpen(true)}
        placeholder="Search properties, suppliers, listings…"
        className="h-9 w-full rounded-lg border border-line bg-surface pr-16 pl-9 text-[13px] outline-none placeholder:text-faint focus:border-accent focus:ring-3 focus:ring-accent/15"
      />
      {q ? (
        <button onClick={() => setQ('')} className="absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded text-faint hover:bg-sunken" aria-label="Clear search">
          <X size={14} />
        </button>
      ) : (
        <span className="pointer-events-none absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-0.5 rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-faint">
          <Command size={10} />K
        </span>
      )}
      {open && results && (
        <div className="animate-rise absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-xl">
          {empty && <div className="px-4 py-6 text-center text-[13px] text-muted">No results for “{q}”</div>}
          {!!results.props.length && <Group label="Unified properties" />}
          {results.props.map((p) => (
            <Row key={p.ids.join()} onClick={() => go(() => navigate('matching', { q: p.name }))} title={p.name} meta={`${p.city} · ${p.sources} supplier listing${p.sources > 1 ? 's' : ''}`} />
          ))}
          {!!results.sups.length && <Group label="Suppliers" />}
          {results.sups.map((s) => (
            <Row key={s.id} onClick={() => go(() => navigate('suppliers', { id: s.id }))} title={<SupplierChip code={s.code} color={s.color} name={s.name} size="sm" />} meta={`${s.id} · ${s.type}`} />
          ))}
          {!!results.ls.length && <Group label="Listings" />}
          {results.ls.map((l) => {
            const s = suppliers.find((x) => x.id === l.supplierId)
            return <Row key={l.id} onClick={() => go(() => navigate('suppliers', { id: l.supplierId, listing: l.id }))} title={l.name} meta={`${l.id} · ${s?.name ?? ''} · ${l.city}`} />
          })}
        </div>
      )}
    </div>
  )
}

const Group = ({ label }: { label: string }) => <div className="px-4 pt-2.5 pb-1 font-mono text-[10px] tracking-[0.14em] text-faint uppercase">{label}</div>
const Row = ({ title, meta, onClick }: { title: ReactNode; meta: string; onClick: () => void }) => (
  <button onClick={onClick} className="flex w-full flex-col items-start px-4 py-2 text-left hover:bg-paper">
    <span className="text-[13px] font-medium">{title}</span>
    <span className="text-[11.5px] text-muted">{meta}</span>
  </button>
)

function Toasts() {
  const { toasts } = useStore()
  return (
    <div className="pointer-events-none fixed right-6 bottom-6 z-[60] flex flex-col items-end gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="animate-rise flex items-center gap-2.5 rounded-lg bg-ink px-4 py-2.5 text-[13px] text-white shadow-xl">
          <span className={cx('size-2 rounded-full', t.tone === 'ok' ? 'bg-signal' : t.tone === 'warn' ? 'bg-amber-400' : 'bg-rose-400')} />
          {t.text}
        </div>
      ))}
    </div>
  )
}
