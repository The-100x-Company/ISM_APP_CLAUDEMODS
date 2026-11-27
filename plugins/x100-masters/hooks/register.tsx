import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'
import type { Category, Consumo, MastersProfile, Recommendation, Team, TeamTalent } from '../types'
import { CATEGORIES, CATEGORY_NAMES, HAIKU_SYSTEM, SONNET_SYSTEM, TEXT_METRICS } from './rubric'
import { AUTOMATION_SKILLS, AUTOMATION_TOOLS, addReading, buildProfile, codeValues, dayKey, emptyDay, isMemoryWrite, isSystemFile, mentionsFile, mentionsPlan, SPEC_TOOLS, isSpecFile, mergeLevel, parseJson, prune, remember, totals } from './score'
import type { DayText, RealMemory, TextLevel, Usage } from './score'
import { finishSweep, newSweep, pickPrompts, scanLine, isArtifactPublish, isCloudLaunch } from './backfill'
import type { Sample } from './backfill'
import { BYLINE, TITLE, improvements, report, spider, webIcon } from './visuals'
import { nameOf, personaOf } from './hash'
import { celebrations, parseNudges, pickNudge, ruleTips } from './nudge'
import type { Nudge, ScoreLog } from './nudge'
import { addTalent, emptyTalent, parseLabels, talentProfile } from './talent-score'
import type { TalentStore } from './talent-score'

// «Tu Claude Score» by The 100x Co. Measures how well a person uses Claude on 41 metrics in four categories and
// sends the scores, never the prompts and never the email (only its hash). Any company can use it: the server
// knows which organizations and domains belong to which company, and hands each install a key on its first send.
// On its first run it sweeps the person's last 45 days of local transcripts; after that, code counts every prompt
// and tool, Haiku reads each 10-prompt window and Sonnet does the full evaluation once a day.

const PANE = 'x100-masters'
const VERSION = '0.5.1'
const SWEEP = 'v3'
const WINDOW = 10
const DAY = 86_400_000
// The doors into Supabase (100x-staging): checked RPCs. The publishable key is public by design; the functions,
// not the key, decide what gets in (company, domain, key, size, rate).
const BASE = 'https://oqhqazffrdeegqesukia.supabase.co/rest/v1/rpc'
const ENDPOINT = `${BASE}/x100_masters_ingest`
const REGISTER_ENDPOINT = `${BASE}/x100_masters_registro`
const TEAM_ENDPOINT = `${BASE}/x100_masters_equipo`
const PUBLISHABLE_KEY = 'sb_publishable_BBepv64edBJZsgY90-ZZOQ_V0j81N55'
const HEADERS = { 'content-type': 'application/json', apikey: PUBLISHABLE_KEY }
const PERSON = new Set(['composer', 'bridge'])
const CHUNK = 4 * 1024 * 1024

type Trigger = 'ventana' | 'diaria' | 'cierre' | 'barrido'
type Excerpt = { at: number; text: string }
// The install's registration: the key lives only here, the server keeps its hash.
type Alta = { llave?: string; empresa?: string | null; ranking?: string; persona?: string; at: number }

const profile = atom({ plugin: 'x100-masters', key: 'profile' } as const, null as MastersProfile | null)
const nudge = atom({ plugin: 'x100-masters', key: 'nudge' } as const, null as Nudge | null)

const load = async <T,>($: EngineInterface, key: string, fallback: T): Promise<T> => ((await $.store.get(key)) as T | undefined) ?? fallback

// What the mod itself spends on the model, per day (30 kept): every call goes through `ask`.
type Bucket = { entrada: number; salida: number; cache_leida: number; cache_escrita: number; llamadas: number }
type Spend = Record<string, Bucket>

