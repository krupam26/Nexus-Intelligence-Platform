import { useState, type ReactNode } from 'react'
import { cx } from './ui'

export function BarList({ items, format = (n) => String(n), max }: { items: { label: ReactNode; value: number; color?: string; sub?: ReactNode }[]; format?: (n: number) => string; max?: number }) {
  const m = max ?? Math.max(...items.map((i) => i.value), 1)
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[12px]">
            <span className="min-w-0 truncate text-ink-2">{it.label}</span>
            <span className="font-mono text-ink tabular">
              {format(it.value)}
              {it.sub && <span className="ml-1.5 text-faint">{it.sub}</span>}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-sunken">
            <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${(it.value / m) * 100}%`, background: it.color ?? 'var(--color-ink)' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function Columns({ data, height = 160, colorFor }: { data: { label: string; value: number }[]; height?: number; colorFor?: (label: string, i: number) => string }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  const [hover, setHover] = useState<number | null>(null)
  return (
    <div>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d, i) => (
          <div key={d.label} className="relative flex h-full flex-1 flex-col justify-end" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            {hover === i && <div className="absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full rounded-md bg-ink px-2 py-1 font-mono text-[11px] whitespace-nowrap text-white">{d.value}</div>}
            <div className={cx('rounded-t-[4px] transition-all duration-500', hover === i && 'brightness-110')} style={{ height: `${Math.max((d.value / max) * 100, d.value ? 3 : 0)}%`, background: colorFor?.(d.label, i) ?? 'var(--color-ink)' }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5 border-t border-line pt-2">
        {data.map((d) => (
          <div key={d.label} className="flex-1 text-center font-mono text-[10px] text-faint">
            {d.label}
          </div>
        ))}
      </div>
    </div>
  )
}

export function Donut({ segments, size = 148, thickness = 16, center }: { segments: { label: string; value: number; color: string }[]; size?: number; thickness?: number; center?: ReactNode }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  let acc = 0
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-sunken)" strokeWidth={thickness} />
        {segments.map((s) => {
          const len = (s.value / total) * c
          const el = <circle key={s.label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={thickness} strokeDasharray={`${Math.max(len - 2, 0)} ${c}`} strokeDashoffset={-acc} className="transition-all duration-700" />
          acc += len
          return el
        })}
      </svg>
      {center && <div className="absolute inset-0 grid place-items-center text-center">{center}</div>}
    </div>
  )
}

export function Legend({ items }: { items: { label: string; value: ReactNode; color: string }[] }) {
  return (
    <div className="space-y-2">
      {items.map((i) => (
        <div key={i.label} className="flex items-center justify-between gap-4 text-[12px]">
          <span className="flex items-center gap-2 text-ink-2">
            <span className="size-2 rounded-sm" style={{ background: i.color }} />
            {i.label}
          </span>
          <span className="font-mono text-ink tabular">{i.value}</span>
        </div>
      ))}
    </div>
  )
}

export function Ring({ value, size = 64, stroke = 6, color = 'var(--color-ink)', children }: { value: number; size?: number; stroke?: number; color?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-sunken)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${(Math.max(0, Math.min(100, value)) / 100) * c} ${c}`} className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  )
}
