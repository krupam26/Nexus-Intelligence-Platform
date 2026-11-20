import { AlertOctagon, AlertTriangle, CircleDollarSign, Download, FileBarChart, FileSpreadsheet, GitCompareArrows, ShieldAlert } from 'lucide-react'
import { useMemo } from 'react'
import { BarList, Columns, Donut, Legend } from '../components/charts'
import { Badge, Button, Card, cx, downloadFile, inr, PageHeader, Stat, SupplierChip, td, th, toCSV } from '../components/ui'
import { OFFERS, PROPERTIES } from '../data/products'
import { GROUND_TRUTH } from '../data/seed'
import { compareOffers, type Classification } from '../lib/equivalence'
import { effectivePrice } from '../lib/optimize'
import { supplierStats, useStore } from '../store'
import { CLASS_META } from '../lib/meta'

export default function Analytics() {
  const store = useStore()
  const { matches, listings, suppliers, clusters, settings, datasets, logExport, toast } = store

  // ---- Matching quality against labelled ground truth
  const truth = useMemo(() => {
    const accepted = matches.filter((m) => m.status === 'matched' || m.status === 'duplicate')
    const labelled = accepted.filter((m) => GROUND_TRUTH[m.a.id] && GROUND_TRUTH[m.b.id])
    const tp = labelled.filter((m) => GROUND_TRUTH[m.a.id] === GROUND_TRUTH[m.b.id]).length
    const fp = labelled.length - tp
    const ids = Object.keys(GROUND_TRUTH).filter((id) => listings.some((l) => l.id === id))
    let totalTrue = 0
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) if (GROUND_TRUTH[ids[i]] === GROUND_TRUTH[ids[j]]) totalTrue++
    return { precision: labelled.length ? tp / labelled.length : 0, recall: totalTrue ? tp / totalTrue : 0, tp, fp, fn: totalTrue - tp }
  }, [matches, listings])

  const buckets = useMemo(() => {
    const b = ['30', '40', '50', '60', '70', '80', '90'].map((l) => ({ label: `${l}+`, value: 0 }))
    matches.forEach((m) => {
      const i = Math.min(6, Math.max(0, Math.floor(m.evidence.overall * 10) - 3))
      b[i].value++
    })
    return b
  }, [matches])

  const supStats = suppliers.map((s) => ({ s, st: supplierStats(s, listings, matches, clusters) }))
  const exclusive = (sid: string) => clusters.filter((c) => c.every((l) => l.supplierId === sid)).length

  // ---- Product equivalence across every same-category pair
  const productPairs = useMemo(() => {
    const out: { a: (typeof OFFERS)[number]; b: (typeof OFFERS)[number]; res: ReturnType<typeof compareOffers> }[] = []
    for (let i = 0; i < OFFERS.length; i++)
      for (let j = i + 1; j < OFFERS.length; j++) {
        const a = OFFERS[i]
        const b = OFFERS[j]
        if (a.propertyId === b.propertyId && a.categoryId === b.categoryId) out.push({ a, b, res: compareOffers(a, b) })
      }
    return out
  }, [])
  const classCounts = (Object.keys(CLASS_META) as Classification[]).map((c) => ({ label: c, value: productPairs.filter((p) => p.res.classification === c).length, color: CLASS_META[c].color }))

  // ---- Price analytics per category
  const priceRows = PROPERTIES.flatMap((p) =>
    p.categories.map((c) => {
      const os = OFFERS.filter((o) => o.propertyId === p.id && o.categoryId === c.id)
      const prices = os.map((o) => effectivePrice(o, settings.taxRate))
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length
      const min = Math.min(...prices)
      const max = Math.max(...prices)
      const eq = productPairs.filter((x) => x.a.propertyId === p.id && x.a.categoryId === c.id && (x.res.classification === 'Exact Equivalent' || x.res.classification === 'Similar Product'))
      const eqGap = eq.length ? Math.max(...eq.map((x) => Math.abs(effectivePrice(x.a, settings.taxRate) - effectivePrice(x.b, settings.taxRate)))) : null
      return { property: p.name, category: c.label, avg, min, max, variation: ((max - min) / avg) * 100, eqGap, count: os.length }
    }),
  )
  const supplierPriceIndex = suppliers
    .map((s) => {
      const idx = OFFERS.filter((o) => o.supplierId === s.id).map((o) => {
        const peers = OFFERS.filter((x) => x.propertyId === o.propertyId && x.categoryId === o.categoryId)
        const mean = peers.reduce((a, x) => a + effectivePrice(x, settings.taxRate), 0) / peers.length
        return (effectivePrice(o, settings.taxRate) / mean - 1) * 100
      })
      return { s, avg: idx.length ? idx.reduce((a, b) => a + b, 0) / idx.length : null, n: idx.length }
    })
    .filter((x) => x.avg != null)

  // ---- Anomaly detection
  const anomalies = useMemo(() => {
    const out: { kind: 'Unusual pricing' | 'Missing attributes' | 'Conflicting information' | 'Inconsistent booking policy'; severity: 'high' | 'medium'; text: string; supplier?: string }[] = []
    for (const o of OFFERS) {
      const peers = OFFERS.filter((x) => x.propertyId === o.propertyId && x.categoryId === o.categoryId && x.id !== o.id)
      if (!peers.length) continue
      const median = peers.map((x) => effectivePrice(x, settings.taxRate)).sort((a, b) => a - b)[Math.floor(peers.length / 2)]
      const dev = (effectivePrice(o, settings.taxRate) / median - 1) * 100
      const pname = PROPERTIES.find((p) => p.id === o.propertyId)!.name
      if (Math.abs(dev) >= 12) out.push({ kind: 'Unusual pricing', severity: Math.abs(dev) >= 20 ? 'high' : 'medium', text: `${o.roomName} at ${pname} is ${dev > 0 ? '+' : ''}${dev.toFixed(0)}% vs peer median after taxes.`, supplier: o.supplierId })
      const missing = (['bed', 'sizeSqm', 'view', 'availability', 'taxesIncluded'] as const).filter((k) => o[k] == null)
      if (missing.length >= 2) out.push({ kind: 'Missing attributes', severity: 'medium', text: `${o.roomName} at ${pname} lacks ${missing.join(', ')}.`, supplier: o.supplierId })
      if (peers.every((x) => x.refundable) && o.refundable === false) out.push({ kind: 'Inconsistent booking policy', severity: 'medium', text: `Only non-refundable offer for ${pname} · ${o.roomName}; all peers are refundable.`, supplier: o.supplierId })
    }
    for (const m of matches.filter((x) => x.status === 'matched' && !x.sameSupplier)) {
      if (m.a.stars && m.b.stars && m.a.stars !== m.b.stars) out.push({ kind: 'Conflicting information', severity: 'high', text: `${m.a.name}: ${m.a.stars}★ from one supplier, ${m.b.stars}★ from another.` })
      if (m.a.phone && m.b.phone && m.a.phone !== m.b.phone) out.push({ kind: 'Conflicting information', severity: 'medium', text: `${m.a.name}: phone numbers differ between suppliers.` })
    }
    for (const s of supStats) if (s.st.count && s.st.completeness < 50) out.push({ kind: 'Missing attributes', severity: 'high', text: `${s.s.name} listings are only ${s.st.completeness}% complete.`, supplier: s.s.id })
    return out
  }, [matches, settings.taxRate, supStats])

  // ---- Reports
  const reports = [
    { key: 'matching', name: 'Matching Report', desc: 'Every candidate pair with evidence and status', icon: <GitCompareArrows size={16} />, rows: () => matches.map((m) => ({ pair: m.id, property_a: m.a.name, property_b: m.b.name, supplier_a: m.a.supplierId, supplier_b: m.b.supplierId, score: (m.evidence.overall * 100).toFixed(1), name: (m.evidence.name * 100).toFixed(0), address: (m.evidence.address * 100).toFixed(0), geo: m.evidence.geo == null ? '' : (m.evidence.geo * 100).toFixed(0), distance_m: m.evidence.distance?.toFixed(0) ?? '', status: m.status, verified_by: m.decision?.by ?? '' })) },
    { key: 'supplier', name: 'Supplier Comparison Report', desc: 'Listings, completeness, quality and contribution', icon: <FileBarChart size={16} />, rows: () => supStats.map(({ s, st }) => ({ supplier_id: s.id, name: s.name, type: s.type, integration: s.integration, listings: st.count, properties: st.properties, exclusive_properties: exclusive(s.id), completeness_pct: st.completeness, quality: st.quality, duplicates: st.dupes, reliability_pct: s.reliability })) },
    { key: 'equivalence', name: 'Product Equivalence Report', desc: 'Pairwise room-level classification', icon: <FileSpreadsheet size={16} />, rows: () => productPairs.map((p) => ({ property: PROPERTIES.find((x) => x.id === p.a.propertyId)?.name, offer_a: `${p.a.supplierId} ${p.a.roomName}`, offer_b: `${p.b.supplierId} ${p.b.roomName}`, classification: p.res.classification, score: p.res.score, verdict: p.res.verdict })) },
    { key: 'optimization', name: 'Optimization Report', desc: 'Price analytics and supplier price index', icon: <CircleDollarSign size={16} />, rows: () => priceRows.map((r) => ({ property: r.property, category: r.category, offers: r.count, avg_price: Math.round(r.avg), min_price: r.min, max_price: r.max, variation_pct: r.variation.toFixed(1), max_gap_between_equivalents: r.eqGap ?? '' })) },
    { key: 'quality', name: 'Data Quality Report', desc: 'Dataset processing outcomes', icon: <ShieldAlert size={16} />, rows: () => datasets.map((d) => ({ dataset: d.id, name: d.name, supplier: d.supplierId, file: d.fileName, format: d.format, uploaded: d.uploadedAt, records: d.records, valid: d.valid, normalized: d.normalized, status: d.status })) },
  ]
  const exportReport = (r: (typeof reports)[number]) => {
    downloadFile(`nexus_${r.key}_report_${new Date().toISOString().slice(0, 10)}.csv`, toCSV(r.rows() as Record<string, unknown>[]))
    logExport(r.name)
    toast(`${r.name} downloaded`)
  }

  const accepted = matches.filter((m) => m.status === 'matched').length

  return (
    <>
      <PageHeader eyebrow="Insights · Analytics & Reports" title="How well is the system performing?" description="Matching accuracy against a hand-labelled test set, supplier contribution, product equivalence, price dispersion and anomalies, all calculated live from workspace data." />

      <SectionTitle n="A" title="Property matching analytics" />
      <div className="mb-8 grid grid-cols-12 gap-5">
        <div className="col-span-12 xl:col-span-5 grid grid-cols-2 gap-3">
          <Stat label="Total matches" value={accepted} sub="cross-supplier pairs accepted" tone="green" />
          <Stat label="Matching precision" value={`${(truth.precision * 100).toFixed(1)}%`} sub={`${truth.tp} TP · ${truth.fp} FP on verified test data`} tone="blue" />
          <Stat label="Recall" value={`${(truth.recall * 100).toFixed(1)}%`} sub={`${truth.fn} true pairs not yet linked`} />
          <Stat label="Duplicates detected" value={matches.filter((m) => m.status === 'duplicate').length} sub={`${clusters.filter((c) => c.length === 1).length} unmatched properties`} tone="violet" />
        </div>
        <Card className="col-span-12 xl:col-span-7" title="Confidence distribution" subtitle="Candidate pairs by overall match score">
          <Columns data={buckets} height={150} colorFor={(l) => (parseInt(l) >= settings.autoThreshold - 5 ? 'var(--color-ok)' : parseInt(l) >= settings.reviewThreshold ? 'var(--color-warn)' : 'var(--color-line-strong)')} />
        </Card>
      </div>

      <SectionTitle n="B" title="Supplier analytics" />
      <div className="mb-8 grid grid-cols-12 gap-5">
        <Card className="col-span-12 xl:col-span-4" title="Listings per supplier">
          <BarList items={supStats.map(({ s, st }) => ({ label: <SupplierChip code={s.code} color={s.color} name={s.name} size="sm" />, value: st.count, color: s.color }))} />
        </Card>
        <Card className="col-span-12 xl:col-span-8" title="Completeness, quality and contribution" pad={false}>
          <table className="w-full">
            <thead className="border-b border-line bg-paper/60">
              <tr>
                <th className={th}>Supplier</th>
                <th className={th}>Completeness</th>
                <th className={th}>Quality score</th>
                <th className={cx(th, 'text-right')}>Properties</th>
                <th className={cx(th, 'text-right')}>Exclusive</th>
                <th className={cx(th, 'text-right')}>Contribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {supStats.map(({ s, st }) => (
                <tr key={s.id}>
                  <td className={td}>
                    <SupplierChip code={s.code} color={s.color} name={s.name} size="sm" />
                  </td>
                  <td className={td}>
                    <Bar v={st.completeness} />
                  </td>
                  <td className={td}>
                    <Bar v={st.quality} />
                  </td>
                  <td className={cx(td, 'text-right font-mono')}>{st.properties}</td>
                  <td className={cx(td, 'text-right font-mono')}>{exclusive(s.id)}</td>
                  <td className={cx(td, 'text-right font-mono')}>{((st.properties / Math.max(clusters.length, 1)) * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <SectionTitle n="C" title="Product & price analytics" />
      <div className="mb-8 grid grid-cols-12 gap-5">
        <Card className="col-span-12 xl:col-span-4" title="Product equivalence" subtitle={`${productPairs.length} same-category offer pairs`}>
          <div className="flex flex-col items-center gap-5">
            <Donut segments={classCounts} size={150} center={<div><div className="font-mono text-[24px] font-medium">{productPairs.length}</div><div className="text-[10.5px] text-muted">pairs</div></div>} />
            <div className="w-full">
              <Legend items={classCounts.map((c) => ({ label: c.label, value: c.value, color: c.color }))} />
            </div>
          </div>
        </Card>
        <Card className="col-span-12 xl:col-span-8" title="Price analytics" subtitle={`Effective prices incl. ${settings.taxRate}% tax and fees`} pad={false}>
          <table className="w-full">
            <thead className="border-b border-line bg-paper/60">
              <tr>
                <th className={th}>Product</th>
                <th className={cx(th, 'text-right')}>Average</th>
                <th className={cx(th, 'text-right')}>Lowest</th>
                <th className={cx(th, 'text-right')}>Highest</th>
                <th className={cx(th, 'text-right')}>Variation</th>
                <th className={cx(th, 'text-right')}>Gap between equivalents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {priceRows.map((r) => (
                <tr key={r.property + r.category}>
                  <td className={td}>
                    <div className="font-medium">{r.category}</div>
                    <div className="text-[11.5px] text-muted">{r.property}</div>
                  </td>
                  <td className={cx(td, 'text-right font-mono text-[12.5px]')}>{inr(r.avg)}</td>
                  <td className={cx(td, 'text-right font-mono text-[12.5px] text-ok')}>{inr(r.min)}</td>
                  <td className={cx(td, 'text-right font-mono text-[12.5px] text-bad')}>{inr(r.max)}</td>
                  <td className={cx(td, 'text-right font-mono text-[12.5px]')}>{r.variation.toFixed(1)}%</td>
                  <td className={cx(td, 'text-right font-mono text-[12.5px]')}>{r.eqGap == null ? <span className="text-faint">No equivalents</span> : inr(r.eqGap)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line px-5 py-3">
            <span className="text-[11.5px] text-muted">Average supplier price vs. peers:</span>
            {supplierPriceIndex.map(({ s, avg }) => (
              <span key={s.id} className="flex items-center gap-1.5 text-[12px]">
                <SupplierChip code={s.code} color={s.color} size="sm" />
                <span className={cx('font-mono', avg! > 0 ? 'text-bad' : 'text-ok')}>
                  {avg! > 0 ? '+' : ''}
                  {avg!.toFixed(1)}%
                </span>
              </span>
            ))}
          </div>
        </Card>
      </div>

      <SectionTitle n="D" title="Anomaly detection" />
      <Card className="mb-8" pad={false}>
        <div className="grid grid-cols-4 divide-x divide-line border-b border-line">
          {(['Unusual pricing', 'Missing attributes', 'Conflicting information', 'Inconsistent booking policy'] as const).map((k) => (
            <div key={k} className="px-5 py-3.5">
              <div className="text-[12px] text-muted">{k}</div>
              <div className="mt-1 font-mono text-[22px]">{anomalies.filter((a) => a.kind === k).length}</div>
            </div>
          ))}
        </div>
        <ul className="max-h-[300px] divide-y divide-line overflow-auto scroll-thin">
          {anomalies.map((a, i) => {
            const s = suppliers.find((x) => x.id === a.supplier)
            return (
              <li key={i} className="flex items-center gap-3 px-5 py-2.5 text-[12.5px]">
                {a.severity === 'high' ? <AlertOctagon size={14} className="shrink-0 text-bad" /> : <AlertTriangle size={14} className="shrink-0 text-warn" />}
                <Badge tone={a.severity === 'high' ? 'red' : 'amber'}>{a.kind}</Badge>
                <span className="flex-1">{a.text}</span>
                {s && <SupplierChip code={s.code} color={s.color} size="sm" />}
              </li>
            )
          })}
        </ul>
      </Card>

      <SectionTitle n="E" title="Export reports · Download center" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
        {reports.map((r) => (
          <div key={r.key} className="flex flex-col rounded-xl border border-line bg-surface p-4">
            <span className="grid size-9 place-items-center rounded-lg bg-sunken text-ink-2">{r.icon}</span>
            <div className="mt-3 text-[13.5px] font-medium">{r.name}</div>
            <div className="mt-0.5 mb-4 text-[12px] text-muted">{r.desc}</div>
            <Button size="sm" className="mt-auto" icon={<Download size={13} />} onClick={() => exportReport(r)}>
              Download CSV
            </Button>
          </div>
        ))}
      </div>
    </>
  )
}

function SectionTitle({ n, title }: { n: string; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="grid size-6 place-items-center rounded-md bg-ink font-mono text-[11px] text-signal">{n}</span>
      <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
      <span className="h-px flex-1 bg-line" />
    </div>
  )
}

function Bar({ v }: { v: number }) {
  const c = v >= 80 ? 'var(--color-ok)' : v >= 65 ? 'var(--color-accent)' : v >= 45 ? 'var(--color-warn)' : 'var(--color-bad)'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-sunken">
        <div className="h-full rounded-full" style={{ width: `${v}%`, background: c }} />
      </div>
      <span className="font-mono text-[12px]">{v}</span>
    </div>
  )
}
