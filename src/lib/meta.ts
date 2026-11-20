import type { Tone } from '../components/ui'
import type { Classification } from './equivalence'
import type { MatchPair } from '../types'

export const CLASS_META: Record<Classification, { tone: Tone; short: string; color: string }> = {
  'Exact Equivalent': { tone: 'green', short: 'Exact', color: 'var(--color-ok)' },
  'Similar Product': { tone: 'blue', short: 'Similar', color: 'var(--color-accent)' },
  'Partially Equivalent': { tone: 'amber', short: 'Partial', color: 'var(--color-warn)' },
  'Non-Equivalent': { tone: 'red', short: 'Non-eq.', color: 'var(--color-bad)' },
  'Requires Verification': { tone: 'violet', short: 'Verify', color: 'var(--color-dup)' },
}

export const STATUS_META: Record<MatchPair['status'], { label: string; tone: Tone }> = {
  matched: { label: 'Matched', tone: 'green' },
  review: { label: 'Review', tone: 'amber' },
  unmatched: { label: 'Unmatched', tone: 'red' },
  duplicate: { label: 'Duplicate', tone: 'violet' },
  rejected: { label: 'Rejected', tone: 'gray' },
}
