import { AlertTriangle, Building2, Copy, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Ring } from '../components/charts'
import { Badge, Button, Card, cx, Empty, Field, fmtDate, inputCls, Modal, PageHeader, SupplierChip, Tabs, td, th, timeAgo, type Tone } from '../components/ui'
import { qualityLabel, supplierStats, useStore } from '../store'
import type { IntegrationStatus, Supplier } from '../types'

const INTEGRATION_TONE: Record<IntegrationStatus, Tone> = { 'Live API': 'green', 'Batch SFTP': 'blue', 'Manual Upload': 'gray', Paused: 'red' }
const COLORS = ['#4F46E5', '#0E9F6E', '#E8590C', '#0891B2', '#C026D3', '#B45309', '#DB2777', '#0F766E']

export default function Suppliers() {
  const store = useStore()
  const { suppliers, listings, matches, clusters, datasets, route, navigate } = store
  const selectedId = route.params.id ?? suppliers[0]?.id
  const selected = suppliers.find((s) => s.id === selectedId)
  const [editing, setEditing] = useState<Supplier | 'new' | null>(null)
  const [removing, setRemoving] = useState<Supplier | null>(null)
  const [tab, setTab] = useState<'listings' | 'datasets' | 'quality'>(route.params.listing ? 'listings' : 'listings')

  useEffect(() => {
    if (route.params.listing) {
      setTab('listings')
      setTimeout(() => document.getElementById(`row-${route.params.listing}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 80)
    }
  }, [route.params.listing])

  return (
    <>
      <PageHeader
        eyebrow="Workspace · Supplier Management"
        title="Supplier directory"
        description="Every connected inventory source, its integration health and the quality of the data it sends."
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => setEditing('new')}>
            Add supplier
          </Button>
        }
      />

      <Card pad={false} className="mb-6">
        <table className="w-full">
          <thead className="border-b border-line bg-paper/60">
            <tr>
              <th className={th}>Supplier ID</th>
              <th className={th}>Supplier name</th>
              <th className={th}>Type</th>
              <th className={cx(th, 'text-right')}>Total listings</th>
              <th className={cx(th, 'text-right')}>Properties</th>
              <th className={th}>Data quality</th>
              <th className={th}>Integration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {suppliers.map((s) => {
              const st = supplierStats(s, listings, matches, clusters)
              const q = qualityLabel(st.quality)
              const active = s.id === selectedId
              return (
                <tr key={s.id} onClick={() => navigate('suppliers', { id: s.id })} className={cx('cursor-pointer transition-colors', active ? 'bg-accent-soft/50' : 'hover:bg-paper/70')}>
                  <td className={cx(td, 'font-mono text-[12px] text-muted')}>
                    <span className="flex items-center gap-2">
                      <span className={cx('h-5 w-[3px] rounded-full', active ? 'bg-accent' : 'bg-transparent')} />
                      {s.id}
                    </span>
                  </td>
                  <td className={td}>
                    <SupplierChip code={s.code} color={s.color} name={s.name} />
                  </td>
                  <td className={cx(td, 'text-ink-2')}>{s.type}</td>
                  <td className={cx(td, 'text-right font-mono tabular')}>{st.count}</td>
                  <td className={cx(td, 'text-right font-mono tabular')}>{st.properties}</td>
                  <td className={td}>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-sunken">
                        <div className="h-full rounded-full" style={{ width: `${st.quality}%`, background: `var(--color-${q.tone === 'green' ? 'ok' : q.tone === 'amber' ? 'warn' : q.tone === 'red' ? 'bad' : 'accent'})` }} />
                      </div>
                      <span className="font-mono text-[12px] tabular">{st.quality}</span>
                    </div>
                  </td>
                  <td className={td}>
                    <Badge tone={INTEGRATION_TONE[s.integration]} dot>
                      {s.integration}
                    </Badge>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!suppliers.length && <Empty icon={<Building2 size={18} />} title="No suppliers yet" action={<Button onClick={() => setEditing('new')}>Add supplier</Button>} />}
      </Card>

      {selected && (() => {
        const st = supplierStats(selected, listings, matches, clusters)
        const ds = datasets.filter((d) => d.supplierId === selected.id).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
        const dupPairs = matches.filter((m) => m.sameSupplier && m.a.supplierId === selected.id && m.status === 'duplicate')
        const q = qualityLabel(st.quality)
        return (
          <div key={selected.id} className="animate-rise grid grid-cols-12 gap-5">
            <div className="col-span-12 xl:col-span-4 space-y-5">
              <Card>
                <div className="flex items-start justify-between">
                  <SupplierChip code={selected.code} color={selected.color} />
                  <Badge tone={INTEGRATION_TONE[selected.integration]} dot>
                    {selected.integration}
                  </Badge>
                </div>
                <h2 className="mt-4 text-[20px] font-semibold tracking-tight">{selected.name}</h2>
                <div className="text-[13px] text-muted">
                  {selected.type} · {selected.region}
                </div>
                <dl className="mt-5 space-y-2.5 text-[12.5px]">
                  {[
                    ['Supplier ID', selected.id],
                    ['Account contact', selected.contact],
                    ['Feed email', selected.email],
                    ['Partner since', fmtDate(selected.since)],
                    ['Reliability', `${selected.reliability}% fulfilment`],
                    ['Last data update', ds[0] ? `${fmtDate(ds[0].uploadedAt)} (${timeAgo(ds[0].uploadedAt)})` : '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <dt className="text-muted">{k}</dt>
                      <dd className="truncate text-right font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Button icon={<Upload size={14} />} onClick={() => navigate('studio', { supplier: selected.id })}>
                    Upload dataset
                  </Button>
                  <Button icon={<Pencil size={14} />} onClick={() => setEditing(selected)}>
                    Update
                  </Button>
                  <Button variant="danger" className="col-span-2" icon={<Trash2 size={14} />} onClick={() => setRemoving(selected)}>
                    Remove supplier
                  </Button>
                </div>
              </Card>

              <Card title="Data completeness">
                <div className="flex items-center gap-5">
                  <Ring value={st.completeness} size={84} stroke={8} color={`var(--color-${q.tone === 'green' ? 'ok' : q.tone === 'amber' ? 'warn' : q.tone === 'red' ? 'bad' : 'accent'})`}>
                    <span className="font-mono text-[18px] font-medium">{st.completeness}%</span>
                  </Ring>
                  <div className="text-[12.5px]">
                    <div>
                      Quality score <span className="font-mono font-semibold">{st.quality}</span> <Badge tone={q.tone}>{q.label}</Badge>
                    </div>
                    <div className="mt-1.5 text-muted">{st.missing.length ? `${st.missing.length} attributes have gaps` : 'All tracked attributes populated'}</div>
                    <div className="mt-0.5 text-muted">
                      {st.dupes} duplicate record{st.dupes === 1 ? '' : 's'}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <Card
              className="col-span-12 xl:col-span-8"
              pad={false}
              title="Supplier data"
              actions={
                <Tabs
                  value={tab}
                  onChange={setTab}
                  items={[
                    { value: 'listings', label: 'Listings', count: st.count },
                    { value: 'datasets', label: 'Datasets', count: ds.length },
                    { value: 'quality', label: 'Missing & duplicates', count: st.missing.length + dupPairs.length },
                  ]}
                />
              }
            >
              {tab === 'listings' && (
                <div className="max-h-[520px] overflow-auto scroll-thin">
                  <table className="w-full">
                    <thead className="sticky top-0 border-b border-line bg-surface">
                      <tr>
                        <th className={th}>ID</th>
                        <th className={th}>Property</th>
                        <th className={th}>City</th>
                        <th className={th}>Stars</th>
                        <th className={th}>Unified with</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {st.listings.map((l) => {
                        const cluster = clusters.find((c) => c.some((x) => x.id === l.id)) ?? []
                        const others = cluster.filter((x) => x.id !== l.id)
                        return (
                          <tr key={l.id} id={`row-${l.id}`} className={cx(route.params.listing === l.id && 'bg-signal/25')}>
                            <td className={cx(td, 'font-mono text-[12px] text-muted')}>{l.id}</td>
                            <td className={td}>
                              <div className="font-medium">{l.name}</div>
                              <div className="max-w-[300px] truncate text-[11.5px] text-muted">{l.address}</div>
                            </td>
                            <td className={cx(td, 'text-ink-2')}>{l.city}</td>
                            <td className={cx(td, 'font-mono text-[12px]')}>{l.stars ? '★'.repeat(l.stars) : <span className="text-faint">—</span>}</td>
                            <td className={td}>
                              {others.length ? (
                                <div className="flex -space-x-1">
                                  {others.map((o) => {
                                    const s = suppliers.find((x) => x.id === o.supplierId)
                                    return s ? (
                                      <span key={o.id} title={`${o.name} (${s.name})`} className="rounded-md ring-2 ring-surface">
                                        <SupplierChip code={s.code} color={s.color} size="sm" />
                                      </span>
                                    ) : null
                                  })}
                                </div>
                              ) : (
                                <span className="text-[12px] text-faint">Unique</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {!st.count && <Empty icon={<Building2 size={18} />} title="No listings" body="Upload a dataset for this supplier to populate listings." />}
                </div>
              )}
              {tab === 'datasets' && (
                <table className="w-full">
                  <thead className="border-b border-line">
                    <tr>
                      <th className={th}>Dataset</th>
                      <th className={th}>Format</th>
                      <th className={th}>Uploaded</th>
                      <th className={cx(th, 'text-right')}>Records</th>
                      <th className={th}>Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {ds.map((d) => (
                      <tr key={d.id}>
                        <td className={td}>
                          <div className="font-medium">{d.name}</div>
                          <div className="font-mono text-[11px] text-muted">
                            {d.id} · {d.fileName}
                          </div>
                        </td>
                        <td className={td}>
                          <Badge>{d.format}</Badge>
                        </td>
                        <td className={cx(td, 'text-muted')}>{fmtDate(d.uploadedAt)}</td>
                        <td className={cx(td, 'text-right font-mono tabular')}>
                          {d.valid}/{d.records}
                        </td>
                        <td className={td}>
                          <Badge tone={d.status === 'Processed' ? 'green' : d.status === 'Failed' ? 'red' : 'amber'} dot>
                            {d.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {tab === 'quality' && (
                <div className="grid grid-cols-2 divide-x divide-line">
                  <div className="p-5">
                    <div className="mb-3 flex items-center gap-2 text-[13px] font-medium">
                      <AlertTriangle size={14} className="text-warn" /> Missing attributes
                    </div>
                    {st.missing.length ? (
                      <div className="space-y-3">
                        {st.missing.map((m) => (
                          <div key={m.label}>
                            <div className="mb-1 flex justify-between text-[12px]">
                              <span>{m.label}</span>
                              <span className="font-mono text-muted">
                                {m.count}/{st.count} missing
                              </span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-sunken">
                              <div className="h-full rounded-full bg-warn" style={{ width: `${(m.count / st.count) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[12.5px] text-muted">No gaps detected.</p>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="mb-3 flex items-center gap-2 text-[13px] font-medium">
                      <Copy size={14} className="text-dup" /> Duplicate records
                    </div>
                    {dupPairs.length ? (
                      <div className="space-y-2">
                        {dupPairs.map((p) => (
                          <button key={p.id} onClick={() => navigate('matching', { pair: p.id })} className="w-full rounded-lg border border-line p-3 text-left hover:bg-paper">
                            <div className="text-[12.5px] font-medium">{p.a.name}</div>
                            <div className="text-[12.5px] font-medium">{p.b.name}</div>
                            <div className="mt-1 font-mono text-[11px] text-dup">
                              {p.a.id} ≈ {p.b.id} · {(p.evidence.overall * 100).toFixed(1)}%
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[12.5px] text-muted">No duplicates within this supplier.</p>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </div>
        )
      })()}

      <SupplierForm
        open={editing != null}
        initial={editing === 'new' ? null : editing}
        usedCodes={suppliers.map((s) => s.code)}
        onClose={() => setEditing(null)}
        onSave={(v) => {
          if (editing === 'new') {
            store.addSupplier(v)
            navigate('suppliers', { id: `SUP-${v.code}` })
          } else if (editing) store.updateSupplier(editing.id, v)
          setEditing(null)
        }}
      />
      <Modal
        open={!!removing}
        onClose={() => setRemoving(null)}
        title="Remove supplier"
        footer={
          <>
            <Button onClick={() => setRemoving(null)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                store.removeSupplier(removing!.id)
                setRemoving(null)
                navigate('suppliers')
              }}
            >
              Remove {removing?.name}
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-ink-2">
          This removes <b>{removing?.name}</b> together with its {listings.filter((l) => l.supplierId === removing?.id).length} listings and{' '}
          {datasets.filter((d) => d.supplierId === removing?.id).length} datasets from the workspace. Matches involving this supplier will be recalculated. The action is recorded in the audit trail.
        </p>
      </Modal>
    </>
  )
}

function SupplierForm({ open, initial, usedCodes, onClose, onSave }: { open: boolean; initial: Supplier | null; usedCodes: string[]; onClose: () => void; onSave: (v: Omit<Supplier, 'id'>) => void }) {
  const nextCode = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').find((c) => !usedCodes.includes(c)) ?? 'Z'
  const blank: Omit<Supplier, 'id'> = { code: nextCode, name: '', type: 'Bedbank', integration: 'Manual Upload', region: 'India', contact: '', email: '', reliability: 80, since: new Date().toISOString().slice(0, 10), color: COLORS[usedCodes.length % COLORS.length] }
  const [v, setV] = useState(blank)
  useEffect(() => {
    if (open) setV(initial ? { ...initial } : blank)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial])
  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => setV((p) => ({ ...p, [k]: val }))
  const valid = v.name.trim().length > 1

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? `Update ${initial.name}` : 'Add supplier'}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!valid} onClick={() => onSave(v)}>
            {initial ? 'Save changes' : 'Add supplier'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Field label="Supplier name">
            <input className={inputCls} value={v.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Coral Bedbank" autoFocus />
          </Field>
        </div>
        <Field label="Supplier type">
          <select className={inputCls} value={v.type} onChange={(e) => set('type', e.target.value)}>
            {['Bedbank', 'Channel Manager', 'Direct Contracts', 'OTA Aggregator', 'Wholesaler', 'Sightseeing Provider'].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Integration">
          <select className={inputCls} value={v.integration} onChange={(e) => set('integration', e.target.value as IntegrationStatus)}>
            {(['Live API', 'Batch SFTP', 'Manual Upload', 'Paused'] as const).map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Region">
          <input className={inputCls} value={v.region} onChange={(e) => set('region', e.target.value)} />
        </Field>
        <Field label="Reliability (%)" hint="Historical booking fulfilment rate">
          <input type="number" min={0} max={100} className={inputCls} value={v.reliability} onChange={(e) => set('reliability', Math.max(0, Math.min(100, Number(e.target.value))))} />
        </Field>
        <Field label="Account contact">
          <input className={inputCls} value={v.contact} onChange={(e) => set('contact', e.target.value)} />
        </Field>
        <Field label="Feed email">
          <input className={inputCls} value={v.email} onChange={(e) => set('email', e.target.value)} />
        </Field>
        <div className="col-span-2">
          <Field label="Colour">
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button key={c} onClick={() => set('color', c)} className={cx('size-7 rounded-md transition-transform', v.color === c && 'scale-110 ring-2 ring-ink ring-offset-2')} style={{ background: c }} aria-label={`Colour ${c}`} />
              ))}
            </div>
          </Field>
        </div>
      </div>
    </Modal>
  )
}
