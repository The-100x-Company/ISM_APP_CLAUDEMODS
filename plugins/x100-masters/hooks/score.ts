// Pure scoring: daily usage counters → code metrics, text levels → profile. No engine calls here.
import { ALL_METRICS, CATEGORIES, CODE_METRICS, TEXT_METRICS, TIERS, WEIGHTS, codeLevel, levelOf } from './rubric'
import type { Category, Evaluator, MastersProfile, MetricResult, Potential, Recommendation } from '../types'

export type Day = {
  prompts: number
  first: number
  last: number
  sessions: number
  gaps: number
  quick: number
  tools: Record<string, number>
  tokens: number
  files: number
  plans: number
  steer: number
  desktop: number
  // Added in 0.2.0: days kept from 0.1.0 lack them, so every read goes through `?? 0`.
  commands?: number
  auto?: number
  build?: number
  // Added in 0.5.0: prompts sent from the phone or the web (Remote Control), artifacts published, cloud launches.
  mobile?: number
  artifacts?: number
  cloud?: number
  // Added in 0.6.0: writes to Claude's memory (memory/*.md, MEMORY.md, CLAUDE.md).
  memory?: number
}
export type Usage = Record<string, Day>
export type TextLevel = { level: number; evaluator: Evaluator; model: string; at: string }

const DAY_MS = 86_400_000

// Mexico City time (UTC-6, no daylight saving): the day a prompt counts for.
export const dayKey = (ms: number) => new Date(ms - 6 * 3_600_000).toISOString().slice(0, 10)

export const emptyDay = (now: number): Day => ({ prompts: 0, first: now, last: now, sessions: 0, gaps: 0, quick: 0, tools: {}, tokens: 0, files: 0, plans: 0, steer: 0, desktop: 0, commands: 0, auto: 0, build: 0 })

// 45 days are kept: the «momento actual» reads the last 30, the «nivel real» the last 45.
export const KEEP_DAYS = 45
export const prune = (usage: Usage, now: number, days: number = KEEP_DAYS): Usage => {
  const from = dayKey(now - days * DAY_MS)

  return Object.fromEntries(Object.entries(usage).filter(([key]) => key >= from))
}

const FILE = /@[\w./\\-]+|[A-Za-z]:\\[^\s]+|(?:^|\s)[\w-]+\/[\w./-]+\.\w{1,5}\b|\b[\w-]+\.(?:md|ts|tsx|js|py|csv|xlsx|json|sql|pdf|html)\b/
// Files that make up a person's system: skills, rules, instructions, hooks, mods and settings.
const SYSTEM_FILE = /(SKILL\.md|CLAUDE\.md|AGENTS\.md|[\\/]\.claude[\\/](skills|rules|commands|agents|hooks|dev-mods|workflows)[\\/]|settings(\.local)?\.json|plugin\.json|hooks\.json)/i
export const isSystemFile = (path: string) => SYSTEM_FILE.test(path)
// Memory files: <anything>/memory/<name>.md, MEMORY.md and CLAUDE.md.
export const MEMORY_FILE = /[\\/]memory[\\/][^\\/]+\.md$|(^|[\\/])(CLAUDE|MEMORY)\.md$/i
export const MEMORY_TOOLS = new Set(['Write', 'Edit', 'MultiEdit'])
// A tool call that saves something into memory.
export const isMemoryWrite = (name: string, input: Record<string, unknown>) => MEMORY_TOOLS.has(name) && MEMORY_FILE.test(String(input.file_path ?? ''))
// Tools that keep work running on its own: loops, schedules, monitors and triggers.
export const AUTOMATION_TOOLS = new Set(['CronCreate', 'ScheduleWakeup', 'Monitor', 'RemoteTrigger', 'mcp:scheduled-tasks'])
export const AUTOMATION_SKILLS = new Set(['loop', 'schedule'])

const PLAN = /\b(dame|arma|haz|escribe|prop[oó]n|pres[eé]ntame|prep[aá]rame)\s+(primero\s+)?(un|el|tu)\s+plan\b|\bantes de (hacer|ejecutar|construir|empezar|tocar|cambiar)\b|\bno (hagas|escribas|cambies|toques) nada\b|\bespera mi (ok|visto bueno|aprobaci[oó]n)\b|\bspec\b|\bespecificaci[oó]n\b|\bentrev[ií]stame\b|\bhazme (las |unas )?preguntas\b|\best[aá] (listo|terminado) cuando\b|^\s*\/(plan|goal)\b/i

