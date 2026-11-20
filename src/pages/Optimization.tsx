import { ArrowDown, ArrowUp, Check, Crown, Download, Play, ShieldCheck, ShieldX, SlidersHorizontal, TrendingDown, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge, Button, Card, cx, downloadFile, Field, inputCls, inr, PageHeader, SupplierChip, td, th, toCSV } from '../components/ui'
import { OFFERS, PROPERTIES } from '../data/products'
import { equivalenceToCategory } from '../lib/equivalence'
import { effectivePrice, optimize, PARAMS, type Constraints, type ParamKey, type Ranked, type Weights } from '../lib/optimize'
import { useStore } from '../store'
import type { Offer } from '../types'

const PARAM_COLOR: Record<ParamKey, string> = {
  price: '#14161b',
  equivalence: '#4338ca',
  reliability: '#0e8a5f',
  flexibility: '#b45309',
  confidence: '#7c3aed',
  availability: '#0891b2',
}

const PRESETS: { label: string; w: Weights }[] = [
  { label: 'Price-led', w: { price: 40, equivalence: 30, flexibility: 20, reliability: 10, confidence: 0, availability: 0 } },
  { label: 'Balanced', w: { price: 25, equivalence: 20, reliability: 20, flexibility: 15, confidence: 10, availability: 10 } },
  { label: 'Flexible traveller', w: { price: 20, equivalence: 15, reliability: 10, flexibility: 45, confidence: 5, availability: 5 } },
  { label: 'Corporate', w: { price: 15, equivalence: 25, reliability: 30, flexibility: 15, confidence: 10, availability: 5 } },
]

