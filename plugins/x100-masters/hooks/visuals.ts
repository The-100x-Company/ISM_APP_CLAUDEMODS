// «Tu Nivel en Claude» by The 100x Co: the web icon, one spider per category, and the full HTML report.
// 100x look: graphite paper, hairlines, one blue accent, slow motion.
import { ALL_METRICS, CATEGORIES, CATEGORY_ABOUT, CATEGORY_NAMES, CODE_METRICS, TEXT_METRICS } from './rubric'
import type { Category, MastersProfile, MetricResult } from '../types'

const PAPER = '#0D0E11'
const INK = '#E6E8EA'
const INK_2 = '#A9ADB1'
const INK_3 = '#84888E'
const HAIR = '#24272A'
const HAIR_2 = '#3A3E43'
const ACCENT = '#6D92D6'
const SANS = `'Host Grotesk','Segoe UI',system-ui,sans-serif`
const MONO = `'Geist Mono',ui-monospace,Consolas,monospace`

export const TITLE = 'Tu Nivel en Claude'
export const BYLINE = 'by The 100x Co'

const esc = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const f = (n: number) => n.toFixed(1)

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
      // The threads sag a little between spokes, as a real web does.
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

// One category's spider: hairline grid of levels 1–5, the person's shape growing out from the centre.
export const spider = (profile: MastersProfile, category: Category, width = 600) => {
  const w = 660
  const h = 470
  const cx = w / 2
  const cy = 262
  const r = 140
  const metrics = profile.metrics.filter(metric => metric.category === category)
  const n = metrics.length
  const at = (i: number, level: number) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2
    return [cx + Math.cos(angle) * r * (level / 5), cy + Math.sin(angle) * r * (level / 5)] as const
  }
  const points = (levels: number[]) => levels.map((level, i) => at(i, level).map(f).join(',')).join(' ')
  const grid = [1, 2, 3, 4, 5]
    .map(level => `<polygon points="${points(metrics.map(() => level))}" fill="none" stroke="${level === 5 ? HAIR_2 : HAIR}" stroke-width="${level === 5 ? 1 : 0.75}"/>`)
    .join('')
  const spokes = metrics.map((_, i) => `<line x1="${cx}" y1="${cy}" x2="${f(at(i, 5)[0])}" y2="${f(at(i, 5)[1])}" stroke="${HAIR}" stroke-width=".75"/>`).join('')
  const levels = metrics.map(metric => Math.max(0.35, metric.level ?? 0))
  const target = points(levels)
  const start = points(levels.map(() => 0.05))
  const shape = `<polygon points="${target}" fill="${ACCENT}" fill-opacity=".14" stroke="${INK}" stroke-width="1.25" stroke-linejoin="round">
<animate attributeName="points" values="${start};${target}" dur="1.4s" calcMode="spline" keyTimes="0;1" keySplines=".16 1 .3 1" fill="freeze"/></polygon>`
  const nodes = metrics
    .map((metric, i) => {
      const [x, y] = at(i, levels[i] ?? 0.35)
      return metric.level === null ? '' : `<circle cx="${f(x)}" cy="${f(y)}" r="2.4" fill="${metric.evaluator === 'codigo' ? INK : ACCENT}"><animate attributeName="opacity" values="0;0;1" keyTimes="0;.7;1" dur="1.6s" fill="freeze"/></circle>`
    })
    .join('')
  const labels = metrics
    .map((metric, i) => {
      const [x, y] = at(i, 6.05)
      const name = ALL_METRICS.find(item => item.id === metric.id)?.name ?? metric.id
      const anchor = x < cx - 10 ? 'end' : x > cx + 10 ? 'start' : 'middle'
      const tone = metric.level === null ? INK_3 : INK_2
      return `<text x="${f(x)}" y="${f(y + 4)}" text-anchor="${anchor}" font-size="12.5" fill="${tone}" font-family="${SANS}"><title>${esc(name)}: ${metric.level ?? 'sin datos'}/5 · ${metric.evaluator}</title>${esc(name)}<tspan fill="${INK_3}" font-family="${MONO}" font-size="11"> ${metric.level ?? '–'}</tspan></text>`
    })
    .join('')
  const value = profile.categories[category]

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${width}" height="${Math.round((width * h) / w)}" role="img">
<rect width="${w}" height="${h}" fill="${PAPER}"/>
<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" fill="none" stroke="${HAIR}"/>
<text x="20" y="32" font-size="13" fill="${INK_3}" font-family="${SANS}" letter-spacing=".04em">${esc(CATEGORY_NAMES[category].toUpperCase())}</text>
<text x="${w - 20}" y="40" text-anchor="end" font-size="30" fill="${INK}" font-family="${MONO}">${value === null ? '—' : value}<tspan font-size="13" fill="${INK_3}">/100</tspan></text>
${grid}${spokes}${shape}${nodes}${labels}
<text x="20" y="${h - 16}" font-size="10.5" fill="${INK_3}" font-family="${SANS}">● código   <tspan fill="${ACCENT}">●</tspan> Haiku o Sonnet</text>
</svg>`
}

const levelText = (metric: MetricResult) => {
  const anchors = TEXT_METRICS.find(item => item.id === metric.id)?.levels
  if (anchors !== undefined && metric.level !== null) return anchors[metric.level - 1] ?? ''
  const code = CODE_METRICS.find(item => item.id === metric.id)
  if (code !== undefined && metric.value !== undefined) return `${metric.value.toLocaleString('es-MX', { maximumFractionDigits: 2 })} ${code.unit}`
  return ''
}

const bar = (level: number | null) =>
  `<span class="bar">${[1, 2, 3, 4, 5].map(step => `<i class="${level !== null && step <= level ? 'on' : ''}"></i>`).join('')}</span>`

// The full report: self-contained HTML the mod writes to disk and opens in the browser.
export const report = (profile: MastersProfile) => {
  const when = new Date(profile.updatedAt).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
  const sections = CATEGORIES.map(category => {
    const rows = profile.metrics
      .filter(metric => metric.category === category)
      .map(metric => {
        const about = ALL_METRICS.find(item => item.id === metric.id)
        return `<tr><td class="n">${esc(about?.name ?? metric.id)}<small>${esc(about?.about ?? '')}</small></td><td>${bar(metric.level)}</td><td class="lv">${esc(levelText(metric))}</td><td><span class="chip ${metric.evaluator}">${metric.evaluator}</span></td></tr>`
      })
      .join('')
    const recs = profile.recommendations
      .filter(rec => rec.category === category)
      .map(rec => `<li>${esc(rec.text)}<span class="chip ${rec.evaluator}">${rec.evaluator}</span></li>`)
      .join('')
    return `<section><div class="viz">${spider(profile, category, 600)}</div><div class="detail"><h2>${esc(CATEGORY_NAMES[category])}</h2><p class="about">${esc(CATEGORY_ABOUT[category])}</p>
