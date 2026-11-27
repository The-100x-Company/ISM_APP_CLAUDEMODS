// «Tu Claude Score» by The 100x Co: the web icon, one Spiderweb Chart per category, the talent X-ray and the portal.
// Visual first: shapes, motion and headlines on screen; the dense detail lives in the hover cards.
// Two webs per spider: today (the recent average) and the real level (what the person showed on good days).
// 100x look: graphite paper, hairlines, one blue accent, warm gold for the real level, slow motion.
import { ALL_METRICS, CATEGORIES, CATEGORY_ABOUT, CATEGORY_NAMES } from './rubric'
import { GUIDE } from './guide'
import type { Category, MastersProfile, MetricResult, Team, TeamPerson } from '../types'
import { ARCHETYPES } from './talent'
import { ARCHETYPE_COLOR, archetypeIcon } from './icons'
import type { TalentProfile } from './talent-score'

const PAPER = '#0D0E11'
const CARD = '#15171A'
const INK = '#E6E8EA'
const INK_2 = '#A9ADB1'
const INK_3 = '#84888E'
const HAIR = '#24272A'
const HAIR_2 = '#3A3E43'
const ACCENT = '#6D92D6'
const WARM = '#E9D25B'
// The group's Master on each axis: a small mint dot.
const MINT = '#4FD1A5'
const SANS = `'Host Grotesk','Segoe UI',system-ui,sans-serif`
const MONO = `'Geist Mono',ui-monospace,Consolas,monospace`

export const TITLE = 'Tu Claude Score'
export const BYLINE = 'by The 100x Co'
export const REAL_NAME = 'Nivel real'
export const NOW_NAME = 'Momento actual'
export const REAL_ABOUT = 'El nivel más alto que alcanzaste al menos 4 veces en 45 días, 2 de ellas en 10 días seguidos. Se queda 120 días: no baja si descansas ni por días de consultas sencillas.'
export const REAL_UNSURE = 'Aún faltan días de trabajo para confirmar tu nivel real: cada nivel se confirma al repetirlo 4 veces.'
export const NOW_ABOUT = 'Cómo usaste Claude en tus últimos 10 días de trabajo. Sube y baja con lo que haces cada día.'

const esc = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const f = (n: number) => n.toFixed(1)
const lvl = (n: number | null | undefined) => (n === null || n === undefined ? '–' : n.toFixed(1))
// Full names everywhere; long ones are cut with CSS ellipsis in the page, never shortened here.
const who = (name: string | null | undefined) => (name === null || name === undefined || name === '' ? '–' : name)

const HEADLINES: Record<Category, readonly [string, string, string, string, string]> = {
  herramienta: ['Apenas empiezas con Claude', 'Claude aparece de vez en cuando', 'Claude ya es parte de tu día', 'Claude es tu herramienta de trabajo', 'Trabajas con Claude a fondo'],
  estructura: ['Le das órdenes sueltas', 'Pides tareas; falta el para qué', 'Planteas bien lo básico', 'Planteas como profesional', 'Planteas como un ingeniero de campo'],
  sistema: ['Cada vez empiezas de cero', 'Empiezas a repetir lo que sirve', 'Ya reutilizas tu trabajo', 'Conviertes tu trabajo en sistema', 'Tu trabajo corre solo'],
  valor: ['Falta conectar con el negocio', 'Intuyes el impacto', 'Hablas de resultados', 'Trabajas sobre tus KPIs', 'Mides, comparas y decides por impacto'],
}

export const headline = (category: Category, percent: number | null) => (percent === null ? 'Aún sin datos' : (HEADLINES[category][Math.min(4, Math.floor(percent / 20))] ?? ''))

// The button: a hairline spider web that turns slowly, a blue node pulsing on its outer ring.
export const webIcon = (size = 22) => {
  const c = 12
  const spokes = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2
    return `<line x1="${c}" y1="${c}" x2="${f(c + Math.cos(a) * 10.5)}" y2="${f(c + Math.sin(a) * 10.5)}"/>`
  }).join('')
  const ring = (r: number) =>
    `<polygon points="${Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2
      const sag = i % 2 === 0 ? r : r * 0.9
      return `${f(c + Math.cos(a) * sag)},${f(c + Math.sin(a) * sag)}`
    }).join(' ')}"/>`

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
<g fill="none" stroke="${INK_2}" stroke-width=".7" stroke-linejoin="round">
<g>${spokes}${ring(3)}${ring(6)}${ring(9)}<animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="48s" repeatCount="indefinite"/></g>
</g>
<circle cx="21" cy="12" r="1.3" fill="${ACCENT}"><animate attributeName="opacity" values=".25;1;.25" dur="2.8s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="48s" repeatCount="indefinite"/></circle>
</svg>`
}

// Splits text into lines of at most `width` characters for an SVG card.
const wrap = (text: string, width: number) => {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/)) {
    if ((line + ' ' + word).trim().length > width && line !== '') {
      lines.push(line)
      line = word
    } else line = (line + ' ' + word).trim()
  }
  if (line !== '') lines.push(line)
  return lines
}

type Stat = { label: string; value: string; tone: string }
type Block =
  | { kind: 'stats'; items: Stat[] }
  | { kind: 'text'; text: string; tone: string }
  | { kind: 'label'; text: string }
  | { kind: 'bullets'; items: string[]; tone: string }

// One hover card as an SVG group: a title, a row of figures, then text and bullet lists, wrapped to the width.
const card = (id: string, x: number, y: number, w: number, title: string, blocks: Block[]) => {
  const chars = Math.floor((w - 44) / 7.8)
  let at = y + 32
  const parts: string[] = [`<text x="${x + 16}" y="${at}" font-size="17" font-weight="600" fill="${INK}" font-family="${SANS}">${esc(title)}</text>`]
  for (const block of blocks) {
    if (block.kind === 'stats') {
      const col = (w - 32) / block.items.length
      at += 26
      block.items.forEach((item, i) => {
        const sx = x + 16 + i * col
        parts.push(`<text x="${f(sx)}" y="${at}" font-size="9.5" letter-spacing=".1em" fill="${INK_3}" font-family="${SANS}">${esc(item.label.toUpperCase())}</text>`)
        parts.push(`<text x="${f(sx)}" y="${at + 22}" font-size="${item.value.length > 6 ? 14 : 19}" fill="${item.tone}" font-family="${item.value.length > 6 ? SANS : MONO}">${esc(item.value)}</text>`)
      })
      at += 30
      parts.push(`<line x1="${x + 16}" y1="${at}" x2="${x + w - 16}" y2="${at}" stroke="${HAIR_2}" stroke-width=".75"/>`)
    } else if (block.kind === 'text') {
      at += 6
      for (const line of wrap(block.text, chars)) {
        at += 19
        parts.push(`<text x="${x + 16}" y="${at}" font-size="14" fill="${block.tone}" font-family="${SANS}">${esc(line)}</text>`)
      }
    } else if (block.kind === 'label') {
      at += 26
      parts.push(`<text x="${x + 16}" y="${at}" font-size="10" letter-spacing=".1em" fill="${INK_3}" font-family="${SANS}">${esc(block.text.toUpperCase())}</text>`)
    } else {
      for (const item of block.items) {
        at += 4
        wrap(item, chars - 3).forEach((line, i) => {
          at += 18
          if (i === 0) parts.push(`<circle cx="${x + 20}" cy="${at - 4.5}" r="1.8" fill="${block.tone}"/>`)
          parts.push(`<text x="${x + 30}" y="${at}" font-size="13" fill="${block.tone}" font-family="${SANS}">${esc(line)}</text>`)
        })
      }
    }
  }
  const h = at - y + 18

  return { svg: `<g class="tip" id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${CARD}" stroke="${HAIR_2}"/>${parts.join('')}</g>`, h }
}

const nameOf = (id: string) => ALL_METRICS.find(item => item.id === id)?.name ?? id

// What every hover shows: the guide of the dimension, or (if the guide lacks it) the rubric's own wording. Never empty.
const guideOf = (id: string): { measure: string; how: string[]; examples: string[] } => {
  const guide = GUIDE[id]
  if (guide !== undefined) return guide
  const metric = ALL_METRICS.find(item => item.id === id)
  return {
    measure: metric?.about ?? id,
    how: ['Pídele a Claude que te explique esta dimensión y que te proponga un primer paso para tu trabajo de esta semana.'],
    examples: [`Explícame qué significa «${metric?.name ?? id}» en mi trabajo y dame un primer paso para hoy.`],
  }
}

