import { Check, CircleDot, Flag, GitMerge, Link2, MapPin, Phone, Play, RotateCcw, Search, Sparkles, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Ring } from '../components/charts'
import { Badge, Button, Card, cx, Empty, Field, inputCls, Modal, PageHeader, scoreTone, Stat, SupplierChip, Tabs, td, th, timeAgo, TONE_FG, type Tone } from '../components/ui'
import { EVIDENCE_WEIGHTS, scorePair } from '../lib/matching'
import { clean } from '../lib/similarity'
import { STATUS_META } from '../lib/meta'
import { useStore } from '../store'
import type { Listing, MatchPair } from '../types'

type Filter = 'all' | 'matched' | 'review' | 'duplicate' | 'unmatched' | 'rejected'

export default function Matching() {
  const store = useStore()
  const { matches, listings, suppliers, settings, route, navigate, lastMatchRun } = store
  const [filter, setFilter] = useState<Filter>((route.params.filter as Filter) ?? 'all')
  const [q, setQ] = useState(route.params.q ?? '')
  const [selectedId, setSelectedId] = useState<string | null>(route.params.pair ?? null)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [manualOpen, setManualOpen] = useState(false)

  const comparisons = useMemo(() => {
    const by = new Map<string, number>()
    listings.forEach((l) => {
      const k = clean(l.city).replace('bengaluru', 'bangalore').replace('new delhi', 'delhi')
      by.set(k, (by.get(k) ?? 0) + 1)
    })
    return [...by.values()].reduce((s, n) => s + (n * (n - 1)) / 2, 0)
  }, [listings])

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: matches.length, matched: 0, review: 0, duplicate: 0, unmatched: 0, rejected: 0 }
    matches.forEach((m) => c[m.status]++)
    return c
  }, [matches])

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase()
    return matches.filter((m) => (filter === 'all' || m.status === filter) && (!t || `${m.a.name} ${m.b.name} ${m.a.city} ${m.a.id} ${m.b.id}`.toLowerCase().includes(t)))
  }, [matches, filter, q])

  const selected = matches.find((m) => m.id === selectedId) ?? rows[0] ?? null

  function startRun() {
    setRunning(true)
    setProgress(0)
    const t0 = performance.now()
    const tick = () => {
      const p = Math.min((performance.now() - t0) / 1600, 1)
      setProgress(p)
      if (p < 1) requestAnimationFrame(tick)
      else {
        store.runMatching()
        setRunning(false)
        store.toast('Matching run complete')
      }
    }
    requestAnimationFrame(tick)
  }

  useEffect(() => {
    if (route.params.run === '1') {
      startRun()
      navigate('matching')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sup = (id: string) => suppliers.find((s) => s.id === id)

  return (
    <>
      <PageHeader
        eyebrow="Intelligence · AI Matching"
        title="Find the same property across suppliers"
        description={`Each listing is compared with every other listing in the same city on name, address, distance, description and attributes. Auto-match at ≥${settings.autoThreshold}%; human review between ${settings.reviewThreshold}% and ${settings.autoThreshold}%.`}
        actions={
          <>
            <Button icon={<Link2 size={14} />} onClick={() => setManualOpen(true)}>
              Manual match
            </Button>
            <Button variant="primary" icon={<Play size={14} />} onClick={startRun} disabled={running}>
              {running ? 'Matching…' : 'Start matching'}
            </Button>
          </>
        }
      />

      {running && (
        <div className="animate-rise relative mb-5 overflow-hidden rounded-xl border border-night-line bg-night px-5 py-4 text-white">
          <div className="flex items-center justify-between font-mono text-[12px]">
            <span className="flex items-center gap-2">
              <Sparkles size={14} className="text-signal" />
              {progress < 0.3 ? 'Blocking candidates by city…' : progress < 0.65 ? `Scoring ${comparisons} listing pairs…` : progress < 0.9 ? 'Applying geographic veto and thresholds…' : 'Clustering unified properties…'}
            </span>
            <span className="text-white/60">{Math.round(progress * 100)}%</span>
          </div>
          <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-night-line">
            <div className="h-full rounded-full bg-signal" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      )}

      <div className="mb-6 grid grid-cols-3 gap-3 xl:grid-cols-5">
        <Stat label="Total records compared" value={comparisons} sub={`${listings.length} listings · last run ${timeAgo(lastMatchRun)}`} />
        <Stat label="Matched properties" value={counts.matched} sub="auto + human confirmed" tone="green" icon={<Check size={13} />} />
        <Stat label="Potential duplicates" value={counts.duplicate} sub="same supplier, same property" tone="violet" icon={<GitMerge size={13} />} />
        <Stat label="Unmatched candidates" value={counts.unmatched} sub="look-alikes below threshold" tone="red" icon={<X size={13} />} />
        <Stat label="Requires verification" value={counts.review} sub={<button className="text-accent hover:underline" onClick={() => setFilter('review')}>Show queue →</button>} tone="amber" icon={<Flag size={13} />} />
      </div>

      <div className="grid grid-cols-12 items-start gap-5">
        <Card className="col-span-12 xl:col-span-7" pad={false}>
          <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
            <Tabs
              value={filter}
              onChange={setFilter}
              items={(['all', 'matched', 'review', 'duplicate', 'unmatched', 'rejected'] as Filter[]).map((f) => ({ value: f, label: f === 'all' ? 'All' : STATUS_META[f].label, count: counts[f] }))}
            />
            <div className="relative ml-auto">
              <Search size={14} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-faint" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter pairs" className={cx(inputCls, 'h-8 w-44 pl-8 text-[12px]')} />
            </div>
          </div>
          <div className="max-h-[720px] overflow-auto scroll-thin">
            <table className="w-full">
              <thead className="sticky top-0 z-10 border-b border-line bg-surface">
                <tr>
                  <th className={th}>Property A</th>
                  <th className={th}>Property B</th>
                  <th className={th}>Suppliers</th>
                  <th className={th}>Match score</th>
                  <th className={th}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((m) => {
                  const score = m.evidence.overall * 100
                  const sa = sup(m.a.supplierId)
                  const sb = sup(m.b.supplierId)
                  const active = selected?.id === m.id
                  return (
                    <tr key={m.id} onClick={() => setSelectedId(m.id)} className={cx('cursor-pointer transition-colors', active ? 'bg-accent-soft/60' : 'hover:bg-paper/70')}>
                      <td className={cx(td, 'max-w-[190px]')}>
                        <div className="truncate font-medium">{m.a.name}</div>
                        <div className="font-mono text-[10.5px] text-faint">{m.a.id}</div>
                      </td>
                      <td className={cx(td, 'max-w-[190px]')}>
                        <div className="truncate font-medium">{m.b.name}</div>
                        <div className="font-mono text-[10.5px] text-faint">{m.b.id}</div>
                      </td>
                      <td className={td}>
                        <div className="flex items-center gap-1">
                          {sa && <SupplierChip code={sa.code} color={sa.color} size="sm" />}
                          {sb && <SupplierChip code={sb.code} color={sb.color} size="sm" />}
                        </div>
                      </td>
                      <td className={td}>
                        <div className="flex items-center gap-2">
                          <span className="w-11 font-mono text-[12.5px] font-medium tabular" style={{ color: TONE_FG[scoreTone(score, settings.autoThreshold, settings.reviewThreshold)] }}>
                            {score.toFixed(0)}%
                          </span>
                          <div className="h-1 w-14 overflow-hidden rounded-full bg-sunken">
                            <div className="h-full rounded-full" style={{ width: `${score}%`, background: TONE_FG[scoreTone(score, settings.autoThreshold, settings.reviewThreshold)] }} />
                          </div>
                        </div>
                      </td>
                      <td className={td}>
                        <div className="flex items-center gap-1.5">
                          <Badge tone={STATUS_META[m.status].tone} dot>
                            {STATUS_META[m.status].label}
                          </Badge>
                          {m.decision && m.decision.status !== 'review' && <span title={`Verified by ${m.decision.by}`} className="grid size-4 place-items-center rounded-full bg-ink text-[9px] text-signal"><Check size={10} /></span>}
                          {m.manual && <span className="font-mono text-[10px] text-muted">manual</span>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!rows.length && <Empty icon={<Search size={18} />} title="No pairs in this view" body="Try another filter, or run matching again." />}
          </div>
        </Card>

        <div className="sticky top-4 col-span-12 xl:col-span-5">{selected ? <PairAnalysis key={selected.id} pair={selected} /> : <Card><Empty icon={<CircleDot size={18} />} title="Select a pair" body="Choose a row to see the full match analysis." /></Card>}</div>
      </div>

      <ManualMatchModal open={manualOpen} onClose={() => setManualOpen(false)} onLinked={(id) => setSelectedId(id)} />
    </>
  )
}

function PairAnalysis({ pair }: { pair: MatchPair }) {
  const store = useStore()
  const { suppliers, settings } = store
  const [note, setNote] = useState('')
  const [showEvidence, setShowEvidence] = useState(true)
  const ev = pair.evidence
  const score = ev.overall * 100
  const tone = scoreTone(score, settings.autoThreshold, settings.reviewThreshold)
  const sa = suppliers.find((s) => s.id === pair.a.supplierId)
  const sb = suppliers.find((s) => s.id === pair.b.supplierId)

  const evidence: { label: string; value: number | null; weight: number; detail: string }[] = [
    { label: 'Name similarity', value: ev.name, weight: EVIDENCE_WEIGHTS.name, detail: 'Token-sorted Jaro-Winkler + brand-core overlap' },
    { label: 'Address similarity', value: ev.address, weight: EVIDENCE_WEIGHTS.address, detail: 'Abbreviation-expanded token overlap' },
    { label: 'Geographic proximity', value: ev.geo, weight: EVIDENCE_WEIGHTS.geo, detail: ev.distance == null ? 'Coordinates missing; weight redistributed' : `${fmtDist(ev.distance)} apart` },
    { label: 'Description similarity', value: ev.description, weight: EVIDENCE_WEIGHTS.description, detail: ev.description == null ? 'Description missing; weight redistributed' : 'Keyword Jaccard overlap' },
    { label: 'Attribute similarity', value: ev.attributes, weight: EVIDENCE_WEIGHTS.attributes, detail: 'Amenities + star rating' },
  ]

  const reasons = explain(pair)

  return (
    <Card pad={false} className="animate-rise overflow-hidden">
      <div className="flex items-center gap-4 border-b border-line px-5 py-4">
        <Ring value={score} size={58} stroke={5} color={TONE_FG[tone]}>
          <span className="font-mono text-[14px] font-semibold">{score.toFixed(0)}</span>
        </Ring>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[10.5px] tracking-[0.12em] text-muted uppercase">Overall match confidence</div>
          <div className="mt-1 flex items-center gap-2">
            <Badge tone={STATUS_META[pair.status].tone} dot>
              {STATUS_META[pair.status].label}
            </Badge>
            {pair.sameSupplier && <Badge tone="violet">Same supplier</Badge>}
            {pair.lowConfidence && pair.status === 'review' && <Badge tone="amber">Low confidence</Badge>}
          </div>
          {pair.decision && (
            <div className="mt-1 text-[11.5px] text-muted">
              {pair.decision.status === 'confirmed' ? 'Confirmed' : pair.decision.status === 'rejected' ? 'Rejected' : 'Flagged'} by {pair.decision.by} · {timeAgo(pair.decision.at)}
            </div>
          )}
        </div>
      </div>

      {/* Side by side */}
      <div className="grid grid-cols-2 divide-x divide-line border-b border-line">
        {[pair.a, pair.b].map((l, i) => {
          const s = i === 0 ? sa : sb
          return (
            <div key={l.id} className="space-y-3 p-4 text-[12.5px]">
              <div className="flex items-center justify-between">
                {s && <SupplierChip code={s.code} color={s.color} name={s.name} size="sm" />}
                <span className="font-mono text-[10.5px] text-faint">{l.id}</span>
              </div>
              <div className="text-[14px] leading-snug font-semibold">{l.name}</div>
              <Attr icon={<MapPin size={12} />} label="Address" value={l.address || '—'} />
              <Attr icon={<CircleDot size={12} />} label="Coordinates" value={l.lat != null ? `${l.lat.toFixed(4)}, ${l.lng!.toFixed(4)}` : 'Not provided'} mono />
              <Attr label="Description" value={l.description || 'Not provided'} />
              <div>
                <div className="mb-1 text-[11px] text-muted">Amenities</div>
                <div className="flex flex-wrap gap-1">
                  {l.amenities.length ? l.amenities.map((a) => <span key={a} className="rounded bg-sunken px-1.5 py-0.5 text-[11px]">{a}</span>) : <span className="text-faint">None listed</span>}
                </div>
              </div>
              <Attr icon={<Phone size={12} />} label="Contact" value={l.phone ?? 'Not provided'} mono />
            </div>
          )
        })}
      </div>

      {/* Evidence */}
      <div className="border-b border-line px-5 py-4">
        <button onClick={() => setShowEvidence((v) => !v)} className="mb-3 flex w-full items-center justify-between text-[13px] font-semibold">
          Matching evidence <span className="text-[12px] font-normal text-accent">{showEvidence ? 'Hide' : 'View matching evidence'}</span>
        </button>
        {showEvidence && (
          <>
            <div className="space-y-3">
              {evidence.map((e) => (
                <div key={e.label}>
                  <div className="mb-1 flex items-baseline justify-between text-[12px]">
                    <span>
                      {e.label} <span className="font-mono text-[10.5px] text-faint">×{e.weight.toFixed(2)}</span>
                    </span>
                    <span className="font-mono tabular">{e.value == null ? 'n/a' : `${(e.value * 100).toFixed(0)}%`}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-sunken">
                    {e.value != null && <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${e.value * 100}%`, background: TONE_FG[scoreTone(e.value * 100, 80, 50)] }} />}
                  </div>
                  <div className="mt-0.5 text-[10.5px] text-faint">{e.detail}</div>
                </div>
              ))}
            </div>
            {ev.distance != null && <ProximityMap distance={ev.distance} />}
            <ul className="mt-4 space-y-1.5 rounded-lg bg-paper p-3">
              {reasons.map((r, i) => (
                <li key={i} className="flex gap-2 text-[12px] leading-snug">
                  <span className={cx('mt-1.5 size-1.5 shrink-0 rounded-full', r.pos ? 'bg-ok' : 'bg-bad')} />
                  {r.text}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Verification */}
      <div className="space-y-3 px-5 py-4">
        <div className="text-[13px] font-semibold">Human verification</div>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note for the audit trail" className={cx(inputCls, 'text-[12.5px]')} />
        <div className="grid grid-cols-3 gap-2">
          <Button variant="primary" icon={<Check size={14} />} onClick={() => store.decide(pair, 'confirmed', note)} disabled={pair.decision?.status === 'confirmed'}>
            Confirm
          </Button>
          <Button variant="danger" icon={<X size={14} />} onClick={() => store.decide(pair, 'rejected', note)} disabled={pair.decision?.status === 'rejected'}>
            Reject
          </Button>
          <Button icon={<Flag size={14} />} onClick={() => store.decide(pair, 'review', note)} disabled={pair.decision?.status === 'review'}>
            Review
          </Button>
        </div>
        {pair.decision && (
          <button onClick={() => store.undoDecision(pair)} className="flex items-center gap-1.5 text-[12px] text-muted hover:text-ink">
            <RotateCcw size={12} /> Revert to AI decision ({STATUS_META[pair.autoStatus].label})
          </button>
        )}
      </div>
    </Card>
  )
}

function Attr({ label, value, icon, mono }: { label: string; value: string; icon?: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div className="mb-0.5 flex items-center gap-1 text-[11px] text-muted">
        {icon}
        {label}
      </div>
      <div className={cx('leading-snug text-ink-2', mono && 'font-mono text-[11.5px]')}>{value}</div>
    </div>
  )
}

function fmtDist(m: number) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`
}

function ProximityMap({ distance }: { distance: number }) {
  // Log-scaled schematic: 150m match radius ring, second pin placed by distance.
  const scale = (d: number) => Math.min(110, 18 + Math.log10(1 + d / 10) * 34)
  const x = scale(distance)
  const r = scale(150)
  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-line bg-[radial-gradient(circle,_var(--color-line)_1px,_transparent_1px)] [background-size:14px_14px]">
      <svg viewBox="0 0 300 100" className="h-[96px] w-full">
        <circle cx="80" cy="50" r={r} fill="var(--color-ok)" fillOpacity="0.08" stroke="var(--color-ok)" strokeDasharray="3 3" />
        <line x1="80" y1="50" x2={80 + x} y2="50" stroke="var(--color-ink)" strokeWidth="1" strokeDasharray="2 2" />
        <circle cx="80" cy="50" r="5" fill="var(--color-ink)" />
        <circle cx={80 + x} cy="50" r="5" fill={distance > 1500 ? 'var(--color-bad)' : 'var(--color-accent)'} />
        <text x={80 + x / 2} y="40" textAnchor="middle" className="fill-ink font-mono text-[10px]">
          {fmtDist(distance)}
        </text>
        <text x="80" y={50 + r + 11} textAnchor="middle" className="fill-ok font-mono text-[8.5px]">
          150 m match radius
        </text>
      </svg>
    </div>
  )
}

function explain(p: MatchPair) {
  const ev = p.evidence
  const out: { pos: boolean; text: string }[] = []
  if (ev.name >= 0.85) out.push({ pos: true, text: `Names are near-identical once word order and location words are ignored (${(ev.name * 100).toFixed(0)}%).` })
  else if (ev.name >= 0.6) out.push({ pos: true, text: `Names share the same brand core but differ in wording (${(ev.name * 100).toFixed(0)}%).` })
  else out.push({ pos: false, text: `Names point to different brands or properties (${(ev.name * 100).toFixed(0)}%).` })
  if (ev.distance != null) {
    if (ev.distance <= 150) out.push({ pos: true, text: `Coordinates are within ${Math.round(ev.distance)} m, consistent with a single building.` })
    else if (ev.distance <= 1500) out.push({ pos: false, text: `Listings are ${fmtDist(ev.distance)} apart, which suggests neighbouring but separate properties.` })
    else out.push({ pos: false, text: `Listings are ${fmtDist(ev.distance)} apart. The geographic veto caps the score.` })
  } else out.push({ pos: false, text: 'At least one supplier omitted coordinates, so location relies on address text only.' })
  if (ev.address >= 0.8) out.push({ pos: true, text: `Addresses agree after expanding abbreviations (${(ev.address * 100).toFixed(0)}%).` })
  else if (ev.address < 0.5) out.push({ pos: false, text: `Addresses have little overlap (${(ev.address * 100).toFixed(0)}%).` })
  if (p.a.stars && p.b.stars && p.a.stars !== p.b.stars) out.push({ pos: false, text: `Star ratings differ (${p.a.stars}★ vs ${p.b.stars}★).` })
  if (p.a.phone && p.b.phone && p.a.phone === p.b.phone) out.push({ pos: true, text: 'Both suppliers list the same phone number.' })
  if (p.sameSupplier && p.status === 'duplicate') out.push({ pos: true, text: 'Both records come from the same supplier: likely a duplicate listing to consolidate.' })
  return out
}

function ManualMatchModal({ open, onClose, onLinked }: { open: boolean; onClose: () => void; onLinked: (id: string) => void }) {
  const { listings, suppliers, manualMatch } = useStore()
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [note, setNote] = useState('')
  useEffect(() => {
    if (open) (setA(''), setB(''), setNote(''))
  }, [open])
  const la = listings.find((l) => l.id === a)
  const lb = listings.find((l) => l.id === b)
  const preview = la && lb ? scorePair(la, lb) : null
  const label = (l: Listing) => `${l.id} · ${l.name} (${suppliers.find((s) => s.id === l.supplierId)?.code ?? '?'}, ${l.city})`
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Manual matching"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!la || !lb || a === b}
            icon={<Link2 size={14} />}
            onClick={() => {
              manualMatch(la!, lb!, note)
              onLinked(a < b ? `${a}|${b}` : `${b}|${a}`)
              onClose()
            }}
          >
            Link records
          </Button>
        </>
      }
    >
      <p className="mb-4 text-[12.5px] text-muted">Connect two records the engine missed, for example after a supplier changed a property's name. Manual links are always treated as confirmed matches and recorded in the audit trail.</p>
      <div className="space-y-4">
        <Field label="Record A">
          <select className={inputCls} value={a} onChange={(e) => setA(e.target.value)}>
            <option value="">Select a listing…</option>
            {listings.map((l) => (
              <option key={l.id} value={l.id}>
                {label(l)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Record B">
          <select className={inputCls} value={b} onChange={(e) => setB(e.target.value)}>
            <option value="">Select a listing…</option>
            {listings
              .filter((l) => l.id !== a)
              .sort((x, y) => (la ? Number(y.city === la.city) - Number(x.city === la.city) : 0))
              .map((l) => (
                <option key={l.id} value={l.id}>
                  {label(l)}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Reason">
          <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Rebranded in 2024, confirmed with supplier" />
        </Field>
        {preview && (
          <div className="flex items-center justify-between rounded-lg bg-paper px-3 py-2.5 text-[12.5px]">
            <span className="text-muted">Engine confidence for this pair</span>
            <span className="font-mono font-medium">{(preview.overall * 100).toFixed(1)}%</span>
          </div>
        )}
      </div>
    </Modal>
  )
}
