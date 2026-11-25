// Pure scoring: daily usage counters → code metrics, text levels → profile. No engine calls here.
import { ALL_METRICS, CATEGORIES, CODE_METRICS, TEXT_METRICS, TIERS, WEIGHTS, levelOf } from './rubric'
import type { Category, Evaluator, MastersProfile, MetricResult, Recommendation } from '../types'

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
}
export type Usage = Record<string, Day>
export type TextLevel = { level: number; evaluator: Evaluator; model: string; at: string }

const DAY_MS = 86_400_000

// Mexico City time (UTC-6, no daylight saving): the day a prompt counts for.
export const dayKey = (ms: number) => new Date(ms - 6 * 3_600_000).toISOString().slice(0, 10)

export const emptyDay = (now: number): Day => ({ prompts: 0, first: now, last: now, sessions: 0, gaps: 0, quick: 0, tools: {}, tokens: 0, files: 0, plans: 0, steer: 0, desktop: 0, commands: 0, auto: 0, build: 0 })

// Only the last 30 days are kept and scored.
export const prune = (usage: Usage, now: number): Usage => {
  const from = dayKey(now - 30 * DAY_MS)

  return Object.fromEntries(Object.entries(usage).filter(([key]) => key >= from))
}

const FILE = /@[\w./\\-]+|[A-Za-z]:\\[^\s]+|(?:^|\s)[\w-]+\/[\w./-]+\.\w{1,5}\b|\b[\w-]+\.(?:md|ts|tsx|js|py|csv|xlsx|json|sql|pdf|html)\b/
// Files that make up a person's system: skills, rules, instructions, hooks, mods and settings.
const SYSTEM_FILE = /(SKILL\.md|CLAUDE\.md|AGENTS\.md|[\\/]\.claude[\\/](skills|rules|commands|agents|hooks|dev-mods|workflows)[\\/]|settings(\.local)?\.json|plugin\.json|hooks\.json)/i
export const isSystemFile = (path: string) => SYSTEM_FILE.test(path)
// Tools that keep work running on its own: loops, schedules, monitors and triggers.
export const AUTOMATION_TOOLS = new Set(['CronCreate', 'ScheduleWakeup', 'Monitor', 'RemoteTrigger', 'mcp:scheduled-tasks'])
export const AUTOMATION_SKILLS = new Set(['loop', 'schedule'])

const PLAN = /\b(plan|spec|especificaci[oó]n|fases?|antes de ejecutar|no escribas c[oó]digo)\b/i

export const mentionsFile = (text: string) => FILE.test(text)
export const mentionsPlan = (text: string) => PLAN.test(text)

// The raw value of each code metric over the kept days.
export const codeValues = (usage: Usage): Record<string, number> => {
  const days = Object.values(usage).filter(day => day.prompts > 0)
  const active = days.length
  const sum = (pick: (day: Day) => number) => days.reduce((total, day) => total + pick(day), 0)
  const tools: Record<string, number> = {}
  for (const day of days) for (const [name, count] of Object.entries(day.tools)) tools[name] = (tools[name] ?? 0) + count
  const prompts = sum(day => day.prompts)
  const sessions = sum(day => day.sessions)
  const gaps = sum(day => day.gaps)
  const mcp = Object.entries(tools).filter(([name]) => name.startsWith('mcp')).reduce((total, [, count]) => total + count, 0)
  const per = (value: number, base: number) => (base > 0 ? value / base : 0)

  return {
    adopcion: active,
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
  // Only the last 30 days are kept.
  for (const old of Object.keys(days).sort().slice(0, -30)) delete days[old]
}

const readingOf = (reading: DayReading | undefined) => (reading === undefined ? undefined : (reading.sonnet ?? (reading.n > 0 ? reading.sum / reading.n : undefined)))

export const AVERAGE_DAYS = 10
const DAY = 86_400_000
const round1 = (n: number) => Math.round(n * 10) / 10
const mean = (list: number[]) => (list.length === 0 ? null : list.reduce((a, b) => a + b, 0) / list.length)
const toPercent = (levels: number[]) => {
  const avg = mean(levels)
  return avg === null ? null : Math.round(((avg - 1) / 4) * 100)
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
    for (const metric of CODE_METRICS) levels[metric.id] = levelOf(values[metric.id] ?? 0, metric.cuts)
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
): MastersProfile => {
  const at = new Date(now).toISOString()
  const kept = prune(usage, now)
  const active = Object.keys(kept).filter(key => (kept[key]?.prompts ?? 0) > 0).sort().slice(-AVERAGE_DAYS)
  const daily = dailyLevels(kept, dayText, active)
  const values = codeValues(kept)
  const averaged = (id: string) => mean(daily.map(levels => levels[id]).filter((level): level is number => level !== undefined))
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
