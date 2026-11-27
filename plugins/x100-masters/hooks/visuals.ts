// «Tu Nivel en Claude» by The 100x Co: the web icon, one spider per category and the portal.
// Visual first: shapes, motion and headlines on screen; the dense detail lives in the hover cards.
// Two webs per spider: today (the recent average) and the real level (what the person showed on good days).
// 100x look: graphite paper, hairlines, one blue accent, warm gold for the real level, slow motion.
import { ALL_METRICS, CATEGORIES, CATEGORY_ABOUT, CATEGORY_NAMES } from './rubric'
import { GUIDE } from './guide'
import type { Category, MastersProfile, MetricResult, Team } from '../types'

const PAPER = '#0D0E11'
const CARD = '#15171A'
const INK = '#E6E8EA'
const INK_2 = '#A9ADB1'
const INK_3 = '#84888E'
const HAIR = '#24272A'
const HAIR_2 = '#3A3E43'
const ACCENT = '#6D92D6'
const WARM = '#E9D25B'
const SANS = `'Host Grotesk','Segoe UI',system-ui,sans-serif`
const MONO = `'Geist Mono',ui-monospace,Consolas,monospace`

export const TITLE = 'Tu Nivel en Claude'
export const BYLINE = 'by The 100x Co'
export const REAL_NAME = 'Nivel real'
export const NOW_NAME = 'Momento actual'
export const REAL_ABOUT = 'Lo que ya demostraste en tus mejores días del último mes. No baja si descansas o si un día solo hiciste consultas sencillas.'
export const REAL_UNSURE = 'Aún faltan días de trabajo para confirmar tu nivel real.'
export const NOW_ABOUT = 'Cómo usaste Claude en tus últimos 10 días de trabajo. Sube y baja con lo que haces cada día.'

const esc = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const f = (n: number) => n.toFixed(1)
const lvl = (n: number | null | undefined) => (n === null || n === undefined ? '–' : n.toFixed(1))
// «Liliana Martinez» → «Liliana M.»: fits a card column.
const short = (name: string | null | undefined) => {
  if (name === null || name === undefined || name === '') return '–'
  const [first, second] = name.split(' ')
  return second === undefined ? (first ?? name) : `${first} ${second.charAt(0)}.`
}

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
  const chars = Math.floor((w - 40) / 7.2)
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
    const guide = GUIDE[metric.id]
    const mates = team?.metricas[metric.id]
    const stats: Stat[] = [
      { label: 'Tu puntaje', value: lvl(metric.level), tone: INK },
      ...(hasReal ? [{ label: 'Nivel real', value: lvl(metric.potential ?? metric.level), tone: WARM }] : []),
      { label: 'Media equipo', value: lvl(mates?.media ?? null), tone: INK_2 },
      { label: 'Master', value: short(mates?.master), tone: ACCENT },
    ]
    const blocks: Block[] = [
      { kind: 'stats', items: stats },
      ...(guide === undefined
        ? []
        : ([
            { kind: 'text', text: guide.measure, tone: INK },
            { kind: 'label', text: 'Cómo hacerlo' },
            { kind: 'bullets', items: guide.how.slice(0, 4), tone: INK_2 },
            { kind: 'label', text: 'Ejemplos' },
            { kind: 'bullets', items: guide.examples.slice(0, 4).map(example => `«${example}»`), tone: ACCENT },
          ] as Block[])),
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
        { label: 'Master', value: short(group?.master), tone: ACCENT },
      ],
    },
    { kind: 'text', text: CATEGORY_ABOUT[category], tone: INK_2 },
    { kind: 'label', text: 'Tus dimensiones (1 a 5)' },
    { kind: 'bullets', items: listing, tone: INK },
  ])
  const h = Math.max(620, cardY + Math.max(...tips.map(tip => tip.h), summaryTip.h) + 16)
  const hover = [...metrics.map((_, i) => `svg:has(#${category}-ax-${i}:hover) #${category}-tip-${i}`), `svg:has(#${category}-score:hover) #${category}-tip-all`].join(',')
  const style = `<style>.tip{opacity:0;transform:translateY(6px);transition:opacity .2s ease,transform .25s cubic-bezier(.16,1,.3,1);pointer-events:none}${hover}{opacity:1;transform:none}.ax{cursor:help}.ax:hover .lbl{fill:${INK}}#${category}-score{cursor:help}</style>`
  const legend = hasReal
    ? `<g font-family="${SANS}" font-size="11.5"><line x1="20" y1="86" x2="40" y2="86" stroke="${INK}" stroke-width="1.6"/><text x="46" y="90" fill="${INK_2}">${NOW_NAME}</text><line x1="150" y1="86" x2="170" y2="86" stroke="${WARM}" stroke-width="1.6" stroke-dasharray="5 3"/><text x="176" y="90" fill="${INK_2}">${REAL_NAME}</text></g>`
    : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${width}" height="${Math.round((width * h) / w)}" role="img">${style}