const ask = async ($: EngineInterface, request: Parameters<EngineInterface['model']['complete']>[0]) => {
  const result = await $.model.complete(request)
  const usage = result.usage as Partial<Record<'input_tokens' | 'output_tokens' | 'cache_read_input_tokens' | 'cache_creation_input_tokens', number>> | undefined
  try {
    const spend = await load<Spend>($, 'consumo', {})
    const key = dayKey(Date.now())
    const bucket = spend[key] ?? { entrada: 0, salida: 0, cache_leida: 0, cache_escrita: 0, llamadas: 0 }
    bucket.entrada += usage?.input_tokens ?? 0
    bucket.salida += usage?.output_tokens ?? 0
    bucket.cache_leida += usage?.cache_read_input_tokens ?? 0
    bucket.cache_escrita += usage?.cache_creation_input_tokens ?? 0
    bucket.llamadas += 1
    spend[key] = bucket
    for (const old of Object.keys(spend).sort().slice(0, -30)) delete spend[old]
    await $.store.set('consumo', spend)
  } catch {
    // Counting the cost never breaks the call.
  }

  return result
}

// Totals over the last 30 days; `dias` counts the days that had calls.
const consumoOf = (spend: Spend, now: number): Consumo => {
  const from = dayKey(now - 30 * DAY)
  const total: Consumo = { entrada: 0, salida: 0, cache_leida: 0, cache_escrita: 0, llamadas: 0, dias: 0 }
  for (const [key, bucket] of Object.entries(spend)) {
    if (key < from || bucket.llamadas <= 0) continue
    total.entrada += bucket.entrada
    total.salida += bucket.salida
    total.cache_leida += bucket.cache_leida
    total.cache_escrita += bucket.cache_escrita
    total.llamadas += bucket.llamadas
    total.dias += 1
  }

  return total
}

// The talent summary that leaves the machine: pair name, two top archetypes and scores. Never evidence or prompts.
const talentOf = (store: TalentStore): TeamTalent => {
  const found = talentProfile(store)

  return { listo: found.ready && found.named, par: found.ready && found.named ? found.pair.name : null, top: [found.top[0].id, found.top[1].id], puntajes: found.scores }
}

// The surface last seen drawing the band, and whether a sweep is running in this module.
let surface = ''
let isSweeping = false

// Home folder, taken from where the mod is installed (always under <home>/.claude/).
const homeOf = (root: string) => root.split(/[\\/]\.claude[\\/]/)[0] ?? root
const separatorOf = (home: string) => (/^[A-Za-z]:/.test(home) ? '\\' : '/')

// On Team the organization's guard denies `session.identity` to a mod, so the account Claude Code signed in
// with is read from ~/.claude.json (oauthAccount) when the engine does not answer.
const identity = async ($: EngineInterface) => {
  const who = await $.session.identity().catch(() => undefined)
  let email = who?.email ?? ''
  let organizationId = who?.organizationId ?? ''
  let fullName = ''
  let role = ''
  let seat = ''
  let rate = ''
  const home = homeOf($.plugin.root)
  const raw = await $.fs.read(`${home}${separatorOf(home)}.claude.json`).catch(() => '')
  try {
    const account = (JSON.parse(typeof raw === 'string' ? raw : '{}') as { oauthAccount?: { emailAddress?: string; organizationUuid?: string; fullName?: string; displayName?: string; organizationRole?: string; seatTier?: string; userRateLimitTier?: string } }).oauthAccount
    email ||= account?.emailAddress ?? ''
    organizationId ||= account?.organizationUuid ?? ''
    fullName = account?.fullName ?? account?.displayName ?? ''
    role = account?.organizationRole ?? ''
    seat = account?.seatTier ?? ''
    rate = account?.userRateLimitTier ?? ''
  } catch {
    // No readable account: nothing is sent.
  }
  email = email.trim().toLowerCase()

  // The role in the Claude organization (owner, primary_owner, admin, user) opens the members' view in the ranking.
  // Premium seat [?]: Team seats read «team_tier_1» with a Max-level usage tier on a premium seat; to calibrate.
  const licencia = seat === '' ? null : /premium|tier_1/i.test(seat) || /max/i.test(rate) ? 'premium' : 'estandar'

  return { email, organizationId, persona: email === '' ? '' : personaOf(email), nombre: nameOf(fullName, email), dominio: email.split('@')[1] ?? '', rol: role, licencia, asiento: seat }
}
type Who = Awaited<ReturnType<typeof identity>>

