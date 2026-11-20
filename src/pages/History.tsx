import { Check, Download, Flag, History as HistoryIcon, Link2, RotateCcw, X } from 'lucide-react'
import { useState } from 'react'
import { Badge, Button, Card, cx, downloadFile, Empty, fmtDateTime, PageHeader, Stat, SupplierChip, Tabs, td, th, toCSV } from '../components/ui'
import { useStore } from '../store'
import type { AuditEntry } from '../types'
import { STATUS_META } from '../lib/meta'

export default function History() {
  const { matches, audit, suppliers, route, navigate, undoDecision } = useStore()
  const [tab, setTab] = useState<'decisions' | 'audit'>(route.params.tab === 'audit' ? 'audit' : 'decisions')
  const [cat, setCat] = useState<'all' | AuditEntry['category']>('all')
  const decided = matches.filter((m) => m.decision).sort((a, b) => b.decision!.at.localeCompare(a.decision!.at))
  const overridden = decided.filter((m) => (m.decision!.status === 'confirmed' && m.autoStatus !== 'matched' && m.autoStatus !== 'duplicate') || (m.decision!.status === 'rejected' && (m.autoStatus === 'matched' || m.autoStatus === 'duplicate')))
  const auditRows = audit.filter((a) => cat === 'all' || a.category === cat)
  const sup = (id: string) => suppliers.find((s) => s.id === id)

  return (
    <>
      <PageHeader
        eyebrow="Insights · Match History"
        title="Decisions and audit trail"
        description="Every human verification, manual link and system operation, with who did it and when."
        actions={
          <Button icon={<Download size={14} />} onClick={() => downloadFile('nexus_audit_trail.csv', toCSV(audit.map((a) => ({ time: a.at, actor: a.actor, category: a.category, action: a.action, target: a.target, detail: a.detail ?? '' }))))}>
            Export audit trail
          </Button>
        }
      />
      <div className="mb-6 grid grid-cols-4 gap-3">
        <Stat label="Human decisions" value={decided.length} />
        <Stat label="Confirmed" value={decided.filter((m) => m.decision!.status === 'confirmed').length} tone="green" icon={<Check size={13} />} />
        <Stat label="Rejected" value={decided.filter((m) => m.decision!.status === 'rejected').length} tone="red" icon={<X size={13} />} />
        <Stat label="AI overridden" value={overridden.length} sub="human disagreed with the engine" tone="amber" icon={<RotateCcw size={13} />} />
      </div>
      <Card
        pad={false}
        title={
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: 'decisions', label: 'Match history', count: decided.length },
              { value: 'audit', label: 'Audit trail', count: audit.length },
            ]}
          />
        }
        actions={
          tab === 'audit' && (
            <Tabs
              value={cat}
              onChange={setCat}
              items={(['all', 'match', 'dataset', 'supplier', 'optimization', 'system'] as const).map((c) => ({ value: c, label: c === 'all' ? 'All' : c[0].toUpperCase() + c.slice(1) }))}
            />
          )
        }
      >
        {tab === 'decisions' &&
          (decided.length ? (
            <table className="w-full">
              <thead className="border-b border-line bg-paper/60">
                <tr>
                  <th className={th}>When</th>
                  <th className={th}>Pair</th>
                  <th className={th}>Score</th>
                  <th className={th}>AI said</th>
                  <th className={th}>Decision</th>
                  <th className={th}>Reviewer</th>
                  <th className={th}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {decided.map((m) => {
                  const d = m.decision!
                  return (
                    <tr key={m.id} className="hover:bg-paper/60">
                      <td className={cx(td, 'font-mono text-[11.5px] text-muted')}>{fmtDateTime(d.at)}</td>
                      <td className={td}>
                        <button onClick={() => navigate('matching', { pair: m.id })} className="text-left hover:underline">
                          <div className="flex items-center gap-1.5 font-medium">
                            {sup(m.a.supplierId) && <SupplierChip code={sup(m.a.supplierId)!.code} color={sup(m.a.supplierId)!.color} size="sm" />}
                            {m.a.name}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5 font-medium">
                            {sup(m.b.supplierId) && <SupplierChip code={sup(m.b.supplierId)!.code} color={sup(m.b.supplierId)!.color} size="sm" />}
                            {m.b.name}
                          </div>
                        </button>
                        {d.note && <div className="mt-1 text-[11.5px] text-muted italic">“{d.note}”</div>}
                      </td>
                      <td className={cx(td, 'font-mono')}>{(m.evidence.overall * 100).toFixed(0)}%</td>
                      <td className={td}>
                        <Badge tone={STATUS_META[m.autoStatus].tone}>{STATUS_META[m.autoStatus].label}</Badge>
                      </td>
                      <td className={td}>
                        <span className="flex items-center gap-1.5">
                          {d.status === 'confirmed' ? <Badge tone="green" dot>Confirmed</Badge> : d.status === 'rejected' ? <Badge tone="red" dot>Rejected</Badge> : <Badge tone="amber" dot>Flagged</Badge>}
                          {m.manual && (
                            <span className="flex items-center gap-0.5 text-[11px] text-muted">
                              <Link2 size={11} /> manual
                            </span>
                          )}
                        </span>
                      </td>
                      <td className={cx(td, 'text-ink-2')}>{d.by}</td>
                      <td className={td}>
                        <Button size="sm" variant="ghost" icon={<RotateCcw size={12} />} onClick={() => undoDecision(m)}>
                          Revert
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <Empty icon={<Flag size={18} />} title="No decisions yet" body="Confirm, reject or flag matches in AI Matching Intelligence to build a decision history." action={<Button onClick={() => navigate('matching', { filter: 'review' })}>Open review queue</Button>} />
          ))}
        {tab === 'audit' && (
          <ol className="relative px-5 py-4">
            <span className="absolute top-6 bottom-6 left-[29px] w-px bg-line" />
            {auditRows.map((a) => (
              <li key={a.id} className="relative flex gap-4 py-2.5">
                <span className={cx('relative z-10 mt-1 size-[10px] shrink-0 rounded-full ring-4 ring-surface', { match: 'bg-ok', dataset: 'bg-accent', supplier: 'bg-ink-2', optimization: 'bg-warn', system: 'bg-faint' }[a.category])} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px]">
                    <span className="font-medium">{a.action}</span> <span className="text-muted">·</span> {a.target}
                  </div>
                  {a.detail && <div className="text-[12px] text-muted">{a.detail}</div>}
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-[11px] text-faint">{fmtDateTime(a.at)}</div>
                  <div className="text-[11.5px] text-ink-2">{a.actor}</div>
                </div>
              </li>
            ))}
            {!auditRows.length && <Empty icon={<HistoryIcon size={18} />} title="No entries in this category" />}
          </ol>
        )}
      </Card>
    </>
  )
}