<rect width="${w}" height="${h}" fill="${PAPER}"/>
<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" fill="none" stroke="${HAIR}"/>
<text x="20" y="32" font-size="12" fill="${INK_3}" font-family="${SANS}" letter-spacing=".08em">${esc(CATEGORY_NAMES[category].toUpperCase())}</text>
<text x="20" y="60" font-size="20" fill="${INK}" font-family="${SANS}" letter-spacing="-.01em">${esc(headline(category, realValue ?? value))}</text>
${legend}
<g id="${category}-score"><rect x="${w - 170}" y="10" width="154" height="74" fill="transparent"/><text x="${w - 20}" y="46" text-anchor="end" font-size="34" fill="${INK}" font-family="${MONO}">${value === null ? '—' : value}<tspan font-size="13" fill="${INK_3}">/100 ⓘ</tspan></text>${realValue === null ? '' : `<text x="${w - 20}" y="70" text-anchor="end" font-size="12" fill="${WARM}" font-family="${MONO}">real ${realValue}</text>`}</g>
${grid}${spokes}${realShape}${shape}${nodes}${callouts}${axes}${tips.map(tip => tip.svg).join('')}${summaryTip.svg}
</svg>`
}

// Up to five ways to improve in a category: the evaluator's advice first, then the weakest dimensions' first step.
export const improvements = (profile: MastersProfile, category: Category) => {
  const advice = profile.recommendations.filter(rec => rec.category === category).map(rec => rec.text)
  const weakest = profile.metrics
    .filter(metric => metric.category === category && metric.level !== null && metric.level < 4.5 && GUIDE[metric.id] !== undefined)
    .sort((a, b) => (a.level ?? 0) - (b.level ?? 0))
    .map(metric => `${nameOf(metric.id)}: ${GUIDE[metric.id]?.how[0] ?? ''}`)
  return [...new Set([...advice.slice(0, 3), ...weakest])].slice(0, 5)
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

const ring = (category: Category, value: number | null, real: number | null, i: number) => {
  const r = 34
  const c = 2 * Math.PI * r
  const share = (value ?? 0) / 100
  const realShare = (real ?? 0) / 100
  const realArc = real === null ? '' : `<circle class="arc" cx="42" cy="42" r="${r + 5}" fill="none" stroke="${WARM}" stroke-width="1.2" stroke-dasharray="${f(2 * Math.PI * (r + 5))}" stroke-dashoffset="${f(2 * Math.PI * (r + 5))}" transform="rotate(-90 42 42)" style="--to:${f(2 * Math.PI * (r + 5) * (1 - realShare))}"/>`
  return `<a class="ring" href="#cat-${category}" style="--d:${0.3 + i * 0.12}s"><svg viewBox="-2 -2 88 88" width="88" height="88"><circle cx="42" cy="42" r="${r}" fill="none" stroke="${HAIR}" stroke-width="1"/>${realArc}<circle class="arc" cx="42" cy="42" r="${r}" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" transform="rotate(-90 42 42)" stroke-dasharray="${f(c)}" stroke-dashoffset="${f(c)}" style="--to:${f(c * (1 - share))}"/><text x="42" y="47" text-anchor="middle" font-size="17" fill="${INK}" font-family="${MONO}">${value ?? '—'}</text></svg><span>${esc(CATEGORY_NAMES[category])}</span><em class="bubble">${esc(CATEGORY_ABOUT[category])}${real === null ? '' : `<br><b style="color:${WARM};font-weight:500">Nivel real ${real}</b>`}</em></a>`
}

