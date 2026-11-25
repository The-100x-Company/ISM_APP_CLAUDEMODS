// «Tu Nivel en Claude» by The 100x Co: the web icon, one spider per category and the portal.
// Visual first: shapes, motion and headlines on screen; the dense detail lives in the hover cards.
// 100x look: graphite paper, hairlines, one blue accent, slow motion.
import { ALL_METRICS, CATEGORIES, CATEGORY_ABOUT, CATEGORY_NAMES, CODE_METRICS, TEXT_METRICS } from './rubric'
import { GUIDE } from './guide'
import type { Category, MastersProfile, MetricResult } from '../types'

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

const esc = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const f = (n: number) => n.toFixed(1)
const fmt = (n: number) => n.toLocaleString('es-MX', { maximumFractionDigits: n < 10 ? 2 : 0 })

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

// What the person scored on a metric, said in words.
const measured = (metric: MetricResult) => {
  const code = CODE_METRICS.find(item => item.id === metric.id)
  if (code !== undefined) return `Medimos ${fmt(metric.value ?? 0)} ${code.unit}. Nivel 5 desde ${fmt(code.cuts[3])}.`
  const anchors = TEXT_METRICS.find(item => item.id === metric.id)?.levels
  if (anchors === undefined || metric.level === null) return 'Leído en tus prompts.'
  return `Hoy: «${anchors[Math.max(0, Math.min(4, Math.round(metric.level) - 1))]}».`
}

const nextStep = (metric: MetricResult) => {
  const anchors = TEXT_METRICS.find(item => item.id === metric.id)?.levels
  if (anchors === undefined || metric.level === null || metric.level >= 4.5) return undefined
  return `Siguiente nivel: «${anchors[Math.min(4, Math.round(metric.level))]}».`
}

type Section = { label: string; text: string; tone: string }

// One hover card as an SVG group: a title, then labelled sections, wrapped to the card's width.
const card = (id: string, x: number, y: number, w: number, title: string, sections: Section[]) => {
  const width = Math.floor((w - 32) / 7.3)
  let at = y + 30
  const parts: string[] = [`<text x="${x + 14}" y="${at}" font-size="16" font-weight="600" fill="${INK}" font-family="${SANS}">${esc(title)}</text>`]
  at += 8
  for (const section of sections) {
    at += 22
    parts.push(`<text x="${x + 14}" y="${at}" font-size="10.5" letter-spacing=".08em" fill="${INK_3}" font-family="${SANS}">${esc(section.label.toUpperCase())}</text>`)
    for (const line of wrap(section.text, width)) {
      at += 18
      parts.push(`<text x="${x + 14}" y="${at}" font-size="13.5" fill="${section.tone}" font-family="${SANS}">${esc(line)}</text>`)
    }
  }
  const h = at - y + 16

  return `<g class="tip" id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${CARD}" stroke="${HAIR_2}"/>${parts.join('')}</g>`
}