export const mentionsFile = (text: string) => FILE.test(text)
export const mentionsPlan = (text: string) => PLAN.test(text)
// Tools that show a spec step: a plan presented, or Claude interviewing the person.
export const SPEC_TOOLS = new Set(['ExitPlanMode', 'AskUserQuestion'])
const SPEC_FILE = /(^|[\\/])(spec|plan|especificaci[oó]n)[\w .-]*\.md$/i
export const isSpecFile = (path: string) => SPEC_FILE.test(path)

// The raw value of each code metric over the kept days.
export const codeValues = (usage: Usage): Record<string, number> => {
  const days = Object.values(usage).filter(day => day.prompts > 0)
  const active = days.length
  const keys = Object.keys(usage).sort()
  const first = keys[0]
  const last = keys[keys.length - 1]
  const span = first === undefined || last === undefined ? 0 : Math.min(30, Math.max(15, Math.round((Date.parse(`${last}T12:00:00Z`) - Date.parse(`${first}T12:00:00Z`)) / 86_400_000) + 1))
  const sum = (pick: (day: Day) => number) => days.reduce((total, day) => total + pick(day), 0)
  const tools: Record<string, number> = {}
  for (const day of days) for (const [name, count] of Object.entries(day.tools)) tools[name] = (tools[name] ?? 0) + count
  const prompts = sum(day => day.prompts)
  const sessions = sum(day => day.sessions)
  const gaps = sum(day => day.gaps)
  const mcp = Object.entries(tools).filter(([name]) => name.startsWith('mcp')).reduce((total, [, count]) => total + count, 0)
  const per = (value: number, base: number) => (base > 0 ? value / base : 0)

  return {
    // Days of use scaled to 30 when less history exists (a first sweep sees 15 days; never fewer than 15 assumed).
    adopcion: span > 0 ? Math.min(30, (active * 30) / span) : 0,
    frecuencia: per(sum(day => day.quick), gaps),
    jornada: per(sum(day => (day.last - day.first) / 3_600_000), active),
    sesiones: per(sessions, active),
    profundidad: per(prompts, sessions),
    consumo: per(sum(day => day.tokens), active),
    variedad: Object.keys(tools).length,
    contexto: per(sum(day => day.files), prompts),
    planificacion: per(sum(day => day.plans) * 100, prompts),
    skills: per(tools.Skill ?? 0, active),
    conectores: per(mcp, active),
    conduccion: per(sum(day => day.steer) * 100, prompts),
    escritorio: per(sum(day => day.desktop), prompts),
    delegacion: per((tools.Agent ?? 0) + (tools.Task ?? 0) + (tools.Workflow ?? 0), active),
    automatizacion: per(sum(day => day.auto ?? 0), active),
    comandos: per(sum(day => day.commands ?? 0), prompts),
    construccion: per(sum(day => day.build ?? 0), active),
    movil: per(days.filter(day => (day.mobile ?? 0) > 0).length, active),
    artefactos: per(sum(day => day.artifacts ?? 0), active),
    nube: per(sum(day => day.cloud ?? 0), active),
    memoria: per(sum(day => day.memory ?? 0), active),
  }
}

export const totals = (usage: Usage) => {
  const days = Object.values(usage).filter(day => day.prompts > 0)

  return {
    dias_activos: days.length,
    prompts: days.reduce((total, day) => total + day.prompts, 0),
    sesiones: days.reduce((total, day) => total + day.sessions, 0),
    tokens: days.reduce((total, day) => total + day.tokens, 0),
  }
}

// A Haiku window moves the level a third of the way; Sonnet's daily reading replaces it.
export const mergeLevel = (prev: TextLevel | undefined, level: number, evaluator: Evaluator, model: string, at: string): TextLevel =>
  evaluator === 'haiku' && prev !== undefined ? { level: prev.level * 0.7 + level * 0.3, evaluator, model, at } : { level, evaluator, model, at }

// Each day's readings of the text metrics: Haiku windows add up, Sonnet's daily reading wins.
export type DayReading = { sum: number; n: number; sonnet?: number }
export type DayText = Record<string, Record<string, DayReading>>

