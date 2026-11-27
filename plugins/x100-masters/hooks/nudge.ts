// The nudge beside «Tu Claude Score» in the band: a celebration when something went up, otherwise one thing to try.
// Celebrations are counted here; the «intenta esto» tips come from Sonnet once a day (yesterday's use) and, until
// then, from fixed rules that push hardest on done criteria, verification, artifacts, schedules and automations.
import type { MastersProfile, Team } from '../types'
import type { Usage } from './score'
import { dayKey } from './score'

export type Nudge = { icon: string; text: string; tip?: boolean }
export type ScoreLog = Record<string, { real: number; actual: number }>

const level = (profile: MastersProfile, id: string) => profile.metrics.find(metric => metric.id === id)?.level ?? null
const value = (profile: MastersProfile, id: string) => profile.metrics.find(metric => metric.id === id)?.value ?? 0

// Tools worth celebrating the first time, in plain words.
const NEW_TOOLS: Record<string, string> = {
  Artifact: 'tu primer artefacto',
  CronCreate: 'una tarea programada',
  ScheduleWakeup: 'un loop que trabaja solo',
  Monitor: 'un monitor',
  RemoteTrigger: 'un disparador remoto',
  Agent: 'un subagente',
  Workflow: 'un workflow de agentes',
  Skill: 'una skill',
  AskUserQuestion: 'una entrevista antes de construir',
  ExitPlanMode: 'un plan antes de construir',
  'mcp:scheduled-tasks': 'una tarea programada',
}

const isWeekend = (key: string) => {
  const weekday = new Date(`${key}T12:00:00Z`).getUTCDay()
  return weekday === 0 || weekday === 6
}

// Working days in a row with Claude, ending today or the last working day; weekends never break it.
export const streak = (usage: Usage, now: number) => {
  let count = 0
  let missed = 0
  for (let back = 0; back < 60; back++) {
    const key = dayKey(now - back * 86_400_000)
    const used = (usage[key]?.prompts ?? 0) > 0
    if (used) {
      count += 1
      continue
    }
    if (isWeekend(key)) continue
    // Today may simply not have started yet.
    if (back === 0 && missed === 0) {
      missed = 1
      continue
    }
    break
  }
  return count
}

const rankOf = (team: Team | null) => {
  const people = team?.personas ?? []
  const at = people.findIndex(person => person.yo)
  return at < 0 ? null : at + 1
}

export const celebrations = (profile: MastersProfile, usage: Usage, log: ScoreLog, team: Team | null, lastRank: number | null, now: number): Nudge[] => {
  const out: Nudge[] = []
  const today = dayKey(now)
  const before = Object.keys(log).filter(key => key < today).sort().pop()
  const prev = before === undefined ? undefined : log[before]
  const real = profile.potential?.score ?? profile.score
  if (prev !== undefined && real > prev.real) out.push({ icon: '🎉', text: `Subiste ${real - prev.real} puntos en tu Claude Score` })
  else if (prev !== undefined && profile.score > prev.actual) out.push({ icon: '📈', text: `Tu momento actual subió ${profile.score - prev.actual} puntos` })
  const rank = rankOf(team)
  if (rank !== null && lastRank !== null && rank < lastRank) out.push({ icon: '🏆', text: `Subiste al lugar ${rank} del ${team?.ranking ?? 'ranking'}` })
  const days = streak(usage, now)
  if (days >= 3) out.push({ icon: '🔥', text: `Racha de ${days} días seguidos con Claude` })
  const todayTools = Object.keys(usage[today]?.tools ?? {})
  const earlier = new Set(Object.entries(usage).filter(([key]) => key < today).flatMap(([, day]) => Object.keys(day.tools)))
  const fresh = todayTools.find(tool => NEW_TOOLS[tool] !== undefined && !earlier.has(tool))
  if (fresh !== undefined) out.push({ icon: '✨', text: `Estrenaste ${NEW_TOOLS[fresh]}` })
  if (profile.potential?.crack === true) out.push({ icon: '💎', text: 'Eres crack: nivel real de 80 o más' })
  return out
}

// Until Sonnet writes today's tips: the weakest of the habits we push most, in that order.
export const ruleTips = (profile: MastersProfile): Nudge[] => {
  const tips: Nudge[] = []
  const low = (id: string, under = 3) => {
    const found = level(profile, id)
    return found === null || found < under
  }
  if (low('criterios')) tips.push({ icon: '✅', text: 'Antes de pedir, di cómo se ve «terminado»: 3 criterios que Claude pueda probar' })
  if (low('verificacion')) tips.push({ icon: '🔍', text: 'Pide evidencia: «muéstrame la salida que prueba que funciona»' })
  if (value(profile, 'artefactos') === 0) tips.push({ icon: '🧩', text: 'Nunca has hecho un artefacto: pide «hazme un tablero con estos datos»' })
  if (low('memoria')) tips.push({ icon: '🧠', text: 'Guarda en memoria lo que aprendiste hoy: «recuerda que…» o una nota en MEMORY.md' })
  if (low('automatizacion')) tips.push({ icon: '⏰', text: 'Programa una tarea: «cada lunes a las 8 revisa esto y mándame el resumen»' })
  if (low('loops')) tips.push({ icon: '🎯', text: 'Usa /goal para que Claude trabaje hasta terminar algo' })
  if (value(profile, 'nube') === 0) tips.push({ icon: '☁️', text: 'Manda una tarea larga a la nube y sigue con lo tuyo' })
  if (value(profile, 'movil') === 0) tips.push({ icon: '📱', text: 'Prueba manejar tu sesión desde la app móvil' })
  if (low('precision')) tips.push({ icon: '🎯', text: 'Sé preciso: nombra el archivo, el dato y la cifra exacta' })
  if (low('edge_cases')) tips.push({ icon: '🧪', text: 'Lista los casos raros antes de construir y pide probarlos uno por uno' })
  return tips
}

export const parseNudges = (raw: unknown): Nudge[] =>
  (Array.isArray(raw) ? raw : [])
    .map(item => item as { icono?: unknown; texto?: unknown })
    .filter(item => typeof item.texto === 'string' && item.texto.trim() !== '')
    .map(item => ({ icon: typeof item.icono === 'string' && item.icono !== '' ? item.icono.slice(0, 4) : '💡', text: String(item.texto).trim().slice(0, 90) }))
    .slice(0, 5)

// One nudge at a time: celebrations first, then tips; it changes every 3 prompts.
export const pickNudge = (list: readonly Nudge[], promptsToday: number): Nudge | null => (list.length === 0 ? null : (list[Math.floor(promptsToday / 3) % list.length] ?? null))