// The install's key: asked once; a company that is not registered is asked again after a day.
const enroll = async ($: EngineInterface, who: Who): Promise<Alta | null> => {
  const alta = await load<Alta>($, 'alta', { at: 0 })
  if (alta.persona === who.persona && alta.llave !== undefined) return alta
  if (alta.persona === who.persona && alta.empresa === null && Date.now() - alta.at < DAY) return alta
  if (who.persona === '' || who.organizationId === '') return null
  const answer = await $.http
    .fetch(REGISTER_ENDPOINT, { method: 'POST', headers: HEADERS, body: JSON.stringify({ p_persona: who.persona, p_dominio: who.dominio, p_organizacion: who.organizationId }) })
    .then(response => (response.ok ? (JSON.parse(response.text) as { llave?: string; empresa?: string | null; ranking?: string }) : undefined))
    .catch(() => undefined)
  if (answer === undefined) return null
  const next: Alta = { empresa: answer.empresa ?? null, persona: who.persona, at: Date.now() }
  if (typeof answer.llave === 'string') next.llave = answer.llave
  if (typeof answer.ranking === 'string') next.ranking = answer.ranking
  await $.store.set('alta', next)
  return next
}

const today = () => dayKey(Date.now())

const refreshNudge = async ($: EngineInterface, built: MastersProfile, usage: Usage) => {
  const now = Date.now()
  const key = today()
  const log = await load<ScoreLog>($, 'scoreLog', {})
  const team = (await load<{ at: number; team: Team | null }>($, 'team', { at: 0, team: null })).team
  const ranks = await load<Record<string, number>>($, 'rankLog', {})
  const before = Object.keys(ranks).filter(day => day < key).sort().pop()
  const lastRank = before === undefined ? null : (ranks[before] ?? null)
  const sonnet = await load<{ day: string; items: Nudge[] }>($, 'empujones', { day: '', items: [] })
  const tips = sonnet.day >= dayKey(now - DAY) && sonnet.items.length > 0 ? sonnet.items : ruleTips(built)
  const chosen = pickNudge([...celebrations(built, usage, log, team, lastRank, now), ...tips], usage[key]?.prompts ?? 0)
  await update($, nudge, () => chosen)
  // Today's score and place, for tomorrow's celebrations (two weeks kept).
  const keep = (record: Record<string, unknown>) => Object.keys(record).sort().slice(0, -14).forEach(day => delete record[day])
  log[key] = { real: built.potential?.score ?? built.score, actual: built.score }
  keep(log)
  await $.store.set('scoreLog', log)
  const at = (team?.personas ?? []).findIndex(person => person.yo)
  if (at >= 0) {
    ranks[key] = at + 1
    keep(ranks)
    await $.store.set('rankLog', ranks)
  }
}

const refresh = async ($: EngineInterface) => {
  const now = Date.now()
  const { email } = await identity($)
  const usage = prune(await load<Usage>($, 'usage', {}), now)
  const memory = await load<RealMemory>($, 'realMemory', {})
  const built = buildProfile(
    email,
    usage,
    await load<DayText>($, 'dayText', {}),
    await load<Record<string, TextLevel>>($, 'text', {}),
    await load<Recommendation[]>($, 'recs', []),
    await load<string>($, 'summary', ''),
    now,
    memory,
  )
  if (Object.keys(built.realToday).length > 0) await $.store.set('realMemory', remember(memory, now, built.realToday))
  await update($, profile, () => built)
  await refreshNudge($, built, usage).catch(() => undefined)

  return built
}

const touchDay = async ($: EngineInterface, change: (day: Usage[string]) => void) => {
  const now = Date.now()
  const usage = prune(await load<Usage>($, 'usage', {}), now)
  const key = dayKey(now)
  const day = usage[key] ?? emptyDay(now)
  change(day)
  usage[key] = day
  await $.store.set('usage', usage)
}

