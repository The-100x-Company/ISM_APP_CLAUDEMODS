import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'
import type { Category, MastersProfile, Recommendation } from '../types'
import { CATEGORIES, CATEGORY_NAMES, HAIKU_SYSTEM, SONNET_SYSTEM, TEXT_METRICS } from './rubric'
import { AUTOMATION_SKILLS, AUTOMATION_TOOLS, buildProfile, codeValues, dayKey, emptyDay, isSystemFile, mentionsFile, mentionsPlan, mergeLevel, parseJson, prune, totals } from './score'
import type { TextLevel, Usage } from './score'
import { BYLINE, TITLE, report, spider, webIcon } from './visuals'

// «Tu Nivel en Claude» by The 100x Co. Measures how well a person uses Claude on 37 metrics in four
// categories and sends the scores, never the prompts. Code counts use on every prompt and tool; Haiku reads each 10-prompt
// window; Sonnet does the full evaluation once a day. Every metric sent names the evaluator behind it.
// The only thing drawn is one tiny web button that opens the person's own spider charts.

const PANE = 'x100-masters'
const VERSION = '0.2.0'
const WINDOW = 10
const DOMAINS = ['ismomotors.com', 'grupoislo.com']
// The one door into Supabase (100x-staging): a checked RPC. The publishable key is public by design;
// the function, not the key, decides what gets in (schema, group domain, size, rate).
const ENDPOINT = 'https://oqhqazffrdeegqesukia.supabase.co/rest/v1/rpc/x100_masters_ingest'
const PUBLISHABLE_KEY = 'sb_publishable_BBepv64edBJZsgY90-ZZOQ_V0j81N55'
const PERSON = new Set(['composer', 'bridge'])

const profile = atom({ plugin: 'x100-masters', key: 'profile' } as const, null as MastersProfile | null)

type Excerpt = { at: number; text: string }

const load = async <T,>($: EngineInterface, key: string, fallback: T): Promise<T> => ((await $.store.get(key)) as T | undefined) ?? fallback

// The surface last seen drawing the band: desktop, terminal, vscode or mobile.
let surface = ''

const identity = async ($: EngineInterface) => {
  const who = await $.session.identity().catch(() => undefined)
  const email = who?.email ?? ''

  return { email, organizationId: who?.organizationId ?? '', isAllowed: who?.isVerified === true && DOMAINS.includes(email.split('@')[1] ?? '') }
}

