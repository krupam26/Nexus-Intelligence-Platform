import { Mail, RotateCcw, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge, Button, Card, Field, inputCls, Modal, PageHeader, Stat, timeAgo } from '../components/ui'
import { computeMatches, EVIDENCE_WEIGHTS } from '../lib/matching'
import { CURRENT_USER, useStore } from '../store'

export function SettingsPage() {
  const { settings, updateSettings, listings, decisions, manual, resetWorkspace } = useStore()
  const [auto, setAuto] = useState(settings.autoThreshold)
  const [review, setReview] = useState(settings.reviewThreshold)
  const [tax, setTax] = useState(settings.taxRate)
  const [confirmReset, setConfirmReset] = useState(false)
  const preview = useMemo(() => {
    const m = computeMatches(listings, { ...settings, autoThreshold: auto, reviewThreshold: Math.min(review, auto) }, decisions, manual)
    return { matched: m.filter((x) => x.status === 'matched').length, review: m.filter((x) => x.status === 'review').length, unmatched: m.filter((x) => x.status === 'unmatched').length }
  }, [listings, settings, auto, review, decisions, manual])
  const dirty = auto !== settings.autoThreshold || review !== settings.reviewThreshold || tax !== settings.taxRate

  return (
    <>
      <PageHeader eyebrow="System · Settings" title="Settings" description="Tune the matching engine and pricing assumptions. Changes apply across the workspace immediately after saving." />
      <div className="grid grid-cols-12 gap-5">
        <Card className="col-span-12 xl:col-span-7" title="Matching thresholds" subtitle="Decide when the engine may act alone and when a human must verify">
          <div className="space-y-6">
            <Field label={`Auto-match threshold: ${auto}%`} hint="Pairs at or above this score are matched without review.">
              <input type="range" min={60} max={99} value={auto} onChange={(e) => (setAuto(Number(e.target.value)), setReview((r) => Math.min(r, Number(e.target.value) - 1)))} className="w-full accent-ink" />
            </Field>
            <Field label={`Review threshold: ${review}%`} hint="Pairs between this and the auto-match threshold go to the human verification queue.">
              <input type="range" min={30} max={auto - 1} value={review} onChange={(e) => setReview(Number(e.target.value))} className="w-full accent-ink" />
            </Field>
            <div className="relative h-8 overflow-hidden rounded-lg bg-sunken">
              <div className="absolute inset-y-0 left-0 bg-bad-soft" style={{ width: `${review}%` }} />
              <div className="absolute inset-y-0 bg-warn-soft" style={{ left: `${review}%`, width: `${auto - review}%` }} />
              <div className="absolute inset-y-0 right-0 bg-ok-soft" style={{ left: `${auto}%` }} />
              <div className="absolute inset-0 flex items-center justify-between px-3 font-mono text-[10.5px]">
                <span className="text-bad">unmatched</span>
                <span className="text-warn">review</span>
                <span className="text-ok">auto-match</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Would auto-match" value={preview.matched} tone="green" />
              <Stat label="Would need review" value={preview.review} tone="amber" />
              <Stat label="Would stay unmatched" value={preview.unmatched} tone="red" />
            </div>
          </div>
        </Card>
        <div className="col-span-12 xl:col-span-5 space-y-5">
          <Card title="Evidence weights" subtitle="How the overall confidence is composed">
            <div className="space-y-2.5">
              {Object.entries(EVIDENCE_WEIGHTS).map(([k, v]) => (
                <div key={k} className="flex items-center gap-3 text-[12.5px]">
                  <span className="w-24 capitalize">{k}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sunken">
                    <div className="h-full rounded-full bg-ink" style={{ width: `${v * 100 * 2.5}%` }} />
                  </div>
                  <span className="w-10 text-right font-mono">{Math.round(v * 100)}%</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11.5px] text-muted">Missing evidence is redistributed across available signals. Listings more than 2.5 km apart are capped at 45%.</p>
          </Card>
          <Card title="Pricing">
            <Field label="Tax rate applied when supplier prices exclude taxes (%)">
              <input type="number" min={0} max={40} className={inputCls} value={tax} onChange={(e) => setTax(Number(e.target.value))} />
            </Field>
          </Card>
          <div className="flex gap-2">
            <Button variant="primary" disabled={!dirty} onClick={() => updateSettings({ autoThreshold: auto, reviewThreshold: review, taxRate: tax })}>
              Save settings
            </Button>
            <Button disabled={!dirty} onClick={() => (setAuto(settings.autoThreshold), setReview(settings.reviewThreshold), setTax(settings.taxRate))}>
              Discard
            </Button>
            <Button variant="danger" className="ml-auto" icon={<RotateCcw size={14} />} onClick={() => setConfirmReset(true)}>
              Reset demo data
            </Button>
          </div>
        </div>
      </div>
      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset workspace"
        footer={
          <>
            <Button onClick={() => setConfirmReset(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => (resetWorkspace(), setConfirmReset(false))}>
              Reset
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-ink-2">All uploads, decisions, manual links and settings will be discarded and the original demo data restored.</p>
      </Modal>
    </>
  )
}

export function Profile() {
  const { audit } = useStore()
  const mine = audit.filter((a) => a.actor === CURRENT_USER.name)
  return (
    <>
      <PageHeader eyebrow="System · User Profile" title="User profile" />
      <div className="grid grid-cols-12 gap-5">
        <Card className="col-span-12 xl:col-span-4">
          <div className="flex flex-col items-center py-4 text-center">
            <span className="grid size-20 place-items-center rounded-full bg-ink text-[26px] font-semibold text-signal">{CURRENT_USER.initials}</span>
            <div className="mt-4 text-[18px] font-semibold">{CURRENT_USER.name}</div>
            <div className="text-[13px] text-muted">{CURRENT_USER.role}</div>
            <div className="mt-3 flex items-center gap-1.5 text-[12.5px] text-ink-2">
              <Mail size={13} /> {CURRENT_USER.email}
            </div>
            <div className="mt-4 flex gap-1.5">
              <Badge tone="ink">Admin</Badge>
              <Badge tone="green">
                <ShieldCheck size={11} /> Verifier
              </Badge>
            </div>
          </div>
        </Card>
        <div className="col-span-12 xl:col-span-8 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Actions recorded" value={mine.length} />
            <Stat label="Match decisions" value={mine.filter((a) => a.category === 'match').length} tone="green" />
            <Stat label="Optimizations run" value={mine.filter((a) => a.category === 'optimization').length} tone="blue" />
          </div>
          <Card title="My recent activity" pad={false}>
            <ul className="divide-y divide-line">
              {mine.slice(0, 10).map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-4 px-5 py-3 text-[13px]">
                  <span>
                    <span className="font-medium">{a.action}</span> <span className="text-muted">· {a.target}</span>
                  </span>
                  <span className="font-mono text-[11px] text-faint">{timeAgo(a.at)}</span>
                </li>
              ))}
              {!mine.length && <li className="px-5 py-6 text-center text-[13px] text-muted">No activity yet.</li>}
            </ul>
          </Card>
        </div>
      </div>
    </>
  )
}