export const addReading = (days: DayText, key: string, levels: Record<string, unknown>, isSonnet: boolean) => {
  const today = (days[key] ??= {})
  for (const metric of TEXT_METRICS) {
    const level = Number(levels[metric.id])
    if (!Number.isFinite(level) || level < 1 || level > 5) continue
    const reading = (today[metric.id] ??= { sum: 0, n: 0 })
    if (isSonnet) reading.sonnet = level
    else {
      reading.sum += level
      reading.n += 1
    }
  }
  // Only the last 45 days are kept.
  for (const old of Object.keys(days).sort().slice(0, -KEEP_DAYS)) delete days[old]
}

const readingOf = (reading: DayReading | undefined) => (reading === undefined ? undefined : (reading.sonnet ?? (reading.n > 0 ? reading.sum / reading.n : undefined)))

export const AVERAGE_DAYS = 10
const DAY = 86_400_000
const round1 = (n: number) => Math.round(n * 10) / 10
const mean = (list: number[]) => (list.length === 0 ? null : list.reduce((a, b) => a + b, 0) / list.length)
// 0.5.0 (Tomás 2026-11-26): scores read a little acid, never optimistic. The 1-5 average maps to 0-100 through
// x·(1+x)/2: what used to read 80 now reads 72, 54 reads 42, 30 reads 20, and 100 is still 100. Levels 1-5 stay.
export const acid = (share: number) => {
  const x = Math.max(0, Math.min(1, share))
  return (x * (1 + x)) / 2
}
export const toPercent = (levels: number[]) => {
  const avg = mean(levels)
  return avg === null ? null : Math.round(acid((avg - 1) / 4) * 100)
}

// The usage a given day saw: its own trailing 30 days.
const upTo = (usage: Usage, key: string) => {
  const from = dayKey(Date.parse(`${key}T12:00:00Z`) - 30 * DAY)
  return Object.fromEntries(Object.entries(usage).filter(([day]) => day <= key && day >= from))
}

// Each active day's level of every metric: code from that day's trailing usage, text from that day's readings.
const dailyLevels = (usage: Usage, dayText: DayText, days: string[]) =>
  days.map(key => {
    const values = codeValues(upTo(usage, key))
    const levels: Record<string, number | undefined> = {}
    for (const metric of CODE_METRICS) levels[metric.id] = codeLevel(metric, values)
    for (const metric of TEXT_METRICS) levels[metric.id] = readingOf(dayText[key]?.[metric.id])
    return levels
  })

// The profile shown and sent: every metric averaged over the last 10 days of use.
export const buildProfile = (
  email: string,
  usage: Usage,
  dayText: DayText,
  text: Record<string, TextLevel>,
  recommendations: Recommendation[],
  summary: string,
  now: number,
  memory: RealMemory = {},
): MastersProfile => {
  const at = new Date(now).toISOString()
  const kept = prune(usage, now, 30)
  const active = Object.keys(kept).filter(key => (kept[key]?.prompts ?? 0) > 0).sort().slice(-AVERAGE_DAYS)
  const daily = dailyLevels(kept, dayText, active)
  const values = codeValues(kept)
  // Adoption is a count of days, so it is judged on the whole period, not day by day.
  const adoption = CODE_METRICS.find(metric => metric.id === 'adopcion')
  const averaged = (id: string) =>
    id === 'adopcion' && adoption !== undefined && active.length > 0
      ? levelOf(values.adopcion ?? 0, adoption.cuts)
      : mean(daily.map(levels => levels[id]).filter((level): level is number => level !== undefined))
  const metrics: MetricResult[] = [
    ...CODE_METRICS.map(metric => {
      const level = averaged(metric.id)
      return { id: metric.id, category: metric.category, level: level === null ? null : round1(level), value: Math.round((values[metric.id] ?? 0) * 100) / 100, evaluator: 'codigo' as const, model: 'reglas-v3', at }
    }),
    ...TEXT_METRICS.map(metric => {
      const found = text[metric.id]
      const level = averaged(metric.id) ?? found?.level ?? null
      return { id: metric.id, category: metric.category, level: level === null ? null : round1(level), evaluator: found?.evaluator ?? 'haiku', model: found?.model ?? 'haiku', at: found?.at ?? at }
    }),
  ]
  const levelsOf = (category: Category, pick: (id: string) => number | null | undefined) =>
    ALL_METRICS.filter(metric => metric.category === category).map(metric => pick(metric.id)).filter((level): level is number => typeof level === 'number')
  const categories = Object.fromEntries(CATEGORIES.map(category => [category, toPercent(levelsOf(category, id => metrics.find(metric => metric.id === id)?.level))])) as Record<Category, number | null>
  const trend = Object.fromEntries(CATEGORIES.map(category => [category, daily.map(levels => toPercent(levelsOf(category, id => levels[id])))])) as Record<Category, (number | null)[]>
  const scored = CATEGORIES.filter(category => categories[category] !== null)
  const weight = scored.reduce((total, category) => total + WEIGHTS[category], 0)
  const score = weight === 0 ? 0 : Math.round(scored.reduce((total, category) => total + WEIGHTS[category] * (categories[category] as number), 0) / weight)
  const real = potentialLevels(usage, dayText, now, Object.fromEntries(metrics.map(metric => [metric.id, metric.level])), memory)
  for (const metric of metrics) metric.potential = real.levels[metric.id] ?? null
  const potential: Potential | null = real.days === 0 && Object.keys(memory).length === 0 ? null : { score: real.score, tier: real.tier, categories: real.categories, confidence: real.confidence, crack: real.crack, recurrent: real.recurrent }
  const realToday = real.today
  const used = active.reduce((total, key) => total + (kept[key]?.prompts ?? 0), 0)

  return {
    email,
    score,
    tier: TIERS[Math.min(4, Math.floor(score / 20))] ?? 'Inicial',
    categories,
    metrics,
    recommendations,
    summary,
    prompts: used,
    days: active.length,
    trend,
    potential,
    realToday,
    updatedAt: at,
  }
}