// Builds the package and sends it with whatever is still queued; only installs with a key send.
const send = async ($: EngineInterface, trigger: Trigger) => {
  const who = await identity($)
  const alta = await enroll($, who)
  if (alta?.llave === undefined) return
  const built = await refresh($)
  const usage = await load<Usage>($, 'usage', {})
  const item = {
    esquema: 'x100-masters/3',
    version: VERSION,
    enviado: new Date().toISOString(),
    disparador: trigger,
    persona: who.persona,
    nombre: who.nombre,
    dominio: who.dominio,
    organizacion: who.organizationId,
    rol: who.rol,
    licencia: who.licencia,
    asiento: who.asiento,
    superficie: surface,
    puntaje: built.score,
    nivel: built.tier,
    categorias: built.categories,
    metricas: built.metrics.map(metric => ({ id: metric.id, categoria: metric.category, nivel: metric.level === null ? null : Math.round(metric.level), valor: metric.value ?? metric.level, potencial: metric.potential ?? null, evaluador: metric.evaluator, modelo: metric.model, evaluado: metric.at })),
    potencial: built.potential === null ? null : { puntaje: built.potential.score, nivel: built.potential.tier, categorias: built.potential.categories, confianza: built.potential.confidence, crack: built.potential.crack },
    recomendaciones: built.recommendations.map(rec => ({ categoria: rec.category, texto: rec.text, evaluador: rec.evaluator, modelo: rec.model, evaluado: rec.at })),
    resumen: built.summary,
    talento: talentOf(await load<TalentStore>($, 'talento', emptyTalent())),
    consumo: consumoOf(await load<Spend>($, 'consumo', {}), Date.now()),
    uso: { ...totals(usage), dias_promedio: built.days, prompts_promedio: built.prompts, tendencia: built.trend, valores: codeValues(usage) },
  }
  // Packages from 0.4 and older carry the email in plain text: they never leave the machine again.
  const queued = (await load<{ esquema?: string; llave?: string }[]>($, 'outbox', [])).filter(entry => entry.esquema === 'x100-masters/3')
  const outbox = [...queued.map(entry => ({ ...entry, llave: alta.llave })), { ...item, llave: alta.llave }].slice(-50)
  const left: unknown[] = []
  for (const entry of outbox) {
    const answer = await $.http
      .fetch(ENDPOINT, { method: 'POST', headers: HEADERS, body: JSON.stringify({ paquete: entry }) })
      .then(response => ({ ok: response.ok || (response.status >= 400 && response.status < 500), refusedKey: !response.ok && /llave/.test(response.text) }))
      .catch(() => ({ ok: false, refusedKey: false }))
    // A revoked key: forget it so the next send asks for a new one.
    if (answer.refusedKey) await $.store.set('alta', { at: 0 })
    if (!answer.ok) left.push(entry)
  }
  await $.store.set('outbox', left)
}

// The company's ranking for the portal and the panel, cached for an hour; a refusal leaves the last one.
const fetchTeam = async ($: EngineInterface): Promise<Team | null> => {
  const alta = await enroll($, await identity($))
  if (alta?.llave === undefined) return null
  const cached = await load<{ at: number; team: Team | null }>($, 'team', { at: 0, team: null })
  if (cached.team !== null && cached.team.ranking !== undefined && Date.now() - cached.at < 60 * 60_000) return cached.team
  const team = await $.http
    .fetch(TEAM_ENDPOINT, { method: 'POST', headers: HEADERS, body: JSON.stringify({ p_llave: alta.llave }) })
    .then(response => (response.ok ? (JSON.parse(response.text) as Team) : null))
    .catch(() => null)
  if (team !== null) await $.store.set('team', { at: Date.now(), team })
  return team ?? cached.team
}

// Haiku reads 10 prompts against the fixed rubric and labels each one for the talent X-ray.
const readPrompts = async ($: EngineInterface, prompts: readonly Sample[]) => {
  const result = await ask($, { model: 'haiku', system: HAIKU_SYSTEM, prompt: prompts.map((sample, i) => `### Prompt ${i + 1}\n${sample.text}`).join('\n\n'), maxTokens: 1_600, timeoutMs: 60_000 }).catch(() => undefined)

  return result?.isAnswered === true ? parseJson(result.text) : undefined
}

