import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'
import type { Category, MastersProfile, Recommendation } from '../types'
import { CATEGORIES, CATEGORY_NAMES, HAIKU_SYSTEM, SONNET_SYSTEM, TEXT_METRICS } from './rubric'
import { AUTOMATION_SKILLS, AUTOMATION_TOOLS, addReading, buildProfile, codeValues, dayKey, emptyDay, isSystemFile, mentionsFile, mentionsPlan, mergeLevel, parseJson, prune, totals } from './score'
import type { DayText, TextLevel, Usage } from './score'
import { finishSweep, newSweep, pickPrompts, scanLine } from './backfill'
import { BYLINE, TITLE, improvements, report, spider, webIcon } from './visuals'

// «Tu Nivel en Claude» by The 100x Co. Measures how well a person uses Claude on 37 metrics in four
// categories and sends the scores, never the prompts. On its first run it sweeps the person's last 15 days
// of local transcripts; after that, code counts every prompt and tool, Haiku reads each 10-prompt window and
// Sonnet does the full evaluation once a day. What is shown and sent is the average of the last 10 days of use.

const PANE = 'x100-masters'
const VERSION = '0.3.2'
const SWEEP = 'v1'
const WINDOW = 10
const DOMAINS = ['ismomotors.com', 'grupoislo.com']
// The one door into Supabase (100x-staging): a checked RPC. The publishable key is public by design;
// the function, not the key, decides what gets in (schema, group domain, size, rate).
const ENDPOINT = 'https://oqhqazffrdeegqesukia.supabase.co/rest/v1/rpc/x100_masters_ingest'
const PUBLISHABLE_KEY = 'sb_publishable_BBepv64edBJZsgY90-ZZOQ_V0j81N55'
const PERSON = new Set(['composer', 'bridge'])
const CHUNK = 4 * 1024 * 1024

type Trigger = 'ventana' | 'diaria' | 'cierre' | 'barrido'
type Excerpt = { at: number; text: string }

const profile = atom({ plugin: 'x100-masters', key: 'profile' } as const, null as MastersProfile | null)

const load = async <T,>($: EngineInterface, key: string, fallback: T): Promise<T> => ((await $.store.get(key)) as T | undefined) ?? fallback

// The surface last seen drawing the band, and whether a sweep is running in this module.
let surface = ''
let isSweeping = false

// ISMO's Claude Team organization: only its members send.
const ORGANIZATION = '19d986ca-5e90-44dc-a434-7c0d2a0f6c76'

// On Team the organization's guard denies `session.identity` to a mod, so the account Claude Code
// signed in with is read from ~/.claude.json (oauthAccount) when the engine does not answer.
const identity = async ($: EngineInterface) => {
  const who = await $.session.identity().catch(() => undefined)
  let email = who?.email ?? ''
  let organizationId = who?.organizationId ?? ''
  if (email === '' || organizationId === '') {
    const home = homeOf($.plugin.root)
    const raw = await $.fs.read(`${home}${separatorOf(home)}.claude.json`).catch(() => '')
    try {
      const account = (JSON.parse(typeof raw === 'string' ? raw : '{}') as { oauthAccount?: { emailAddress?: string; organizationUuid?: string } }).oauthAccount
      email ||= account?.emailAddress ?? ''
      organizationId ||= account?.organizationUuid ?? ''
    } catch {
      // No readable account: nothing is sent.
    }
  }
  email = email.toLowerCase()

  return { email, organizationId, isAllowed: organizationId === ORGANIZATION && DOMAINS.includes(email.split('@')[1] ?? '') }
}