export const metricName = (id: string) => ALL_METRICS.find(metric => metric.id === id)?.name ?? id

// The first JSON object in a model answer, or undefined.
export const parseJson = (text: string): Record<string, unknown> | undefined => {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end <= start) return undefined
  try {
    return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>
  } catch {
    return undefined
  }
}

// ── Nivel real ────────────────────────────────────────────────────────────────────────────────────────
// «Máximo recurrente» (0.5.0, regla de Tomás 2026-11-26): the highest level a person reached at least 4 times
// in the last 45 days, with 2 of those times inside 10 consecutive days. Once reached it is remembered for
// 120 days, so vacations or light weeks never pull it down. Light days (few prompts or tokens) never count.
export const REAL = {
  minPrompts: 8, // a day with fewer prompts is a light day
  minTokens: 50_000, // …and so is one under the first «consumo» cut
  window: 45, // days read
  times: 4, // times the level must be reached
  within: 10, // two of them inside this many consecutive days
  memory: 120, // days a reached level is remembered
  fullDays: 8, // substantive days for full confidence
  crackScore: 80,
  crackConfidence: 0.75,
} as const

// Counted over the whole period: one day alone says nothing about them.
const PERIOD_METRICS = new Set(['adopcion', 'variedad'])

export const isSubstantive = (day: Day | undefined): day is Day => day !== undefined && day.prompts >= REAL.minPrompts && day.tokens >= REAL.minTokens

// Each day's recurrent maximum, per metric, for the 120-day memory (kept in the store as `realMemory`).
export type RealMemory = Record<string, Record<string, number>>

// The Potential of types/index.d.ts plus what the spider, the memory and the audit need.
export type PotentialLevels = Potential & {
  // Level 1-5 per metric, never under the current one; null when nothing was ever seen. Goes to MetricResult.potential.
  levels: Record<string, number | null>
  // Today's recurrent maximum per metric (only the metrics that qualified): written into the memory.
  today: Record<string, number>
  // Substantive days with evidence behind each metric.
  evidence: Record<string, number>
  // Substantive days in the window.
  days: number
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))
const noonOf = (key: string) => Date.parse(`${key}T12:00:00Z`)

// The highest level reached on `times` days, two of them less than `within` days apart; null when none qualifies.
export const recurrentMax = (seen: readonly { key: string; level: number }[], times: number = REAL.times, within: number = REAL.within): number | null => {
  const candidates = [...new Set(seen.map(item => item.level))].sort((a, b) => b - a)
  for (const level of candidates) {
    const days = seen.filter(item => item.level >= level).map(item => noonOf(item.key)).sort((a, b) => a - b)
    if (days.length < times) continue
    if (days.some((ms, i) => i > 0 && ms - (days[i - 1] ?? ms) < within * DAY)) return level
  }
  return null
}