// One category's spider. Hover an axis for its card; hover the score for everything that was measured.
export const spider = (profile: MastersProfile, category: Category, width = 600) => {
  const w = 660
  const h = 500
  const cx = w / 2
  const cy = 280
  const r = 140
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
  const target = points(levels)
  const start = points(levels.map(() => 0.05))
  const shape = `<polygon points="${target}" fill="${ACCENT}" fill-opacity=".16" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round">
<animate attributeName="points" values="${start};${target}" dur="1.6s" calcMode="spline" keyTimes="0;1" keySplines=".16 1 .3 1" fill="freeze"/></polygon>`
  const scored = metrics.map((metric, i) => ({ metric, i })).filter(item => item.metric.level !== null)
  const best = [...scored].sort((a, b) => (b.metric.level ?? 0) - (a.metric.level ?? 0))[0]
  const worst = [...scored].sort((a, b) => (a.metric.level ?? 0) - (b.metric.level ?? 0))[0]
  const nodes = scored
    .map(({ metric, i }) => {
      const [x, y] = at(i, levels[i] ?? 0.35)
      const isWorst = worst !== undefined && worst.i === i && best !== undefined && (best.metric.level ?? 0) > (worst.metric.level ?? 0)
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${isWorst ? 3.4 : 2.4}" fill="${isWorst ? WARM : INK}" opacity="0"><animate attributeName="opacity" values="0;0;1" keyTimes="0;.75;1" dur="1.8s" fill="freeze"/>${isWorst ? `<animate attributeName="r" values="3.4;6;3.4" dur="2.4s" begin="1.8s" repeatCount="indefinite"/>` : ''}</circle>`
    })
    .join('')
  const callout = (item: { metric: MetricResult; i: number } | undefined, text: string, tone: string) => {
    if (item === undefined) return ''
    const [x, y] = at(item.i, Math.max(1.4, levels[item.i] ?? 1) * 0.55)
    return `<text x="${f(x)}" y="${f(y)}" text-anchor="middle" font-size="10" letter-spacing=".08em" fill="${tone}" font-family="${SANS}" opacity="0">${text}<animate attributeName="opacity" values="0;0;.9" keyTimes="0;.8;1" dur="2.2s" fill="freeze"/></text>`
  }
  const callouts = best !== undefined && worst !== undefined && (best.metric.level ?? 0) > (worst.metric.level ?? 0) ? callout(best, 'FORTALEZA', INK_2) + callout(worst, 'SIGUIENTE SALTO', WARM) : ''
  const axes = metrics
    .map((metric, i) => {
      const [x, y] = at(i, 6.05)
      const [vx, vy] = at(i, 5)
      const name = ALL_METRICS.find(item => item.id === metric.id)?.name ?? metric.id
      const anchor = x < cx - 10 ? 'end' : x > cx + 10 ? 'start' : 'middle'
      const tone = metric.level === null ? INK_3 : INK_2
      const textW = name.length * 7 + 26
      const hx = anchor === 'end' ? x - textW : anchor === 'middle' ? x - textW / 2 : x
      return `<g class="ax" id="${category}-ax-${i}"><line x1="${cx}" y1="${cy}" x2="${f(vx)}" y2="${f(vy)}" stroke="transparent" stroke-width="14"/><rect x="${f(hx)}" y="${f(y - 11)}" width="${textW}" height="20" fill="transparent"/><text class="lbl" x="${f(x)}" y="${f(y + 4)}" text-anchor="${anchor}" font-size="12.5" fill="${tone}" font-family="${SANS}">${esc(name)}<tspan fill="${INK_3}" font-family="${MONO}" font-size="11"> ${metric.level === null ? '–' : metric.level.toFixed(1)}</tspan></text></g>`
    })
    .join('')
  const cardW = 400
  const cardX = cx - cardW / 2
  const tips = metrics
    .map((metric, i) => {
      const about = ALL_METRICS.find(item => item.id === metric.id)
      const guide = GUIDE[metric.id]
      const next = nextStep(metric)
      const sections: Section[] = [
        { label: 'Qué evaluamos', text: `${about?.about ?? ''}. ${measured(metric)}`, tone: INK_2 },
        ...(next === undefined ? [] : [{ label: 'Cómo subir', text: next, tone: WARM }]),
        ...(guide === undefined ? [] : [{ label: 'Buena práctica', text: guide.practice, tone: INK }, { label: 'Ejemplo', text: guide.example, tone: ACCENT }]),
      ]
      return card(`${category}-tip-${i}`, cardX, 70, cardW, `${about?.name ?? metric.id} · ${metric.level === null ? 'sin datos' : `${metric.level.toFixed(1)} de 5`}`, sections)
    })
    .join('')
  const listing = metrics
    .map(metric => `${ALL_METRICS.find(item => item.id === metric.id)?.name ?? metric.id} ${metric.level === null ? '–' : metric.level.toFixed(1)}`)
    .join(' · ')
  const summaryTip = card(`${category}-tip-all`, w - 20 - cardW, 60, cardW, CATEGORY_NAMES[category], [
    { label: 'De qué se trata', text: CATEGORY_ABOUT[category], tone: INK_2 },
    { label: 'Lo que evaluamos en ti (1 a 5)', text: listing, tone: INK },
  ])
  const value = profile.categories[category]
  const hover = [...metrics.map((_, i) => `svg:has(#${category}-ax-${i}:hover) #${category}-tip-${i}`), `svg:has(#${category}-score:hover) #${category}-tip-all`].join(',')
  const style = `<style>.tip{opacity:0;transition:opacity .18s ease;pointer-events:none}${hover}{opacity:1}.ax{cursor:help}.ax:hover .lbl{fill:${INK}}#${category}-score{cursor:help}</style>`

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${width}" height="${Math.round((width * h) / w)}" role="img">${style}
<rect width="${w}" height="${h}" fill="${PAPER}"/>
<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" fill="none" stroke="${HAIR}"/>
<text x="20" y="32" font-size="12" fill="${INK_3}" font-family="${SANS}" letter-spacing=".08em">${esc(CATEGORY_NAMES[category].toUpperCase())}</text>
<text x="20" y="58" font-size="20" fill="${INK}" font-family="${SANS}" letter-spacing="-.01em">${esc(headline(category, value))}</text>
<g id="${category}-score"><rect x="${w - 140}" y="12" width="124" height="44" fill="transparent"/><text x="${w - 20}" y="46" text-anchor="end" font-size="34" fill="${INK}" font-family="${MONO}">${value === null ? '—' : value}<tspan font-size="13" fill="${INK_3}">/100 ⓘ</tspan></text></g>
${grid}${spokes}${shape}${nodes}${callouts}${axes}${tips}${summaryTip}
</svg>`
}

// Up to five ways to improve in a category: the evaluator's advice first, then the weakest dimensions' practice.
export const improvements = (profile: MastersProfile, category: Category) => {
  const advice = profile.recommendations.filter(rec => rec.category === category).map(rec => rec.text)
  const weakest = profile.metrics
    .filter(metric => metric.category === category && metric.level !== null && metric.level < 4.5)
    .sort((a, b) => (a.level ?? 0) - (b.level ?? 0))
    .map(metric => `${ALL_METRICS.find(item => item.id === metric.id)?.name ?? metric.id}: ${GUIDE[metric.id]?.practice ?? ''}`)
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

const ring = (category: Category, value: number | null, i: number) => {
  const r = 34
  const c = 2 * Math.PI * r
  const share = (value ?? 0) / 100
  return `<a class="ring" href="#cat-${category}" style="--d:${0.3 + i * 0.12}s"><svg viewBox="0 0 84 84" width="84" height="84"><circle cx="42" cy="42" r="${r}" fill="none" stroke="${HAIR}" stroke-width="1"/><circle class="arc" cx="42" cy="42" r="${r}" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" transform="rotate(-90 42 42)" stroke-dasharray="${f(c)}" stroke-dashoffset="${f(c)}" style="--to:${f(c * (1 - share))}"/><text x="42" y="47" text-anchor="middle" font-size="17" fill="${INK}" font-family="${MONO}">${value ?? '—'}</text></svg><span>${esc(CATEGORY_NAMES[category])}</span><em class="bubble">${esc(CATEGORY_ABOUT[category])}</em></a>`
}

