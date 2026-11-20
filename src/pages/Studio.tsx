import { ArrowRight, Check, CheckCircle2, Download, Eye, FileJson, FileSpreadsheet, FileText, Play, Sparkles, UploadCloud, Wand2, XCircle } from 'lucide-react'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { Badge, Button, Card, cx, downloadFile, Field, fmtDateTime, inputCls, PageHeader, Stat, SupplierChip, td, th, toCSV } from '../components/ui'
import { autoMap, inferCity, parseCSV, parseJSON, processRows, RULES, SAMPLE_FILES, STANDARD_FIELDS, tableToRows, type FieldKey, type Row, type RuleKey } from '../lib/normalize'
import { useStore } from '../store'
import type { Dataset, Listing } from '../types'

type Step = 1 | 2 | 3 | 4
interface Loaded {
  fileName: string
  format: Dataset['format']
  headers: string[]
  rows: Row[]
  size: number
}

export default function Studio() {
  const { suppliers, datasets, route, addDataset, toast, navigate, listings } = useStore()
  const [supplierId, setSupplierId] = useState(route.params.supplier ?? 'SUP-E')
  const [name, setName] = useState('')
  const [file, setFile] = useState<Loaded | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mapping, setMapping] = useState<Record<string, FieldKey>>({})
  const [confidence, setConfidence] = useState<Record<string, number>>({})
  const [rules, setRules] = useState<Set<RuleKey>>(new Set(RULES.map((r) => r.key)))
  const [step, setStep] = useState<Step>(1)
  const [processedId, setProcessedId] = useState<string | null>(null)
  const [drag, setDrag] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const supplier = suppliers.find((s) => s.id === supplierId)

  const result = useMemo(() => (file ? processRows(file.rows, mapping, rules) : null), [file, mapping, rules])

  function accept(loaded: Loaded) {
    if (!loaded.headers.length || !loaded.rows.length) {
      setError('No rows found. Make sure the first row contains column headers.')
      return
    }
    const m: Record<string, FieldKey> = {}
    const c: Record<string, number> = {}
    const used = new Set<FieldKey>()
    for (const h of loaded.headers) {
      const r = autoMap(h)
      m[h] = r.field !== 'ignore' && used.has(r.field) ? 'ignore' : r.field
      if (m[h] !== 'ignore') used.add(m[h])
      c[h] = r.confidence
    }
    setFile(loaded)
    setMapping(m)
    setConfidence(c)
    setError(null)
    setProcessedId(null)
    setName((n) => n || loaded.fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '))
    setStep(2)
  }

  async function readFile(f: File) {
    setError(null)
    const ext = f.name.split('.').pop()?.toLowerCase()
    try {
      if (ext === 'csv' || ext === 'txt') accept({ fileName: f.name, format: 'CSV', size: f.size, ...parseCSV(await f.text()) })
      else if (ext === 'json') accept({ fileName: f.name, format: 'JSON', size: f.size, ...parseJSON(await f.text()) })
      else if (ext === 'xlsx') {
        const { readSheet } = await import('read-excel-file/browser')
        const data = await readSheet(f)
        accept({ fileName: f.name, format: 'Excel', size: f.size, ...tableToRows(data as unknown[][]) })
      } else setError('Unsupported file type. Upload a .csv, .xlsx or .json file.')
    } catch (e) {
      setError(`Could not read ${f.name}: ${(e as Error).message}`)
    }
  }

  function loadSample(i: number) {
    const s = SAMPLE_FILES[i]
    const isJson = s.fileName.endsWith('.json')
    accept({ fileName: s.fileName, format: isJson ? 'JSON' : 'CSV', size: s.text.length, ...(isJson ? parseJSON(s.text) : parseCSV(s.text)) })
  }

  function processDataset() {
    if (!file || !result || !supplier) return
    const id = `DS-${1045 + datasets.length}`
    // One listing per unique property; room rows of the same property collapse together.
    const byProp = new Map<string, (typeof result.rows)[number]>()
    for (const r of result.rows) {
      if (r.status !== 'valid') continue
      const k = `${r.out.name?.toLowerCase()}|${(r.out.address ?? '').toLowerCase()}`
      if (!byProp.has(k)) byProp.set(k, r)
    }
    const existing = listings.filter((l) => l.supplierId === supplier.id).length
    const newListings: Listing[] = [...byProp.values()].map((r, i) => ({
      id: `${supplier.code}-${String(existing + i + 1).padStart(4, '0')}`,
      supplierId: supplier.id,
      datasetId: id,
      name: r.out.name!,
      address: r.out.address ?? '',
      city: inferCity(r.out),
      lat: r.out.lat ? Number(r.out.lat) : undefined,
      lng: r.out.lng ? Number(r.out.lng) : undefined,
      description: r.out.description ?? '',
      amenities: (r.out.amenities ?? '').split(';').map((a) => a.trim()).filter(Boolean),
      stars: r.out.stars ? Number(r.out.stars) : undefined,
      phone: r.out.phone || undefined,
    }))
    const ds: Dataset = {
      id,
      supplierId: supplier.id,
      name: name || file.fileName,
      fileName: file.fileName,
      format: file.format,
      uploadedAt: new Date().toISOString(),
      records: result.report.total,
      valid: result.report.valid,
      normalized: result.report.normalized,
      status: result.report.valid ? 'Processed' : 'Failed',
    }
    addDataset(ds, newListings)
    setProcessedId(id)
    setStep(4)
    toast(`${newListings.length} listings added to ${supplier.name}`)
  }

  function downloadCleaned() {
    if (!result || !file) return
    const rows = result.rows
      .filter((r) => r.status === 'valid')
      .map((r) => Object.fromEntries(STANDARD_FIELDS.filter((f) => Object.values(mapping).includes(f.key)).map((f) => [f.label, r.out[f.key] ?? ''])))
    downloadFile(`${file.fileName.replace(/\.[^.]+$/, '')}_cleaned.csv`, toCSV(rows))
  }

  const mappedFields = Object.values(mapping).filter((v) => v !== 'ignore')
  const hasName = mappedFields.includes('name')

  return (
    <>
      <PageHeader
        eyebrow="Workspace · Data Intelligence Studio"
        title="Upload, map and standardize supplier data"
        description="Every supplier names their columns differently and formats values their own way. The studio maps source columns to a standard schema and normalizes the values, so listings can be matched across suppliers."
      />

      {/* Stepper */}
      <div className="animate-rise mb-6 grid grid-cols-4 gap-2">
        {[
          { n: 1, label: 'Upload dataset', icon: <UploadCloud size={14} /> },
          { n: 2, label: 'Map columns', icon: <Wand2 size={14} /> },
          { n: 3, label: 'Preview & normalize', icon: <Eye size={14} /> },
          { n: 4, label: 'Process & report', icon: <Play size={14} /> },
        ].map((s) => {
          const done = step > s.n || (s.n === 4 && !!processedId)
          const active = step === s.n
          const reachable = s.n === 1 || (file && (s.n < 4 || processedId))
          return (
            <button
              key={s.n}
              disabled={!reachable}
              onClick={() => setStep(s.n as Step)}
              className={cx('flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors disabled:opacity-50', active ? 'border-ink bg-ink text-white' : 'border-line bg-surface hover:bg-paper')}
            >
              <span className={cx('grid size-7 place-items-center rounded-full font-mono text-[11px]', done ? 'bg-ok text-white' : active ? 'bg-signal text-ink' : 'bg-sunken text-muted')}>{done ? <Check size={13} /> : s.n}</span>
              <span className="text-[13px] font-medium">{s.label}</span>
              <span className={cx('ml-auto', active ? 'text-signal' : 'text-faint')}>{s.icon}</span>
            </button>
          )
        })}
      </div>

      {step === 1 && (
        <div className="grid grid-cols-12 gap-5">
          <Card className="col-span-12 xl:col-span-8" title="Dataset upload" subtitle="CSV, Excel (.xlsx) or JSON. Files are parsed in your browser.">
            <div
              onDragOver={(e) => (e.preventDefault(), setDrag(true))}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDrag(false)
                const f = e.dataTransfer.files[0]
                if (f) readFile(f)
              }}
              onClick={() => inputRef.current?.click()}
              className={cx('flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors', drag ? 'border-accent bg-accent-soft' : 'border-line-strong bg-paper hover:border-ink-2')}
            >
              <div className="mb-4 flex gap-2">
                {[<FileText key="c" size={18} />, <FileSpreadsheet key="x" size={18} />, <FileJson key="j" size={18} />].map((ic, i) => (
                  <span key={i} className="grid size-10 place-items-center rounded-lg border border-line bg-surface text-ink-2 shadow-sm" style={{ transform: `rotate(${(i - 1) * 6}deg)` }}>
                    {ic}
                  </span>
                ))}
              </div>
              <div className="text-[15px] font-medium">Drop a supplier file here, or click to browse</div>
              <div className="mt-1 text-[12.5px] text-muted">The first row must contain column headers · up to 10k rows</div>
              <input ref={inputRef} type="file" accept=".csv,.xlsx,.json,.txt" className="hidden" onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])} />
            </div>
            {error && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-bad-soft px-3 py-2 text-[12.5px] text-bad">
                <XCircle size={14} /> {error}
              </div>
            )}
            <div className="mt-5">
              <div className="mb-2 text-[12px] font-medium text-ink-2">No file handy? Load a messy demo file</div>
              <div className="grid grid-cols-2 gap-2">
                {SAMPLE_FILES.map((s, i) => (
                  <button key={s.fileName} onClick={() => loadSample(i)} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5 text-left hover:bg-paper">
                    <span className="grid size-8 place-items-center rounded-md bg-sunken text-ink-2">{s.fileName.endsWith('json') ? <FileJson size={15} /> : <FileText size={15} />}</span>
                    <span>
                      <span className="block text-[12.5px] font-medium">{s.label}</span>
                      <span className="block font-mono text-[11px] text-muted">{s.fileName}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </Card>
          <Card className="col-span-12 xl:col-span-4" title="Dataset details">
            <div className="space-y-4">
              <Field label="Supplier">
                <select className={inputCls} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.id})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Dataset name">
                <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. October inventory refresh" />
              </Field>
              <Field label="Upload date">
                <input className={inputCls} value={fmtDateTime(new Date().toISOString())} readOnly />
              </Field>
              <Field label="File status">
                <div className="flex h-9 items-center">
                  {file ? <Badge tone="green" dot>Parsed · {file.rows.length} rows</Badge> : error ? <Badge tone="red" dot>Error</Badge> : <Badge dot>Awaiting file</Badge>}
                </div>
              </Field>
            </div>
          </Card>
          <MappingMemory />
          <DatasetHistory />
        </div>
      )}

      {step === 2 && file && (
        <div className="grid grid-cols-12 gap-5">
          <Card
            className="col-span-12 xl:col-span-8"
            pad={false}
            title="Automatic column mapping"
            subtitle={`${file.fileName} · ${file.headers.length} columns detected · ${mappedFields.length} mapped to standard fields`}
            actions={
              <Button variant="primary" disabled={!hasName} onClick={() => setStep(3)} icon={<ArrowRight size={14} />}>
                Preview data
              </Button>
            }
          >
            <table className="w-full">
              <thead className="border-b border-line bg-paper/60">
                <tr>
                  <th className={th}>Source column</th>
                  <th className={th}>Sample values</th>
                  <th className={th}></th>
                  <th className={th}>Standard field</th>
                  <th className={th}>Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {file.headers.map((h) => {
                  const c = confidence[h] ?? 0
                  const f = mapping[h]
                  const conflict = f !== 'ignore' && Object.entries(mapping).filter(([, v]) => v === f).length > 1
                  return (
                    <tr key={h}>
                      <td className={cx(td, 'font-mono text-[12.5px] font-medium')}>{h}</td>
                      <td className={cx(td, 'max-w-[240px]')}>
                        <div className="truncate text-[12px] text-muted">
                          {file.rows
                            .slice(0, 3)
                            .map((r) => r[h])
                            .filter(Boolean)
                            .join(' · ') || '—'}
                        </div>
                      </td>
                      <td className="w-6 text-faint">
                        <ArrowRight size={14} />
                      </td>
                      <td className={td}>
                        <select
                          value={f}
                          onChange={(e) => {
                            setMapping((m) => ({ ...m, [h]: e.target.value as FieldKey }))
                            setConfidence((cc) => ({ ...cc, [h]: 1 }))
                          }}
                          className={cx(inputCls, 'h-8 w-48', f === 'ignore' && 'text-faint', conflict && 'border-warn')}
                        >
                          <option value="ignore">Ignore column</option>
                          {STANDARD_FIELDS.map((sf) => (
                            <option key={sf.key} value={sf.key}>
                              {sf.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className={td}>
                        {f === 'ignore' ? (
                          <span className="text-[12px] text-faint">Not mapped</span>
                        ) : c === 1 ? (
                          <Badge tone="blue">Manual</Badge>
                        ) : (
                          <Badge tone={c >= 0.95 ? 'green' : 'amber'}>{Math.round(c * 100)}%</Badge>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!hasName && <div className="border-t border-line bg-warn-soft px-5 py-2.5 text-[12.5px] text-warn">Map at least one column to Property Name to continue.</div>}
          </Card>
          <div className="col-span-12 xl:col-span-4 space-y-5">
            <Card title="Standard schema coverage">
              <div className="flex flex-wrap gap-1.5">
                {STANDARD_FIELDS.map((f) => (
                  <span key={f.key} className={cx('rounded-md border px-2 py-1 text-[11.5px]', mappedFields.includes(f.key) ? 'border-ok/30 bg-ok-soft text-ok' : 'border-line text-faint')}>
                    {mappedFields.includes(f.key) && <Check size={11} className="mr-1 inline" />}
                    {f.label}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-[12px] leading-relaxed text-muted">
                Columns are matched against a synonym dictionary learned from earlier uploads, then by fuzzy header similarity. Override any suggestion; manual choices are marked so reviewers can audit them.
              </p>
            </Card>
            <Card title="Target supplier">
              {supplier && <SupplierChip code={supplier.code} color={supplier.color} name={supplier.name} />}
              <div className="mt-2 text-[12px] text-muted">
                Dataset “{name || file.fileName}” · {file.format} · {(file.size / 1024).toFixed(1)} KB
              </div>
            </Card>
          </div>
        </div>
      )}

      {step === 3 && file && result && (
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 xl:col-span-4 space-y-5">
            <Card title="Data normalization" subtitle="Toggle rules to see their effect in the preview">
              <div className="space-y-1">
                {RULES.map((r) => {
                  const on = rules.has(r.key)
                  return (
                    <button
                      key={r.key}
                      onClick={() => setRules((s) => { const n = new Set(s); on ? n.delete(r.key) : n.add(r.key); return n })}
                      className="flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left hover:bg-paper"
                    >
                      <span className={cx('mt-0.5 flex h-[18px] w-8 shrink-0 items-center rounded-full p-0.5 transition-colors', on ? 'bg-ink' : 'bg-line-strong')}>
                        <span className={cx('size-3.5 rounded-full bg-white transition-transform', on && 'translate-x-3.5 bg-signal')} />
                      </span>
                      <span>
                        <span className="block text-[12.5px] font-medium">{r.label}</span>
                        <span className="block font-mono text-[10.5px] text-muted">{r.example}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </Card>
            <QualityReport r={result.report} />
          </div>
          <Card
            className="col-span-12 xl:col-span-8"
            pad={false}
            title="Preview data"
            subtitle={<>Cells highlighted in <span className="rounded bg-signal/50 px-1 text-ink">lime</span> were changed by normalization. Hover to see the original value.</>}
            actions={
              <>
                <Button onClick={() => setStep(2)}>Back to mapping</Button>
                <Button variant="primary" icon={<Play size={14} />} onClick={processDataset} disabled={!result.report.valid}>
                  Process dataset
                </Button>
              </>
            }
          >
            <PreviewTable rows={result.rows} mapping={mapping} />
          </Card>
        </div>
      )}

      {step === 4 && result && file && (
        <div className="grid grid-cols-12 gap-5">
          <div className="animate-rise col-span-12 xl:col-span-8 rounded-xl border border-night-line bg-night p-7 text-white">
            <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] text-signal uppercase">
              <CheckCircle2 size={14} /> {processedId} processed
            </div>
            <h2 className="mt-3 font-serif text-[34px] leading-tight italic">{result.report.normalized} records cleaned and added to {supplier?.name}.</h2>
            <p className="mt-2 max-w-xl text-[13.5px] text-white/60">
              The normalized listings are now in the matching pool. Run matching to reconcile them with the inventory you already hold from other suppliers.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button variant="signal" icon={<Sparkles size={14} />} onClick={() => navigate('matching', { run: '1' })}>
                Start matching
              </Button>
              <Button className="!border-night-line !bg-night-2 !text-white hover:!bg-night-line" icon={<Download size={14} />} onClick={downloadCleaned}>
                Download cleaned data
              </Button>
              <Button
                className="!border-night-line !bg-night-2 !text-white hover:!bg-night-line"
                icon={<UploadCloud size={14} />}
                onClick={() => {
                  setFile(null)
                  setName('')
                  setProcessedId(null)
                  setStep(1)
                }}
              >
                Upload another
              </Button>
            </div>
          </div>
          <div className="col-span-12 xl:col-span-4">
            <QualityReport r={result.report} />
          </div>
          <div className="col-span-12 grid grid-cols-3 gap-3 xl:grid-cols-6">
            <Stat label="Total processed" value={result.report.total} />
            <Stat label="Valid records" value={result.report.valid} tone="green" />
            <Stat label="Missing fields" value={result.report.missingFields} tone="amber" />
            <Stat label="Duplicate rows" value={result.report.duplicates} tone="violet" />
            <Stat label="Invalid records" value={result.report.invalid} tone="red" />
            <Stat label="Normalized" value={result.report.normalized} sub={`${result.report.cellsChanged} cells changed`} tone="blue" />
          </div>
          <DatasetHistory className="col-span-12" />
        </div>
      )}
    </>
  )
}

function PreviewTable({ rows, mapping }: { rows: ReturnType<typeof processRows>['rows']; mapping: Record<string, FieldKey> }) {
  const fields = STANDARD_FIELDS.filter((f) => Object.values(mapping).includes(f.key))
  const srcFor = (k: FieldKey) => Object.entries(mapping).find(([, v]) => v === k)?.[0]
  return (
    <div className="max-h-[560px] overflow-auto scroll-thin">
      <table className="w-full">
        <thead className="sticky top-0 z-10 border-b border-line bg-surface">
          <tr>
            <th className={th}>#</th>
            <th className={th}>Status</th>
            {fields.map((f) => (
              <th key={f.key} className={th}>
                {f.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r, i) => (
            <tr key={i} className={cx(r.status !== 'valid' && 'bg-paper/70')}>
              <td className={cx(td, 'font-mono text-[11px] text-faint')}>{i + 1}</td>
              <td className={td}>
                {r.status === 'valid' ? <Badge tone="green">Valid</Badge> : r.status === 'duplicate' ? <Badge tone="violet">Duplicate</Badge> : <span title={r.issues.join(', ')}><Badge tone="red">Invalid</Badge></span>}
              </td>
              {fields.map((f) => {
                const changed = r.changed.has(f.key)
                const src = srcFor(f.key)
                const v = r.out[f.key]
                return (
                  <td key={f.key} className={cx(td, 'max-w-[220px] text-[12px]')}>
                    <span title={changed && src ? `Original: ${r.raw[src] || '(empty)'}` : undefined} className={cx('inline-block max-w-full truncate rounded px-1', changed && 'bg-signal/45', !v && 'text-faint')}>
                      {v || '—'}
                    </span>
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

function QualityReport({ r }: { r: ReturnType<typeof processRows>['report'] }) {
  const items: [string, number, string, ReactNode?][] = [
    ['Total records processed', r.total, 'var(--color-ink)'],
    ['Valid records', r.valid, 'var(--color-ok)'],
    ['Successfully normalized', r.normalized, 'var(--color-accent)'],
    ['Duplicate rows', r.duplicates, 'var(--color-dup)'],
    ['Invalid records', r.invalid, 'var(--color-bad)'],
    ['Missing field values', r.missingFields, 'var(--color-warn)'],
  ]
  const score = r.total ? Math.round((r.valid / r.total) * 100) : 0
  return (
    <Card title="Data quality report" actions={<span className="font-mono text-[20px] font-medium">{score}%</span>}>
      <div className="mb-4 flex h-2 overflow-hidden rounded-full bg-sunken">
        <div style={{ width: `${(r.valid / Math.max(r.total, 1)) * 100}%` }} className="bg-ok" />
        <div style={{ width: `${(r.duplicates / Math.max(r.total, 1)) * 100}%` }} className="bg-dup" />
        <div style={{ width: `${(r.invalid / Math.max(r.total, 1)) * 100}%` }} className="bg-bad" />
      </div>
      <dl className="space-y-2">
        {items.map(([k, v, c]) => (
          <div key={k} className="flex items-center justify-between text-[12.5px]">
            <dt className="flex items-center gap-2 text-ink-2">
              <span className="size-2 rounded-sm" style={{ background: c }} />
              {k}
            </dt>
            <dd className="font-mono tabular">{v}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}

function MappingMemory() {
  const rows = [
    ['Hotel_Name', 'Property', 'Property Name'],
    ['Hotel_Address', 'Location', 'Address'],
    ['Room_Desc', 'Room_Type', 'Room Type'],
    ['Meal_Plan', 'Board', 'Meal Plan'],
    ['Rate', 'Price', 'Price'],
    ['Facilities', 'Amenities', 'Amenities'],
  ]
  return (
    <Card className="col-span-12 xl:col-span-5" title="Mapping memory" subtitle="How different supplier schemas resolve to one standard" pad={false}>
      <table className="w-full">
        <thead className="border-b border-line bg-paper/60">
          <tr>
            <th className={th}>Format A</th>
            <th className={th}>Format B</th>
            <th className={th}>Standard field</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map(([a, b, s]) => (
            <tr key={s + a}>
              <td className={cx(td, 'font-mono text-[12px] text-muted')}>{a}</td>
              <td className={cx(td, 'font-mono text-[12px] text-muted')}>{b}</td>
              <td className={cx(td, 'font-medium')}>
                <span className="flex items-center gap-2">
                  <ArrowRight size={12} className="text-faint" />
                  {s}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

function DatasetHistory({ className = 'col-span-12 xl:col-span-7' }: { className?: string }) {
  const { datasets, suppliers } = useStore()
  return (
    <Card className={className} title="Dataset history" subtitle="Previously uploaded datasets" pad={false}>
      <div className="max-h-[330px] overflow-auto scroll-thin">
        <table className="w-full">
          <thead className="sticky top-0 border-b border-line bg-surface">
            <tr>
              <th className={th}>Dataset</th>
              <th className={th}>Supplier</th>
              <th className={th}>Uploaded</th>
              <th className={cx(th, 'text-right')}>Valid</th>
              <th className={th}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {datasets.map((d) => {
              const s = suppliers.find((x) => x.id === d.supplierId)
              return (
                <tr key={d.id}>
                  <td className={td}>
                    <div className="font-medium">{d.name}</div>
                    <div className="font-mono text-[11px] text-muted">
                      {d.id} · {d.fileName}
                    </div>
                  </td>
                  <td className={td}>{s ? <SupplierChip code={s.code} color={s.color} size="sm" /> : '—'}</td>
                  <td className={cx(td, 'text-[12px] text-muted')}>{fmtDateTime(d.uploadedAt)}</td>
                  <td className={cx(td, 'text-right font-mono text-[12px] tabular')}>
                    {d.valid}/{d.records}
                  </td>
                  <td className={td}>
                    <Badge tone={d.status === 'Processed' ? 'green' : d.status === 'Failed' ? 'red' : 'amber'} dot>
                      {d.status}
                    </Badge>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
