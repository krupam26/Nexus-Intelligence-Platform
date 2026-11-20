import { ArrowRight, ArrowUpRight, Boxes, CheckCircle2, Copy, Database, GitCompareArrows, Hourglass, Layers, Scale, Upload, Users } from 'lucide-react'
import { Donut, Legend } from '../components/charts'
import { Badge, Card, cx, fmtDate, PageHeader, Stat, SupplierChip, td, th, timeAgo } from '../components/ui'
import { qualityLabel, supplierStats, useStore } from '../store'

export default function Overview() {
  const { suppliers, listings, matches, clusters, datasets, audit, navigate, lastMatchRun } = useStore()
  const multi = clusters.filter((c) => new Set(c.map((l) => l.supplierId)).size > 1)
  const review = matches.filter((m) => m.status === 'review')
  const dupes = matches.filter((m) => m.status === 'duplicate' && m.sameSupplier)
  const matchedPairs = matches.filter((m) => m.status === 'matched')
  const unmatchedRecords = clusters.filter((c) => c.length === 1).length
  const lowConf = matches.filter((m) => m.lowConfidence && m.status === 'review')

  const pipeline = [
    { label: 'Ingested', value: datasets.filter((d) => d.status === 'Processed').length, unit: 'datasets', page: 'studio' as const, icon: <Upload size={14} /> },
    { label: 'Normalized', value: listings.length, unit: 'listings', page: 'studio' as const, icon: <Database size={14} /> },
    { label: 'Matched', value: multi.length, unit: 'unified properties', page: 'matching' as const, icon: <GitCompareArrows size={14} /> },
    { label: 'Compared', value: 4, unit: 'properties at room level', page: 'equivalence' as const, icon: <Boxes size={14} /> },
    { label: 'Optimized', value: audit.filter((a) => a.category === 'optimization').length, unit: 'recommendations', page: 'optimization' as const, icon: <Scale size={14} /> },
  ]

  const activity = audit.slice(0, 7)

  return (
    <>
      <PageHeader
        eyebrow="Workspace · Overview"
        title="Supplier ecosystem at a glance"
        description={`${suppliers.length} suppliers feed ${listings.length} listings into one unified inventory. Last matching run ${timeAgo(lastMatchRun)}.`}
      />

      {/* Pipeline strip */}
      <div className="animate-rise mb-6 grid grid-cols-5 overflow-hidden rounded-xl border border-night-line bg-night text-white">
        {pipeline.map((p, i) => (
          <button key={p.label} onClick={() => navigate(p.page)} className={cx('group relative px-5 py-4 text-left transition-colors hover:bg-night-2', i > 0 && 'border-l border-night-line')}>
            <div className="flex items-center gap-2 font-mono text-[10.5px] tracking-[0.14em] text-white/45 uppercase">
              <span className="text-signal">{p.icon}</span>
              <span className="hidden xl:inline">{String(i + 1).padStart(2, '0')} · </span>{p.label}
            </div>
            <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2">
              <span className="font-mono text-[26px] leading-none font-medium tracking-tight">{p.value}</span>
              <span className="text-[11.5px] text-white/50">{p.unit}</span>
            </div>
            <ArrowUpRight size={14} className="absolute top-4 right-4 text-white/0 transition-colors group-hover:text-signal" />
          </button>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3 xl:grid-cols-6">
        <Stat label="Total suppliers" value={suppliers.length} sub={`${suppliers.filter((s) => s.integration !== 'Paused').length} active feeds`} icon={<Users size={13} />} />
        <Stat label="Supplier listings" value={listings.length} sub="across all feeds" icon={<Layers size={13} />} />
        <Stat label="Unique properties" value={clusters.length} sub={`${((1 - clusters.length / Math.max(listings.length, 1)) * 100).toFixed(0)}% inventory consolidated`} icon={<Boxes size={13} />} tone="blue" />
        <Stat label="Duplicate listings" value={dupes.length} sub="within the same supplier" icon={<Copy size={13} />} tone="violet" />
        <Stat label="Matched properties" value={multi.length} sub="sold by 2+ suppliers" icon={<CheckCircle2 size={13} />} tone="green" />
        <Stat label="Pending verification" value={review.length} sub={<button onClick={() => navigate('matching', { filter: 'review' })} className="text-accent hover:underline">Open review queue →</button>} icon={<Hourglass size={13} />} tone="amber" />
      </div>

      <div className="grid grid-cols-12 gap-5">
        <Card className="col-span-12 xl:col-span-8" title="Supplier overview" subtitle="Feed health and contribution by supplier" pad={false} actions={<button onClick={() => navigate('suppliers')} className="text-[12px] font-medium text-accent hover:underline">Manage suppliers</button>}>
          <table className="w-full">
            <thead className="border-b border-line bg-paper/60">
              <tr>
                <th className={th}>Supplier</th>
                <th className={cx(th, 'text-right')}>Listings</th>
                <th className={cx(th, 'text-right')}>Properties</th>
                <th className={th}>Data quality</th>
                <th className={th}>Last upload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {suppliers.map((s) => {
                const st = supplierStats(s, listings, matches, clusters)
                const q = qualityLabel(st.quality)
                const last = datasets.filter((d) => d.supplierId === s.id).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))[0]
                return (
                  <tr key={s.id} onClick={() => navigate('suppliers', { id: s.id })} className="cursor-pointer hover:bg-paper/70">
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        <SupplierChip code={s.code} color={s.color} />
                        <div>
                          <div className="font-medium">{s.name}</div>
                          <div className="text-[11.5px] text-muted">{s.type}</div>
                        </div>
                      </div>
                    </td>
                    <td className={cx(td, 'text-right font-mono tabular')}>{st.count}</td>
                    <td className={cx(td, 'text-right font-mono tabular')}>{st.properties}</td>
                    <td className={td}>
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 font-mono text-[12px] tabular">{st.quality}</span>
                        <Badge tone={q.tone} dot>
                          {q.label}
                        </Badge>
                      </div>
                    </td>
                    <td className={cx(td, 'text-muted')}>
                      {last ? (
                        <span className="flex items-center gap-2">
                          {fmtDate(last.uploadedAt)}
                          {last.status === 'Failed' && <Badge tone="red">Failed</Badge>}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>

        <Card className="col-span-12 xl:col-span-4" title="Matching overview" subtitle="Current state of the reconciliation engine">
          <div className="flex items-center gap-5">
            <Donut
              segments={[
                { label: 'Matched', value: matchedPairs.length, color: 'var(--color-ok)' },
                { label: 'Review', value: review.length, color: 'var(--color-warn)' },
                { label: 'Duplicate', value: dupes.length, color: 'var(--color-dup)' },
              ]}
              center={
                <div>
                  <div className="font-mono text-[24px] leading-none font-medium">{matchedPairs.length + review.length + dupes.length}</div>
                  <div className="mt-1 text-[10.5px] text-muted">candidate pairs</div>
                </div>
              }
            />
            <div className="flex-1">
              <Legend
                items={[
                  { label: 'Matched records', value: matchedPairs.length, color: 'var(--color-ok)' },
                  { label: 'Needs review', value: review.length, color: 'var(--color-warn)' },
                  { label: 'Potential duplicates', value: dupes.length, color: 'var(--color-dup)' },
                ]}
              />
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-paper p-3">
              <div className="text-[11.5px] text-muted">Unmatched records</div>
              <div className="mt-1 font-mono text-[18px]">{unmatchedRecords}</div>
            </div>
            <div className="rounded-lg bg-paper p-3">
              <div className="text-[11.5px] text-muted">Low-confidence</div>
              <div className="mt-1 font-mono text-[18px] text-warn">{lowConf.length}</div>
            </div>
          </div>
          <button onClick={() => navigate('matching')} className="mt-4 flex w-full items-center justify-between rounded-lg border border-line px-3 py-2.5 text-[12.5px] font-medium hover:bg-paper">
            Open AI Matching Intelligence <ArrowRight size={14} />
          </button>
        </Card>

        <Card className="col-span-12 xl:col-span-8" title="Recent activity" subtitle="Uploads, matching operations, verifications and optimization results" pad={false} actions={<button onClick={() => navigate('history', { tab: 'audit' })} className="text-[12px] font-medium text-accent hover:underline">Full audit trail</button>}>
          <ol className="divide-y divide-line">
            {activity.map((a) => (
              <li key={a.id} className="flex items-start gap-4 px-5 py-3">
                <span className={cx('mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg', { match: 'bg-ok-soft text-ok', dataset: 'bg-accent-soft text-accent', optimization: 'bg-signal/40 text-ink', supplier: 'bg-sunken text-ink-2', system: 'bg-sunken text-ink-2' }[a.category])}>
                  {{ match: <GitCompareArrows size={14} />, dataset: <Database size={14} />, optimization: <Scale size={14} />, supplier: <Users size={14} />, system: <Layers size={14} /> }[a.category]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px]">
                    <span className="font-medium">{a.action}</span> <span className="text-muted">·</span> <span className="text-ink-2">{a.target}</span>
                  </div>
                  {a.detail && <div className="mt-0.5 truncate text-[12px] text-muted">{a.detail}</div>}
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-[11px] text-faint">{timeAgo(a.at)}</div>
                  <div className="text-[11px] text-muted">{a.actor}</div>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <div className="col-span-12 xl:col-span-4 space-y-3">
          <div className="px-1 font-mono text-[10.5px] tracking-[0.14em] text-muted uppercase">Quick actions</div>
          {[
            { label: 'Upload supplier data', body: 'CSV, Excel or JSON with automatic column mapping', icon: <Upload size={16} />, go: () => navigate('studio') },
            { label: 'Start matching', body: 'Reconcile every listing across suppliers', icon: <GitCompareArrows size={16} />, go: () => navigate('matching', { run: '1' }) },
            { label: 'Compare products', body: 'Room, meal and policy-level equivalence', icon: <Boxes size={16} />, go: () => navigate('equivalence') },
            { label: 'Run optimization', body: 'Weighted multi-criteria supplier ranking', icon: <Scale size={16} />, go: () => navigate('optimization') },
          ].map((q, i) => (
            <button key={q.label} onClick={q.go} className={cx('group flex w-full items-center gap-3.5 rounded-xl border p-4 text-left transition-all hover:-translate-y-px hover:shadow-md', i === 0 ? 'border-ink bg-ink text-white' : 'border-line bg-surface')}>
              <span className={cx('grid size-9 place-items-center rounded-lg', i === 0 ? 'bg-signal text-ink' : 'bg-sunken text-ink-2')}>{q.icon}</span>
              <span className="flex-1">
                <span className="block text-[13.5px] font-medium">{q.label}</span>
                <span className={cx('block text-[12px]', i === 0 ? 'text-white/55' : 'text-muted')}>{q.body}</span>
              </span>
              <ArrowRight size={15} className="opacity-40 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
