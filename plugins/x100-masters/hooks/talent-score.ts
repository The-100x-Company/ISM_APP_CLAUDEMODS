// The talent X-ray: which archetypes show up when the person works WITH Claude, not when they hand work off.
// Informative only: it never touches the score and never leaves the person's machine.
import { ARCHETYPES, PAIRS } from './talent'
import type { Archetype, ArchetypeId, Pair } from './talent'
import { dayKey } from './score'

// One prompt as Haiku labels it: h = higiene (formato, ortografía, traducir, resumir), d = delegación, c = co-creación.
export type TalentLabel = { t: 'h' | 'd' | 'c'; a: string[]; e?: string }
export type TalentDay = { w: Record<string, number>; total: number; n: number; c: number }
export type TalentStore = { days: Record<string, TalentDay>; evidence: Record<string, string[]> }

// Fable's starting values (docs/0B §B), not yet calibrated with real data.
export const TALENT = {
  // Hygiene weighs almost nothing; blind delegation little; co-creation (own criterion, iteration) in full.
  weights: { h: 0.05, d: 0.25, c: 1 },
  // Outside working hours (Mon-Fri 08:00-19:00 is work) the vocation shows without the job's filter; only d and c.
  offHours: 1.5,
  second: 0.5, // the second archetype of a prompt
  dayCap: 6, // points per day and axis: one marathon day cannot draw the profile
  keepDays: 90,
  minWeight: 30, // points before the chart shows…
  minDays: 5, // …on this many different days
  minAxis: 3, // points before an axis is drawn
  minPair: 5, // points on each of the two top axes before the pair is named
} as const

export const emptyTalent = (): TalentStore => ({ days: {}, evidence: {} })

// Mexico City time: weekends, and weekdays before 8:00 or from 19:00.
export const isOffHours = (ms: number) => {
  const local = new Date(ms - 6 * 3_600_000)
  const weekday = local.getUTCDay()
  const hour = local.getUTCHours()
  return weekday === 0 || weekday === 6 || hour < 8 || hour >= 19
}

const IDS = new Set<string>(ARCHETYPES.map(item => item.id))

export const parseLabels = (raw: unknown): TalentLabel[] =>
  (Array.isArray(raw) ? raw : []).map(item => {
    const label = (item ?? {}) as { t?: unknown; a?: unknown; e?: unknown }
    const t = label.t === 'h' || label.t === 'd' || label.t === 'c' ? label.t : 'd'
    const a = (Array.isArray(label.a) ? label.a : []).map(String).filter(id => IDS.has(id)).slice(0, 2)
    const e = typeof label.e === 'string' && label.e.trim() !== '' ? label.e.trim().slice(0, 120) : undefined
    return e === undefined ? { t, a } : { t, a, e }
  })

// Adds one window of labels; `times` are the prompts' moments, in the same order.
export const addTalent = (store: TalentStore, labels: readonly TalentLabel[], times: readonly number[], now: number): TalentStore => {
  const next: TalentStore = { days: { ...store.days }, evidence: { ...store.evidence } }
  labels.forEach((label, i) => {
    const at = times[i] ?? now
    const key = dayKey(at)
    const day = (next.days[key] = { ...(next.days[key] ?? { w: {}, total: 0, n: 0, c: 0 }), w: { ...(next.days[key]?.w ?? {}) } })
    const weight = TALENT.weights[label.t] * (label.t !== 'h' && isOffHours(at) ? TALENT.offHours : 1)
    day.n += 1
    if (label.t === 'c') day.c += 1
    if (label.a.length === 0) return
    day.total += weight
    // The first archetype is the main one; the second counts half.
    label.a.forEach((id, j) => {
      day.w[id] = (day.w[id] ?? 0) + weight * (j === 0 ? 1 : TALENT.second)
    })
    if (label.t === 'c' && label.e !== undefined && label.a[0] !== undefined) next.evidence[label.a[0]] = [label.e, ...(next.evidence[label.a[0]] ?? [])].slice(0, 3)
  })
  const from = dayKey(now - TALENT.keepDays * 86_400_000)
  for (const key of Object.keys(next.days)) if (key < from) delete next.days[key]
  return next
}

export type TalentProfile = {
  ready: boolean
  // Whether the two top axes have enough points to name the pair.
  named: boolean
  days: number
  // Points per archetype (capped per day), before the scaling to 0-100.
  points: Record<ArchetypeId, number>
  // 0-100 per archetype, relative to the person's own peak (it is a profile, not a ranking).
  scores: Record<ArchetypeId, number>
  top: [Archetype, Archetype]
  low: [Archetype, Archetype]
  pair: Pair
  partner: Pair
  weight: number
  prompts: number
  cocreation: number
  evidence: Record<string, string[]>
}

const pairOf = (a: ArchetypeId, b: ArchetypeId): Pair => {
  const order = ARCHETYPES.map(item => item.id)
  const [first, second] = order.indexOf(a) < order.indexOf(b) ? [a, b] : [b, a]
  return PAIRS[`${first}+${second}`] ?? { name: 'Perfil en formación', line: 'Aún reunimos evidencia de tu estilo.', fiction: '', real: '' }
}

export const talentProfile = (store: TalentStore): TalentProfile => {
  const sums: Record<string, number> = {}
  let weight = 0
  let prompts = 0
  let cocreated = 0
  let days = 0
  for (const day of Object.values(store.days)) {
    weight += day.total
    prompts += day.n
    cocreated += day.c
    if (day.total > 0) days += 1
    for (const [id, value] of Object.entries(day.w)) sums[id] = (sums[id] ?? 0) + Math.min(TALENT.dayCap, value)
  }
  // Square root: the second axis is not crushed by the first, so the shape reads as a profile.
  const peak = Math.sqrt(Math.max(0, ...Object.values(sums)))
  const scores = Object.fromEntries(
    ARCHETYPES.map(item => {
      const points = sums[item.id] ?? 0
      return [item.id, peak === 0 || points < TALENT.minAxis ? 0 : Math.round((100 * Math.sqrt(points)) / peak)]
    }),
  ) as Record<ArchetypeId, number>
  const points = Object.fromEntries(ARCHETYPES.map(item => [item.id, Math.round((sums[item.id] ?? 0) * 10) / 10])) as Record<ArchetypeId, number>
  const ranked = [...ARCHETYPES].sort((a, b) => scores[b.id] - scores[a.id])
  const first = ranked[0] as Archetype
  const second = ranked[1] as Archetype
  const last = ranked[ranked.length - 1] as Archetype
  const beforeLast = ranked[ranked.length - 2] as Archetype

  return {
    ready: weight >= TALENT.minWeight && days >= TALENT.minDays,
    named: (sums[first.id] ?? 0) >= TALENT.minPair && (sums[second.id] ?? 0) >= TALENT.minPair,
    days,
    points,
    scores,
    top: [first, second],
    low: [beforeLast, last],
    pair: pairOf(first.id, second.id),
    partner: pairOf(beforeLast.id, last.id),
    weight: Math.round(weight * 10) / 10,
    prompts,
    cocreation: prompts === 0 ? 0 : Math.round((100 * cocreated) / prompts),
    evidence: store.evidence,
  }
}
