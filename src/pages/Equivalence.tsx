import { AlertTriangle, ArrowLeftRight, Check, HelpCircle, Minus, Sparkles, X } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Ring } from '../components/charts'
import { Badge, Card, cx, Field, inputCls, inr, PageHeader, SupplierChip, th, type Tone } from '../components/ui'
import { OFFERS, PROPERTIES } from '../data/products'
import { compareOffers, type AttrRow, type Classification } from '../lib/equivalence'
import { CLASS_META } from '../lib/meta'
import { useStore } from '../store'
import type { MealPlan, Offer } from '../types'

const MEALS: MealPlan[] = ['Room only', 'Breakfast included', 'Half board', 'Full board', 'All inclusive']

export default function Equivalence() {
  const { suppliers, listings } = useStore()
  const [propertyId, setPropertyId] = useState(PROPERTIES[0].id)
  const property = PROPERTIES.find((p) => p.id === propertyId)!
  const [categoryId, setCategoryId] = useState(property.categories[0].id)
  const offers = OFFERS.filter((o) => o.propertyId === propertyId)
  const catOffers = offers.filter((o) => o.categoryId === categoryId)
  const [aId, setAId] = useState(catOffers[0]?.id)
  const [bId, setBId] = useState(catOffers[1]?.id ?? catOffers[0]?.id)

  const changeProperty = (id: string) => {
    const p = PROPERTIES.find((x) => x.id === id)!
    setPropertyId(id)
    selectCategory(p.categories[0].id, id)
  }
  const selectCategory = (cid: string, pid = propertyId) => {
    setCategoryId(cid)
    const os = OFFERS.filter((o) => o.propertyId === pid && o.categoryId === cid)
    setAId(os[0]?.id)
    setBId(os[1]?.id ?? os[0]?.id)
  }

  const a = OFFERS.find((o) => o.id === aId)!
  const b = OFFERS.find((o) => o.id === bId)!
  const result = useMemo(() => (a && b ? compareOffers(a, b) : null), [a, b])
  const sup = (id: string) => suppliers.find((s) => s.id === id)
  const offerLabel = (o: Offer) => `${sup(o.supplierId)?.name ?? o.supplierId} · ${o.roomName} · ${inr(o.price)}`
  const listingFor = (o: Offer) => listings.find((l) => property.listingIds.includes(l.id) && l.supplierId === o.supplierId)

  return (
    <>
      <PageHeader
        eyebrow="Intelligence · Product Equivalence Lab"
        title="Are two suppliers really selling the same product?"
        description="Matching the property is only the first step. The lab compares room configuration, meal plan and booking conditions to decide whether two offers can fairly be compared on price."
      />

      <Card className="mb-5" title="Property selection">
        <div className="grid grid-cols-12 items-end gap-4">
          <div className="col-span-6 xl:col-span-3">
            <Field label="Unified property">
              <select className={inputCls} value={propertyId} onChange={(e) => changeProperty(e.target.value)}>
                {PROPERTIES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="col-span-6 xl:col-span-3">
            <Field label="Room / product category">
              <select className={inputCls} value={categoryId} onChange={(e) => selectCategory(e.target.value)}>
                {property.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="col-span-12 grid grid-cols-[1fr_auto_1fr] xl:col-span-6 items-end gap-2">
            <Field label="Supplier listing A">
              <select className={inputCls} value={aId} onChange={(e) => setAId(e.target.value)}>
                {offers.map((o) => (
                  <option key={o.id} value={o.id}>
                    {offerLabel(o)}
                  </option>
                ))}
              </select>
            </Field>
            <button onClick={() => (setAId(bId), setBId(aId))} className="mb-0.5 grid size-8 place-items-center rounded-lg border border-line hover:bg-paper" aria-label="Swap listings">
              <ArrowLeftRight size={14} />
            </button>
            <Field label="Supplier listing B">
              <select className={inputCls} value={bId} onChange={(e) => setBId(e.target.value)}>
                {offers.map((o) => (
                  <option key={o.id} value={o.id}>
                    {offerLabel(o)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px] text-muted">
          Unified from
          {property.listingIds.map((id) => {
            const l = listings.find((x) => x.id === id)
            const s = l && sup(l.supplierId)
            return l && s ? (
              <span key={id} className="inline-flex items-center gap-1.5 rounded-md border border-line px-2 py-0.5">
                <SupplierChip code={s.code} color={s.color} size="sm" />
                <span className="text-ink-2">{l.name}</span>
              </span>
            ) : null
          })}
        </div>
      </Card>

      {result && a && b && (
        <div className="grid grid-cols-12 items-start gap-5">
          <div className="col-span-12 xl:col-span-8 space-y-5">
            <Card pad={false}>
              <div className="grid grid-cols-[180px_1fr_1fr_44px] border-b border-line bg-paper/60">
                <div className={th}>Attribute</div>
                {[a, b].map((o, i) => {
                  const s = sup(o.supplierId)
                  return (
                    <div key={i} className="px-4 py-3">
                      {s && <SupplierChip code={s.code} color={s.color} name={s.name} size="sm" />}
                      <div className="mt-1 text-[12px] text-muted">
                        {listingFor(o)?.name ?? '—'} · <span className="font-mono text-ink">{inr(o.price)}</span>
                      </div>
                    </div>
                  )
                })}
                <div />
              </div>
              <Group title="Room comparison" rows={result.rows.filter((r) => r.group === 'room')} />
              <Group title="Meal plan comparison" rows={result.rows.filter((r) => r.group === 'meal')} extra={<MealScale a={a.mealPlan} b={b.mealPlan} />} />
              <Group title="Booking policy comparison" rows={result.rows.filter((r) => r.group === 'policy')} />
            </Card>

            <Card title="Equivalence matrix" subtitle={`Every supplier offer at ${property.name}, compared pairwise`} pad={false}>
              <Matrix offers={offers} onPick={(x, y) => (setAId(x), setBId(y))} activeA={aId} activeB={bId} />
            </Card>
          </div>

          <div className="sticky top-4 col-span-12 xl:col-span-4 space-y-5">
            <Card>
              <div className="flex items-center gap-4">
                <Ring value={result.score} size={72} stroke={6} color={CLASS_META[result.classification].color}>
                  <span className="font-mono text-[17px] font-semibold">{result.score}</span>
                </Ring>
                <div>
                  <div className="font-mono text-[10.5px] tracking-[0.12em] text-muted uppercase">Equivalence result</div>
                  <div className="mt-1.5">
                    <Badge tone={CLASS_META[result.classification].tone} dot>
                      {result.classification}
                    </Badge>
                  </div>
                  <div className="mt-2 flex gap-3 font-mono text-[11px] text-muted">
                    <span>room {Math.round(result.roomScore * 100)}%</span>
                    <span>conditions {Math.round(result.condScore * 100)}%</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1">
                {(Object.keys(CLASS_META) as Classification[]).map((c) => (
                  <span key={c} className={cx('rounded px-1.5 py-0.5 text-[10.5px]', c === result.classification ? 'bg-ink text-white' : 'bg-sunken text-faint')}>
                    {c}
                  </span>
                ))}
              </div>
            </Card>

            <div className="rounded-xl border border-night-line bg-night p-5 text-white">
              <div className="flex items-center gap-2 font-mono text-[10.5px] tracking-[0.14em] text-signal uppercase">
                <Sparkles size={13} /> AI verdict
              </div>
              <p className="mt-3 font-serif text-[19px] leading-snug">“{result.verdict}”</p>
            </div>

            <Card title="Difference analysis">
              <DiffList icon={<Check size={12} />} tone="text-ok bg-ok-soft" title="Matching attributes" items={result.rows.filter((r) => r.state === 'match' || r.state === 'close').map((r) => r.label + (r.state === 'close' ? ' (close)' : ''))} />
              <DiffList icon={<X size={12} />} tone="text-bad bg-bad-soft" title="Different attributes" items={result.rows.filter((r) => r.state === 'diff').map((r) => `${r.label}: ${r.a} vs ${r.b}`)} />
              <DiffList icon={<HelpCircle size={12} />} tone="text-dup bg-dup-soft" title="Missing information" items={result.rows.filter((r) => r.state === 'missing').map((r) => `${r.label} (${r.a === '—' ? 'A' : 'B'} not provided)`)} />
              <DiffList
                icon={<AlertTriangle size={12} />}
                tone="text-warn bg-warn-soft"
                title="Important booking-condition differences"
                items={result.rows.filter((r) => r.group !== 'room' && r.state === 'diff' && ['meal', 'refundable', 'deadline', 'charge', 'taxes', 'extra'].includes(r.key)).map((r) => `${r.label}: ${r.a} → ${r.b}`)}
                last
              />
            </Card>
          </div>
        </div>
      )}
    </>
  )
}

function Group({ title, rows, extra }: { title: string; rows: AttrRow[]; extra?: ReactNode }) {
  return (
    <div className="border-b border-line last:border-0">
      <div className="bg-paper/40 px-4 pt-3 pb-1.5 font-mono text-[10.5px] tracking-[0.12em] text-muted uppercase">{title}</div>
      {extra}
      {rows.map((r) => (
        <div key={r.key} className={cx('grid grid-cols-[180px_1fr_1fr_44px] items-center border-t border-line/70 text-[12.5px]', r.state === 'diff' && 'bg-bad-soft/35')}>
          <div className="px-4 py-2.5 text-ink-2">
            {r.label}
            {r.critical && <span className="ml-1 text-[10px] text-faint">•</span>}
          </div>
          <div className={cx('px-4 py-2.5', r.a === '—' && 'text-faint')}>{r.a}</div>
          <div className={cx('px-4 py-2.5', r.b === '—' && 'text-faint')}>{r.b}</div>
          <div className="flex justify-center">
            <StateIcon state={r.state} />
          </div>
        </div>
      ))}
    </div>
  )
}

function StateIcon({ state }: { state: AttrRow['state'] }) {
  const m = { match: ['bg-ok text-white', <Check key="c" size={11} />], close: ['bg-accent-soft text-accent', <Minus key="m" size={11} />], diff: ['bg-bad text-white', <X key="x" size={11} />], missing: ['bg-dup-soft text-dup', <HelpCircle key="h" size={11} />] }[state]
  return <span className={cx('grid size-5 place-items-center rounded-full', m[0] as string)} title={state}>{m[1]}</span>
}

function MealScale({ a, b }: { a: MealPlan | null; b: MealPlan | null }) {
  return (
    <div className="grid grid-cols-5 gap-1 px-4 pt-1 pb-3">
      {MEALS.map((m) => {
        const isA = a === m
        const isB = b === m
        return (
          <div key={m} className={cx('rounded-md border px-2 py-1.5 text-center text-[11px]', isA || isB ? 'border-ink bg-ink text-white' : 'border-line text-faint')}>
            {m}
            {(isA || isB) && <div className="mt-0.5 font-mono text-[10px] text-signal">{isA && isB ? 'A · B' : isA ? 'A' : 'B'}</div>}
          </div>
        )
      })}
    </div>
  )
}

function DiffList({ icon, tone, title, items, last }: { icon: ReactNode; tone: string; title: string; items: string[]; last?: boolean }) {
  return (
    <div className={cx(!last && 'mb-4')}>
      <div className="mb-1.5 flex items-center gap-2 text-[12px] font-medium">
        <span className={cx('grid size-5 place-items-center rounded-full', tone)}>{icon}</span>
        {title}
        <span className="font-mono text-[11px] text-faint">{items.length}</span>
      </div>
      {items.length ? (
        <ul className="ml-7 space-y-0.5">
          {items.map((i) => (
            <li key={i} className="text-[12px] text-ink-2">
              {i}
            </li>
          ))}
        </ul>
      ) : (
        <div className="ml-7 text-[12px] text-faint">None</div>
      )}
    </div>
  )
}

function Matrix({ offers, onPick, activeA, activeB }: { offers: Offer[]; onPick: (a: string, b: string) => void; activeA?: string; activeB?: string }) {
  const { suppliers } = useStore()
  const label = (o: Offer) => {
    const s = suppliers.find((x) => x.id === o.supplierId)
    return (
      <span className="flex items-center gap-1.5">
        {s && <SupplierChip code={s.code} color={s.color} size="sm" />}
        <span className="max-w-[120px] truncate">{o.roomName}</span>
      </span>
    )
  }
  return (
    <div className="overflow-auto scroll-thin">
      <table className="w-full text-[11.5px]">
        <thead>
          <tr className="border-b border-line">
            <th className="px-3 py-2" />
            {offers.map((o) => (
              <th key={o.id} className="px-2 py-2 text-left font-normal">
                {label(o)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {offers.map((r) => (
            <tr key={r.id} className="border-b border-line last:border-0">
              <td className="px-3 py-2">{label(r)}</td>
              {offers.map((c) => {
                if (r.id === c.id) return <td key={c.id} className="bg-paper px-2 py-2 text-center text-faint">—</td>
                const res = compareOffers(r, c)
                const m = CLASS_META[res.classification]
                const active = (activeA === r.id && activeB === c.id) || (activeA === c.id && activeB === r.id)
                return (
                  <td key={c.id} className="px-1 py-1">
                    <button onClick={() => onPick(r.id, c.id)} title={`${res.classification} · ${res.score}`} className={cx('w-full rounded-md px-2 py-1.5 text-left transition-shadow hover:ring-2 hover:ring-ink/20', active && 'ring-2 ring-ink')} style={{ background: `color-mix(in srgb, ${m.color} 13%, white)`, color: m.color }}>
                      <span className="font-medium">{m.short}</span> <span className="font-mono opacity-70">{res.score}</span>
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