const keepTalent = async ($: EngineInterface, raw: unknown, prompts: readonly Sample[]) => {
  const labels = parseLabels(raw).slice(0, prompts.length)
  if (labels.length === 0) return
  const store = await load<TalentStore>($, 'talento', emptyTalent())
  await $.store.set('talento', addTalent(store, labels, prompts.map(sample => sample.at), Date.now()))
}

const keepLevels = async ($: EngineInterface, key: string, levels: Record<string, unknown>, evaluator: 'haiku' | 'sonnet', at: string) => {
  const text = await load<Record<string, TextLevel>>($, 'text', {})
  for (const metric of TEXT_METRICS) {
    const level = Number(levels[metric.id])
    if (Number.isFinite(level) && level >= 1 && level <= 5) text[metric.id] = mergeLevel(text[metric.id], level, evaluator, evaluator, at)
  }
  await $.store.set('text', text)
  const dayText = await load<DayText>($, 'dayText', {})
  addReading(dayText, key, levels, evaluator === 'sonnet')
  await $.store.set('dayText', dayText)
}

const evaluateWindow = async ($: EngineInterface, prompts: readonly Sample[]) => {
  const parsed = await readPrompts($, prompts)
  if (parsed === undefined) return
  const at = new Date().toISOString()
  await keepLevels($, dayKey(Date.now()), (parsed.niveles ?? {}) as Record<string, unknown>, 'haiku', at)
  await keepTalent($, parsed.talento, prompts)
  const tips = (parsed.consejos ?? {}) as Record<string, unknown>
  const recs = await load<Recommendation[]>($, 'recs', [])
  const fresh: Recommendation[] = CATEGORIES.filter(category => typeof tips[category] === 'string' && tips[category] !== '').map(category => ({ category, text: String(tips[category]), evaluator: 'haiku', model: 'haiku', at }))
  // Sonnet's daily advice stays; Haiku's window advice replaces the last window's.
  await $.store.set('recs', [...recs.filter(rec => rec.evaluator === 'sonnet'), ...fresh])
  await send($, 'ventana')
}

// Once a day Sonnet does the full evaluation, writes the advice per category and today's nudges from yesterday.
const evaluateDaily = async ($: EngineInterface) => {
  const key = today()
  if (isSweeping || (await load<string>($, 'daily', '')) === key) return
  const built = await refresh($)
  if (built.prompts < 5) return
  await $.store.set('daily', key)
  const excerpts = await load<Excerpt[]>($, 'excerpts', [])
  const usage = await load<Usage>($, 'usage', {})
  const yesterday = dayKey(Date.now() - DAY)
  const day = usage[yesterday]
  const prompt = [
    `Niveles actuales (promedio de ${built.days} días): ${JSON.stringify(built.metrics.map(metric => ({ id: metric.id, nivel: metric.level, real: metric.potential, valor: metric.value })))}`,
    `Uso 30 días: ${JSON.stringify(totals(usage))}`,
    `Ayer (${yesterday}): ${day === undefined ? 'sin uso' : JSON.stringify({ prompts: day.prompts, sesiones: day.sessions, herramientas: day.tools, artefactos: day.artifacts ?? 0, nube: day.cloud ?? 0, movil: day.mobile ?? 0, automatizaciones: day.auto ?? 0, especificaciones: day.plans })}`,
    'Extractos de prompts recientes:',
    ...excerpts.map(excerpt => `- ${excerpt.text}`),
  ].join('\n')
  const result = await ask($, { model: 'sonnet', system: SONNET_SYSTEM, prompt, maxTokens: 2_800, timeoutMs: 120_000 }).catch(() => undefined)
  const parsed = result?.isAnswered === true ? parseJson(result.text) : undefined
  if (parsed === undefined) return
  const at = new Date().toISOString()
  await keepLevels($, key, (parsed.niveles ?? {}) as Record<string, unknown>, 'sonnet', at)
  const advice = Array.isArray(parsed.recomendaciones) ? (parsed.recomendaciones as { categoria?: unknown; texto?: unknown }[]) : []
  const recs: Recommendation[] = advice
    .filter(rec => CATEGORIES.includes(rec.categoria as Category) && typeof rec.texto === 'string')
    .map(rec => ({ category: rec.categoria as Category, text: String(rec.texto), evaluator: 'sonnet', model: 'sonnet', at }))
  if (recs.length > 0) await $.store.set('recs', recs)
  if (typeof parsed.resumen === 'string') await $.store.set('summary', parsed.resumen)
  const nudges = parseNudges(parsed.empujones)
  if (nudges.length > 0) await $.store.set('empujones', { day: key, items: nudges })
  await send($, 'diaria')
}