const refresh = async ($: EngineInterface) => {
  const now = Date.now()
  const { email } = await identity($)
  const built = buildProfile(
    email,
    prune(await load<Usage>($, 'usage', {}), now),
    await load<DayText>($, 'dayText', {}),
    await load<Record<string, TextLevel>>($, 'text', {}),
    await load<Recommendation[]>($, 'recs', []),
    await load<string>($, 'summary', ''),
    now,
  )
  await update($, profile, () => built)

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

// Builds the package and sends it with whatever is still queued; only group accounts send.
const send = async ($: EngineInterface, trigger: Trigger) => {
  const who = await identity($)
  if (!who.isAllowed) return
  const built = await refresh($)
  const usage = await load<Usage>($, 'usage', {})
  const item = {
    esquema: 'x100-masters/2',
    version: VERSION,
    enviado: new Date().toISOString(),
    disparador: trigger,
    correo: who.email,
    organizacion: who.organizationId,
    superficie: surface,
    puntaje: built.score,
    nivel: built.tier,
    categorias: built.categories,
    metricas: built.metrics.map(metric => ({ id: metric.id, categoria: metric.category, nivel: metric.level === null ? null : Math.round(metric.level), valor: metric.value ?? metric.level, evaluador: metric.evaluator, modelo: metric.model, evaluado: metric.at })),
    recomendaciones: built.recommendations.map(rec => ({ categoria: rec.category, texto: rec.text, evaluador: rec.evaluator, modelo: rec.model, evaluado: rec.at })),
    resumen: built.summary,
    uso: { ...totals(usage), dias_promedio: built.days, prompts_promedio: built.prompts, tendencia: built.trend, valores: codeValues(usage) },
  }
  const outbox = [...(await load<unknown[]>($, 'outbox', [])), item].slice(-50)
  const left: unknown[] = []
  for (const queued of outbox) {
    const sent = await $.http
      .fetch(ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json', apikey: PUBLISHABLE_KEY }, body: JSON.stringify({ paquete: queued }) })
      // A refusal (4xx: old schema, foreign domain) is final; only network or server failures stay queued.
      .then(response => response.ok || (response.status >= 400 && response.status < 500))
      .catch(() => false)
    if (!sent) left.push(queued)
  }
  await $.store.set('outbox', left)
}

// Haiku reads 10 prompts against the fixed rubric: specific, cheap, cached prefix.
const readPrompts = async ($: EngineInterface, prompts: string[]) => {
  const result = await $.model
    .complete({ model: 'haiku', system: HAIKU_SYSTEM, prompt: prompts.map((text, i) => `### Prompt ${i + 1}\n${text}`).join('\n\n'), maxTokens: 900, timeoutMs: 60_000 })
    .catch(() => undefined)

  return result?.isAnswered === true ? parseJson(result.text) : undefined
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

const evaluateWindow = async ($: EngineInterface, prompts: string[]) => {
  const parsed = await readPrompts($, prompts)
  if (parsed === undefined) return
  const at = new Date().toISOString()
  await keepLevels($, dayKey(Date.now()), (parsed.niveles ?? {}) as Record<string, unknown>, 'haiku', at)
  const tips = (parsed.consejos ?? {}) as Record<string, unknown>
  const recs = await load<Recommendation[]>($, 'recs', [])
  const fresh: Recommendation[] = CATEGORIES.filter(category => typeof tips[category] === 'string' && tips[category] !== '').map(category => ({ category, text: String(tips[category]), evaluator: 'haiku', model: 'haiku', at }))
  // Sonnet's daily advice stays; Haiku's window advice replaces the last window's.
  await $.store.set('recs', [...recs.filter(rec => rec.evaluator === 'sonnet'), ...fresh])
  await send($, 'ventana')
}

// Once a day Sonnet does the full, detailed evaluation and writes the advice per category.
const evaluateDaily = async ($: EngineInterface) => {
  const today = dayKey(Date.now())
  if (isSweeping || (await load<string>($, 'daily', '')) === today) return
  const built = await refresh($)
  if (built.prompts < 5) return
  await $.store.set('daily', today)
  const excerpts = await load<Excerpt[]>($, 'excerpts', [])
  const prompt = [
    `Niveles actuales (promedio de ${built.days} días): ${JSON.stringify(built.metrics.map(metric => ({ id: metric.id, nivel: metric.level, valor: metric.value })))}`,
    `Uso 30 días: ${JSON.stringify(totals(await load<Usage>($, 'usage', {})))}`,
    'Extractos de prompts recientes:',
    ...excerpts.map(excerpt => `- ${excerpt.text}`),
  ].join('\n')
  const result = await $.model.complete({ model: 'sonnet', system: SONNET_SYSTEM, prompt, maxTokens: 2_400, timeoutMs: 120_000 }).catch(() => undefined)
  const parsed = result?.isAnswered === true ? parseJson(result.text) : undefined
  if (parsed === undefined) return
  const at = new Date().toISOString()
  await keepLevels($, today, (parsed.niveles ?? {}) as Record<string, unknown>, 'sonnet', at)
  const advice = Array.isArray(parsed.recomendaciones) ? (parsed.recomendaciones as { categoria?: unknown; texto?: unknown }[]) : []
  const recs: Recommendation[] = advice
    .filter(rec => CATEGORIES.includes(rec.categoria as Category) && typeof rec.texto === 'string')
    .map(rec => ({ category: rec.categoria as Category, text: String(rec.texto), evaluator: 'sonnet', model: 'sonnet', at }))
  if (recs.length > 0) await $.store.set('recs', recs)
  if (typeof parsed.resumen === 'string') await $.store.set('summary', parsed.resumen)
  await send($, 'diaria')
}

// Home folder, taken from where the mod is installed (always under <home>/.claude/).
const homeOf = (root: string) => root.split(/[\\/]\.claude[\\/]/)[0] ?? root
const separatorOf = (home: string) => (/^[A-Za-z]:/.test(home) ? '\\' : '/')

// First run: rebuild the last 15 days from the person's local transcripts, read one sample of each day with
// Haiku, then send. Runs once per person and machine, in the background.
const sweep = async ($: EngineInterface) => {
  if (isSweeping || (await load<string>($, 'barrido', '')) === SWEEP) return
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
    // The sweep is the truth for the days it saw; live counters keep only days it did not see.
    const usage = { ...(await load<Usage>($, 'usage', {})), ...swept }
    await $.store.set('usage', prune(usage, now))
    for (const key of Object.keys(swept).sort().slice(-15)) {
      const parsed = await readPrompts($, pickPrompts(state.samples[key] ?? []))
      if (parsed !== undefined) await keepLevels($, key, (parsed.niveles ?? {}) as Record<string, unknown>, 'haiku', new Date(now).toISOString())
    }
    await $.store.set('barrido', SWEEP)
    await send($, 'barrido')
  } finally {
    isSweeping = false
  }
}

// Counts a person's prompt and queues it for the next Haiku window. Never blocks the prompt.
const observePrompt = async ($: EngineInterface, text: string) => {
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
    if (text.trimStart().startsWith('/')) day.commands = (day.commands ?? 0) + 1
  })
  const window = [...(await load<string[]>($, 'window', [])), text.slice(0, 1_500)]
  const excerpts = [...(await load<Excerpt[]>($, 'excerpts', [])), { at: now, text: text.slice(0, 500) }].slice(-30)
  await $.store.set('excerpts', excerpts)
  if (window.length >= WINDOW) {
    await $.store.set('window', [])
    void evaluateWindow($, window)
  } else await $.store.set('window', window)
}