export default function Optimization() {
  const { suppliers, matches, settings, logOptimization, toast } = useStore()
  const [propertyId, setPropertyId] = useState(PROPERTIES[0].id)
  const property = PROPERTIES.find((p) => p.id === propertyId)!
  const [categoryId, setCategoryId] = useState(property.categories[0].id)
  const category = property.categories.find((c) => c.id === categoryId) ?? property.categories[0]
  const [weights, setWeights] = useState<Weights>(PRESETS[0].w)
  const [constraints, setConstraints] = useState<Constraints>({ refundable: false, breakfast: false, maxBudget: null, minEquivalence: 60 })
  const [lastRun, setLastRun] = useState<{ key: string; ranks: Record<string, number>; at: string } | null>(null)
  const [compare, setCompare] = useState(false)

  const offers = OFFERS.filter((o) => o.propertyId === propertyId && o.categoryId === category.id)
  const confidenceFor = (o: Offer) => {
    const l = property.listingIds.find((id) => id.startsWith(suppliers.find((s) => s.id === o.supplierId)?.code + '-'))
    if (!l) return 0.5
    const ps = matches.filter((m) => (m.a.id === l || m.b.id === l) && property.listingIds.includes(m.a.id) && property.listingIds.includes(m.b.id) && (m.status === 'matched' || m.status === 'duplicate'))
    return ps.length ? ps.reduce((s, p) => s + p.evidence.overall, 0) / ps.length : 0.5
  }
  const ranked = useMemo(() => optimize(offers, suppliers, category, weights, constraints, settings.taxRate, confidenceFor), [offers, suppliers, category, weights, constraints, settings.taxRate, matches])
  const wSum = Object.values(weights).reduce((a, b) => a + b, 0) || 1
  const best = ranked[0]
  const second = ranked[1]
  const runKey = `${propertyId}:${category.id}`

  function run() {
    setLastRun({ key: runKey, ranks: Object.fromEntries(ranked.map((r) => [r.offer.id, r.rank])), at: new Date().toISOString() })
    if (best) logOptimization(`${property.name} · ${category.label}`, `Recommended ${best.supplier.name} (score ${best.total.toFixed(1)})`)
    toast('Optimization complete')
  }

  function exportCsv() {
    downloadFile(
      `optimization_${property.id}_${category.id}.csv`,
      toCSV(
        ranked.map((r) => ({
          Rank: r.rank,
          Supplier: r.supplier.name,
          Room: r.offer.roomName,
          'Listed price': r.offer.price,
          'Effective price': r.effective,
          'Weighted score': r.total.toFixed(1),
          ...Object.fromEntries(PARAMS.map((p) => [p.label, (r.scores[p.key] * 100).toFixed(0)])),
          Constraints: r.violations.length ? r.violations.join('; ') : 'All satisfied',
        })),
      ),
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="Intelligence · Supplier Optimization Engine"
        title="Recommend the right supplier, not just the cheapest"
        description="Rank every supplier offer for an equivalent product using your priorities. Price is compared after taxes and fees, and mandatory constraints are enforced before ranking."
        actions={
          <>
            <Button icon={<Download size={14} />} onClick={exportCsv}>
              Export recommendations
            </Button>
            <Button variant="primary" icon={<Play size={14} />} onClick={run}>
              Run optimization
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-12 items-start gap-5">
        <div className="col-span-12 xl:col-span-4 space-y-5">
          <Card title="Product">
            <div className="space-y-3">
              <Field label="Unified property">
                <select
                  className={inputCls}
                  value={propertyId}
                  onChange={(e) => {
                    const p = PROPERTIES.find((x) => x.id === e.target.value)!
                    setPropertyId(p.id)
                    setCategoryId(p.categories[0].id)
                  }}
                >
                  {PROPERTIES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Requested room category">
                <select className={inputCls} value={category.id} onChange={(e) => setCategoryId(e.target.value)}>
                  {property.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="rounded-lg bg-paper px-3 py-2 text-[11.5px] text-muted">
                {category.roomType} · {category.bed} bed · {category.capacity} guests · {category.sizeSqm} m² · {category.view} view
              </div>
            </div>
          </Card>

          <Card title="User preferences" subtitle="Set the importance of each parameter" actions={<SlidersHorizontal size={15} className="text-muted" />}>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {PRESETS.map((p) => {
                const on = PARAMS.every((x) => p.w[x.key] === weights[x.key])
                return (
                  <button key={p.label} onClick={() => setWeights(p.w)} className={cx('rounded-md border px-2 py-1 text-[11.5px] transition-colors', on ? 'border-ink bg-ink text-white' : 'border-line hover:bg-paper')}>
                    {p.label}
                  </button>
                )
              })}
            </div>
            <div className="mb-4 flex h-2 overflow-hidden rounded-full">
              {PARAMS.map((p) => (
                <div key={p.key} style={{ width: `${(weights[p.key] / wSum) * 100}%`, background: PARAM_COLOR[p.key] }} className="transition-[width] duration-300" />
              ))}
            </div>
            <div className="space-y-3.5">
              {PARAMS.map((p) => (
                <div key={p.key}>
                  <div className="mb-1 flex items-center justify-between text-[12.5px]">
                    <span className="flex items-center gap-2" title={p.hint}>
                      <span className="size-2 rounded-sm" style={{ background: PARAM_COLOR[p.key] }} />
                      {p.label}
                    </span>
                    <span className="font-mono text-[12px] tabular">{Math.round((weights[p.key] / wSum) * 100)}%</span>
                  </div>
                  <input type="range" min={0} max={100} step={5} value={weights[p.key]} onChange={(e) => setWeights((w) => ({ ...w, [p.key]: Number(e.target.value) }))} className="w-full accent-ink" aria-label={p.label} />
                </div>
              ))}
            </div>
          </Card>

          <Card title="Mandatory constraints">
            <div className="space-y-3 text-[12.5px]">
              {(
                [
                  ['refundable', 'Must be refundable'],
                  ['breakfast', 'Must include breakfast'],
                ] as const
              ).map(([k, label]) => (
                <label key={k} className="flex cursor-pointer items-center justify-between">
                  {label}
                  <input type="checkbox" checked={constraints[k]} onChange={(e) => setConstraints((c) => ({ ...c, [k]: e.target.checked }))} className="size-4 accent-ink" />
                </label>
              ))}
              <Field label="Maximum budget (effective, ₹)">
                <input type="number" className={inputCls} placeholder="No limit" value={constraints.maxBudget ?? ''} onChange={(e) => setConstraints((c) => ({ ...c, maxBudget: e.target.value ? Number(e.target.value) : null }))} />
              </Field>
              <Field label={`Minimum product equivalence: ${constraints.minEquivalence}%`}>
                <input type="range" min={0} max={100} step={5} value={constraints.minEquivalence} onChange={(e) => setConstraints((c) => ({ ...c, minEquivalence: Number(e.target.value) }))} className="w-full accent-ink" />
              </Field>
            </div>
          </Card>
        </div>

        <div className="col-span-12 xl:col-span-8 space-y-5">
          {best && (
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
              <div className="animate-rise xl:col-span-3 rounded-xl border border-night-line bg-night p-6 text-white">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-mono text-[10.5px] tracking-[0.14em] text-signal uppercase">
                    <Crown size={13} /> Recommended supplier
                  </span>
                  {best.violations.length ? <Badge tone="red">No offer meets all constraints</Badge> : <Badge tone="green" dot>Constraints satisfied</Badge>}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <SupplierChip code={best.supplier.code} color={best.supplier.color} />
                  <span className="text-[22px] font-semibold tracking-tight">{best.supplier.name}</span>
                </div>
                <div className="mt-1 text-[12.5px] text-white/55">
                  {best.offer.roomName} · {best.offer.mealPlan ?? 'Meal plan unknown'} · {best.offer.refundable ? 'Refundable' : 'Non-refundable'}
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4 border-t border-night-line pt-4">
                  <Metric label="Weighted score" value={best.total.toFixed(1)} />
                  <Metric label="Effective price" value={inr(best.effective)} />
                  <Metric label="Equivalence" value={`${Math.round(best.scores.equivalence * 100)}%`} />
                </div>
              </div>
              <div className="flex flex-col rounded-xl xl:col-span-2 border border-line bg-surface p-5">
                <div className="font-mono text-[10.5px] tracking-[0.14em] text-muted uppercase">Second-best alternative</div>
                {second ? (
                  <>
                    <div className="mt-3 flex items-center gap-2.5">
                      <SupplierChip code={second.supplier.code} color={second.supplier.color} />
                      <span className="text-[16px] font-semibold">{second.supplier.name}</span>
                    </div>
                    <div className="mt-1 text-[12px] text-muted">{second.offer.roomName}</div>
                    <div className="mt-auto grid grid-cols-2 gap-3 pt-4">
                      <div>
                        <div className="text-[11px] text-muted">Score gap</div>
                        <div className="font-mono text-[16px]">−{(best.total - second.total).toFixed(1)}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-muted">Price difference</div>
                        <div className={cx('font-mono text-[16px]', second.effective < best.effective ? 'text-ok' : 'text-bad')}>
                          {second.effective < best.effective ? '−' : '+'}
                          {inr(Math.abs(second.effective - best.effective))}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="mt-3 text-[12.5px] text-muted">Only one supplier sells this product.</div>
                )}
              </div>
            </div>
          )}

          <Card
            title="Overall ranking"
            subtitle="Bar segments show how each parameter contributes to the weighted score"
            pad={false}
            actions={
              <Button size="sm" variant={compare ? 'primary' : 'secondary'} disabled={!lastRun || lastRun.key !== runKey} onClick={() => setCompare((c) => !c)} title={!lastRun ? 'Run optimization first to snapshot a ranking' : undefined}>
                Compare with last run
              </Button>
            }
          >
            <div className="divide-y divide-line">
              {ranked.map((r) => {
                const prev = compare && lastRun?.key === runKey ? lastRun.ranks[r.offer.id] : undefined
                const delta = prev ? prev - r.rank : 0
                const cheapest = Math.min(...ranked.map((x) => x.effective))
                return (
                  <div key={r.offer.id} className={cx('grid grid-cols-[36px_1.3fr_2fr_auto] items-center gap-4 px-5 py-3.5', r.violations.length > 0 && 'opacity-60')}>
                    <div className={cx('grid size-8 place-items-center rounded-lg font-mono text-[13px] font-semibold', r.rank === 1 && !r.violations.length ? 'bg-signal text-ink' : 'bg-sunken text-ink-2')}>{r.rank}</div>
                    <div className="min-w-0">
                      <SupplierChip code={r.supplier.code} color={r.supplier.color} name={r.supplier.name} size="sm" />
                      <div className="mt-0.5 truncate text-[11.5px] text-muted">
                        {inr(r.effective)} effective {r.effective !== cheapest && <span className="text-bad">(+{inr(r.effective - cheapest)})</span>}
                      </div>
                    </div>
                    <div>
                      <div className="flex h-3 overflow-hidden rounded-full bg-sunken">
                        {PARAMS.map((p) => (
                          <div key={p.key} title={`${p.label}: ${(r.contributions[p.key] * 100).toFixed(1)} pts`} className="transition-[width] duration-500" style={{ width: `${r.contributions[p.key] * 100}%`, background: PARAM_COLOR[p.key] }} />
                        ))}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {r.violations.length ? r.violations.map((v) => <Badge key={v} tone="red">{v}</Badge>) : <span className="flex items-center gap-1 text-[11px] text-ok"><ShieldCheck size={12} /> All constraints satisfied</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      {prev != null && delta !== 0 && (
                        <span className={cx('flex items-center font-mono text-[11px]', delta > 0 ? 'text-ok' : 'text-bad')}>
                          {delta > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                          {Math.abs(delta)}
                        </span>
                      )}
                      <span className="font-mono text-[18px] font-medium tabular">{r.total.toFixed(1)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line bg-paper/50 px-5 py-2.5">
              {PARAMS.map((p) => (
                <span key={p.key} className="flex items-center gap-1.5 text-[11px] text-muted">
                  <span className="size-2 rounded-sm" style={{ background: PARAM_COLOR[p.key] }} />
                  {p.label}
                </span>
              ))}
            </div>
          </Card>

          <ComparisonTable ranked={ranked} category={category} />

          {best && <Explanation best={best} ranked={ranked} weights={weights} />}
        </div>
      </div>
    </>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] text-white/45">{label}</div>
      <div className="mt-0.5 font-mono text-[18px] font-medium">{value}</div>
    </div>
  )
}

function ComparisonTable({ ranked, category }: { ranked: Ranked[]; category: Parameters<typeof equivalenceToCategory>[1] }) {
  const { settings } = useStore()
  const cols = [...ranked].sort((a, b) => a.supplier.code.localeCompare(b.supplier.code))
  const yes = (v: boolean | null) => (v == null ? <span className="text-faint">Unknown</span> : v ? <span className="text-ok">Yes</span> : <span className="text-bad">No</span>)
  const rows: [string, (r: Ranked) => React.ReactNode][] = [
    ['Listed price', (r) => inr(r.offer.price)],
    ['Effective price', (r) => <b className="font-mono">{inr(effectivePrice(r.offer, settings.taxRate))}</b>],
    ['Room', (r) => r.offer.roomName],
    ['Breakfast', (r) => yes(r.offer.mealPlan == null ? null : r.offer.mealPlan !== 'Room only')],
    ['Refundable', (r) => yes(r.offer.refundable)],
    ['Free cancellation until', (r) => (r.offer.refundable ? (r.offer.cancelDeadlineHrs != null ? `${r.offer.cancelDeadlineHrs}h before` : '—') : 'n/a')],
    ['Taxes included', (r) => yes(r.offer.taxesIncluded)],
    ['Product equivalence', (r) => `${Math.round(equivalenceToCategory(r.offer, category) * 100)}%`],
    ['Match confidence', (r) => `${Math.round(r.scores.confidence * 100)}%`],
    ['Supplier reliability', (r) => `${r.supplier.reliability}%`],
    ['Availability', (r) => (r.offer.availability == null ? <span className="text-faint">Not supplied</span> : `${r.offer.availability} rooms`)],
  ]
  return (
    <Card title="Supplier comparison" pad={false}>
      <table className="w-full">
        <thead className="border-b border-line bg-paper/60">
          <tr>
            <th className={th}>Parameter</th>
            {cols.map((c) => (
              <th key={c.offer.id} className={th}>
                <SupplierChip code={c.supplier.code} color={c.supplier.color} name={c.supplier.name} size="sm" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map(([label, fn]) => (
            <tr key={label}>
              <td className={cx(td, 'text-muted')}>{label}</td>
              {cols.map((c) => (
                <td key={c.offer.id} className={cx(td, 'text-[12.5px]', c.rank === 1 && !c.violations.length && 'bg-signal/10')}>
                  {fn(c)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

function Explanation({ best, ranked, weights }: { best: Ranked; ranked: Ranked[]; weights: Weights }) {
  const others = ranked.filter((r) => r !== best)
  const top = [...PARAMS].filter((p) => weights[p.key] > 0).sort((a, b) => best.contributions[b.key] - best.contributions[a.key]).slice(0, 3)
  const adv = PARAMS.filter((p) => others.length && others.every((o) => best.scores[p.key] > o.scores[p.key] + 0.01))
  const comp = PARAMS.filter((p) => others.some((o) => o.scores[p.key] > best.scores[p.key] + 0.05))
  const cheapest = [...ranked].sort((a, b) => a.effective - b.effective)[0]
  const why = best.violations.length
    ? `No supplier satisfies every mandatory constraint, so ${best.supplier.name} is shown as the closest option. Relax a constraint to get a compliant recommendation.`
    : `${best.supplier.name} has the highest weighted score (${best.total.toFixed(1)}) among offers that meet your mandatory constraints${cheapest !== best ? `, even though ${cheapest.supplier.name} is ${inr(best.effective - cheapest.effective)} cheaper after taxes` : ' and it is also the lowest effective price'}.`
  return (
    <Card title="Recommendation explanation">
      <p className="text-[13.5px] leading-relaxed text-ink">{why}</p>
      <div className="mt-5 grid grid-cols-3 gap-5">
        <div>
          <div className="mb-2 text-[12px] font-medium text-muted">Contributing parameters</div>
          <div className="space-y-2">
            {top.map((p) => (
              <div key={p.key} className="flex items-center justify-between text-[12.5px]">
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-sm" style={{ background: PARAM_COLOR[p.key] }} />
                  {p.label}
                </span>
                <span className="font-mono">{(best.contributions[p.key] * 100).toFixed(1)} pts</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-ok">
            <TrendingUp size={13} /> Advantages
          </div>
          <ul className="space-y-1 text-[12.5px]">
            {adv.length ? adv.map((p) => <li key={p.key}>Best {p.label.toLowerCase()} of all suppliers</li>) : <li className="text-muted">No single parameter where it leads outright; it wins on balance.</li>}
          </ul>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-warn">
            <TrendingDown size={13} /> Compromises
          </div>
          <ul className="space-y-1 text-[12.5px]">
            {comp.length ? (
              comp.map((p) => {
                const leader = others.reduce((a, b) => (b.scores[p.key] > a.scores[p.key] ? b : a))
                return (
                  <li key={p.key}>
                    {p.label}: {leader.supplier.name} scores higher
                  </li>
                )
              })
            ) : (
              <li className="text-muted">None. It matches or beats every alternative.</li>
            )}
          </ul>
        </div>
      </div>
      <div className={cx('mt-5 flex items-center gap-2 rounded-lg px-3 py-2.5 text-[12.5px]', best.violations.length ? 'bg-bad-soft text-bad' : 'bg-ok-soft text-ok')}>
        {best.violations.length ? <ShieldX size={14} /> : <Check size={14} />}
        {best.violations.length ? `Mandatory constraints not met: ${best.violations.join(', ')}` : 'Satisfies all mandatory constraints'}
      </div>
    </Card>
  )
}