const refresh = async ($: EngineInterface) => {
  const now = Date.now()
  const { email } = await identity($)
  const usage = prune(await load<Usage>($, 'usage', {}), now)
  const text = await load<Record<string, TextLevel>>($, 'text', {})
  const recs = await load<Recommendation[]>($, 'recs', [])
  const summary = await load<string>($, 'summary', '')
  const built = buildProfile(email, usage, text, recs, summary, now)
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

// Builds the package and queues it; sends the queue when the endpoint exists and the person is in a group domain.
const send = async ($: EngineInterface, trigger: 'ventana' | 'diaria' | 'cierre') => {
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
    metricas: built.metrics.map(metric => ({ id: metric.id, categoria: metric.category, nivel: metric.level, valor: metric.value ?? null, evaluador: metric.evaluator, modelo: metric.model, evaluado: metric.at })),
    recomendaciones: built.recommendations.map(rec => ({ categoria: rec.category, texto: rec.text, evaluador: rec.evaluator, modelo: rec.model, evaluado: rec.at })),
    resumen: built.summary,
    uso: { ...totals(usage), valores: codeValues(usage) },
  }
  const outbox = [...(await load<unknown[]>($, 'outbox', [])), item].slice(-50)
  const left: unknown[] = []
  for (const queued of outbox) {
    const sent = await $.http
      .fetch(ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json', apikey: PUBLISHABLE_KEY }, body: JSON.stringify({ paquete: queued }) })
      .then(response => response.ok)
      .catch(() => false)
    if (!sent) left.push(queued)
  }
  await $.store.set('outbox', left)
}

// Haiku reads the last 10 prompts against the fixed rubric: specific, cheap, cached prefix.
const evaluateWindow = async ($: EngineInterface, prompts: string[]) => {
  const result = await $.model
    .complete({ model: 'haiku', system: HAIKU_SYSTEM, prompt: prompts.map((text, i) => `### Prompt ${i + 1}\n${text}`).join('\n\n'), maxTokens: 900, timeoutMs: 60_000 })
    .catch(() => undefined)
  const parsed = result?.isAnswered === true ? parseJson(result.text) : undefined
  if (parsed === undefined) return
  const at = new Date().toISOString()
  const text = await load<Record<string, TextLevel>>($, 'text', {})
  const levels = (parsed.niveles ?? {}) as Record<string, unknown>
  for (const metric of TEXT_METRICS) {
    const level = Number(levels[metric.id])
    if (Number.isFinite(level) && level >= 1 && level <= 5) text[metric.id] = mergeLevel(text[metric.id], level, 'haiku', 'haiku', at)
  }
  await $.store.set('text', text)
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
  if ((await load<string>($, 'daily', '')) === today) return
  const built = await refresh($)
  if (built.prompts < 5) return
  await $.store.set('daily', today)
  const excerpts = await load<Excerpt[]>($, 'excerpts', [])
  const prompt = [
    `Niveles actuales: ${JSON.stringify(built.metrics.map(metric => ({ id: metric.id, nivel: metric.level, evaluador: metric.evaluator, valor: metric.value })))}`,
    `Uso 30 días: ${JSON.stringify(totals(await load<Usage>($, 'usage', {})))}`,
    'Extractos de prompts recientes:',
    ...excerpts.map(excerpt => `- ${excerpt.text}`),
  ].join('\n')
  const result = await $.model.complete({ model: 'sonnet', system: SONNET_SYSTEM, prompt, maxTokens: 2_000, timeoutMs: 120_000 }).catch(() => undefined)
  const parsed = result?.isAnswered === true ? parseJson(result.text) : undefined
  if (parsed === undefined) return
  const at = new Date().toISOString()
  const text = await load<Record<string, TextLevel>>($, 'text', {})
  const levels = (parsed.niveles ?? {}) as Record<string, unknown>
  for (const metric of TEXT_METRICS) {
    const level = Number(levels[metric.id])
    if (Number.isFinite(level) && level >= 1 && level <= 5) text[metric.id] = mergeLevel(text[metric.id], level, 'sonnet', 'sonnet', at)
  }
  await $.store.set('text', text)
  const advice = Array.isArray(parsed.recomendaciones) ? (parsed.recomendaciones as { categoria?: unknown; texto?: unknown }[]) : []
  const recs: Recommendation[] = advice
    .filter(rec => CATEGORIES.includes(rec.categoria as Category) && typeof rec.texto === 'string')
    .map(rec => ({ category: rec.categoria as Category, text: String(rec.texto), evaluator: 'sonnet', model: 'sonnet', at }))
  if (recs.length > 0) await $.store.set('recs', recs)
  if (typeof parsed.resumen === 'string') await $.store.set('summary', parsed.resumen)
  await send($, 'diaria')
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

// Home folder, taken from where the mod is installed (always under <home>/.claude/).
const homeOf = (root: string) => root.split(/[\\/]\.claude[\\/]/)[0] ?? root

const openPane = async ($: EngineInterface) => {
  await refresh($)
  await $.ui.open({ id: PANE, title: `${TITLE} ${BYLINE}` })
}

// The full report: a self-contained HTML page written next to the person's Claude settings and opened in the browser.
const openReport = async ($: EngineInterface) => {
  const built = await refresh($)
  const home = homeOf($.plugin.root)
  const isWindows = /^[A-Za-z]:/.test(home)
  const sep = isWindows ? '\\' : '/'
  const path = `${home}${sep}.claude${sep}tu-nivel-en-claude.html`
  await $.fs.write(path, report(built))
  const argv = isWindows ? ['explorer.exe', path] : [/^\/Users\//.test(home) ? 'open' : 'xdg-open', path]
  await $.process.run(argv).catch(() => undefined)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'masters', description: 'Tu Nivel en Claude (The 100x Co): tus arañas y recomendaciones' })
    await touchDay($, day => {
      day.sessions += 1
    })
    void refresh($)

    return next(e)
  })

  on('command.run', { command: 'masters' }, async ($, e) => {
    if (/reporte|html|grande/i.test(e.args ?? '')) {
      await openReport($)

      return { text: 'Reporte abierto en el navegador.' }
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

  // The only mark on screen: a tiny hairline web that opens the person's evaluation.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    surface = e.surface
    if (e.props.hasSurvey) return next(e)
    const inner = await next(e)
    const elements = $.ui.resolve(e)
    const { Box, Button, Text } = elements
    const Svg = 'Svg' in elements ? elements.Svg : undefined
    // A Button holds only text, so on surfaces that draw SVG the web sits under a blank Button laid over it.
    const icon = Svg ? (
      <Box key="masters-web" position="relative" width={20} height={20}>
        <Svg source={webIcon(20)} alt={TITLE} width={20} height={20} />
        <Box key="masters-hit" position="absolute" top={0} left={0}>
          <Button key="masters-open" plain label={TITLE} onPress={() => openPane($)}>
            <Text>{'  '}</Text>
          </Button>
        </Box>
      </Box>
    ) : (
      <Button key="masters-open" plain onPress={() => openPane($)}>
        <Text color="#84888E">✳</Text>
      </Button>
    )

    return inner === null || inner === undefined ? (
      <Box key="masters" alignSelf="flex-end">{icon}</Box>
    ) : (
      <Box flexDirection="column">
        {inner}
        <Box key="masters" alignSelf="flex-end">{icon}</Box>
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const elements = $.ui.resolve(e)
    const { Box, Button, Text } = elements
    const Svg = 'Svg' in elements ? elements.Svg : undefined
    const shown = (await read($, profile)) ?? (await refresh($))

    return (
      <Box flexDirection="column" gap={1} paddingX={1}>
        <Box key="head" flexDirection="row" justifyContent="space-between">
          <Text bold>{`${TITLE} ${BYLINE}   ${shown.score}/100 · ${shown.tier}`}</Text>
          <Button key="masters-report" plain onPress={() => openReport($)}>
            <Text color="#6D92D6">Abrir reporte completo ↗</Text>
          </Button>
        </Box>
        {shown.summary !== '' && <Text color="#A9ADB1">{shown.summary}</Text>}
        {CATEGORIES.map(category => (
          <Box key={`cat-${category}`} flexDirection="column">
            {Svg ? (
              <Svg source={spider(shown, category, 520)} alt={`${CATEGORY_NAMES[category]}: ${shown.categories[category] ?? 'sin datos'}`} width={520} isInteractive />
            ) : (
              <Text bold>{`${CATEGORY_NAMES[category]} · ${shown.categories[category] ?? '—'}`}</Text>
            )}
            {shown.recommendations
              .filter(rec => rec.category === category)
              .map((rec, i) => (
                <Text key={`r-${category}-${i}`} color="#E6E8EA">{`→ ${rec.text}  (${rec.evaluator})`}</Text>
              ))}
          </Box>
        ))}
      </Box>
    )
  })
}