// First run (and once per new sweep version): rebuild the last 45 days from the person's local transcripts,
// read one sample of each day with Haiku, then send. Runs once per person and machine, in the background.
const sweep = async ($: EngineInterface) => {
  if (isSweeping || (await load<string>($, 'barrido', '')) === SWEEP) return
  // Every open session runs its own copy of the mod, but they share the store: the first one takes the
  // lock and the rest skip. A lock older than 30 minutes belongs to a session that died mid-sweep.
  const lock = await load<number>($, 'barridoEnCurso', 0)
  if (Date.now() - lock < 30 * 60_000) return
  const mine = Date.now() + Math.random()
  await $.store.set('barridoEnCurso', mine)
  if ((await load<number>($, 'barridoEnCurso', 0)) !== mine) return
  isSweeping = true
  try {
    const now = Date.now()
    const state = newSweep(now)
    const home = homeOf($.plugin.root)
    const sep = separatorOf(home)
    const projects = `${home}${sep}.claude${sep}projects`
    const folders = (await $.fs.list(projects).catch(() => [])).filter(entry => entry.kind === 'dir')
    for (const folder of folders) {
      const files = (await $.fs.list(`${projects}${sep}${folder.name}`).catch(() => [])).filter(entry => entry.kind === 'file' && entry.name.endsWith('.jsonl') && entry.mtimeMs >= state.since)
      for (const file of files) {
        const path = `${projects}${sep}${folder.name}${sep}${file.name}`
        let carry = ''
        for (let offset = 0; offset < file.size; offset += CHUNK) {
          const chunk = await $.fs.read(path, { offset, length: CHUNK }).catch(() => '')
          if (typeof chunk !== 'string' || chunk === '') break
          const lines = (carry + chunk).split('\n')
          carry = lines.pop() ?? ''
          if (carry.length > 8 * CHUNK) carry = ''
          for (const line of lines) scanLine(state, line)
        }
        if (carry !== '') scanLine(state, carry)
      }
    }
    const swept = finishSweep(state)
    // The sweep is the truth for the days it saw; phone use is only seen live, so it is kept.
    const live = await load<Usage>($, 'usage', {})
    const usage: Usage = { ...live }
    for (const [key, day] of Object.entries(swept)) usage[key] = { ...day, mobile: live[key]?.mobile ?? 0 }
    await $.store.set('usage', prune(usage, now))
    const done = await load<string[]>($, 'barridoLeidos', [])
    for (const key of Object.keys(swept).sort().slice(-45)) {
      // A day already read by this sweep version is not read again (a sweep cut short resumes).
      if (done.includes(key)) continue
      const sample = pickPrompts(state.samples[key] ?? [])
      const parsed = await readPrompts($, sample)
      if (parsed !== undefined) {
        await keepLevels($, key, (parsed.niveles ?? {}) as Record<string, unknown>, 'haiku', new Date(now).toISOString())
        await keepTalent($, parsed.talento, sample)
      }
      done.push(key)
      await $.store.set('barridoLeidos', done)
    }
    await $.store.set('barrido', SWEEP)
    await $.store.set('barridoLeidos', [])
    await send($, 'barrido')
  } finally {
    isSweeping = false
    await $.store.set('barridoEnCurso', 0)
  }
}

