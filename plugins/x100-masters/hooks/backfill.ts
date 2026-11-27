// The first-run sweep: reads the person's local Claude transcripts of the last 45 days and rebuilds the
// daily counters the live hooks would have kept. Pure: the caller feeds it lines, file by file.
import { dayKey, emptyDay, isMemoryWrite, isSystemFile, mentionsFile, mentionsPlan, SPEC_TOOLS, isSpecFile, AUTOMATION_SKILLS, AUTOMATION_TOOLS } from './score'
import type { Usage } from './score'

export const SWEEP_DAYS = 45
const SAMPLE = 40

// One prompt and its moment: the talent X-ray weighs prompts outside working hours more.
export type Sample = { at: number; text: string }

// An artifact published or pinned as an app.
export const isArtifactPublish = (name: string, input: Record<string, unknown>) =>
  name === 'Artifact' && (input.action === undefined || input.action === 'publish' || input.action === 'pin') && (input.asset !== true)
// Work sent to run in the cloud: cloud sessions, routines and remote triggers.
export const isCloudLaunch = (name: string, input: Record<string, unknown>) =>
  name === 'RemoteTrigger' ||
  name === 'mcp__ccd_session__move_to_cloud' ||
  (name === 'mcp__ccd_session__start_session' && input.target === 'cloud') ||
  (name === 'Skill' && input.skill === 'schedule')

export type Sweep = {
  since: number
  usage: Usage
  times: Record<string, number[]>
  sessions: Set<string>
  messages: Set<string>
  samples: Record<string, Sample[]>
}

export const newSweep = (now: number): Sweep => ({ since: now - SWEEP_DAYS * 86_400_000, usage: {}, times: {}, sessions: new Set(), messages: new Set(), samples: {} })

const day = (sweep: Sweep, ms: number) => {
  const key = dayKey(ms)
  sweep.usage[key] ??= emptyDay(ms)
  return sweep.usage[key]
}

const textOf = (content: unknown): string | undefined => {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return undefined
  if (content.some(block => (block as { type?: string }).type === 'tool_result')) return undefined
  return content
    .filter(block => (block as { type?: string }).type === 'text')
    .map(block => String((block as { text?: unknown }).text ?? ''))
    .join('\n')
}

// One transcript line. Cheap string checks first: most lines are tool output or request blobs.
export const scanLine = (sweep: Sweep, line: string) => {
  if (line.length > 3_000_000) return
  const isUser = line.includes('"type":"user"')
  const isAssistant = line.includes('"type":"assistant"')
  if (!isUser && !isAssistant) return
  let entry: Record<string, unknown>
  try {
    entry = JSON.parse(line) as Record<string, unknown>
  } catch {
    return
  }
  if (entry.isSidechain === true) return
  const ms = Date.parse(String(entry.timestamp ?? ''))
  if (!Number.isFinite(ms) || ms < sweep.since) return
  const message = (entry.message ?? {}) as Record<string, unknown>

  if (entry.type === 'user') {
    const text = textOf(message.content)
    if (text === undefined) return
    if (text.startsWith('[Request interrupted by user')) {
      day(sweep, ms).steer += 1
      return
    }
    const origin = entry.origin as { kind?: string } | null | undefined
    if (origin?.kind !== 'human' || entry.isMeta === true) return
    const counters = day(sweep, ms)
    const key = dayKey(ms)
    counters.prompts += 1
    ;(sweep.times[key] ??= []).push(ms)
    const session = `${key}|${String(entry.sessionId ?? '')}`
    if (!sweep.sessions.has(session)) {
      sweep.sessions.add(session)
      counters.sessions += 1
    }
    if (mentionsFile(text)) counters.files += 1
    if (mentionsPlan(text)) counters.plans += 1
    if (entry.entrypoint === 'claude-desktop') counters.desktop += 1
    if (text.trimStart().startsWith('/') || text.includes('<command-name>')) counters.commands = (counters.commands ?? 0) + 1
    const sample = (sweep.samples[key] ??= [])
    if (sample.length < SAMPLE) sample.push({ at: ms, text: text.slice(0, 1_500) })
    return
  }

  const counters = day(sweep, ms)
  const id = String(message.id ?? '')
  const usage = message.usage as Record<string, number> | undefined
  if (usage !== undefined && id !== '' && !sweep.messages.has(id)) {
    sweep.messages.add(id)
    counters.tokens += (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0) + (usage.cache_creation_input_tokens ?? 0)
  }
  if (!Array.isArray(message.content)) return
  for (const block of message.content as Record<string, unknown>[]) {
    if (block.type !== 'tool_use') continue
    const name = String(block.name ?? '')
    const input = (block.input ?? {}) as Record<string, unknown>
    const key = name.startsWith('mcp__') ? `mcp:${name.split('__')[1] ?? ''}` : name
    counters.tools[key] = (counters.tools[key] ?? 0) + 1
    if (SPEC_TOOLS.has(name) || (['Write', 'Edit'].includes(name) && isSpecFile(String(input.file_path ?? '')))) counters.plans += 1
    if (AUTOMATION_TOOLS.has(key) || (name === 'Skill' && AUTOMATION_SKILLS.has(String(input.skill ?? '')))) counters.auto = (counters.auto ?? 0) + 1
    if (['Write', 'Edit', 'MultiEdit', 'NotebookEdit'].includes(name) && isSystemFile(String(input.file_path ?? input.notebook_path ?? ''))) counters.build = (counters.build ?? 0) + 1
    if (isArtifactPublish(name, input)) counters.artifacts = (counters.artifacts ?? 0) + 1
    if (isCloudLaunch(name, input)) counters.cloud = (counters.cloud ?? 0) + 1
    if (isMemoryWrite(name, input)) counters.memory = (counters.memory ?? 0) + 1
  }
}

// Turns the prompt times into first, last, gaps and quick replies, the way the live hook counts them.
export const finishSweep = (sweep: Sweep): Usage => {
  for (const [key, list] of Object.entries(sweep.times)) {
    const counters = sweep.usage[key]
    if (counters === undefined) continue
    const sorted = [...list].sort((a, b) => a - b)
    counters.first = sorted[0] ?? counters.first
    counters.last = sorted[sorted.length - 1] ?? counters.last
    counters.gaps = Math.max(0, sorted.length - 1)
    counters.quick = sorted.slice(1).filter((ms, i) => ms - (sorted[i] ?? ms) < 10 * 60_000).length
  }
  return Object.fromEntries(Object.entries(sweep.usage).filter(([, counters]) => counters.prompts > 0))
}

// Up to 10 prompts of a day, spread across it, for the day's reading.
export const pickPrompts = (sample: readonly Sample[], count = 10): Sample[] => {
  if (sample.length <= count) return [...sample]
  return Array.from({ length: count }, (_, i) => sample[Math.floor((i * sample.length) / count)] ?? { at: 0, text: '' })
}