// The memory's best level per metric over the last 120 days.
export const remembered = (memory: RealMemory, now: number): Record<string, number> => {
  const from = dayKey(now - REAL.memory * DAY)
  const best: Record<string, number> = {}
  for (const [key, levels] of Object.entries(memory)) {
    if (key < from) continue
    for (const [id, level] of Object.entries(levels)) best[id] = Math.max(best[id] ?? 0, level)
  }
  return best
}

// Adds today's recurrent maxima to the memory and drops what is older than 120 days.
export const remember = (memory: RealMemory, now: number, today: Record<string, number>): RealMemory => {
  const from = dayKey(now - REAL.memory * DAY)
  const kept: RealMemory = Object.fromEntries(Object.entries(memory).filter(([key]) => key >= from))
  const key = dayKey(now)
  const day = { ...(kept[key] ?? {}) }
  for (const [id, level] of Object.entries(today)) day[id] = Math.max(day[id] ?? 0, level)
  if (Object.keys(day).length > 0) kept[key] = day
  return kept
}

// `current` is the level of each metric in the «momento actual» web (profile.metrics), so the real web never falls inside it.
export const potentialLevels = (
  usage: Usage,
  dayText: DayText,
  now: number,
  current: Record<string, number | null | undefined> = {},
  memory: RealMemory = {},
): PotentialLevels => {
  const kept = prune(usage, now, REAL.window)
  const keys = Object.keys(kept).filter(key => isSubstantive(kept[key])).sort()
  const period = codeValues(prune(usage, now, 30))
  const best = remembered(memory, now)
  // Each substantive day on its own: code from that day's counters alone, text from that day's readings.
  const perDay = keys.map(key => {
    const values = codeValues({ [key]: kept[key] as Day })
    const levels: Record<string, number | undefined> = {}
    for (const metric of CODE_METRICS) if (!PERIOD_METRICS.has(metric.id)) levels[metric.id] = codeLevel(metric, values)
    for (const metric of TEXT_METRICS) levels[metric.id] = readingOf(dayText[key]?.[metric.id])
    return { key, levels }
  })
  const levels: Record<string, number | null> = {}
  const today: Record<string, number> = {}
  const evidence: Record<string, number> = {}
  let recurrent = 0

  for (const metric of ALL_METRICS) {
    const shown = current[metric.id] ?? null
    if (PERIOD_METRICS.has(metric.id)) {
      const cuts = CODE_METRICS.find(item => item.id === metric.id)?.cuts ?? []
      const whole = Object.keys(kept).length === 0 ? null : levelOf(period[metric.id] ?? 0, cuts)
      if (whole !== null && keys.length >= REAL.times) today[metric.id] = whole
      const real = Math.max(whole ?? 0, best[metric.id] ?? 0, shown ?? 0)
      levels[metric.id] = real === 0 ? null : round1(real)
      evidence[metric.id] = keys.length
      continue
    }
    const seen = perDay.flatMap(day => {
      const level = day.levels[metric.id]
      return level === undefined ? [] : [{ key: day.key, level }]
    })
    const top = recurrentMax(seen)
    if (top !== null) {
      today[metric.id] = top
      recurrent += 1
    }
    evidence[metric.id] = seen.length
    const real = Math.max(top ?? 0, best[metric.id] ?? 0, shown ?? 0)
    levels[metric.id] = real === 0 ? null : round1(real)
  }

  const inCategory = (category: Category) =>
    ALL_METRICS.filter(metric => metric.category === category)
      .map(metric => levels[metric.id])
      .filter((level): level is number => typeof level === 'number')
  const categories = Object.fromEntries(CATEGORIES.map(category => [category, toPercent(inCategory(category))])) as Record<Category, number | null>
  const scored = CATEGORIES.filter(category => categories[category] !== null)
  const weight = scored.reduce((total, category) => total + WEIGHTS[category], 0)
  const score = weight === 0 ? 0 : Math.round(scored.reduce((total, category) => total + WEIGHTS[category] * (categories[category] as number), 0) / weight)
  const confidence = Math.round(clamp01(keys.length / REAL.fullDays) * 100) / 100

  return {
    levels,
    today,
    evidence,
    confidence,
    days: keys.length,
    categories,
    score,
    tier: TIERS[Math.min(4, Math.floor(score / 20))] ?? 'Inicial',
    crack: score >= REAL.crackScore && confidence >= REAL.crackConfidence,
    recurrent,
  }
}