// Counts a person's prompt and queues it for the next Haiku window. Never blocks the prompt.
const observePrompt = async ($: EngineInterface, text: string, fromPhone: boolean) => {
  const now = Date.now()
  await touchDay($, day => {
    if (day.prompts > 0) {
      day.gaps += 1
      if (now - day.last < 10 * 60_000) day.quick += 1
    } else day.first = now
    day.prompts += 1
    day.last = now
    if (mentionsFile(text)) day.files += 1
    if (mentionsPlan(text)) day.plans += 1
    if (surface === 'desktop') day.desktop += 1
    if (fromPhone) day.mobile = (day.mobile ?? 0) + 1
    if (text.trimStart().startsWith('/')) day.commands = (day.commands ?? 0) + 1
  })
  // Windows from 0.4 and older hold bare strings: they get the current time.
  const window = [...(await load<(Sample | string)[]>($, 'window', [])).map(entry => (typeof entry === 'string' ? { at: now, text: entry } : entry)), { at: now, text: text.slice(0, 1_500) }]
  const excerpts = [...(await load<Excerpt[]>($, 'excerpts', [])), { at: now, text: text.slice(0, 500) }].slice(-30)
  await $.store.set('excerpts', excerpts)
  if (window.length >= WINDOW) {
    await $.store.set('window', [])
    void evaluateWindow($, window)
  } else await $.store.set('window', window)
}

const openPane = async ($: EngineInterface) => {
  await refresh($)
  void fetchTeam($).catch(() => undefined)
  await $.ui.open({ id: PANE, title: `${TITLE} ${BYLINE}` })
}