// The portal: a self-contained page the mod writes to disk and opens in the browser.
// Two tabs: «Mi nivel» and «Ranking ISMO» (the ranking comes only to group accounts that already sent).
export const report = (profile: MastersProfile, team: Team | null = null) => {
  const real = profile.potential
  const sections = CATEGORIES.map(category => {
    const tips = improvements(profile, category)
    const group = team?.categorias[category]
    return `<section id="cat-${category}" class="cat"><div class="viz">${spider(profile, category, 600, team)}</div><aside>
<div class="kicker">Últimos ${profile.days} días</div>${sparkline(profile.trend[category] ?? [])}
${group === undefined ? '' : `<div class="mates"><span>Media del equipo <b>${group.media ?? '–'}</b></span><span>Master <b>${esc(group.master ?? '–')}</b></span></div>`}
${tips.length === 0 ? '' : `<h3>Cómo subir</h3><ul>${tips.map(tip => `<li>${esc(tip)}</li>`).join('')}</ul>`}</aside></section>`
  }).join('')
  const teamJson = JSON.stringify(team).replace(/</g, '\\u003c')
  const head = real === null
    ? `<div class="score"><div class="big"><small>${NOW_NAME}</small><b class="count" data-to="${profile.score}">0</b><span class="tier">${esc(profile.tier)}</span></div></div>`
    : `<div class="score"><div class="big real"><small>${REAL_NAME}</small><b class="count" data-to="${real.score}">0</b><span class="tier">${esc(real.tier)}</span><p>${esc(real.confidence < 0.5 ? REAL_UNSURE : REAL_ABOUT)}</p></div>
<div class="big now"><small>${NOW_NAME}</small><b class="count" data-to="${profile.score}">0</b><span class="tier">${esc(profile.tier)}</span><p>${esc(NOW_ABOUT)}</p></div></div>`

  return `<!doctype html><html lang="es-MX"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${TITLE} ${BYLINE}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Geist+Mono&family=Host+Grotesk:wght@300..600&display=swap" rel="stylesheet">
<style>
:root{--paper:${PAPER};--ink:${INK};--ink2:${INK_2};--ink3:${INK_3};--hair:${HAIR};--hair2:${HAIR_2};--accent:${ACCENT};--warm:${WARM};color-scheme:dark}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--ink);font:380 16px/1.5 ${SANS};overflow-x:hidden}
canvas#field{position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;opacity:.5}
.tabs{position:sticky;top:0;z-index:20;display:flex;gap:4px;justify-content:center;padding:12px 16px;background:linear-gradient(var(--paper) 70%,transparent)}
.tabs a{color:var(--ink3);text-decoration:none;font-size:14px;padding:7px 16px;border:1px solid transparent;border-radius:99px;transition:color .2s,border-color .2s,background .2s}
.tabs a:hover{color:var(--ink)}.tabs a.on{color:var(--ink);border-color:var(--hair2);background:#15171A}
.wrap{position:relative;max-width:1240px;margin:0 auto;padding:0 clamp(16px,3.2vw,48px) clamp(16px,3.2vw,48px)}
.hero{min-height:calc(100vh - 60px);display:flex;flex-direction:column;justify-content:center;gap:16px;padding-bottom:24px}
h1{font-weight:470;font-size:clamp(2.6rem,7.5vw,7rem);letter-spacing:-.045em;line-height:.9;margin:0}
h1 span{display:inline-block;opacity:0;transform:translateY(.4em);animation:rise .9s cubic-bezier(.16,1,.3,1) forwards}
.by{color:var(--ink3);font-size:15px;opacity:0;animation:fade 1s .6s forwards}
.score{display:flex;align-items:flex-start;gap:clamp(24px,6vw,96px);flex-wrap:wrap;margin-top:10px}
.big{display:flex;flex-direction:column;gap:4px;max-width:340px;opacity:0;animation:fade 1s .9s forwards}
.big small{font:11px ${MONO};letter-spacing:.12em;text-transform:uppercase;color:var(--ink3)}
.big b{font:400 clamp(5rem,16vw,12rem)/.85 ${MONO};letter-spacing:-.07em}
.big.real b{color:var(--warm)}.big.now b{font-size:clamp(3.4rem,9vw,7rem);color:var(--ink)}
.big .tier{font-size:clamp(1.2rem,2.4vw,2rem);color:var(--accent)}.big.real .tier{color:var(--warm)}
.big p{margin:6px 0 0;color:var(--ink3);font-size:13.5px;line-height:1.45}
.rings{display:flex;gap:clamp(16px,3vw,44px);flex-wrap:wrap;margin-top:24px}
.ring{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;color:var(--ink2);text-decoration:none;font-size:12.5px;max-width:120px;text-align:center;opacity:0;animation:fade .8s var(--d) forwards;transition:transform .3s cubic-bezier(.16,1,.3,1)}
.ring:hover{transform:translateY(-4px)}
.ring .arc{transition:stroke-dashoffset 1.8s cubic-bezier(.16,1,.3,1) var(--d)}.loaded .ring .arc{stroke-dashoffset:var(--to)}
.ring:hover span{color:var(--ink)}
.bubble{position:absolute;top:100%;left:50%;transform:translate(-50%,8px);width:250px;padding:12px 14px;background:#15171A;border:1px solid var(--hair2);border-radius:4px;color:var(--ink2);font:380 13px/1.45 ${SANS};font-style:normal;text-align:left;opacity:0;pointer-events:none;transition:opacity .18s;z-index:5}
.ring:hover .bubble{opacity:1}
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
.switch{display:inline-flex;border:1px solid var(--hair2);border-radius:99px;padding:3px;margin-bottom:18px}
.switch button{background:none;border:0;color:var(--ink3);font:inherit;font-size:13px;padding:6px 14px;border-radius:99px;cursor:pointer}
.switch button.on{background:#1C1F24;color:var(--ink)}
table{width:100%;border-collapse:collapse}
th{font:500 10.5px ${MONO};letter-spacing:.1em;text-transform:uppercase;color:var(--ink3);text-align:left;padding:8px;border-bottom:1px solid var(--hair2)}
td{padding:10px 8px;border-bottom:1px solid var(--hair);white-space:nowrap;font-size:14.5px}
td.n{font-family:${MONO};text-align:right}
tr.me td{background:rgba(233,210,91,.06)}tr.me td:first-child{box-shadow:inset 2px 0 var(--warm)}
tbody tr{opacity:0;transform:translateX(-12px);transition:opacity .6s,transform .6s cubic-bezier(.16,1,.3,1)}
.shown tbody tr{opacity:1;transform:none}
.bar{display:inline-block;vertical-align:middle;width:120px;height:6px;border-radius:3px;background:var(--hair);overflow:hidden;margin-right:10px}
.bar i{display:block;height:100%;width:0;border-radius:3px;transition:width 1.2s cubic-bezier(.16,1,.3,1)}
.bar.real i{background:var(--warm)}.bar.now i{background:var(--accent)}
.pos{font-family:${MONO};color:var(--ink3);width:36px}
.tag{font-size:11px;color:var(--warm);margin-left:8px;border:1px solid rgba(233,210,91,.4);border-radius:99px;padding:1px 7px}
.tag.crack{color:var(--accent);border-color:rgba(109,146,214,.5)}
.empty{color:var(--ink3);padding:40px 0;font-size:15px}
.scroller{overflow-x:auto}
@keyframes rise{to{opacity:1;transform:none}}@keyframes fade{to{opacity:1}}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(8px)}}@keyframes blink{0%,100%{opacity:.3}50%{opacity:1}}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}h1 span,.by,.big,.ring,.cat,.cue,tbody tr{opacity:1;transform:none}}
</style></head><body><canvas id="field"></canvas>
<nav class="tabs"><a href="#mi-nivel" data-tab="me" class="on">Mi nivel</a><a href="#ranking" data-tab="rank">Ranking ISMO</a></nav>
<div class="wrap">
<div id="pane-me">
<header class="hero" id="mi-nivel">
<h1>${TITLE.split(' ').map((word, i) => `<span style="animation-delay:${0.08 * i}s">${esc(word)}</span>`).join(' ')}</h1>
<div class="by">${BYLINE}</div>
${head}
<nav class="rings">${CATEGORIES.map((category, i) => ring(category, profile.categories[category], real?.categories[category] ?? null, i)).join('')}</nav>
<a class="cue" href="#cat-herramienta">Baja para ver tus arañas<svg width="28" height="34" viewBox="0 0 28 34" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8l8 8 8-8"/><path d="M6 18l8 8 8-8"/></svg></a>
</header>
${sections}
<footer>${profile.prompts.toLocaleString('es-MX')} prompts analizados · últimos ${profile.days} días de uso</footer>
</div>
<section id="pane-rank" class="rank" hidden>
<h2>Ranking ISMO</h2>
<p class="sub">Solo cuentas de ISMO Motors. Ordenado por nivel real: lo que cada quien ya demostró, no cuánto usó Claude esta semana.</p>
<div class="switch"><button data-by="real" class="on">Nivel real</button><button data-by="now">Momento actual</button></div>
<div class="scroller" id="rank-table"></div>
</section>
</div>
<script type="application/json" id="team">${teamJson}</script>
<script>
(() => {
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches
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
    entry.target.querySelectorAll('svg').forEach(svg => { try { svg.setCurrentTime(0); svg.unpauseAnimations() } catch {} })
    entry.target.querySelectorAll('.spark animate').forEach(a => { try { a.beginElement() } catch {} })
    io.unobserve(entry.target)
  }), { threshold: .2 })
  document.querySelectorAll('.cat').forEach(cat => { cat.querySelectorAll('svg').forEach(svg => { try { svg.pauseAnimations() } catch {} }); io.observe(cat) })
  // The ranking tab.
  const team = JSON.parse(document.getElementById('team').textContent || 'null')
  const box = document.getElementById('rank-table')
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  let by = 'real'
  const realOf = p => (p.potencial && typeof p.potencial.puntaje === 'number') ? p.potencial.puntaje : null
  const drawRank = () => {
    if (!team || !team.personas || team.personas.length === 0) { box.innerHTML = '<p class="empty">El ranking aparece cuando tu cuenta de ISMO ya envió su primer puntaje. Vuelve a abrir el portal en unos minutos.</p>'; return }
    const rows = [...team.personas].sort((a, b) => by === 'real' ? ((realOf(b) ?? b.puntaje) - (realOf(a) ?? a.puntaje)) : (b.puntaje - a.puntaje))
    const cats = ['herramienta', 'estructura', 'sistema', 'valor']
    box.innerHTML = '<table><thead><tr><th>#</th><th>Persona</th><th>Nivel real</th><th>Momento</th>' + cats.map(c => '<th>' + c.slice(0, 1).toUpperCase() + c.slice(1, 4) + '</th>').join('') + '<th>Días</th></tr></thead><tbody>' +
      rows.map((p, i) => { const r = realOf(p); return '<tr class="' + (p.yo ? 'me' : '') + '" style="transition-delay:' + (i * 45) + 'ms"><td class="pos">' + String(i + 1).padStart(2, '0') + '</td><td>' + esc(p.nombre) + (p.yo ? '<span class="tag">tú</span>' : '') + (p.potencial && p.potencial.puntaje >= 80 && (p.potencial.confianza ?? 0) >= .75 ? '<span class="tag crack">crack</span>' : '') + '</td>' +
        '<td><span class="bar real"><i data-w="' + (r ?? 0) + '"></i></span><span class="n">' + (r ?? '–') + '</span></td>' +
        '<td><span class="bar now"><i data-w="' + p.puntaje + '"></i></span><span class="n">' + p.puntaje + '</span></td>' +
        cats.map(c => { const v = by === 'real' && p.potencial && p.potencial.categorias ? p.potencial.categorias[c] : p.categorias[c]; return '<td class="n">' + (v ?? '–') + '</td>' }).join('') +
        '<td class="n">' + p.dias + '</td></tr>' }).join('') + '</tbody></table>'
    box.classList.remove('shown')
    requestAnimationFrame(() => requestAnimationFrame(() => { box.classList.add('shown'); box.querySelectorAll('.bar i').forEach(b => b.style.width = b.dataset.w + '%') }))
  }
  document.querySelectorAll('.switch button').forEach(b => b.onclick = () => { by = b.dataset.by; document.querySelectorAll('.switch button').forEach(x => x.classList.toggle('on', x === b)); drawRank() })
  const show = () => {
    const isRank = location.hash === '#ranking'
    document.getElementById('pane-me').hidden = isRank
    document.getElementById('pane-rank').hidden = !isRank
    document.querySelectorAll('.tabs a').forEach(a => a.classList.toggle('on', (a.dataset.tab === 'rank') === isRank))
    if (isRank) { scrollTo(0, 0); drawRank() }
  }
  addEventListener('hashchange', show); show()
  // Fragment → Loop: hairline fragments drift, then settle onto a 3:2 Lissajous loop.
  const cv = document.getElementById('field'), cx = cv.getContext('2d')
  let W, H; const size = () => { W = cv.width = innerWidth * devicePixelRatio; H = cv.height = innerHeight * devicePixelRatio }; size(); addEventListener('resize', size)
  const N = 420, bits = Array.from({ length: N }, (_, i) => ({ x: Math.random(), y: Math.random(), a: Math.random() * 6.28, t: (i / N) * 6.28 }))
  const start = performance.now()
  const draw = now => {
    const k = calm ? 1 : Math.min(1, (now - start) / 3200), e = 1 - Math.pow(1 - k, 3), spin = (now - start) / 26000
    cx.clearRect(0, 0, W, H); cx.strokeStyle = '${ACCENT}'; cx.lineWidth = devicePixelRatio * .7; cx.globalAlpha = .55
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
})()
</script></body></html>`
}