// One category's spider: today filled in blue, the real level as a gold dashed web.
// Hover an axis for its card; hover the score for the whole category.
export const spider = (profile: MastersProfile, category: Category, width = 600, team: Team | null = null) => {
  const w = 660
  const cx = w / 2
  const cy = 330
  const r = 150
  const metrics = profile.metrics.filter(metric => metric.category === category)
  const n = metrics.length
  const at = (i: number, level: number) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2
    return [cx + Math.cos(angle) * r * (level / 5), cy + Math.sin(angle) * r * (level / 5)] as const
  }
  const points = (levels: number[]) => levels.map((level, i) => at(i, level).map(f).join(',')).join(' ')
  const grid = [1, 2, 3, 4, 5]
    .map(level => `<polygon points="${points(metrics.map(() => level))}" fill="none" stroke="${level === 5 ? HAIR_2 : HAIR}" stroke-width="${level === 5 ? 1 : 0.75}"${level === 5 ? ' stroke-dasharray="2 4"' : ''}/>`)
    .join('')
  const spokes = metrics.map((_, i) => `<line x1="${cx}" y1="${cy}" x2="${f(at(i, 5)[0])}" y2="${f(at(i, 5)[1])}" stroke="${HAIR}" stroke-width=".75"/>`).join('')
  const levels = metrics.map(metric => Math.max(0.35, metric.level ?? 0))
  const reals = metrics.map((metric, i) => Math.max(levels[i] ?? 0.35, metric.potential ?? 0))
  const hasReal = metrics.some(metric => metric.potential !== undefined && metric.potential !== null)
  const target = points(levels)
  const start = points(levels.map(() => 0.05))
  const realShape = hasReal
    ? `<polygon points="${points(reals)}" fill="${WARM}" fill-opacity=".06" stroke="${WARM}" stroke-width="1.3" stroke-dasharray="5 4" stroke-linejoin="round" opacity="0">
<animate attributeName="points" values="${target};${points(reals)}" begin="1.2s" dur="1.4s" calcMode="spline" keyTimes="0;1" keySplines=".16 1 .3 1" fill="freeze"/>
<animate attributeName="opacity" values="0;1" begin="1.2s" dur=".4s" fill="freeze"/>
<animate attributeName="stroke-dashoffset" values="0;-36" dur="3s" begin="2.6s" repeatCount="indefinite"/></polygon>`
    : ''
  const shape = `<polygon points="${target}" fill="${ACCENT}" fill-opacity=".18" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round">
<animate attributeName="points" values="${start};${target}" dur="1.6s" calcMode="spline" keyTimes="0;1" keySplines=".16 1 .3 1" fill="freeze"/></polygon>`
  const scored = metrics.map((metric, i) => ({ metric, i })).filter(item => item.metric.level !== null)
  const best = [...scored].sort((a, b) => (b.metric.level ?? 0) - (a.metric.level ?? 0))[0]
  const worst = [...scored].sort((a, b) => (a.metric.level ?? 0) - (b.metric.level ?? 0))[0]
  const hasSpread = best !== undefined && worst !== undefined && (best.metric.level ?? 0) > (worst.metric.level ?? 0)
  const nodes = scored
    .map(({ i }) => {
      const [x, y] = at(i, levels[i] ?? 0.35)
      const isWorst = hasSpread && worst?.i === i
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${isWorst ? 3.6 : 2.4}" fill="${isWorst ? ACCENT : INK}" opacity="0"><animate attributeName="opacity" values="0;0;1" keyTimes="0;.75;1" dur="1.8s" fill="freeze"/>${isWorst ? `<animate attributeName="r" values="3.6;7;3.6" dur="2.4s" begin="1.8s" repeatCount="indefinite"/>` : ''}</circle>`
    })
    .join('')
  // The group's Master on each axis, so the person sees how far the best one is.
  const masters = metrics
    .map((metric, i) => {
      const top = team?.metricas[metric.id]?.master_nivel
      if (top === null || top === undefined) return ''
      const [x, y] = at(i, Math.max(0.35, top))
      return `<circle cx="${f(x)}" cy="${f(y)}" r="3.4" fill="${PAPER}" stroke="${MINT}" stroke-width="1.6" opacity="0"><animate attributeName="opacity" values="0;0;1" keyTimes="0;.8;1" dur="2.4s" fill="freeze"/></circle>`
    })
    .join('')
  const callout = (item: { metric: MetricResult; i: number } | undefined, text: string, tone: string) => {
    if (item === undefined) return ''
    const [x, y] = at(item.i, Math.max(1.4, levels[item.i] ?? 1) * 0.55)
    return `<text x="${f(x)}" y="${f(y)}" text-anchor="middle" font-size="10" letter-spacing=".08em" fill="${tone}" font-family="${SANS}" opacity="0">${text}<animate attributeName="opacity" values="0;0;.9" keyTimes="0;.8;1" dur="2.2s" fill="freeze"/></text>`
  }
  const callouts = hasSpread ? callout(best, 'FORTALEZA', INK_2) + callout(worst, 'SIGUIENTE SALTO', ACCENT) : ''
  const axes = metrics
    .map((metric, i) => {
      const [x, y] = at(i, 6.1)
      const [vx, vy] = at(i, 5)
      const name = nameOf(metric.id)
      const anchor = x < cx - 10 ? 'end' : x > cx + 10 ? 'start' : 'middle'
      const tone = metric.level === null ? INK_3 : INK_2
      const textW = name.length * 7 + 30
      const hx = anchor === 'end' ? x - textW : anchor === 'middle' ? x - textW / 2 : x
      return `<g class="ax" id="${category}-ax-${i}"><line x1="${cx}" y1="${cy}" x2="${f(vx)}" y2="${f(vy)}" stroke="transparent" stroke-width="16"/><rect x="${f(hx)}" y="${f(y - 12)}" width="${textW}" height="22" fill="transparent"/><text class="lbl" x="${f(x)}" y="${f(y + 4)}" text-anchor="${anchor}" font-size="12.5" fill="${tone}" font-family="${SANS}">${esc(name)}<tspan fill="${INK_3}" font-family="${MONO}" font-size="11"> ${lvl(metric.level)}</tspan></text></g>`
    })
    .join('')
  const cardW = 480
  const cardX = cx - cardW / 2
  const cardY = 70
  const tips = metrics.map((metric, i) => {
    const guide = guideOf(metric.id)
    const mates = team?.metricas[metric.id]
    const stats: Stat[] = [
      { label: 'Tu puntaje', value: lvl(metric.level), tone: INK },
      ...(hasReal ? [{ label: 'Nivel real', value: lvl(metric.potential ?? metric.level), tone: WARM }] : []),
      { label: 'Media equipo', value: lvl(mates?.media ?? null), tone: INK_2 },
    ]
    const blocks: Block[] = [
      { kind: 'stats', items: stats },
      ...(mates?.master === null || mates?.master === undefined ? [] : ([{ kind: 'text', text: `Master del grupo: ${who(mates.master)}${mates.master_nivel === null || mates.master_nivel === undefined ? '' : ` · nivel ${lvl(mates.master_nivel)}`}`, tone: MINT }] as Block[])),
      { kind: 'text', text: guide.measure, tone: INK },
      { kind: 'label', text: 'Cómo hacerlo' },
      { kind: 'bullets', items: guide.how, tone: INK_2 },
      { kind: 'label', text: 'Ejemplos' },
      { kind: 'bullets', items: guide.examples.map(example => `«${example}»`), tone: ACCENT },
    ]
    return card(`${category}-tip-${i}`, cardX, cardY, cardW, nameOf(metric.id), blocks)
  })
  const value = profile.categories[category]
  const realValue = profile.potential?.categories[category] ?? null
  const group = team?.categorias[category]
  const listing = metrics.map(metric => `${nameOf(metric.id)} ${lvl(metric.level)}${hasReal ? ` · real ${lvl(metric.potential ?? metric.level)}` : ''}`)
  const summaryTip = card(`${category}-tip-all`, w - 20 - cardW, 64, cardW, CATEGORY_NAMES[category], [
    {
      kind: 'stats',
      items: [
        { label: 'Momento', value: value === null ? '–' : String(value), tone: INK },
        ...(realValue === null ? [] : [{ label: 'Nivel real', value: String(realValue), tone: WARM }]),
        { label: 'Media equipo', value: group?.media === null || group?.media === undefined ? '–' : String(group.media), tone: INK_2 },
      ],
    },
    ...(group?.master === null || group?.master === undefined ? [] : ([{ kind: 'text', text: `Master del grupo: ${who(group.master)}`, tone: MINT }] as Block[])),
    { kind: 'text', text: CATEGORY_ABOUT[category], tone: INK_2 },
    { kind: 'label', text: 'Tus dimensiones (1 a 5)' },
    { kind: 'bullets', items: listing, tone: INK },
  ])
  const h = Math.max(620, cardY + Math.max(...tips.map(tip => tip.h), summaryTip.h) + 16)
  const hover = [...metrics.map((_, i) => `svg:has(#${category}-ax-${i}:hover) #${category}-tip-${i}`), `svg:has(#${category}-score:hover) #${category}-tip-all`].join(',')
  const style = `<style>.tip{opacity:0;transform:translateY(6px);transition:opacity .2s ease,transform .25s cubic-bezier(.16,1,.3,1);pointer-events:none}${hover}{opacity:1;transform:none}.ax{cursor:help}.ax:hover .lbl{fill:${INK}}#${category}-score{cursor:help}</style>`
  const hasMaster = masters !== ''
  const legend = `<g font-family="${SANS}" font-size="11.5"><line x1="20" y1="86" x2="40" y2="86" stroke="${INK}" stroke-width="1.6"/><text x="46" y="90" fill="${INK_2}">${NOW_NAME}</text>${
    hasReal ? `<line x1="150" y1="86" x2="170" y2="86" stroke="${WARM}" stroke-width="1.6" stroke-dasharray="5 3"/><text x="176" y="90" fill="${INK_2}">${REAL_NAME}</text>` : ''
  }${hasMaster ? `<circle cx="264" cy="86" r="3.4" fill="${PAPER}" stroke="${MINT}" stroke-width="1.6"/><text x="273" y="90" fill="${INK_2}">Master del grupo</text>` : ''}</g>`

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${width}" height="${Math.round((width * h) / w)}" role="img">${style}
<rect width="${w}" height="${h}" fill="${PAPER}"/>
<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" fill="none" stroke="${HAIR}"/>
<text x="20" y="32" font-size="12" fill="${INK_3}" font-family="${SANS}" letter-spacing=".08em">SPIDERWEB CHART · ${esc(CATEGORY_NAMES[category].toUpperCase())}</text>
<text x="20" y="60" font-size="20" fill="${INK}" font-family="${SANS}" letter-spacing="-.01em">${esc(headline(category, realValue ?? value))}</text>
${legend}
<g id="${category}-score"><rect x="${w - 170}" y="10" width="154" height="74" fill="transparent"/><text x="${w - 20}" y="46" text-anchor="end" font-size="34" fill="${INK}" font-family="${MONO}">${value === null ? '—' : value}<tspan font-size="13" fill="${INK_3}">/100 ⓘ</tspan></text>${realValue === null ? '' : `<text x="${w - 20}" y="70" text-anchor="end" font-size="12" fill="${WARM}" font-family="${MONO}">real ${realValue}</text>`}</g>
${grid}${spokes}${realShape}${shape}${masters}${nodes}${callouts}${axes}${tips.map(tip => tip.svg).join('')}${summaryTip.svg}
</svg>`
}

// Up to five ways to improve in a category. Every item belongs to that category: the evaluator's advice for it first,
// then the first step of the category's weakest dimensions (herramienta: skills, conectores, artefactos, tareas programadas, funciones).
export const improvements = (profile: MastersProfile, category: Category) => {
  const advice = profile.recommendations.filter(rec => rec.category === category).map(rec => rec.text)
  const weakest = profile.metrics
    .filter(metric => metric.category === category && (metric.level ?? 0) < 4.5)
    .sort((a, b) => (a.level ?? 0) - (b.level ?? 0))
    .map(metric => `${nameOf(metric.id)}: ${guideOf(metric.id).how[0] ?? ''}`)
  return [...new Set([...advice.slice(0, 3), ...weakest])].slice(0, 5)
}

// For the bubble over a category: first steps and prompts of its weakest dimensions, so it never shows only a definition.
const howTo = (profile: MastersProfile, category: Category) => {
  const weak = profile.metrics.filter(metric => metric.category === category).sort((a, b) => (a.level ?? 0) - (b.level ?? 0)).slice(0, 3)
  return { how: weak.map(metric => `${nameOf(metric.id)}: ${guideOf(metric.id).how[0] ?? ''}`), examples: weak.map(metric => guideOf(metric.id).examples[0] ?? '').filter(text => text !== '') }
}

const sparkline = (values: (number | null)[]) => {
  const list = values.map(value => value ?? 0)
  if (list.length < 2) return ''
  const w = 220
  const h = 44
  const step = w / (list.length - 1)
  const d = list.map((value, i) => `${i === 0 ? 'M' : 'L'}${f(i * step)} ${f(h - (value / 100) * h)}`).join(' ')
  const last = list[list.length - 1] ?? 0
  return `<svg class="spark" viewBox="-4 -4 ${w + 8} ${h + 8}" width="${w}" height="${h}"><path d="${d}" fill="none" stroke="${ACCENT}" stroke-width="1.2" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" from="1" to="0" dur="1.6s" begin="indefinite" fill="freeze"/></path><circle cx="${f((list.length - 1) * step)}" cy="${f(h - (last / 100) * h)}" r="2.6" fill="${INK}"/></svg>`
}

const ring = (category: Category, value: number | null, real: number | null, i: number, extra: { how: string[]; examples: string[] }) => {
  const r = 34
  const c = 2 * Math.PI * r
  const share = (value ?? 0) / 100
  const realShare = (real ?? 0) / 100
  const realArc = real === null ? '' : `<circle class="arc" cx="42" cy="42" r="${r + 5}" fill="none" stroke="${WARM}" stroke-width="1.2" stroke-dasharray="${f(2 * Math.PI * (r + 5))}" stroke-dashoffset="${f(2 * Math.PI * (r + 5))}" transform="rotate(-90 42 42)" style="--to:${f(2 * Math.PI * (r + 5) * (1 - realShare))}"/>`
  return `<a class="ring" href="#cat-${category}" style="--d:${0.3 + i * 0.12}s"><svg viewBox="-2 -2 88 88" width="88" height="88"><circle cx="42" cy="42" r="${r}" fill="none" stroke="${HAIR}" stroke-width="1"/>${realArc}<circle class="arc" cx="42" cy="42" r="${r}" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" transform="rotate(-90 42 42)" stroke-dasharray="${f(c)}" stroke-dashoffset="${f(c)}" style="--to:${f(c * (1 - share))}"/><text x="42" y="47" text-anchor="middle" font-size="17" fill="${INK}" font-family="${MONO}">${value ?? '—'}</text></svg><span>${esc(CATEGORY_NAMES[category])}</span><em class="bubble">${esc(CATEGORY_ABOUT[category])}${real === null ? '' : `<br><b style="color:${WARM};font-weight:500">Nivel real ${real}</b>`}<span class="tl">Cómo hacerlo</span><ul class="tb">${extra.how.map(text => `<li>${esc(text)}</li>`).join('')}</ul><span class="tl">Ejemplos</span><ul class="tb ex">${extra.examples.map(text => `<li>«${esc(text)}»</li>`).join('')}</ul></em></a>`
}

// A member's package as a profile, so an owner or admin sees the same Spiderweb Charts the member sees.
const asProfile = (person: TeamPerson): MastersProfile => {
  const metrics: MetricResult[] = ALL_METRICS.map(metric => {
    const pair = person.metricas?.[metric.id]
    return { id: metric.id, category: metric.category, level: pair?.[0] ?? null, potential: pair?.[1] ?? null, evaluator: metric.evaluator, model: '', at: '' }
  })
  const real = person.potencial
  return {
    email: '',
    score: person.puntaje,
    tier: person.nivel,
    categories: person.categorias,
    metrics,
    recommendations: (person.recomendaciones ?? []).map(rec => ({ category: rec.categoria, text: rec.texto, evaluator: 'sonnet' as const, model: '', at: '' })),
    summary: person.resumen ?? '',
    prompts: 0,
    days: person.dias,
    trend: { herramienta: [], estructura: [], sistema: [], valor: [] },
    potential:
      real === null || typeof real.puntaje !== 'number'
        ? null
        : { score: real.puntaje, tier: real.nivel ?? '', categories: real.categorias ?? person.categorias, confidence: real.confianza ?? 0, crack: real.crack ?? false, recurrent: 0 },
    realToday: {},
    updatedAt: '',
  }
}

// Owners and admins: every member's full view, opened from the ranking (#ranking/m-<n>).
const memberViews = (team: Team | null) =>
  team?.admin !== true
    ? ''
    : team.personas
        .map((person, k) => {
          const shown = asProfile(person)
          const real = shown.potential
          return `<section class="member" id="m-${k}" hidden><a class="back" href="#ranking">← ${esc(team.ranking ?? 'Ranking')}</a>
<h2>${esc(person.nombre)}${person.licencia === 'premium' ? ' <span class="crown" title="Licencia premium">👑</span>' : ''}</h2>
<p class="sub">${real === null ? '' : `${REAL_NAME} <b style="color:${WARM}">${real.score}</b> · `}${NOW_NAME} <b>${shown.score}</b> · ${esc(shown.tier)} · ${person.dias} días</p>
${shown.summary === '' ? '' : `<p class="msum">${esc(shown.summary)}</p>`}
${CATEGORIES.map(category => {
  const tips = improvements(shown, category)
  return `<div class="cat in"><div class="viz">${spider(shown, category, 600, team)}</div><aside>${tips.length === 0 ? '' : `<h3>Cómo subir</h3><ul>${tips.map(tip => `<li>${esc(tip)}</li>`).join('')}</ul>`}</aside></div>`
}).join('')}</section>`
        })
        .join('')