// The portal: a self-contained page the mod writes to disk and opens in the browser.
export const report = (profile: MastersProfile) => {
  const sections = CATEGORIES.map(category => {
    const tips = improvements(profile, category)
    return `<section id="cat-${category}" class="cat"><div class="viz">${spider(profile, category, 600)}</div><aside>
<div class="kicker">Últimos ${profile.days} días</div>${sparkline(profile.trend[category] ?? [])}
${tips.length === 0 ? '' : `<h3>Cómo subir</h3><ul>${tips.map(tip => `<li>${esc(tip)}</li>`).join('')}</ul>`}</aside></section>`
  }).join('')

  return `<!doctype html><html lang="es-MX"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${TITLE} ${BYLINE}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Geist+Mono&family=Host+Grotesk:wght@300..600&display=swap" rel="stylesheet">
<style>
:root{--paper:${PAPER};--ink:${INK};--ink2:${INK_2};--ink3:${INK_3};--hair:${HAIR};--accent:${ACCENT};--warm:${WARM};color-scheme:dark}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--ink);font:380 16px/1.5 ${SANS};overflow-x:hidden}
canvas#field{position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;opacity:.55}
.wrap{position:relative;max-width:1240px;margin:0 auto;padding:clamp(16px,3.2vw,48px)}
.hero{min-height:88vh;display:flex;flex-direction:column;justify-content:center;gap:18px}
h1{font-weight:470;font-size:clamp(2.8rem,8vw,7.5rem);letter-spacing:-.045em;line-height:.9;margin:0}
h1 span{display:inline-block;opacity:0;transform:translateY(.4em);animation:rise .9s cubic-bezier(.16,1,.3,1) forwards}
.by{color:var(--ink3);font-size:15px;opacity:0;animation:fade 1s .6s forwards}
.score{display:flex;align-items:baseline;gap:22px;flex-wrap:wrap;margin-top:8px}
.score b{font:400 clamp(6rem,20vw,15rem)/.8 ${MONO};letter-spacing:-.07em}
.score .tier{font-size:clamp(1.4rem,3vw,2.4rem);color:var(--accent);opacity:0;animation:fade 1s 1.4s forwards}
.rings{display:flex;gap:clamp(16px,3vw,44px);flex-wrap:wrap;margin-top:28px}
.ring{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;color:var(--ink2);text-decoration:none;font-size:12.5px;max-width:120px;text-align:center;opacity:0;animation:fade .8s var(--d) forwards}
.ring .arc{transition:stroke-dashoffset 1.8s cubic-bezier(.16,1,.3,1) var(--d)}.loaded .ring .arc{stroke-dashoffset:var(--to)}
.ring:hover span{color:var(--ink)}
.bubble{position:absolute;top:100%;left:50%;transform:translate(-50%,8px);width:240px;padding:12px 14px;background:${CARD};border:1px solid ${HAIR_2};border-radius:3px;color:var(--ink2);font:380 13px/1.45 ${SANS};font-style:normal;text-align:left;opacity:0;pointer-events:none;transition:opacity .18s;z-index:5}
.ring:hover .bubble{opacity:1}
.scroll{margin-top:40px;color:var(--ink3);font:11px ${MONO};letter-spacing:.1em}
.cat{display:grid;grid-template-columns:minmax(0,640px) minmax(0,1fr);gap:40px;align-items:center;padding:64px 0;border-top:1px solid var(--hair);opacity:0;transform:translateY(40px);transition:opacity 1s cubic-bezier(.16,1,.3,1),transform 1s cubic-bezier(.16,1,.3,1)}
.cat.in{opacity:1;transform:none}
@media (max-width:960px){.cat{grid-template-columns:1fr}}
.viz svg{width:100%;height:auto;display:block}
.kicker{font:11px ${MONO};letter-spacing:.1em;color:var(--ink3);text-transform:uppercase;margin-bottom:6px}
h3{font-weight:470;font-size:28px;letter-spacing:-.02em;margin:32px 0 10px}
ul{margin:0;padding:0;list-style:none;counter-reset:n}li{counter-increment:n;border-top:1px solid var(--hair);padding:12px 0 12px 34px;position:relative;color:var(--ink);font-size:15px}
li::before{content:counter(n,decimal-leading-zero);position:absolute;left:0;top:13px;font:11px ${MONO};color:var(--accent)}
footer{border-top:1px solid var(--hair);padding:28px 0 56px;color:var(--ink3);font:12px ${MONO};letter-spacing:.04em}
@keyframes rise{to{opacity:1;transform:none}}@keyframes fade{to{opacity:1}}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}h1 span,.by,.score .tier,.ring,.cat{opacity:1;transform:none}}
</style></head><body><canvas id="field"></canvas><div class="wrap">
<header class="hero">
<h1>${TITLE.split(' ').map((word, i) => `<span style="animation-delay:${0.08 * i}s">${esc(word)}</span>`).join(' ')}</h1>
<div class="by">${BYLINE}</div>
<div class="score"><b id="score" data-to="${profile.score}">0</b><span class="tier">${esc(profile.tier)}</span></div>
<nav class="rings">${CATEGORIES.map((category, i) => ring(category, profile.categories[category], i)).join('')}</nav>
<div class="scroll">↓ PASA EL CURSOR SOBRE CADA DIMENSIÓN</div>
</header>
${sections}
<footer>${profile.prompts.toLocaleString('es-MX')} prompts analizados · últimos ${profile.days} días de uso</footer>
</div>
<script>
(() => {
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches
  requestAnimationFrame(() => document.body.classList.add('loaded'))
  // The score counts up.
  const el = document.getElementById('score'), to = +el.dataset.to, t0 = performance.now()
  const tick = now => { const p = calm ? 1 : Math.min(1, (now - t0) / 1600); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4))); if (p < 1) requestAnimationFrame(tick) }
  requestAnimationFrame(tick)
  // Each category rises in and replays its drawing when it scrolls into view.
  const io = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return
    entry.target.classList.add('in')
    entry.target.querySelectorAll('svg').forEach(svg => { try { svg.setCurrentTime(0); svg.unpauseAnimations() } catch {} })
    entry.target.querySelectorAll('.spark animate').forEach(a => { try { a.beginElement() } catch {} })
    io.unobserve(entry.target)
  }), { threshold: .25 })
  document.querySelectorAll('.cat').forEach(cat => { cat.querySelectorAll('svg').forEach(svg => { try { svg.pauseAnimations() } catch {} }); io.observe(cat) })
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