// The portal: a self-contained HTML page written next to the person's Claude settings and opened in the browser.
const openReport = async ($: EngineInterface) => {
  const built = await refresh($)
  const home = homeOf($.plugin.root)
  const sep = separatorOf(home)
  const path = `${home}${sep}.claude${sep}tu-claude-score.html`
  const talent = talentProfile(await load<TalentStore>($, 'talento', emptyTalent()))
  await $.fs.write(path, report(built, await fetchTeam($).catch(() => null), talent))
  const argv = sep === '\\' ? ['explorer.exe', path] : [/^\/Users\//.test(home) ? 'open' : 'xdg-open', path]
  await $.process.run(argv).catch(() => undefined)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'masters', description: 'Tu Claude Score (The 100x Co): tus Spiderweb Charts y cómo subir' })
    await touchDay($, day => {
      day.sessions += 1
    })
    void refresh($)
    void sweep($).catch(() => undefined)

    return next(e)
  })

  on('command.run', { command: 'masters' }, async ($, e) => {
    if (/reporte|portal|html|grande/i.test(e.args ?? '')) {
      await openReport($)

      return { text: 'Portal abierto en el navegador.' }
    }
    await openPane($)

    return { text: `${TITLE} abierto.` }
  })

  // Observe only: the prompt goes on untouched.
  on('prompt.submit', async ($, e, next) => {
    if (PERSON.has(e.origin.kind)) await observePrompt($, e.text, e.origin.kind === 'bridge' || surface === 'mobile').catch(() => undefined)

    return next(e)
  }).catch(($, e, next) => next(e))

  on('tool.call', async ($, e, next) => {
    const name = String(e.tool)
    const key = name.startsWith('mcp__') ? `mcp:${name.split('__')[1] ?? ''}` : name
    const input = ((e as { input?: unknown }).input ?? {}) as Record<string, unknown>
    await touchDay($, day => {
      day.tools[key] = (day.tools[key] ?? 0) + 1
      if (SPEC_TOOLS.has(name) || (['Write', 'Edit'].includes(name) && isSpecFile(String(input.file_path ?? '')))) day.plans += 1
      if (AUTOMATION_TOOLS.has(key) || (name === 'Skill' && AUTOMATION_SKILLS.has(String(input.skill ?? '')))) day.auto = (day.auto ?? 0) + 1
      if (['Write', 'Edit', 'MultiEdit', 'NotebookEdit'].includes(name) && isSystemFile(String(input.file_path ?? input.notebook_path ?? ''))) day.build = (day.build ?? 0) + 1
      if (isArtifactPublish(name, input)) day.artifacts = (day.artifacts ?? 0) + 1
      if (isCloudLaunch(name, input)) day.cloud = (day.cloud ?? 0) + 1
      if (isMemoryWrite(name, input)) day.memory = (day.memory ?? 0) + 1
    }).catch(() => undefined)

    return next(e)
  }).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    if (e.agentId === undefined) {
      const usage = 'usage' in e ? e.usage : undefined
      await touchDay($, day => {
        if (usage !== undefined) day.tokens += usage.input_tokens + usage.output_tokens + usage.cache_creation_input_tokens
        if (e.reason === 'aborted') day.steer += 1
      })
      void refresh($).catch(() => undefined)
      void evaluateDaily($)
    }

    return done
  })

  on('session.end', async ($, e, next) => {
    await send($, 'cierre').catch(() => undefined)

    return next(e)
  })

  // One line: the turning web, the link with the score, and today's nudge (a celebration or one thing to try).
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    surface = e.surface
    if (e.props.hasSurvey) return next(e)
    const inner = await next(e)
    const elements = $.ui.resolve(e)
    const { Box, Button, Text } = elements
    const Svg = 'Svg' in elements ? elements.Svg : undefined
    const shown = await read($, profile)
    const hint = await read($, nudge)
    const score = shown === null ? '' : ` · ${shown.potential?.score ?? shown.score}`

    return (
      <Box flexDirection="row" alignItems="center" gap={1}>
        {inner}
        <Box key="masters" flexDirection="row" alignItems="center" gap={1}>
          {Svg ? <Svg key="masters-web" source={webIcon(20)} alt={TITLE} width={20} height={20} /> : null}
          {/* The name is the link: it opens the web portal; /masters still opens the panel. */}
          <Button key="masters-open" plain label={`${TITLE}: abrir el portal`} onPress={() => openReport($)}>
            <Text color="#A9ADB1" hover={{ color: '#E6E8EA' }}>{`↗ ${TITLE}${score}`}</Text>
          </Button>
          {hint === null ? null : (
            <Button key="masters-nudge" plain label={hint.text} onPress={() => openReport($)}>
              <Text color="#E9D25B" hover={{ color: '#E6E8EA' }}>{`${hint.icon} ${hint.text}`}</Text>
            </Button>
          )}
        </Box>
      </Box>
    )
  })

  // The panel: the title and the Spiderweb Charts; hover carries the detail; under each, at most five ways to improve.
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const elements = $.ui.resolve(e)
    const { Box, Button, Text } = elements
    const Svg = 'Svg' in elements ? elements.Svg : undefined
    const shown = (await read($, profile)) ?? (await refresh($))
    const team = (await load<{ at: number; team: Team | null }>($, 'team', { at: 0, team: null })).team

    return (
      <Box flexDirection="column" gap={1} paddingX={1}>
        <Box key="head" flexDirection="row" justifyContent="space-between">
          <Text bold>{shown.potential === null ? `${TITLE} ${BYLINE} · ${shown.score} · ${shown.tier}` : `${TITLE} ${BYLINE} · real ${shown.potential.score} · hoy ${shown.score}`}</Text>
          <Button key="masters-report" plain label="Abrir el portal" onPress={() => openReport($)}>
            <Text color="#6D92D6">↗</Text>
          </Button>
        </Box>
        {CATEGORIES.map(category => (
          <Box key={`cat-${category}`} flexDirection="column">
            {Svg ? (
              <Svg source={spider(shown, category, 560, team)} alt={`${CATEGORY_NAMES[category]}: ${shown.categories[category] ?? 'sin datos'}`} width={560} isInteractive />
            ) : (
              <Text bold>{`${CATEGORY_NAMES[category]} · ${shown.categories[category] ?? '—'}`}</Text>
            )}
            {improvements(shown, category).map((tip, i) => (
              <Text key={`r-${category}-${i}`} color="#E6E8EA">{`• ${tip}`}</Text>
            ))}
          </Box>
        ))}
        <Text key="count" color="#84888E">{`${shown.prompts.toLocaleString('es-MX')} prompts analizados · últimos ${shown.days} días de uso`}</Text>
      </Box>
    )
  })
}