// The portal's script, plain JavaScript (no escapes: [/] and [0-9] in regexes). __ACCENT__ is replaced when the page is built.
const PORTAL_JS = String.raw`(() => {
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches
  const NL = String.fromCharCode(10)
  const $ = s => document.querySelector(s)
  const J = id => { try { return JSON.parse(document.getElementById(id).textContent || 'null') } catch (e) { return null } }
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  requestAnimationFrame(() => document.body.classList.add('loaded'))
  // The scores count up.
  document.querySelectorAll('.count').forEach((el, k) => {
    const to = +el.dataset.to, t0 = performance.now() + k * 250
    const tick = now => { const p = calm ? 1 : Math.max(0, Math.min(1, (now - t0) / 1700)); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4))); if (p < 1) requestAnimationFrame(tick) }
    requestAnimationFrame(tick)
  })
  addEventListener('scroll', () => document.body.classList.toggle('scrolled', scrollY > 120), { passive: true })
  // Each category rises in and replays its drawing when it scrolls into view.
  const io = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return
    entry.target.classList.add('in')
    entry.target.querySelectorAll('svg').forEach(svg => { try { svg.setCurrentTime(0); svg.unpauseAnimations() } catch (e) {} })
    entry.target.querySelectorAll('.spark animate').forEach(a => { try { a.beginElement() } catch (e) {} })
    io.unobserve(entry.target)
  }), { threshold: .2 })
  document.querySelectorAll('.cat').forEach(cat => { cat.querySelectorAll('svg').forEach(svg => { try { svg.pauseAnimations() } catch (e) {} }); io.observe(cat) })

  // One floating card for every hover bubble (info marks, rings, data-tip): it always shows whole, flips near the edges and widens before it cuts.
  const tip = document.getElementById('gtip')
  const hideTip = () => { tip.hidden = true }
  const placeTip = (html, el) => {
    const r = el.getBoundingClientRect(), vw = innerWidth, vh = innerHeight
    tip.innerHTML = html
    tip.style.visibility = 'hidden'; tip.style.maxHeight = ''; tip.hidden = false
    let w = 0, h = 0
    for (const mw of [300, 380, 480, 600, 760]) {
      tip.style.width = Math.min(mw, vw - 16) + 'px'; w = tip.offsetWidth; h = tip.offsetHeight
      if (h <= Math.max(r.top - 16, vh - r.bottom - 16)) break
    }
    let left = r.left + r.width / 2 - w / 2, top = r.bottom + 8
    if (top + h > vh - 8) top = r.top - h - 8
    if (top < 8) {
      // Neither above nor below: put it beside the anchor.
      left = r.right + 8 + w <= vw - 8 ? r.right + 8 : r.left - w - 8
      top = Math.max(8, Math.min(r.top, vh - h - 8))
    }
    left = Math.max(8, Math.min(left, vw - w - 8))
    if (h > vh - 16) { top = 8; tip.style.maxHeight = (vh - 16) + 'px' }
    tip.style.left = left + 'px'; tip.style.top = top + 'px'; tip.style.visibility = 'visible'
  }
  const tipHtml = t => {
    if (t.dataset && t.dataset.tip !== undefined) return esc(t.dataset.tip).split(NL).join('<br>')
    const em = t.querySelector('em'); return em ? em.innerHTML : ''
  }
  const tipTarget = e => e.target && e.target.closest ? e.target.closest('.info,.ring,[data-tip]') : null
  document.addEventListener('mouseover', e => { const t = tipTarget(e); if (t) { const h = tipHtml(t); if (h) placeTip(h, t) } })
  document.addEventListener('mouseout', e => { const t = tipTarget(e); if (t && !(e.relatedTarget && t.contains(e.relatedTarget))) hideTip() })
  document.addEventListener('focusin', e => { const t = tipTarget(e); if (t) { const h = tipHtml(t); if (h) placeTip(h, t) } })
  document.addEventListener('focusout', hideTip)
  addEventListener('scroll', hideTip, { passive: true })
  document.addEventListener('keydown', e => { if (e.key === 'Escape') hideTip() })

  // Data.
  const team = J('team'), NAMES = J('names') || {}, CATS = J('cats') || {}, GUIDE = J('guide') || {}, ARCH = J('arch') || {}, MINE = J('mine') || {}
  const CAT_IDS = ['herramienta', 'estructura', 'sistema', 'valor']
  const CAT_SHORT = { herramienta: 'Herramienta', estructura: 'Estructura', sistema: 'Sistema', valor: 'Valor' }
  const SEGC = { top: '#94B27E', mid: '#8E9DD6', low: '#D67D5E' }
  const SEGN = { top: 'Top', mid: 'Mid', low: 'Low' }
  const DIMS = Object.keys(NAMES).sort((a, b) => CAT_IDS.indexOf(NAMES[a][1]) - CAT_IDS.indexOf(NAMES[b][1]))
  const people = team && team.personas ? team.personas : []
  const realOf = p => (p.potencial && typeof p.potencial.puntaje === 'number') ? p.potencial.puntaje : null
  const num1 = v => v === null || v === undefined ? '–' : (Math.round(v * 10) / 10).toString()

  let by = 'real', measure = 'total', seg = 'all', limit = 50
  const sort = { key: null, dir: -1 }
  const filters = {}
  const openF = new Set()
  const metricVal = (p, id) => { const m = p.metricas && p.metricas[id]; if (!m) return null; const v = by === 'real' ? (m[1] == null ? m[0] : m[1]) : m[0]; return typeof v === 'number' ? v : null }
  const catVal = (p, c) => { const src = by === 'real' && p.potencial && p.potencial.categorias ? p.potencial.categorias : p.categorias; const v = src ? src[c] : null; return typeof v === 'number' ? v : null }
  const totalVal = p => by === 'real' ? (realOf(p) == null ? p.puntaje : realOf(p)) : p.puntaje
  const mval = p => measure === 'total' ? totalVal(p) : measure.indexOf('cat:') === 0 ? catVal(p, measure.slice(4)) : metricVal(p, measure.slice(4))
  const isDim = () => measure.indexOf('dim:') === 0
  const isCat = () => measure.indexOf('cat:') === 0

  // Percentiles of the selected measure: top >= p80, low <= p20.
  let P80 = 0, P20 = 0, rankOf = new Map()
  const pct = (list, q) => { if (list.length === 0) return 0; const x = (list.length - 1) * q, lo = Math.floor(x), hi = Math.ceil(x); return list[lo] + (list[hi] - list[lo]) * (x - lo) }
  const segOf = p => { const v = mval(p); if (v === null || v === undefined) return 'none'; if (P80 === P20) return 'mid'; return v >= P80 ? 'top' : v <= P20 ? 'low' : 'mid' }
  const refresh = () => {
    const vals = people.map(mval).filter(v => v !== null && v !== undefined).sort((a, b) => a - b)
    P80 = pct(vals, .8); P20 = pct(vals, .2)
    const order = people.map(p => ({ p, v: mval(p) })).sort((a, b) => (b.v === null ? -1 : b.v) - (a.v === null ? -1 : a.v))
    rankOf = new Map(order.map((x, i) => [x.p, i + 1]))
    const th = $('#f-th'); if (th) th.textContent = vals.length === 0 ? '' : 'Top desde ' + num1(P80) + ' · Low hasta ' + num1(P20)
  }

  // Bubbles.
  const info = html => '<i class="info" tabindex="0">i<em>' + html + '</em></i>'
  const list = (items, cls) => '<ul class="tb ' + (cls || '') + '">' + items.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul>'
  const guideInfo = id => { const g = GUIDE[id]; return g ? esc(g[0]) + '<span class="tl">Cómo hacerlo</span>' + list(g[1]) + '<span class="tl">Ejemplos</span>' + list(g[2].map(t => '«' + t + '»'), 'ex') : '' }
  const catInfo = c => {
    const ids = DIMS.filter(id => NAMES[id][1] === c)
    return esc((CATS[c] || [c, ''])[0] + ': ' + (CATS[c] || ['', ''])[1]) + '<span class="tl">Cómo hacerlo</span>' + list(ids.map(id => NAMES[id][0] + ': ' + ((GUIDE[id] || [0, ['']])[1][0] || ''))) +
      '<span class="tl">Ejemplos</span>' + list(ids.slice(0, 3).map(id => '«' + ((GUIDE[id] || [0, 0, ['']])[2][0] || '') + '»'), 'ex')
  }

  // Columns.
  const hasCons = people.some(p => p.consumo)
  const tok = p => p.consumo ? (p.consumo.entrada || 0) + (p.consumo.salida || 0) : null
  const nf = new Intl.NumberFormat('es-MX')
  const fmtTok = n => n === null ? '–' : n >= 1e6 ? (n / 1e6).toFixed(1) + ' M' : n >= 1e3 ? Math.round(n / 1e3) + ' k' : String(n)
  const adnText = p => { const t = p.talento; if (!t || !t.listo || !t.top || !t.top[0]) return ''; return t.par || t.top.map(id => (ARCH[id] || [id])[0]).join(' + ') }
  const barCell = (v, cls) => '<td><span class="bar ' + cls + '"><i data-w="' + (v == null ? 0 : v) + '"></i></span><span class="n">' + (v == null ? '–' : v) + '</span></td>'
  const numCell = v => '<td class="n">' + (v == null ? '–' : num1(v)) + '</td>'
  const cols = [
    { key: 'pos', label: '#', num: true, fixed: true, get: p => rankOf.get(p) },
    { key: 'nombre', label: 'Persona', fixed: true, get: p => p.nombre || '' },
    { key: 'real', label: 'Nivel real', num: true, def: true, group: 'Base', info: 'El nivel más alto que la persona alcanzó al menos 4 veces en 45 días, 2 de ellas en 10 días seguidos. Se queda 120 días.', get: p => realOf(p), cell: p => barCell(realOf(p), 'real') },
    { key: 'now', label: 'Momento', num: true, def: true, group: 'Base', info: 'Promedio de sus últimos 10 días de trabajo.', get: p => p.puntaje, cell: p => barCell(p.puntaje, 'now') },
  ]
  CAT_IDS.forEach(c => cols.push({ key: 'cat:' + c, label: CAT_SHORT[c], num: true, def: true, group: 'Categorías', infoHtml: catInfo(c), get: p => catVal(p, c), cell: p => numCell(catVal(p, c)) }))
  cols.push({ key: 'dias', label: 'Días', num: true, def: true, group: 'Base', info: 'Días de trabajo detrás de su momento actual.', get: p => p.dias, cell: p => '<td class="n">' + p.dias + '</td>' })
  cols.push({ key: 'adn', label: 'ADN', def: true, group: 'Base', info: 'Su arquetipo de talento principal y el nombre del par que forma con el segundo. Aparece cuando su radiografía ya está lista.', get: p => adnText(p),
    cell: p => { const t = p.talento, a = t && t.listo && t.top && t.top[0] ? ARCH[t.top[0]] : null; return a ? '<td class="adn-c"><span class="adn-i">' + a[3] + '</span><span class="adn-t">' + esc(adnText(p)) + '</span></td>' : '<td class="adn-c dash">—</td>' } })
  if (hasCons) cols.push({ key: 'consumo', label: 'Consumo', num: true, group: 'Base', info: 'Tokens (entrada + salida) que el propio mod gastó evaluando a esta persona, últimos 30 días. Sirve para vigilar costo. Solo lo ven owners y admins.', get: p => tok(p),
    cell: p => { const c = p.consumo; return c ? '<td class="n" data-tip="' + esc('Entrada ' + nf.format(c.entrada || 0) + NL + 'Salida ' + nf.format(c.salida || 0) + NL + 'Caché leída ' + nf.format(c.cache_leida || 0) + NL + 'Caché escrita ' + nf.format(c.cache_escrita || 0) + NL + 'Llamadas ' + nf.format(c.llamadas || 0) + NL + 'Últimos ' + (c.dias || 30) + ' días') + '">' + fmtTok(tok(p)) + '</td>' : '<td class="n">–</td>' } })
  DIMS.forEach(id => cols.push({ key: 'dim:' + id, label: NAMES[id][0], num: true, group: 'Dimensiones · ' + (CATS[NAMES[id][1]] || [NAMES[id][1]])[0], infoHtml: guideInfo(id), get: p => metricVal(p, id), cell: p => numCell(metricVal(p, id)) }))
  const colBy = Object.fromEntries(cols.map(c => [c.key, c]))
  let order = cols.map(c => c.key)
  const vis = new Set(cols.filter(c => c.def).map(c => c.key))
  const effKeys = () => order.filter(k => colBy[k].fixed || vis.has(k) || k === measure)

  const box = $('#rank-table'), sc = $('#rank-sc'), moreBox = $('#rank-more')
  const arrow = k => sort.key === k ? (sort.dir > 0 ? ' ↑' : ' ↓') : ''
  const funnel = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16l-6 7v6l-4 2v-8z"/></svg>'
  const drawHead = () => {
    const keys = effKeys()
    $('#rank-head').innerHTML = '<tr>' + keys.map(k => {
      const c = colBy[k], f = filters[k] || '', open = openF.has(k) || f !== ''
      const cls = (k === 'pos' ? 's0 ' : k === 'nombre' ? 's1 ' : '') + (k === measure ? 'hl ' : '') + (c.num ? 'tn' : '')
      const infoMark = c.infoHtml ? info(c.infoHtml) : c.info ? info(esc(c.info)) : ''
      return '<th class="' + cls + '" data-k="' + k + '"><div class="th-in"><span class="th-lab" data-k="' + k + '"' + (c.fixed ? '' : ' draggable="true"') + '>' + esc(c.label) + arrow(k) + '</span>' + infoMark +
        (k === 'pos' ? '' : '<button class="th-f' + (f !== '' ? ' on' : '') + '" data-k="' + k + '" aria-label="Filtrar ' + esc(c.label) + '">' + funnel + '</button>') + '</div>' +
        (open && k !== 'pos' ? '<input class="fi" data-k="' + k + '" value="' + esc(f) + '" placeholder="' + (c.num ? 'mín.' : 'contiene') + '" aria-label="Filtro de ' + esc(c.label) + '">' : '') + '</th>'
    }).join('') + '</tr>'
    const head = $('#rank-head')
    head.querySelectorAll('.th-lab').forEach(el => el.onclick = () => {
      const k = el.dataset.k; if (sort.key === k) sort.dir = -sort.dir; else { sort.key = k; sort.dir = colBy[k].num && k !== 'pos' ? -1 : 1 }
      limit = 50; drawHead(); drawBody()
    })
    head.querySelectorAll('.th-f').forEach(el => el.onclick = () => { const k = el.dataset.k; if (openF.has(k) || (filters[k] || '') !== '') { openF.delete(k); delete filters[k] } else openF.add(k); limit = 50; drawHead(); drawBody() })
    head.querySelectorAll('.fi').forEach(el => { el.oninput = () => { filters[el.dataset.k] = el.value; limit = 50; drawBody() }; el.onclick = e => e.stopPropagation() })
    // Drag a header to move its column.
    let drag = null
    head.querySelectorAll('.th-lab[draggable]').forEach(el => el.ondragstart = e => { drag = el.dataset.k; try { e.dataTransfer.setData('text/plain', drag); e.dataTransfer.effectAllowed = 'move' } catch (x) {} })
    head.querySelectorAll('th').forEach(th => {
      const k = th.dataset.k
      th.ondragover = e => { if (drag && !colBy[k].fixed) { e.preventDefault(); th.classList.add('over') } }
      th.ondragleave = () => th.classList.remove('over')
      th.ondrop = e => { e.preventDefault(); th.classList.remove('over'); if (!drag || drag === k || colBy[k].fixed) return; const from = order.indexOf(drag), to = order.indexOf(k); order.splice(from, 1); order.splice(to, 0, drag); drag = null; drawHead(); drawBody() }
    })
    edges()
  }
  const passes = p => {
    for (const k in filters) {
      const f = String(filters[k]).trim(); if (f === '' || !colBy[k]) continue
      const v = colBy[k].get(p)
      if (colBy[k].num) { const n = Number(f.replace(',', '.')); if (!isNaN(n) && (v === null || v === undefined || v < n)) return false } else if (String(v == null ? '' : v).toLowerCase().indexOf(f.toLowerCase()) < 0) return false
    }
    return true
  }
  const detail = (p, span) => {
    const m = p.metricas || {}
    const groups = CAT_IDS.map(c => {
      const items = DIMS.filter(id => NAMES[id][1] === c && m[id])
      if (items.length === 0) return ''
      return '<div><h4>' + esc((CATS[c] || [c])[0]) + '</h4>' + items.map(id => { const n = m[id][0], r = m[id][1]; return '<div class="det-row"><span>' + esc(NAMES[id][0]) + '</span><span class="mini"><i class="r" style="width:' + ((r == null ? 0 : r) * 20) + '%"></i><i class="n" style="width:' + ((n == null ? 0 : n) * 20) + '%"></i></span><b>' + (n == null ? '–' : n) + '</b><b class="r">' + (r == null ? '–' : r) + '</b></div>' }).join('') + '</div>'
    }).join('')
    return '<tr class="det"><td colspan="' + span + '">' + (groups === '' ? '<span class="empty">Esta persona aún usa una versión que no envía el detalle.</span>' : '<div class="det-grid">' + groups + '</div>') + '</td></tr>'
  }
  const drawBody = () => {
    hideTip()
    const keys = effKeys()
    const rows = people.map((p, k) => ({ p, k })).filter(x => (seg === 'all' || segOf(x.p) === seg) && passes(x.p))
    const sk = sort.key
    const getter = sk === null ? (p => mval(p)) : colBy[sk].get
    const dir = sk === null ? -1 : sort.dir
    const isNum = sk === null ? true : !!colBy[sk].num
    rows.sort((a, b) => {
      const va = getter(a.p), vb = getter(b.p), na = va === null || va === undefined || va === '', nb = vb === null || vb === undefined || vb === ''
      if (na || nb) return na && nb ? 0 : na ? 1 : -1
      return (isNum ? (va - vb) : String(va).localeCompare(String(vb), 'es')) * dir
    })
    const cut = rows.slice(0, limit)
    const rowHtml = (x, i) => {
      const p = x.p, s = segOf(p)
      return '<tr class="row ' + (p.yo ? 'me' : '') + '" data-k="' + x.k + '" style="transition-delay:' + Math.min(i, 20) * 28 + 'ms">' + keys.map(k => {
        const c = colBy[k]
        if (k === 'pos') return '<td class="pos s0">' + String(rankOf.get(p) || i + 1).padStart(2, '0') + '</td>'
        if (k === 'nombre') return '<td class="s1"><span class="nm" title="' + esc(p.nombre) + '">' + (s === 'none' ? '' : '<i class="seg" style="background:' + SEGC[s] + '" title="' + SEGN[s] + '"></i>') + esc(p.nombre) + '</span>' + (p.licencia === 'premium' ? '<span class="crown" title="Licencia premium">👑</span>' : '') + (p.yo ? '<span class="tag">tú</span>' : '') + (p.potencial && p.potencial.puntaje >= 80 && (p.potencial.confianza || 0) >= .75 ? '<span class="tag crack">crack</span>' : '') + '</td>'
        const cell = c.cell(p)
        return k === measure ? cell.replace('<td', '<td data-hl="1"') : cell
      }).join('') + '</tr>'
    }
    $('#rank-body').innerHTML = cut.length === 0 ? '<tr><td colspan="' + keys.length + '" class="empty">Ninguna persona cumple estos filtros.</td></tr>' : cut.map(rowHtml).join('')
    $('#rank-body').querySelectorAll('tr.row').forEach(tr => tr.onclick = ev => {
      if (ev.target.closest && ev.target.closest('.info')) return
      const k = +tr.dataset.k
      if (team.admin && document.getElementById('m-' + k)) { location.hash = '#ranking/m-' + k; return }
      const d = tr.nextElementSibling
      if (d && d.classList.contains('det')) d.remove(); else tr.insertAdjacentHTML('afterend', detail(people[k], keys.length))
    })
    const left = rows.length - limit
    moreBox.innerHTML = left > 0 ?
      '<button class="more-b" data-m="50" aria-label="Mostrar 50 más"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg><span>+50</span></button>' +
      '<button class="more-b all" data-m="all" aria-label="Mostrar todo"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l6 6 6-6"/><path d="M6 13l6 6 6-6"/></svg><span>Todo</span></button>' : ''
    moreBox.querySelectorAll('.more-b').forEach(b => b.onclick = () => { limit = b.dataset.m === 'all' ? 1e9 : limit + 50; drawBody() })
    box.classList.remove('shown')
    requestAnimationFrame(() => requestAnimationFrame(() => { box.classList.add('shown'); box.querySelectorAll('.bar i').forEach(b => b.style.width = b.dataset.w + '%') }))
    edges()
  }

  // Edge chevrons: the table has no scrollbar; hover an edge and it glides.
  const eL = $('#edge-l'), eR = $('#edge-r')
  function edges() { if (!sc || !eL) return; eL.hidden = sc.scrollLeft <= 2; eR.hidden = sc.scrollLeft >= sc.scrollWidth - sc.clientWidth - 2 }
  let slide = 0
  const glide = () => { if (!slide) return; sc.scrollLeft += slide * 8; edges(); requestAnimationFrame(glide) }
  ;[[eL, -1], [eR, 1]].forEach(([el, d]) => {
    if (!el) return
    el.onmouseenter = () => { slide = d; glide() }
    el.onmouseleave = () => { slide = 0 }
    el.onclick = () => sc.scrollBy({ left: d * 280, behavior: 'smooth' })
  })
  if (sc) {
    sc.addEventListener('scroll', edges, { passive: true })
    sc.addEventListener('wheel', e => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { sc.scrollLeft += e.deltaX; edges(); e.preventDefault() } }, { passive: false })
    addEventListener('resize', edges)
  }

  // Filter bar.
  const sel = $('#f-measure')
  const buildMeasure = () => {
    let h = '<option value="total">Puntaje total</option><optgroup label="Categorías">' + CAT_IDS.map(c => '<option value="cat:' + c + '">' + esc((CATS[c] || [c])[0]) + '</option>').join('') + '</optgroup>'
    CAT_IDS.forEach(c => { h += '<optgroup label="' + esc('Dimensiones · ' + (CATS[c] || [c])[0]) + '">' + DIMS.filter(id => NAMES[id][1] === c).map(id => '<option value="dim:' + id + '">' + esc(NAMES[id][0]) + '</option>').join('') + '</optgroup>' })
    sel.innerHTML = h
  }
  const measureInfo = () => {
    const el = $('#f-info em'); if (!el) return
    el.innerHTML = measure === 'total' ? 'Puntaje total: el promedio ponderado de las cuatro categorías.' : isCat() ? catInfo(measure.slice(4)) : guideInfo(measure.slice(4))
  }
  const syncBar = () => {
    sel.value = measure
    document.querySelectorAll('#f-seg button').forEach(b => b.classList.toggle('on', b.dataset.s === seg))
    document.querySelectorAll('.switch button[data-by]').forEach(x => x.classList.toggle('on', x.dataset.by === by))
    measureInfo()
  }
  function redraw() { refresh(); syncBar(); drawHead(); drawBody(); drawTeamWeb(); drawGauss() }
  if (team && sel) {
    buildMeasure(); syncBar()
    sel.onchange = () => { measure = sel.value; sort.key = null; limit = 50; redraw() }
    document.querySelectorAll('#f-seg button').forEach(b => b.onclick = () => { seg = b.dataset.s; limit = 50; redraw() })
    document.querySelectorAll('.switch button[data-by]').forEach(b => b.onclick = () => { by = b.dataset.by; redraw() })
    // Column chooser.
    const pop = $('#cols-pop'), btn = $('#cols-btn')
    const drawPop = () => {
      const groups = []
      cols.filter(c => !c.fixed).forEach(c => { let g = groups.find(x => x.n === c.group); if (!g) { g = { n: c.group, items: [] }; groups.push(g) } g.items.push(c) })
      pop.innerHTML = groups.map(g => '<div class="cp-g"><b>' + esc(g.n) + '</b>' + g.items.map(c => '<label><input type="checkbox" data-k="' + c.key + '"' + (vis.has(c.key) || c.key === measure ? ' checked' : '') + (c.key === measure ? ' disabled' : '') + '> ' + esc(c.label) + '</label>').join('') + '</div>').join('') + '<button class="cp-reset">Restablecer columnas</button>'
      pop.querySelectorAll('input').forEach(i => i.onchange = () => { if (i.checked) vis.add(i.dataset.k); else vis.delete(i.dataset.k); drawHead(); drawBody() })
      pop.querySelector('.cp-reset').onclick = () => { vis.clear(); cols.filter(c => c.def).forEach(c => vis.add(c.key)); order = cols.map(c => c.key); drawPop(); drawHead(); drawBody() }
    }
    btn.onclick = e => { e.stopPropagation(); pop.hidden = !pop.hidden; if (!pop.hidden) drawPop() }
    document.addEventListener('click', e => { if (!pop.hidden && !pop.contains(e.target) && e.target !== btn) pop.hidden = true })
    $('#f-clear').onclick = () => { for (const k in filters) delete filters[k]; openF.clear(); seg = 'all'; measure = 'total'; sort.key = null; limit = 50; redraw() }
  }

  // Owners and admins: the whole team on one Spiderweb Chart. Click a name or a shape to light it; double-click to zoom in.
  const TW = document.getElementById('team-web')
  let axesBy = 'cat'
  const picked = new Set()
  const hue = i => 'hsl(' + Math.round((i * 137.5) % 360) + ',46%,62%)'
  function drawTeamWeb() {
    if (!TW || !team || !team.personas) return
    const mode = isDim() ? 'dim' : isCat() ? 'cat' : axesBy
    const hl = measure === 'total' ? null : measure.slice(4)
    const idx = people.map((p, k) => k).filter(k => seg === 'all' || segOf(people[k]) === seg)
    const axes = mode === 'cat' ? CAT_IDS : DIMS
    const label = a => mode === 'cat' ? (CATS[a] || [a])[0] : NAMES[a][0]
    const val = (p, a) => {
      if (mode === 'cat') { const v = catVal(p, a); return v === null ? 0 : v / 100 }
      const v = metricVal(p, a); return v === null ? 0 : v / 5
    }
    TW.querySelectorAll('.switch button[data-ax]').forEach(x => x.classList.toggle('on', x.dataset.ax === mode))
    const W = 940, cx = W / 2, cy = 470, R = 330, n = axes.length
    const pt = (i, s) => { const an = (i / n) * Math.PI * 2 - Math.PI / 2; return [cx + Math.cos(an) * R * s, cy + Math.sin(an) * R * s] }
    const poly = vals => vals.map((v, i) => pt(i, Math.max(.03, v)).map(x => x.toFixed(1)).join(',')).join(' ')
    let svg = '<svg viewBox="-170 0 ' + (W + 340) + ' 960" class="tw-svg">'
    for (const s of [.2, .4, .6, .8, 1]) svg += '<polygon points="' + poly(axes.map(() => s)) + '" fill="none" stroke="' + (s === 1 ? '#3A3E43' : '#24272A') + '" stroke-width=".8"/>'
    axes.forEach((a, i) => {
      const on = hl === null || hl === a
      const [x, y] = pt(i, 1); const [lx, ly] = pt(i, mode === 'cat' ? 1.12 : 1.06); const anchor = lx < cx - 8 ? 'end' : lx > cx + 8 ? 'start' : 'middle'
      svg += '<line x1="' + cx + '" y1="' + cy + '" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="' + (hl === a ? '#6D92D6' : '#24272A') + '" stroke-width="' + (hl === a ? 1.6 : 1) + '"/><text x="' + lx.toFixed(1) + '" y="' + (ly + 4).toFixed(1) + '" text-anchor="' + anchor + '" font-size="' + (mode === 'cat' ? 17 : 10.5) + '" fill="' + (hl === a ? '#E6E8EA' : on ? '#A9ADB1' : '#4B4F55') + '"' + (hl === a ? ' font-weight="600"' : '') + '>' + esc(label(a)) + '</text>'
    })
    const shown = idx.map(k => people[k])
    const avg = axes.map(a => shown.reduce((t, p) => t + val(p, a), 0) / Math.max(1, shown.length))
    idx.forEach(k => {
      const p = people[k], on = picked.has(k), dim = picked.size > 0 && !on
      svg += '<polygon class="tw-p" data-k="' + k + '" points="' + poly(axes.map(a => val(p, a))) + '" fill="' + hue(k) + '" fill-opacity="' + (on ? .16 : dim ? 0 : .03) + '" stroke="' + hue(k) + '" stroke-opacity="' + (on ? 1 : dim ? .06 : .35) + '" stroke-width="' + (on ? 2.4 : 1.1) + '" style="--d:' + (k % 30 * 40) + 'ms" data-tip="' + esc(p.nombre) + '"></polygon>'
    })
    svg += '<polygon points="' + poly(avg) + '" fill="none" stroke="#E6E8EA" stroke-width="2" stroke-dasharray="6 5" class="tw-avg" data-tip="Media de las personas dibujadas"></polygon></svg>'
    const chips = '<div class="tw-chips"><button class="chip all' + (picked.size === 0 ? ' on' : '') + '" data-k="all">Todo el equipo</button>' + idx.map(k => { const p = people[k]; return '<button class="chip' + (picked.has(k) ? ' on' : '') + '" data-k="' + k + '" style="--c:' + hue(k) + '"><i></i><span class="cn">' + esc(p.nombre) + '</span>' + (p.licencia === 'premium' ? ' 👑' : '') + '</button>' }).join('') + '</div>'
    TW.querySelector('.tw-body').innerHTML = chips + svg
    const toggle = k => { if (k === 'all') picked.clear(); else { k = +k; picked.has(k) ? picked.delete(k) : picked.add(k) } drawTeamWeb() }
    const zoom = k => { if (k !== 'all' && document.getElementById('m-' + k)) location.hash = '#ranking/m-' + k }
    TW.querySelectorAll('.chip').forEach(c => { c.onclick = () => toggle(c.dataset.k); c.ondblclick = () => zoom(c.dataset.k) })
    TW.querySelectorAll('.tw-p').forEach(pl => { pl.onclick = () => toggle(pl.dataset.k); pl.ondblclick = () => zoom(pl.dataset.k) })
  }
  if (TW) TW.querySelectorAll('.switch button[data-ax]').forEach(b => b.onclick = () => { axesBy = b.dataset.ax; if (measure !== 'total') { measure = 'total'; sort.key = null; redraw() } else drawTeamWeb() })

  // Owners and admins: the bell curve of the selected measure. Each person is a dot, colored by segment.
  const GA = document.getElementById('gauss')
  function drawGauss() {
    if (!GA || !team || !team.personas) return
    const body = GA.querySelector('.g-body')
    const all = people.map((p, k) => ({ p, k, v: mval(p) })).filter(x => x.v !== null && x.v !== undefined)
    const title = measure === 'total' ? 'Puntaje total' : isCat() ? (CATS[measure.slice(4)] || [measure])[0] : NAMES[measure.slice(4)][0]
    GA.querySelector('.g-t').textContent = title + (by === 'real' ? ' · nivel real' : ' · momento actual')
    if (all.length < 3) { body.innerHTML = '<p class="empty">Aún no hay suficientes personas con este dato para dibujar la distribución.</p>'; return }
    const lo = 0, hi = isDim() ? 5 : 100, N = all.length
    const mean = all.reduce((t, x) => t + x.v, 0) / N
    const sd = Math.max(Math.sqrt(all.reduce((t, x) => t + (x.v - mean) * (x.v - mean), 0) / N), (hi - lo) * .01)
    const W = 940, pl = 40, pr = 24, pt = 30, ph = 210, ay = pt + ph
    const X = v => pl + (v - lo) / (hi - lo) * (W - pl - pr)
    const nb = 12, bw = (hi - lo) / nb, counts = Array(nb).fill(0)
    all.forEach(x => { counts[Math.min(nb - 1, Math.max(0, Math.floor((x.v - lo) / bw)))]++ })
    const pdf = v => Math.exp(-((v - mean) * (v - mean)) / (2 * sd * sd)) / (sd * Math.sqrt(2 * Math.PI))
    const peak = Math.max(N * bw * pdf(mean), Math.max.apply(null, counts), 1)
    const Y = c => ay - (c / peak) * ph * .92
    let g = '<svg viewBox="0 0 ' + W + ' %H%" class="g-svg" role="img">'
    counts.forEach((c, i) => { if (c > 0) g += '<rect x="' + (X(lo + i * bw) + 1).toFixed(1) + '" y="' + Y(c).toFixed(1) + '" width="' + (X(lo + bw) - X(lo) - 2).toFixed(1) + '" height="' + (ay - Y(c)).toFixed(1) + '" fill="#E6E8EA" fill-opacity=".06"/>' })
    let d = ''
    for (let i = 0; i <= 120; i++) { const v = lo + (hi - lo) * i / 120; d += (i ? 'L' : 'M') + X(v).toFixed(1) + ' ' + Y(N * bw * pdf(v)).toFixed(1) }
    g += '<path d="' + d + 'L' + X(hi).toFixed(1) + ' ' + ay + 'L' + X(lo).toFixed(1) + ' ' + ay + 'Z" fill="#6D92D6" fill-opacity=".08"/><path d="' + d + '" fill="none" stroke="#6D92D6" stroke-width="1.6"' + (calm ? '' : ' pathLength="1" stroke-dasharray="1" class="g-draw"') + '/>'
    ;[[mean - sd, '−1σ'], [mean, 'media'], [mean + sd, '+1σ']].forEach(([v, t], i) => {
      if (v < lo || v > hi) return
      g += '<line x1="' + X(v).toFixed(1) + '" x2="' + X(v).toFixed(1) + '" y1="' + (pt - 6) + '" y2="' + ay + '" stroke="' + (i === 1 ? '#E6E8EA' : '#84888E') + '" stroke-width="1" stroke-dasharray="' + (i === 1 ? '5 4' : '2 4') + '"/><text x="' + X(v).toFixed(1) + '" y="' + (pt - 12) + '" text-anchor="middle" font-size="11" fill="#A9ADB1" font-family="monospace">' + t + ' ' + num1(v) + '</text>'
    })
    g += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + ay + '" y2="' + ay + '" stroke="#3A3E43"/>'
    const stepT = isDim() ? 1 : 20
    for (let v = lo; v <= hi; v += stepT) g += '<text x="' + X(v).toFixed(1) + '" y="' + (ay + 15) + '" text-anchor="middle" font-size="10.5" fill="#84888E" font-family="monospace">' + v + '</text>'
    // Dots under the axis, stacked so none hides another.
    const dots = all.filter(x => seg === 'all' || segOf(x.p) === seg).sort((a, b) => a.v - b.v)
    const lastX = []
    let rows = 0
    dots.forEach(x => {
      const px = X(x.v); let r = 0
      while (lastX[r] !== undefined && px - lastX[r] < 11) r++
      lastX[r] = px; rows = Math.max(rows, r + 1)
      const s = segOf(x.p)
      g += '<circle class="g-dot" cx="' + px.toFixed(1) + '" cy="' + (ay + 30 + r * 11) + '" r="4.4" fill="' + SEGC[s] + '" fill-opacity=".9" data-k="' + x.k + '" data-tip="' + esc(x.p.nombre + NL + num1(x.v) + ' · ' + SEGN[s]) + '"/>'
    })
    const H = ay + 30 + Math.max(1, rows) * 11 + 18
    body.innerHTML = g.replace('%H%', H) + '</svg>'
    body.querySelectorAll('.g-dot').forEach(c => c.onclick = () => { if (document.getElementById('m-' + c.dataset.k)) location.hash = '#ranking/m-' + c.dataset.k })
    const lg = GA.querySelector('.g-lg')
    lg.innerHTML = ['top', 'mid', 'low'].map(s => '<span><i style="background:' + SEGC[s] + '"></i>' + SEGN[s] + '</span>').join('') + '<span class="mono">media ' + num1(mean) + ' · σ ' + num1(sd) + '</span>'
  }

  // «Mi nivel»: who would be my ideal partner and my ideal master.
  const drawBuddies = () => {
    const root = document.getElementById('buddies')
    if (!root || !team || !people.length) return
    const mine = MINE.metricas || {}
    const mineIds = Object.keys(mine).filter(id => NAMES[id])
    const others = people.map((p, k) => ({ p, k })).filter(x => !x.p.yo && x.p.metricas)
    if (mineIds.length === 0 || others.length === 0) return
    const my = id => { const m = mine[id]; return m ? (m[1] == null ? m[0] : m[1]) : null }
    const their = (p, id) => { const m = p.metricas[id]; return m ? (m[1] == null ? m[0] : m[1]) : null }
    const ids = mineIds.filter(id => my(id) !== null).sort((a, b) => my(a) - my(b))
    if (ids.length < 3) return
    const link = (x, inner) => (team.admin && document.getElementById('m-' + x.k)) ? '<a class="pp" href="#ranking/m-' + x.k + '">' + inner + '</a>' : '<div class="pp">' + inner + '</div>'
    const card = (x, tail) => {
      const t = x.p.talento, a = t && t.listo && t.top && t.top[0] ? ARCH[t.top[0]] : null
      return '<span class="pp-i">' + (a ? a[3] : '') + '</span><span class="pp-b"><b class="pp-n">' + esc(x.p.nombre) + '</b>' + (a ? '<small style="color:' + a[2] + '">' + esc(adnText(x.p)) + '</small>' : '') + '<span class="pp-r">' + esc(tail.reason) + '</span></span><span class="pp-s">' + tail.score + '</span>'
    }
    // Ideal master: the highest real level on my weakest dimensions.
    const weak = ids.filter(id => others.some(x => their(x.p, id) !== null)).slice(0, 5)
    const masters = others.map(x => {
      const vals = weak.map(id => ({ id, v: their(x.p, id) })).filter(y => y.v !== null)
      if (vals.length < Math.min(3, weak.length)) return null
      const avg = vals.reduce((t, y) => t + y.v, 0) / vals.length
      const wins = vals.filter(y => y.v > my(y.id)).sort((a, b) => (b.v - my(b.id)) - (a.v - my(a.id)))
      return wins.length === 0 ? null : { x, avg, wins }
    }).filter(Boolean).sort((a, b) => b.avg - a.avg || b.wins.length - a.wins.length).slice(0, 3)
    const mBox = document.getElementById('bd-master')
    mBox.innerHTML = masters.length === 0 ? '<p class="empty">Aún no hay alguien del equipo por encima de ti en tus dimensiones más bajas.</p>' : masters.map(m => link(m.x, card(m.x, { score: num1(m.avg), reason: 'Más alto que tú en ' + m.wins.slice(0, 3).map(y => NAMES[y.id][0] + ' (' + y.v + ' frente a tu ' + my(y.id) + ')').join(', ') + '.' }))).join('')
    // Ideal partner: strong where I am weak, in the talent X-ray and in the dimensions.
    const tm = MINE.talento || null
    const mates = others.map(x => {
      let tf = null, topA = []
      const tp = x.p.talento && x.p.talento.listo ? x.p.talento.puntajes : null
      if (tm && tp) {
        let num = 0, den = 0
        Object.keys(tm).forEach(a => { const w = Math.pow(100 - tm[a], 2) / 10000; num += w * (tp[a] || 0); den += w })
        tf = den > 0 ? num / den / 100 : null
        topA = Object.keys(tm).map(a => ({ a, s: (tp[a] || 0) * (100 - tm[a]) })).sort((p, q) => q.s - p.s).slice(0, 2).filter(y => y.s > 0).map(y => (ARCH[y.a] || [y.a])[0])
      }
      let num = 0, den = 0
      const gaps = []
      ids.forEach(id => { const t = their(x.p, id); if (t === null) return; const w = (5 - my(id)) / 4; num += w * Math.max(0, t - my(id)) / 4; den += w; if (t > my(id)) gaps.push({ id, g: (t - my(id)) * (1 + w) }) })
      const mf = den > 0 ? num / den : null
      if (mf === null && tf === null) return null
      const score = tf === null ? mf : mf === null ? tf : .5 * tf + .5 * mf
      return { x, score, topA, gaps: gaps.sort((a, b) => b.g - a.g).slice(0, 2) }
    }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 5)
    const tBox = document.getElementById('bd-mate')
    tBox.innerHTML = mates.length === 0 ? '<p class="empty">Aún no hay datos suficientes del equipo para sugerirte un compañero.</p>' : mates.map(m => {
      const parts = []
      if (m.topA.length) parts.push('Fuerte en ' + m.topA.join(' y ') + ', donde tu radiografía es baja')
      if (m.gaps.length) parts.push((parts.length ? 'y te' : 'Te') + ' complementa en ' + m.gaps.map(y => NAMES[y.id][0]).join(' y '))
      return link(m.x, card(m.x, { score: Math.round(m.score * 100), reason: parts.join(' ') + '.' }))
    }).join('')
    root.hidden = false
  }

  const show = () => {
    const isRank = location.hash.indexOf('#ranking') === 0
    const member = (location.hash.match(/^#ranking[/](m-[0-9]+)$/) || [])[1]
    document.getElementById('pane-me').hidden = isRank
    document.getElementById('pane-rank').hidden = !isRank
    document.querySelectorAll('.tabs a').forEach(a => a.classList.toggle('on', (a.dataset.tab === 'rank') === isRank))
    document.querySelectorAll('.member').forEach(m => m.hidden = m.id !== member)
    document.getElementById('rank-main').hidden = !!member
    hideTip()
    if (isRank) { scrollTo(0, 0); if (!member && people.length) redraw() }
  }
  if (!team || !people.length) { const b = document.getElementById('rank-table'); if (b) b.innerHTML = '<p class="empty">El ranking aparece cuando tu cuenta ya envió su primer puntaje y tu empresa está dada de alta. Vuelve a abrir el portal en unos minutos.</p>'; const fb = document.getElementById('fbar'); if (fb) fb.hidden = true } else refresh()
  drawBuddies()
  addEventListener('hashchange', show); show()

  // Fragment → Loop: hairline fragments drift, then settle onto a 3:2 Lissajous loop.
  const cv = document.getElementById('field'), cx = cv.getContext('2d')
  let W, H; const size = () => { W = cv.width = innerWidth * devicePixelRatio; H = cv.height = innerHeight * devicePixelRatio }; size(); addEventListener('resize', size)
  const N = 420, bits = Array.from({ length: N }, (_, i) => ({ x: Math.random(), y: Math.random(), a: Math.random() * 6.28, t: (i / N) * 6.28 }))
  const start = performance.now()
  const draw = now => {
    const k = calm ? 1 : Math.min(1, (now - start) / 3200), e = 1 - Math.pow(1 - k, 3), spin = (now - start) / 26000
    cx.clearRect(0, 0, W, H); cx.strokeStyle = '__ACCENT__'; cx.lineWidth = devicePixelRatio * .7; cx.globalAlpha = .55
    const ox = W * .72, oy = H * .34, rx = Math.min(W, H) * .26, ry = Math.min(W, H) * .2
    for (const b of bits) {
      const t = b.t + spin, lx = ox + Math.sin(3 * t + 1.5708) * rx, ly = oy + Math.sin(2 * t) * ry
      const x = (b.x * W) * (1 - e) + lx * e, y = (b.y * H) * (1 - e) + ly * e
      const dx = Math.cos(b.a + t) * 6 * devicePixelRatio * (1 - e * .6), dy = Math.sin(b.a + t) * 6 * devicePixelRatio * (1 - e * .6)
      cx.beginPath(); cx.moveTo(x - dx, y - dy); cx.lineTo(x + dx, y + dy); cx.stroke()
    }
    if (!calm) requestAnimationFrame(draw)
  }
  requestAnimationFrame(draw)
})()`

