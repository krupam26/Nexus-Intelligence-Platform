import { X } from 'lucide-react'
import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react'

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4 animate-rise">
      <div className="max-w-2xl">
        <div className="mb-2 font-mono text-[11px] tracking-[0.14em] text-muted uppercase">{eyebrow}</div>
        <h1 className="text-[30px] leading-[1.1] font-semibold tracking-[-0.02em] text-ink">{title}</h1>
        {description && <p className="mt-2 text-[14px] leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Card({ title, subtitle, actions, children, className, pad = true }: { title?: ReactNode; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={cx('rounded-xl border border-line bg-surface shadow-[0_1px_0_rgba(20,22,27,0.03)]', className)}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div>
            {title && <h2 className="text-[14px] font-semibold tracking-[-0.005em] text-ink">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-[12px] text-muted">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={pad ? 'p-5' : ''}>{children}</div>
    </section>
  )
}

export function Stat({ label, value, sub, tone, icon }: { label: string; value: ReactNode; sub?: ReactNode; tone?: Tone; icon?: ReactNode }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-line bg-surface px-4 py-4">
      <div className="flex items-center justify-between">
        <span className="truncate text-[12px] text-muted">{label}</span>
        {icon && <span className={cx('grid size-6 shrink-0 place-items-center rounded-md', tone ? TONE_BG[tone] : 'bg-sunken text-ink-2')}>{icon}</span>}
      </div>
      <div className="mt-3 font-mono text-[28px] leading-none font-medium tracking-[-0.03em] text-ink tabular">{value}</div>
      {sub && <div className="mt-2 text-[12px] text-muted">{sub}</div>}
    </div>
  )
}

export type Tone = 'green' | 'amber' | 'red' | 'violet' | 'blue' | 'gray' | 'ink'
export const TONE_BG: Record<Tone, string> = {
  green: 'bg-ok-soft text-ok',
  amber: 'bg-warn-soft text-warn',
  red: 'bg-bad-soft text-bad',
  violet: 'bg-dup-soft text-dup',
  blue: 'bg-accent-soft text-accent',
  gray: 'bg-sunken text-ink-2',
  ink: 'bg-ink text-white',
}
export const TONE_FG: Record<Tone, string> = {
  green: 'var(--color-ok)',
  amber: 'var(--color-warn)',
  red: 'var(--color-bad)',
  violet: 'var(--color-dup)',
  blue: 'var(--color-accent)',
  gray: 'var(--color-faint)',
  ink: 'var(--color-ink)',
}

export function Badge({ tone = 'gray', children, dot }: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap', TONE_BG[tone])}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'signal'; size?: 'sm' | 'md'; icon?: ReactNode }
export function Button({ variant = 'secondary', size = 'md', icon, className, children, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap transition-[background,color,box-shadow,transform] active:translate-y-px disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        size === 'sm' ? 'h-7 px-2.5 text-[12px]' : 'h-9 px-3.5 text-[13px]',
        variant === 'primary' && 'bg-ink text-white hover:bg-ink-2',
        variant === 'signal' && 'bg-signal text-ink hover:brightness-95',
        variant === 'secondary' && 'border border-line bg-surface text-ink shadow-[0_1px_0_rgba(0,0,0,0.03)] hover:border-line-strong hover:bg-paper',
        variant === 'ghost' && 'text-ink-2 hover:bg-sunken',
        variant === 'danger' && 'border border-bad/20 bg-bad-soft text-bad hover:bg-bad hover:text-white',
        className,
      )}
    >
      {icon}
      {children}
    </button>
  )
}

export function Meter({ value, tone = 'blue', className }: { value: number; tone?: Tone; className?: string }) {
  return (
    <div className={cx('h-1.5 w-full overflow-hidden rounded-full bg-sunken', className)}>
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: TONE_FG[tone] }} />
    </div>
  )
}

export function scoreTone(score: number, auto = 85, review = 60): Tone {
  return score >= auto ? 'green' : score >= review ? 'amber' : 'red'
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { value: T; label: ReactNode; count?: number }[] }) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-sunken p-0.5">
      {items.map((it) => (
        <button
          key={it.value}
          onClick={() => onChange(it.value)}
          className={cx('flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium transition-colors', value === it.value ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink')}
        >
          {it.label}
          {it.count != null && <span className="font-mono text-[10px] text-faint">{it.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-ink-2">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-faint">{hint}</span>}
    </label>
  )
}

export const inputCls = 'h-9 w-full rounded-lg border border-line bg-surface px-3 text-[13px] text-ink outline-none placeholder:text-faint focus:border-accent focus:ring-3 focus:ring-accent/15'

export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return
    const on = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-night/40 p-4 backdrop-blur-[2px]" onMouseDown={onClose}>
      <div className={cx('animate-rise max-h-[90vh] w-full overflow-auto rounded-2xl border border-line bg-surface shadow-2xl scroll-thin', wide ? 'max-w-3xl' : 'max-w-lg')} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="text-[15px] font-semibold">{title}</h3>
          <button onClick={onClose} className="grid size-7 place-items-center rounded-md text-muted hover:bg-sunken" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line bg-paper/60 px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}

export function Empty({ icon, title, body, action }: { icon: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 grid size-10 place-items-center rounded-xl bg-sunken text-muted">{icon}</div>
      <div className="text-[14px] font-medium">{title}</div>
      {body && <p className="mt-1 max-w-sm text-[13px] text-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function SupplierChip({ code, color, name, size = 'md' }: { code: string; color: string; name?: string; size?: 'sm' | 'md' }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cx('grid shrink-0 place-items-center rounded-md font-mono font-semibold text-white', size === 'sm' ? 'size-5 text-[10px]' : 'size-6 text-[11px]')} style={{ background: color }}>
        {code}
      </span>
      {name && <span className="truncate">{name}</span>}
    </span>
  )
}

export const th = 'px-4 py-2.5 text-left text-[11px] font-medium tracking-wide text-muted uppercase whitespace-nowrap'
export const td = 'px-4 py-3 text-[13px] align-middle'

export function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  const d = Math.floor(s / 86400)
  return d === 1 ? 'yesterday' : `${d}d ago`
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
export function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
export const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

export function downloadFile(name: string, content: string, type = 'text/csv') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function toCSV(rows: Record<string, unknown>[]) {
  if (!rows.length) return ''
  const cols = Object.keys(rows[0])
  const esc = (v: unknown) => {
    const s = Array.isArray(v) ? v.join('; ') : v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n')
}