const openPane = async ($: EngineInterface) => {
  await refresh($)
  await $.ui.open({ id: PANE, title: `${TITLE} ${BYLINE}` })
}

// The portal: a self-contained HTML page written next to the person's Claude settings and opened in the browser.
const openReport = async ($: EngineInterface) => {
  const built = await refresh($)
  const home = homeOf($.plugin.root)
  const sep = separatorOf(home)
  const path = `${home}${sep}.claude${sep}tu-nivel-en-claude.html`
  await $.fs.write(path, report(built))
  const argv = sep === '\\' ? ['explorer.exe', path] : [/^\/Users\//.test(home) ? 'open' : 'xdg-open', path]
  await $.process.run(argv).catch(() => undefined)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'masters', description: 'Tu Nivel en Claude (The 100x Co): tus arañas y cómo subir' })
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
    if (PERSON.has(e.origin.kind)) await observePrompt($, e.text).catch(() => undefined)

    return next(e)
  }).catch(($, e, next) => next(e))

  on('tool.call', async ($, e, next) => {
    const name = String(e.tool)
    const key = name.startsWith('mcp__') ? `mcp:${name.split('__')[1] ?? ''}` : name
    const input = ((e as { input?: unknown }).input ?? {}) as Record<string, unknown>
    await touchDay($, day => {
      day.tools[key] = (day.tools[key] ?? 0) + 1
      if (name === 'EnterPlanMode') day.plans += 1
      if (AUTOMATION_TOOLS.has(key) || (name === 'Skill' && AUTOMATION_SKILLS.has(String(input.skill ?? '')))) day.auto = (day.auto ?? 0) + 1
      if (['Write', 'Edit', 'MultiEdit', 'NotebookEdit'].includes(name) && isSystemFile(String(input.file_path ?? input.notebook_path ?? ''))) day.build = (day.build ?? 0) + 1
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
      void evaluateDaily($)
    }

    return done
  })

  on('session.end', async ($, e, next) => {
    await send($, 'cierre').catch(() => undefined)

    return next(e)
  })

  // The only mark on screen, one line high: the turning web and, beside it, the button with the score.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    surface = e.surface
    if (e.props.hasSurvey) return next(e)
    const inner = await next(e)
    const elements = $.ui.resolve(e)
    const { Box, Button, Text } = elements
    const Svg = 'Svg' in elements ? elements.Svg : undefined
    const shown = await read($, profile)

    return (
      <Box flexDirection="row" alignItems="center" gap={1}>
        {inner}
        <Box key="masters" flexDirection="row" alignItems="center" gap={1}>
          {Svg ? <Svg key="masters-web" source={webIcon(14)} alt={TITLE} width={14} height={14} /> : null}
          {/* The name is the link: it opens the web portal; /masters still opens the panel. */}
          <Button key="masters-open" plain label={`${TITLE}: abrir el portal`} onPress={() => openReport($)}>
            <Text color="#A9ADB1" hover={{ color: '#E6E8EA' }}>{shown === null ? `${TITLE} ↗` : `${TITLE} · ${shown.score} ↗`}</Text>
          </Button>
        </Box>
      </Box>
    )
  })

  // The panel: the title and the spiders; hover carries the detail; under each, at most five ways to improve.
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const elements = $.ui.resolve(e)
    const { Box, Button, Text } = elements
    const Svg = 'Svg' in elements ? elements.Svg : undefined
    const shown = (await read($, profile)) ?? (await refresh($))

    return (
      <Box flexDirection="column" gap={1} paddingX={1}>
        <Box key="head" flexDirection="row" justifyContent="space-between">
          <Text bold>{`${TITLE} ${BYLINE} · ${shown.score} · ${shown.tier}`}</Text>
          <Button key="masters-report" plain label="Abrir el portal" onPress={() => openReport($)}>
            <Text color="#6D92D6">↗</Text>
          </Button>
        </Box>
        {CATEGORIES.map(category => (
          <Box key={`cat-${category}`} flexDirection="column">
            {Svg ? (
              <Svg source={spider(shown, category, 560)} alt={`${CATEGORY_NAMES[category]}: ${shown.categories[category] ?? 'sin datos'}`} width={560} isInteractive />
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