// The portal: a self-contained page the mod writes to disk and opens in the browser.
// Two tabs: «Mi nivel» and the company's ranking (it comes only to installs with a key from that company).
export const report = (profile: MastersProfile, team: Team | null = null, talent: TalentProfile | null = null) => {
  const real = profile.potential
  const rankName = team?.ranking ?? 'Ranking'
  const json = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c')
  const metricNames = json(Object.fromEntries(ALL_METRICS.map(metric => [metric.id, [metric.name, metric.category]])))
  const catNames = json(Object.fromEntries(CATEGORIES.map(category => [category, [CATEGORY_NAMES[category], CATEGORY_ABOUT[category]]])))
  const guideJson = json(Object.fromEntries(ALL_METRICS.map(metric => { const g = guideOf(metric.id); return [metric.id, [g.measure, g.how, g.examples]] })))
  const archJson = json(Object.fromEntries(ARCHETYPES.map(item => [item.id, [item.name, item.alias, ARCHETYPE_COLOR[item.id], archetypeIcon(item.id, 18)]])))
  const mineJson = json({ metricas: Object.fromEntries(profile.metrics.map(metric => [metric.id, [metric.level, metric.potential ?? metric.level]])), talento: talent !== null && talent.ready ? talent.scores : null })
  const sections = CATEGORIES.map(category => {
    const tips = improvements(profile, category)
    const group = team?.categorias[category]
    return `<section id="cat-${category}" class="cat"><div class="viz">${spider(profile, category, 600, team)}</div><aside>
<div class="kicker">Últimos ${profile.days} días</div>${sparkline(profile.trend[category] ?? [])}
${group === undefined ? '' : `<div class="mates"><span>Media del equipo <b>${group.media ?? '–'}</b></span><span>Master <b>${esc(group.master ?? '–')}</b></span></div>`}
${tips.length === 0 ? '' : `<h3>Cómo subir</h3><ul>${tips.map(tip => `<li>${esc(tip)}</li>`).join('')}</ul>`}</aside></section>`
  }).join('')
  const teamJson = json(team)
  const flow = `<div class="flow" aria-hidden="true"><div class="lane r">${[0, 1, 2, 3, 4].map(k => `<i style="--k:${k}"></i>`).join('')}</div><div class="lane l">${[0, 1, 2, 3, 4].map(k => `<i style="--k:${k}"></i>`).join('')}</div></div>`
  const head = real === null
    ? `<div class="score one"><div class="big now"><small>${NOW_NAME}</small><b class="count" data-to="${profile.score}">0</b><span class="tier">${esc(profile.tier)}</span><p>${esc(NOW_ABOUT)}</p></div></div>`
    : `<div class="score"><div class="big real"><small>${REAL_NAME}</small><b class="count" data-to="${real.score}">0</b><span class="tier">${esc(real.tier)}</span><p>${esc(real.confidence < 0.5 ? REAL_UNSURE : REAL_ABOUT)}</p></div>${flow}
<div class="big now"><small>${NOW_NAME}</small><b class="count" data-to="${profile.score}">0</b><span class="tier">${esc(profile.tier)}</span><p>${esc(NOW_ABOUT)}</p></div></div>`
  const chevron = (d: string) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`
  const bubble = (text: string) => `<i class="info" tabindex="0">i<em>${esc(text)}</em></i>`

  return `<!doctype html><html lang="es-MX"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${TITLE} ${BYLINE}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Geist+Mono&family=Host+Grotesk:wght@300..600&display=swap" rel="stylesheet">
<style>
:root{--paper:${PAPER};--ink:${INK};--ink2:${INK_2};--ink3:${INK_3};--hair:${HAIR};--hair2:${HAIR_2};--accent:${ACCENT};--warm:${WARM};color-scheme:dark}
*{box-sizing:border-box}[hidden]{display:none!important}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--ink);font:380 16px/1.5 ${SANS};overflow-x:hidden}
canvas#field{position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;opacity:.5}
.tabs{position:sticky;top:0;z-index:20;display:flex;gap:10px;justify-content:center;padding:16px 16px 22px;background:linear-gradient(var(--paper) 75%,transparent)}
.tabs a{color:var(--ink3);text-decoration:none;font-size:clamp(17px,2.2vw,22px);font-weight:470;letter-spacing:-.01em;padding:14px clamp(22px,4vw,44px);border:1px solid var(--hair);border-radius:99px;transition:color .2s,border-color .2s,background .2s}
.tabs a:hover{color:var(--ink)}.tabs a.on{color:var(--ink);border-color:var(--hair2);background:#15171A}
.wrap{position:relative;max-width:1240px;margin:0 auto;padding:0 clamp(16px,3.2vw,48px) clamp(16px,3.2vw,48px)}
.hero{min-height:calc(100vh - 60px);display:flex;flex-direction:column;justify-content:center;gap:16px;padding-bottom:24px}
h1{font-weight:470;font-size:clamp(2.6rem,7.5vw,7rem);letter-spacing:-.045em;line-height:.9;margin:0}
h1 span{display:inline-block;opacity:0;transform:translateY(.4em);animation:rise .9s cubic-bezier(.16,1,.3,1) forwards}
.by{color:var(--ink3);font-size:15px;opacity:0;animation:fade 1s .6s forwards}
.score{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:clamp(10px,2vw,28px);align-items:stretch;margin-top:10px;max-width:980px}
.score.one{grid-template-columns:minmax(0,480px)}
.big{display:flex;flex-direction:column;gap:4px;min-width:0;padding:22px clamp(18px,2.4vw,30px);border:1px solid var(--hair);border-radius:6px;background:#15171A;opacity:0;animation:fade 1s .9s forwards}
.big small{font:11px ${MONO};letter-spacing:.12em;text-transform:uppercase;color:var(--ink3)}
.big b{font:400 clamp(4rem,10vw,8rem)/.9 ${MONO};letter-spacing:-.07em}
.big.real b{color:var(--warm)}.big.now b{color:var(--ink)}
.big .tier{font-size:clamp(1.2rem,2.4vw,2rem);color:var(--accent)}.big.real .tier{color:var(--warm)}
.big p{margin:6px 0 0;color:var(--ink3);font-size:13.5px;line-height:1.45}
.flow{position:relative;width:clamp(70px,10vw,140px);align-self:center;height:44px}
.lane{position:absolute;left:0;right:0;height:10px}.lane.r{top:8px}.lane.l{top:28px}
.lane i{position:absolute;top:3px;left:0;width:4px;height:4px;border-radius:50%;opacity:0;animation:travel-r 5s cubic-bezier(.45,0,.25,1) infinite;animation-delay:calc(var(--k)*1s)}
.lane.r i{background:var(--warm)}.lane.l i{background:var(--accent);animation-name:travel-l}
@keyframes travel-r{0%{left:0;opacity:0}15%{opacity:.7}85%{opacity:.7}100%{left:calc(100% - 4px);opacity:0}}
@keyframes travel-l{0%{left:calc(100% - 4px);opacity:0}15%{opacity:.7}85%{opacity:.7}100%{left:0;opacity:0}}
@media (max-width:720px){.score{grid-template-columns:minmax(0,1fr)}.flow{display:none}}
.rings{display:flex;gap:clamp(16px,3vw,44px);flex-wrap:wrap;margin-top:24px}
.ring{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;color:var(--ink2);text-decoration:none;font-size:12.5px;max-width:120px;text-align:center;opacity:0;animation:fade .8s var(--d) forwards;transition:transform .3s cubic-bezier(.16,1,.3,1)}
.ring:hover{transform:translateY(-4px)}
.ring .arc{transition:stroke-dashoffset 1.8s cubic-bezier(.16,1,.3,1) var(--d)}.loaded .ring .arc{stroke-dashoffset:var(--to)}
.ring:hover span{color:var(--ink)}
.bubble,.info em{display:none}
#gtip{position:fixed;z-index:100;padding:12px 14px;background:#15171A;border:1px solid var(--hair2);border-radius:4px;color:var(--ink2);font:380 13px/1.45 ${SANS};text-align:left;pointer-events:none;overflow:auto;overflow-wrap:anywhere;max-width:calc(100vw - 16px)}
#gtip em{font-style:normal}#gtip b{color:var(--ink);font-weight:500}
#gtip .tl{display:block;margin:10px 0 4px;font:500 10px ${MONO};letter-spacing:.1em;text-transform:uppercase;color:var(--ink3)}
#gtip .tb{margin:0;padding:0;list-style:none;counter-reset:none}
#gtip .tb li{counter-increment:none;border:0;padding:2px 0 2px 12px;font-size:12.5px;color:var(--ink2);position:relative}
#gtip .tb li::before{content:'';counter-increment:none;position:absolute;left:0;top:10px;width:4px;height:4px;border-radius:50%;background:var(--ink3);font:0 ${MONO}}
#gtip .tb.ex li{color:var(--accent)}
.cue{align-self:center;margin-top:36px;display:flex;flex-direction:column;align-items:center;gap:6px;color:var(--ink2);text-decoration:none;font:12px ${MONO};letter-spacing:.12em;text-transform:uppercase;opacity:0;animation:fade 1s 2.2s forwards;transition:opacity .4s}
.cue:hover{color:var(--ink)}.cue svg{animation:bob 1.6s ease-in-out infinite}.cue svg path:nth-child(2){animation:blink 1.6s ease-in-out infinite}
.scrolled .cue{opacity:0!important;pointer-events:none}
.cat{display:grid;grid-template-columns:minmax(0,640px) minmax(0,1fr);gap:40px;align-items:center;padding:64px 0;border-top:1px solid var(--hair);opacity:0;transform:translateY(48px) scale(.98);transition:opacity 1s cubic-bezier(.16,1,.3,1),transform 1.1s cubic-bezier(.16,1,.3,1)}
.cat.in{opacity:1;transform:none}
@media (max-width:960px){.cat{grid-template-columns:1fr}}
.viz svg{width:100%;height:auto;display:block}
.kicker{font:11px ${MONO};letter-spacing:.1em;color:var(--ink3);text-transform:uppercase;margin-bottom:6px}
.mates{display:flex;gap:22px;flex-wrap:wrap;margin-top:18px;color:var(--ink3);font-size:13px}.mates b{color:var(--ink);font-weight:500;margin-left:4px}
h3{font-weight:470;font-size:28px;letter-spacing:-.02em;margin:28px 0 10px}
ul{margin:0;padding:0;list-style:none;counter-reset:n}li{counter-increment:n;border-top:1px solid var(--hair);padding:12px 0 12px 34px;position:relative;color:var(--ink);font-size:15px}
li::before{content:counter(n,decimal-leading-zero);position:absolute;left:0;top:13px;font:11px ${MONO};color:var(--accent)}
footer{border-top:1px solid var(--hair);padding:28px 0 56px;color:var(--ink3);font:12px ${MONO};letter-spacing:.04em}
#pane-rank{padding-top:32px;min-height:80vh}
.rank h2{font-weight:470;font-size:clamp(2rem,5vw,3.6rem);letter-spacing:-.03em;margin:0}
.rank .sub{color:var(--ink3);font-size:14px;margin:8px 0 22px}
.switch,.seg-sw{display:inline-flex;border:1px solid var(--hair2);border-radius:99px;padding:3px}
.switch button,.seg-sw button{background:none;border:0;color:var(--ink3);font:inherit;font-size:13px;padding:6px 14px;border-radius:99px;cursor:pointer}
.switch button.on,.seg-sw button.on{background:#1C1F24;color:var(--ink)}
.fbar{display:flex;flex-wrap:wrap;gap:12px 18px;align-items:center;margin-bottom:16px}
.fb-m{display:flex;align-items:center;gap:8px;color:var(--ink3);font:11px ${MONO};letter-spacing:.1em;text-transform:uppercase}
select{background:#15171A;color:var(--ink);border:1px solid var(--hair2);border-radius:4px;padding:8px 10px;font:inherit;font-size:14px;max-width:min(300px,100%);text-transform:none;letter-spacing:0}
.f-th,.mono{font:12px ${MONO};color:var(--ink3)}
.fb-r{display:flex;gap:8px;margin-left:auto;align-items:center}.cp-wrap{position:relative}
.btn{background:none;border:1px solid var(--hair2);border-radius:99px;color:var(--ink2);font:inherit;font-size:13px;padding:7px 14px;cursor:pointer;transition:color .2s,border-color .2s}.btn:hover{color:var(--ink);border-color:var(--ink3)}
.cols-pop{position:absolute;right:0;top:calc(100% + 6px);z-index:40;width:min(360px,calc(100vw - 32px));max-height:min(70vh,520px);overflow:auto;background:#15171A;border:1px solid var(--hair2);border-radius:4px;padding:12px 14px}
.cp-g{margin-bottom:12px}.cp-g b{display:block;font:500 10px ${MONO};letter-spacing:.1em;text-transform:uppercase;color:var(--ink3);margin-bottom:4px}
.cp-g label{display:inline-block;width:48%;font-size:13px;color:var(--ink2);padding:2px 0;cursor:pointer}.cp-g input{accent-color:${ACCENT}}
.cp-reset{background:none;border:1px solid var(--hair2);border-radius:99px;color:var(--ink2);font:inherit;font-size:12px;padding:5px 12px;cursor:pointer}
.tbl-wrap{position:relative;--s0:56px;--s1:300px}
.scroller{overflow:hidden;scrollbar-width:none}.scroller::-webkit-scrollbar{display:none}
.edge{position:absolute;top:0;bottom:0;z-index:6;width:34px;display:flex;align-items:flex-start;justify-content:center;background:linear-gradient(90deg,transparent,rgba(13,14,17,.92) 45%);border:0;color:var(--ink2);cursor:pointer;padding:0;transition:color .2s}.edge.l{background:linear-gradient(270deg,transparent,rgba(13,14,17,.92) 45%)}.edge svg{position:sticky;top:46vh;margin-top:56px;animation:nudgeX 2.4s cubic-bezier(.16,1,.3,1) infinite}.edge.l svg{animation-name:nudgeXl}@keyframes nudgeX{0%,100%{transform:translateX(0)}50%{transform:translateX(3px)}}@keyframes nudgeXl{0%,100%{transform:translateX(0)}50%{transform:translateX(-3px)}}@media (prefers-reduced-motion:reduce){.edge svg{animation:none}}
.edge:hover{color:var(--ink)}.edge.l{left:calc(var(--s0) + var(--s1));border-radius:0 4px 4px 0}.edge.r{right:0;border-radius:4px 0 0 4px}
table{width:max-content;min-width:100%;border-collapse:separate;border-spacing:0}
th{font:500 10.5px ${MONO};letter-spacing:.1em;text-transform:uppercase;color:var(--ink3);text-align:left;padding:8px;border-bottom:1px solid var(--hair2);vertical-align:top;white-space:nowrap}
td{padding:10px 8px;border-bottom:1px solid var(--hair);white-space:nowrap;font-size:14.5px}
th.s0,td.s0{position:sticky;left:0;z-index:3;width:var(--s0);min-width:var(--s0);max-width:var(--s0);background:var(--paper)}
th.s1,td.s1{position:sticky;left:var(--s0);z-index:3;width:var(--s1);min-width:var(--s1);max-width:var(--s1);background:var(--paper);border-right:1px solid var(--hair2);overflow:hidden}
.nm{display:inline-block;max-width:210px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;vertical-align:bottom}
.seg{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:8px;vertical-align:middle}
.th-in{display:flex;align-items:center;gap:2px}.th-lab{cursor:pointer;user-select:none}.th-lab[draggable=true]{cursor:grab}
.th-f{background:none;border:0;color:var(--ink3);cursor:pointer;padding:2px 3px;margin-left:2px;opacity:.5;display:inline-flex}.th-f:hover{opacity:1}.th-f.on{color:var(--accent);opacity:1}
.fi{display:block;width:92px;margin-top:5px;background:#111316;border:1px solid var(--hair2);color:var(--ink);border-radius:3px;font:12px ${MONO};padding:3px 6px;text-transform:none;letter-spacing:0}
th.over{background:rgba(109,146,214,.12)}th.hl,td[data-hl]{background:rgba(109,146,214,.06)}
th.tn{text-align:left}
tbody tr.row{cursor:pointer}tbody tr.row:hover td{background:rgba(255,255,255,.025)}tbody tr.row:hover td.s0,tbody tr.row:hover td.s1{background:#14161A}
tr.det td{white-space:normal;background:#111316;padding:18px 16px}
.det-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px 28px}
.det-grid h4{margin:0 0 8px;font:500 11px ${MONO};letter-spacing:.1em;text-transform:uppercase;color:var(--ink3)}
.det-row{display:grid;grid-template-columns:1fr 70px 34px 34px;gap:8px;align-items:center;font-size:13px;color:var(--ink2);padding:3px 0}
.det-row .mini{height:5px;border-radius:3px;background:var(--hair);position:relative;overflow:hidden}
.det-row .mini i{position:absolute;left:0;top:0;bottom:0;border-radius:3px}.det-row .mini i.r{background:var(--warm);opacity:.55}.det-row .mini i.n{background:var(--accent)}
.det-row b{font:400 12px ${MONO};text-align:right;color:var(--ink)}.det-row b.r{color:var(--warm)}
.info{position:relative;display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;margin-left:6px;border:1px solid var(--hair2);border-radius:50%;font:italic 600 10px Georgia,serif;color:var(--ink3);cursor:help;vertical-align:middle;text-transform:none;letter-spacing:0}
.info:hover,.info:focus{color:var(--ink);border-color:var(--ink3)}
.talent{padding:72px 0 24px;border-top:1px solid var(--hair)}
.adn{border:1px solid var(--hair2);border-radius:6px;padding:clamp(20px,3vw,40px);background:#15171A}
.adn-head{display:flex;align-items:center;gap:clamp(14px,2.4vw,30px);flex-wrap:wrap}
.adn-ic{display:flex;gap:10px}.adn-ic svg{width:clamp(56px,8vw,92px);height:auto}.adn-ic svg+svg{opacity:.8;width:clamp(40px,5.6vw,64px);align-self:flex-end}
.adn-k{font:11px ${MONO};letter-spacing:.12em;text-transform:uppercase;color:var(--ink3)}
.adn-title,.adn-name{font-weight:470;font-size:clamp(2.2rem,5.5vw,4rem);letter-spacing:-.035em;line-height:1.02;margin:6px 0 0}
.adn-title{color:var(--ink)}.adn-name small{display:block;font:13px ${MONO};letter-spacing:.06em;color:var(--ink3);margin-top:8px}
.adn .viz{margin:24px 0 8px}
.adn-line{font-size:19px;color:var(--ink);margin:6px 0 22px;max-width:760px}
.adn-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px 32px;border-top:1px solid var(--hair);padding-top:22px}
.adn-grid b{font:500 11px ${MONO};letter-spacing:.1em;text-transform:uppercase;color:var(--ink3)}.adn-grid p{margin:6px 0 0;color:var(--ink);font-size:15px}
.adn-foot{margin:24px 0 0;color:var(--ink3);font-size:12.5px}
.buddies{margin-top:48px;padding-top:12px;border-top:1px solid var(--hair);display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:12px 56px}
.bd h3{margin:24px 0 10px;font-size:clamp(1.4rem,2.6vw,1.9rem)}
.pp{display:grid;grid-template-columns:40px minmax(0,1fr) auto;gap:14px;align-items:start;padding:14px 0;border-top:1px solid var(--hair);color:inherit;text-decoration:none}
a.pp:hover .pp-n{color:var(--accent)}
.pp-i svg{width:36px;height:36px;display:block}
.pp-n{display:block;font-weight:480;font-size:16px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pp-b small{display:block;font-size:12.5px}
.pp-r{display:block;color:var(--ink2);font-size:13.5px;margin-top:4px;line-height:1.4}
.pp-s{font:14px ${MONO};color:var(--ink)}
.crown{font-size:12px;margin-left:6px;filter:saturate(.8)}
.teamweb{margin-top:56px;padding-top:36px;border-top:1px solid var(--hair)}
.tw-k{font:11px ${MONO};letter-spacing:.12em;text-transform:uppercase;color:var(--ink3)}
.teamweb h3{margin:6px 0 4px}
.tw-chips{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 10px}
.chip{display:inline-flex;align-items:center;gap:7px;max-width:240px;background:none;border:1px solid var(--hair2);border-radius:99px;color:var(--ink2);font:inherit;font-size:13px;padding:6px 12px;cursor:pointer;transition:all .2s}
.chip .cn{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.chip i{flex:none;width:9px;height:9px;border-radius:50%;background:var(--c,var(--ink))}.chip:hover{color:var(--ink)}.chip.on{color:var(--ink);border-color:var(--c,var(--ink));background:rgba(255,255,255,.04)}
.tw-svg{width:100%;max-width:1180px;height:auto;display:block;margin:0 auto}
.tw-p{cursor:pointer;transition:fill-opacity .3s,stroke-opacity .3s,stroke-width .3s;transform-origin:50% 49%;animation:grow 1.1s cubic-bezier(.16,1,.3,1) both;animation-delay:var(--d)}
.tw-p:hover{stroke-opacity:1!important;stroke-width:2.6;fill-opacity:.12}
@keyframes grow{from{transform:scale(.05);opacity:0}to{transform:none;opacity:1}}
.g-svg{width:100%;max-width:1100px;height:auto;display:block;margin:0 auto}
.g-draw{stroke-dashoffset:1;animation:draw 1.8s cubic-bezier(.16,1,.3,1) forwards}@keyframes draw{to{stroke-dashoffset:0}}
.g-dot{cursor:pointer;transition:r .18s}.g-dot:hover{r:6.5}
.g-lg{display:flex;gap:18px;flex-wrap:wrap;color:var(--ink2);font-size:13px;margin:4px 0 10px;align-items:center}.g-lg i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px}
.open{display:inline-block;margin-top:14px;color:var(--accent);text-decoration:none;font-size:14px}.open:hover{color:var(--ink)}
.member h2{font-weight:470;font-size:clamp(2rem,5vw,3.6rem);letter-spacing:-.03em;margin:12px 0 0}.member .sub b{color:var(--ink);font-family:${MONO}}
.back{color:var(--ink3);text-decoration:none;font-size:14px}.back:hover{color:var(--ink)}.msum{max-width:760px;color:var(--ink2)}
td.n{font-family:${MONO};text-align:left}
tr.me td{background:rgba(233,210,91,.06)}tr.me td.s0,tr.me td.s1{background:#1A1A15}tr.me td.s0{border-left:2px solid var(--warm)}
tbody tr{opacity:0;transition:opacity .6s}
.shown tbody tr{opacity:1}
.bar{display:inline-block;vertical-align:middle;width:120px;height:6px;border-radius:3px;background:var(--hair);overflow:hidden;margin-right:10px}
.bar i{display:block;height:100%;width:0;border-radius:3px;transition:width 1.2s cubic-bezier(.16,1,.3,1)}
.bar.real i{background:var(--warm)}.bar.now i{background:var(--accent)}
.pos{font-family:${MONO};color:var(--ink3)}
.adn-c{display:flex;align-items:center;gap:8px;min-width:200px}.adn-c.dash{color:var(--ink3);display:table-cell}.adn-i svg{width:20px;height:20px;display:block}.adn-t{font-size:13.5px;color:var(--ink2)}
td.adn-c{display:table-cell}td.adn-c .adn-i{display:inline-block;vertical-align:middle;margin-right:8px}td.adn-c .adn-t{vertical-align:middle}
.tag{font-size:11px;color:var(--warm);margin-left:8px;border:1px solid rgba(233,210,91,.4);border-radius:99px;padding:1px 7px}
.tag.crack{color:var(--accent);border-color:rgba(109,146,214,.5)}
.empty{color:var(--ink3);padding:40px 0;font-size:15px}
.more{display:flex;justify-content:center;align-items:flex-start;gap:34px;margin-top:6px;min-height:8px}
.more-b{background:none;border:0;color:var(--ink3);cursor:pointer;display:flex;flex-direction:column;align-items:center;font:11px ${MONO};letter-spacing:.1em;padding:6px 10px;transition:color .2s}
.more-b:hover{color:var(--ink)}.more-b svg{animation:nudge 2.2s ease-in-out infinite}
@keyframes rise{to{opacity:1;transform:none}}@keyframes fade{to{opacity:1}}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(8px)}}@keyframes blink{0%,100%{opacity:.3}50%{opacity:1}}
@keyframes nudge{0%,100%{transform:translateY(0);opacity:.55}50%{transform:translateY(5px);opacity:1}}
@media (max-width:720px){.tbl-wrap{--s0:44px;--s1:170px}.nm{max-width:110px}.fb-r{margin-left:0}}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}h1 span,.by,.big,.ring,.cat,.cue,tbody tr{opacity:1;transform:none}.lane i{opacity:.45;left:calc(var(--k)*20%)}.g-draw{stroke-dashoffset:0}}
</style></head><body><canvas id="field"></canvas><div id="gtip" role="tooltip" hidden></div>
<nav class="tabs"><a href="#mi-nivel" data-tab="me" class="on">Mi nivel</a><a href="#ranking" data-tab="rank">${esc(rankName)}</a></nav>
<div class="wrap">
<div id="pane-me">
<header class="hero" id="mi-nivel">
<h1>${TITLE.split(' ').map((word, i) => `<span style="animation-delay:${0.08 * i}s">${esc(word)}</span>`).join(' ')}</h1>
<div class="by">${BYLINE}</div>
${head}
<nav class="rings">${CATEGORIES.map((category, i) => ring(category, profile.categories[category], real?.categories[category] ?? null, i, howTo(profile, category))).join('')}</nav>
<a class="cue" href="#cat-herramienta">Baja para ver tus Spiderweb Charts<svg width="28" height="34" viewBox="0 0 28 34" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8l8 8 8-8"/><path d="M6 18l8 8 8-8"/></svg></a>
</header>
${sections}
${talent === null ? '' : `<section class="talent" id="talento">${talentBox(talent)}</section>`}
<section class="buddies" id="buddies" hidden><div class="bd"><h3>¿Quién sería tu compañero ideal?</h3><div id="bd-mate"></div></div><div class="bd"><h3>¿Quién sería tu maestro ideal?</h3><div id="bd-master"></div></div></section>
<footer>${profile.prompts.toLocaleString('es-MX')} prompts analizados · últimos ${profile.days} días de uso</footer>
</div>
<section id="pane-rank" class="rank" hidden>
<div id="rank-main">
<h2>${esc(rankName)}</h2>
<p class="sub">Solo cuentas de ${esc(team?.empresa ?? 'tu empresa')}. Ordenado por nivel real, o por la medida que elijas: lo que cada quien ya demostró, no cuánto usó Claude esta semana. Toca una fila para ver el 100 % de sus puntajes.</p>
<div class="fbar" id="fbar">
<label class="fb-m"><span>Medir por</span><select id="f-measure" aria-label="Medida"></select><i class="info" id="f-info" tabindex="0">i<em></em></i></label>
<div class="seg-sw" id="f-seg"><button data-s="all" class="on">Todos</button><button data-s="top">Top</button><button data-s="mid">Mid</button><button data-s="low">Low</button></div>${bubble('Top: personas desde el percentil 80 de la medida elegida. Low: hasta el percentil 20. Mid: todas las demás. Los cortes se recalculan al cambiar la medida.')}
<span class="f-th" id="f-th"></span>
<div class="switch"><button data-by="real" class="on">Nivel real</button><button data-by="now">Momento actual</button></div>
<div class="fb-r"><div class="cp-wrap"><button class="btn" id="cols-btn">Columnas</button><div class="cols-pop" id="cols-pop" hidden></div></div><button class="btn" id="f-clear">Limpiar filtros</button></div>
</div>
<div class="tbl-wrap"><button class="edge l" id="edge-l" hidden aria-label="Desplazar a la izquierda">${chevron('M15 6l-6 6 6 6')}</button><div class="scroller" id="rank-sc"><div id="rank-table"><table><thead id="rank-head"></thead><tbody id="rank-body"></tbody></table></div></div><button class="edge r" id="edge-r" hidden aria-label="Desplazar a la derecha">${chevron('M9 6l6 6-6 6')}</button></div>
<div class="more" id="rank-more"></div>
${team?.admin === true ? `<section id="team-web" class="teamweb"><div class="tw-k">Solo owners y admins</div><h3>El equipo en un Spiderweb Chart</h3>
<p class="sub">Toca nombres o figuras para encenderlas y compararlas; doble clic para entrar a la vista de esa persona. La línea punteada blanca es la media de las personas dibujadas. Responde a los filtros de arriba.</p>
<div class="switch"><button data-ax="cat" class="on">Categorías</button><button data-ax="dim">Las dimensiones</button></div><div class="tw-body"></div></section>
<section id="gauss" class="teamweb"><div class="tw-k">Solo owners y admins</div><h3>La campana del equipo</h3>
<p class="sub g-t"></p><div class="g-lg"></div><div class="g-body"></div></section>` : ''}
</div>
<div id="members">${memberViews(team)}</div>
</section>
</div>
<script type="application/json" id="team">${teamJson}</script>
<script type="application/json" id="names">${metricNames}</script>
<script type="application/json" id="cats">${catNames}</script>
<script type="application/json" id="guide">${guideJson}</script>
<script type="application/json" id="arch">${archJson}</script>
<script type="application/json" id="mine">${mineJson}</script>
<script>
${PORTAL_JS.replace('__ACCENT__', ACCENT)}
</script></body></html>`
}

// ── Radiografía de talento ────────────────────────────────────────────────────────────────────────────
// The big Spiderweb Chart inside the single «Tu ADN de talento» box: 11 archetypes, informative only, never part of the score.
const bubbleOf = (text: string) => `<i class="info" tabindex="0">i<em>${esc(text)}</em></i>`

export const talentWeb = (talent: TalentProfile, width = 1000) => {
  const w = 1000
  const cx = w / 2
  const cy = 470
  const r = 270
  const n = ARCHETYPES.length
  const at = (i: number, share: number) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2
    return [cx + Math.cos(angle) * r * share, cy + Math.sin(angle) * r * share] as const
  }
  const points = (shares: number[]) => shares.map((share, i) => at(i, share).map(f).join(',')).join(' ')
  const grid = [0.2, 0.4, 0.6, 0.8, 1]
    .map(share => `<polygon points="${points(ARCHETYPES.map(() => share))}" fill="none" stroke="${share === 1 ? HAIR_2 : HAIR}" stroke-width="${share === 1 ? 1 : 0.75}"${share === 1 ? ' stroke-dasharray="2 4"' : ''}/>`)
    .join('')
  const spokes = ARCHETYPES.map((_, i) => `<line x1="${cx}" y1="${cy}" x2="${f(at(i, 1)[0])}" y2="${f(at(i, 1)[1])}" stroke="${HAIR}" stroke-width=".75"/>`).join('')
  const shares = ARCHETYPES.map(item => Math.max(0.04, (talent.scores[item.id] ?? 0) / 100))
  const target = points(shares)
  const start = points(shares.map(() => 0.02))
  const lead = talent.top[0].id
  const tone = talent.ready ? ARCHETYPE_COLOR[lead] : INK_3
  const shape = `<polygon points="${target}" fill="${tone}" fill-opacity="${talent.ready ? 0.14 : 0.06}" stroke="${tone}" stroke-width="1.6" stroke-linejoin="round"${talent.ready ? '' : ' stroke-dasharray="4 4"'}>
<animate attributeName="points" values="${start};${target}" dur="2s" calcMode="spline" keyTimes="0;1" keySplines=".16 1 .3 1" fill="freeze"/></polygon>`
  const topIds = new Set(talent.ready ? [talent.top[0].id, talent.top[1].id] : [])
  const nodes = ARCHETYPES.map((item, i) => {
    const [x, y] = at(i, shares[i] ?? 0.04)
    const isTop = topIds.has(item.id)
    const color = talent.ready ? ARCHETYPE_COLOR[item.id] : INK_3
    return `<circle cx="${f(x)}" cy="${f(y)}" r="${isTop ? 5 : 3}" fill="${isTop ? WARM : color}" opacity="0"><animate attributeName="opacity" values="0;0;1" keyTimes="0;.75;1" dur="2.2s" fill="freeze"/>${isTop ? `<animate attributeName="r" values="5;9;5" dur="2.6s" begin="2.2s" repeatCount="indefinite"/>` : ''}</circle>`
  }).join('')
  const ICON = 26
  const axes = ARCHETYPES.map((item, i) => {
    const [x, y] = at(i, 1.13)
    const [vx, vy] = at(i, 1)
    const anchor = x < cx - 12 ? 'end' : x > cx + 12 ? 'start' : 'middle'
    const isTop = topIds.has(item.id)
    const color = ARCHETYPE_COLOR[item.id]
    const textW = Math.max(item.name.length, item.alias.length) * 8 + 40
    const hx = anchor === 'end' ? x - textW - ICON : anchor === 'middle' ? x - textW / 2 : x - ICON
    // The animated icon sits on the web side of its label: left of the text for the right half, right of it for the left half, above it at the top.
    const ix = anchor === 'start' ? x - ICON - 4 : anchor === 'end' ? x + 4 : x - ICON / 2
    const iy = anchor === 'middle' ? (y < cy ? y - ICON - 18 : y + 26) : y - 6
    return `<g class="ax" id="tal-ax-${i}"><line x1="${cx}" y1="${cy}" x2="${f(vx)}" y2="${f(vy)}" stroke="transparent" stroke-width="22"/><rect x="${f(hx)}" y="${f(Math.min(y - 16, iy))}" width="${textW + ICON}" height="${f(Math.abs(iy - y) + 50)}" fill="transparent"/>
${archetypeIcon(item.id, ICON, Number(f(ix)), Number(f(iy)))}
<text class="lbl" x="${f(x)}" y="${f(y)}" text-anchor="${anchor}" font-size="16" font-weight="${isTop ? 600 : 450}" fill="${color}" fill-opacity="${isTop ? 1 : 0.82}" font-family="${SANS}">${esc(item.name)}<tspan fill="${INK_3}" font-family="${MONO}" font-size="13"> ${talent.ready ? talent.scores[item.id] : '·'}</tspan></text>
<text x="${f(x)}" y="${f(y + 18)}" text-anchor="${anchor}" font-size="12" fill="${INK_3}" font-family="${SANS}">${esc(item.alias)}</text></g>`
  }).join('')
  const cardW = 560
  const tips = ARCHETYPES.map((item, i) => {
    const seen = talent.evidence[item.id] ?? []
    const blocks: Block[] = [
      { kind: 'stats', items: [{ label: 'Tu intensidad', value: talent.ready ? String(talent.scores[item.id]) : '–', tone: ARCHETYPE_COLOR[item.id] }, { label: 'Puntos', value: f(talent.points[item.id] ?? 0), tone: INK_2 }, { label: 'Arquetipo', value: item.alias, tone: INK }] },
      { kind: 'text', text: item.xray, tone: INK },
      { kind: 'label', text: 'Talento oculto' },
      { kind: 'text', text: item.talent, tone: INK_2 },
      { kind: 'label', text: 'Qué pide naturalmente a Claude' },
      { kind: 'text', text: item.signal, tone: INK_2 },
      ...(seen.length === 0 ? [] : ([{ kind: 'label', text: 'Lo vimos cuando' }, { kind: 'bullets', items: seen, tone: ARCHETYPE_COLOR[item.id] }] as Block[])),
      { kind: 'label', text: 'Tu ventaja injusta' },
      { kind: 'text', text: item.genius, tone: WARM },
      { kind: 'label', text: 'Qué vigilar' },
      { kind: 'text', text: item.kryptonite, tone: INK_2 },
    ]
    return card(`tal-tip-${i}`, cx - cardW / 2, 120, cardW, `${item.name} · ${item.alias}`, blocks)
  })
  const h = Math.max(980, 120 + Math.max(...tips.map(tip => tip.h)) + 20)
  const hover = ARCHETYPES.map((_, i) => `svg:has(#tal-ax-${i}:hover) #tal-tip-${i}`).join(',')
  const style = `<style>.tip{opacity:0;transform:translateY(6px);transition:opacity .2s ease,transform .25s cubic-bezier(.16,1,.3,1);pointer-events:none}${hover}{opacity:1;transform:none}.ax{cursor:help}.ax:hover .lbl{fill-opacity:1}</style>`
  const caption = talent.ready
    ? `Pasa el cursor por cada eje: es tu radiografía en ese arquetipo.`
    : `Radiografía en formación: faltan ${Math.max(0, Math.ceil(30 - talent.weight))} puntos de co-creación en ${Math.max(0, 5 - talent.days)} días más.`

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${width}" height="${Math.round((width * h) / w)}" role="img">${style}
<rect width="${w}" height="${h}" fill="${PAPER}"/>
<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" fill="none" stroke="${HAIR}"/>
<text x="24" y="36" font-size="12" fill="${INK_3}" font-family="${SANS}" letter-spacing=".1em">SPIDERWEB CHART · RADIOGRAFÍA DE TALENTO</text>
<text x="24" y="62" font-size="14" fill="${INK_3}" font-family="${SANS}">${esc(caption)}</text>
${grid}${spokes}${shape}${nodes}${axes}${tips.map(tip => tip.svg).join('')}
</svg>`
}

// The content under the chart, inside the same box: references, genius zone vs blind spot, ideal partner,
// a routine to take the talent to 100 % and the roles where it shines. Hover on each bubble for the why.
export const talentCard = (talent: TalentProfile) => {
  if (!talent.ready) return ''
  const [a, b] = talent.top
  const [x, y] = talent.low
  const roles = [...new Set([...a.roles, ...b.roles])].slice(0, 4)
  const bubble = bubbleOf
  return `${talent.named ? `<p class="adn-line">${esc(talent.pair.line)}</p>` : ''}
<div class="adn-grid">
${talent.named && talent.pair.fiction !== '' ? `<div><b>Referentes ${bubble('Un personaje de ficción y una figura real con la misma combinación de talentos.')}</b><p>${esc(talent.pair.fiction)} · ${esc(talent.pair.real)}</p></div>` : ''}
<div><b>Tu zona de genio ${bubble(a.talent)}</b><p>${esc(a.genius)}</p></div>
<div><b>Tu punto ciego ${bubble('Tu kriptonita: el lado de tu fortaleza que más te puede costar.')}</b><p>${esc(a.kryptonite)}</p></div>
<div><b>Tu complemento ideal ${bubble(`Tus ejes más bajos son ${x.name} y ${y.name}. Alguien fuerte ahí completa tu juego.`)}</b><p>Un ${esc(talent.partner.name.replace(/^(El|La|Los|Las)\s+/i, ''))} (${esc(x.name)} + ${esc(y.name)}): ${esc(x.gives)} y ${esc(y.gives)}.</p></div>
<div><b>Rutina para tu talento ${bubble('Un micro-hábito con Claude para llevar tu talento natural del 80 al 100 %.')}</b><p>${esc(a.habit)}</p></div>
<div><b>Roles 2027 donde brillarías ${bubble('Roles emergentes según el Future of Jobs 2025 del WEF y LinkedIn. No te encasillan en tu puesto actual.')}</b><p>${roles.map(esc).join(' · ')}</p></div>
</div>
<p class="adn-foot">Informativo: no suma a tu Claude Score. Se calcula solo en tu computadora y no se envía. ${talent.cocreation} % de tus prompts leídos fueron co-creación.</p>`
}

// One single box: «Tu ADN de talento», the pair's name as big as the title, the talent Spiderweb Chart and the card content.
export const talentBox = (talent: TalentProfile) => {
  const [a, b] = talent.top
  const color = talent.ready ? ARCHETYPE_COLOR[a.id] : INK_3
  const name = !talent.ready ? 'En formación' : talent.named ? talent.pair.name : `${a.alias} + ${b.alias}`
  return `<div class="adn">
<div class="adn-head">${talent.ready ? `<span class="adn-ic">${archetypeIcon(a.id, 92)}${archetypeIcon(b.id, 64)}</span>` : ''}<div>
<div class="adn-k">Radiografía de talento ${bubbleOf('Cruzamos tus dos ejes más altos. Solo cuentan los prompts donde pusiste criterio propio; las tareas de formato casi no pesan y lo que haces fuera de horario pesa más.')}</div>
<h2 class="adn-title">Tu ADN de talento</h2>
<h3 class="adn-name" style="color:${color}">${esc(name)}${talent.ready ? `<small>${esc(a.name)} + ${esc(b.name)}</small>` : ''}</h3>
</div></div>
<div class="viz">${talentWeb(talent)}</div>
${talentCard(talent)}
</div>`
}