<table>${rows}</table>${recs === '' ? '' : `<h3>Recomendaciones</h3><ul>${recs}</ul>`}</div></section>`
  }).join('')

  return `<!doctype html><html lang="es-MX"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${TITLE} ${BYLINE}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Geist+Mono&family=Host+Grotesk:wght@300..600&display=swap" rel="stylesheet">
<style>
:root{--paper:${PAPER};--ink:${INK};--ink2:${INK_2};--ink3:${INK_3};--hair:${HAIR};--accent:${ACCENT};color-scheme:dark}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:380 16px/1.5 ${SANS}}
.wrap{max-width:1180px;margin:0 auto;padding:clamp(16px,3.2vw,48px)}
header{position:relative;border-bottom:1px solid var(--hair);padding-bottom:32px;margin-bottom:8px;overflow:hidden}
header svg.loop{position:absolute;right:-40px;top:-30px;width:520px;opacity:.5;pointer-events:none}
h1{font-weight:470;font-size:clamp(2.4rem,6vw,5rem);letter-spacing:-.04em;line-height:.95;margin:0}
.by{color:var(--ink3);font-size:15px;margin-top:10px}
.score{display:flex;gap:28px;align-items:baseline;margin-top:28px;flex-wrap:wrap}
.score b{font:400 clamp(4rem,12vw,9rem)/.8 ${MONO};letter-spacing:-.06em}
.score span{color:var(--ink2);font-size:20px}.score em{font-style:normal;color:var(--accent)}
.summary{max-width:760px;color:var(--ink2);margin-top:20px}
.meta{font:11px ${MONO};color:var(--ink3);margin-top:12px}
section{display:grid;grid-template-columns:minmax(0,600px) minmax(0,1fr);gap:32px;padding:40px 0;border-bottom:1px solid var(--hair)}
@media (max-width:900px){section{grid-template-columns:1fr}}
.viz svg{width:100%;height:auto;display:block}
h2{font-weight:470;font-size:28px;letter-spacing:-.02em;margin:0 0 6px}.about{color:var(--ink3);margin:0 0 18px}
h3{font-weight:500;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink3);margin:24px 0 8px}
table{width:100%;border-collapse:collapse}td{border-top:1px solid var(--hair);padding:7px 8px 7px 0;vertical-align:middle;white-space:nowrap}
td.n{white-space:normal;font-weight:500;font-size:14px}td.n small{display:block;font-weight:380;color:var(--ink3);font-size:12px}
td.lv{white-space:normal;color:var(--ink2);font-size:12.5px;max-width:240px}
.bar{display:inline-flex;gap:3px}.bar i{width:14px;height:6px;border:1px solid var(--hair);display:block}.bar i.on{background:var(--ink);border-color:var(--ink)}
.chip{font:11px ${MONO};color:var(--ink3);border:1px solid var(--hair);border-radius:2px;padding:2px 6px;margin-left:8px}.chip.haiku,.chip.sonnet{color:var(--accent);border-color:#24365a}
ul{margin:0;padding:0;list-style:none}li{border-top:1px solid var(--hair);padding:10px 0;color:var(--ink)}
footer{color:var(--ink3);font-size:13px;padding:28px 0}
@media (prefers-reduced-motion:reduce){svg *{animation:none!important}}
</style></head><body><div class="wrap">
<header>
<svg class="loop" viewBox="0 0 400 300" fill="none"><path d="${lissajous()}" stroke="${ACCENT}" stroke-width=".8" stroke-dasharray="1400" stroke-dashoffset="1400"><animate attributeName="stroke-dashoffset" from="1400" to="0" dur="3.2s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines=".16 1 .3 1"/></path></svg>
<h1>${TITLE}</h1><div class="by">${BYLINE}</div>
<div class="score"><b>${profile.score}</b><span>de 100 · <em>${esc(profile.tier)}</em></span></div>
${profile.summary === '' ? '' : `<p class="summary">${esc(profile.summary)}</p>`}
<div class="meta">${esc(profile.email)} · ${profile.prompts.toLocaleString('es-MX')} prompts en 30 días · actualizado ${esc(when)}</div>
</header>
${sections}
<footer>Se envían solo puntajes y recomendaciones. Tus prompts no salen de tu equipo: solo Claude los lee para evaluarte, con tu propia cuenta.</footer>
</div></body></html>`
}

// The 100x loop: a 3:2 Lissajous curve drawn in hairline.
const lissajous = () => {
  const steps = 240
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = (i / steps) * Math.PI * 2
    const x = 200 + Math.sin(3 * t + Math.PI / 2) * 180
    const y = 150 + Math.sin(2 * t) * 130
    return `${i === 0 ? 'M' : 'L'}${f(x)} ${f(y)}`
  }).join(' ')
}
