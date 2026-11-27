// Animated line icons and colors for the 11 talent archetypes («Tu Claude Score by The 100x Co»).
// Pure strings: 24x24 viewBox, stroke-based, SMIL animation looping every 5 s. No ids, gradients or scripts,
// so an icon can repeat many times on one page. Usable standalone (HTML) or nested inside another <svg> (x, y).
import type { ArchetypeId } from './talent'

// Matte family of the 100x design system (dark theme): soft, low-chroma hues, readable on #0D0E11.
// Taken from dataviz.categorica and the reserve family; violet, sage, orchid and aqua extend it in the same chroma.
export const ARCHETYPE_COLOR: Record<ArchetypeId, string> = {
  builder: '#C69356',
  data: '#84C0E4',
  investigator: '#A493D0',
  governance: '#5BB19B',
  architect: '#94B27E',
  planner: '#8E9DD6',
  strategist: '#DD9AB9',
  catalyst: '#D67D5E',
  creative: '#C48BC2',
  connector: '#6DB6B9',
  learner: '#E3B25A',
}

const LOOP = 'dur="5s" repeatCount="indefinite"'
const EASE = '0.37 0 0.25 1'

const keys = (n: number, kt?: number[]): number[] => kt ?? Array.from({ length: n }, (_, i) => i / (n - 1))

const spline = (n: number): string => `calcMode="spline" keySplines="${Array(n - 1).fill(EASE).join(';')}"`

// <animate> on one attribute, smooth between values.
const an = (attr: string, values: string[], kt?: number[]): string =>
  `<animate attributeName="${attr}" values="${values.join(';')}" keyTimes="${keys(values.length, kt).join(';')}" ${spline(values.length)} ${LOOP}/>`

// <animateTransform> with smooth easing.
const at = (type: string, values: string[], kt?: number[]): string =>
  `<animateTransform attributeName="transform" type="${type}" values="${values.join(';')}" keyTimes="${keys(values.length, kt).join(';')}" ${spline(values.length)} ${LOOP}/>`

const BODY: Record<ArchetypeId, (c: string) => string> = {
  // Gear: 8 teeth turn one tooth-step (45 deg) and hold; the jump back is visually identical.
  builder: () =>
    `<g><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/><circle cx="12" cy="12" r="6.4"/><circle cx="12" cy="12" r="2.2"/>` +
    `<animateTransform attributeName="transform" type="rotate" values="0 12 12;45 12 12;45 12 12" keyTimes="0;0.7;1" calcMode="spline" keySplines="${EASE};0 0 1 1" ${LOOP}/></g>`,

  // Three bars rising and falling out of phase.
  data: () =>
    `<path d="M3 21.5h18" stroke-width="1.2" opacity=".6"/><g stroke-width="3">` +
    `<line x1="6" y1="19" x2="6" y2="11">${an('y2', ['11', '8', '13', '11'])}</line>` +
    `<line x1="12" y1="19" x2="12" y2="7">${an('y2', ['7', '11', '6', '7'])}</line>` +
    `<line x1="18" y1="19" x2="18" y2="15">${an('y2', ['15', '11', '13', '15'])}</line></g>`,

  // Magnifying glass sweeping along a small arc.
  investigator: () =>
    `<g><circle cx="10" cy="10" r="5.6"/><path d="M14.2 14.2L20 20"/><path d="M7.6 9.6a2.8 2.8 0 0 1 2.2-2.2" opacity=".7"/>` +
    `${at('translate', ['0 0', '1.5 .5', '.5 2', '-1 1', '0 0'])}</g>`,

  // Shield; the check draws in, then pulses.
  governance: () =>
    `<path d="M12 3l7.5 3v5.5c0 4.5-3.2 7.9-7.5 9.5-4.3-1.6-7.5-5-7.5-9.5V6z"/>` +
    `<path d="M8.5 12.2l2.5 2.5 4.5-5.2" stroke-dasharray="12" stroke-dashoffset="12">` +
    `<animate attributeName="stroke-dashoffset" values="12;0;0;0;0;12" keyTimes="0;0.2;0.5;0.7;0.9;1" ${spline(6)} ${LOOP}/>` +
    `${an('stroke-width', ['1.6', '1.6', '2.2', '1.6', '1.6'], [0, 0.3, 0.5, 0.7, 1])}</path>`,

  // 2x2 grid: three blocks in place, the fourth slides in and snaps.
  architect: () =>
    `<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/>` +
    `<rect x="13.5" y="13.5" width="7" height="7" rx="1.5">${at('translate', ['4 0', '0 0', '0 0', '4 0'], [0, 0.35, 0.8, 1])}${an('opacity', ['0', '1', '1', '0'], [0, 0.3, 0.8, 1])}</rect>`,

  // Clock whose minute hand ticks 5 times (72 deg each) per loop.
  planner: () =>
    `<circle cx="12" cy="12" r="8.6"/><path d="M12 3.6v1.3M12 19.1v1.3M3.6 12h1.3M19.1 12h1.3" opacity=".7"/><path d="M12 12h3.2"/>` +
    `<path d="M12 12V6.8"><animateTransform attributeName="transform" type="rotate" values="0 12 12;360 12 12" keyTimes="0;1" calcMode="linear" ${LOOP}/></path>`,

  // Compass: the needle swings, then settles to north.
  strategist: () =>
    `<circle cx="12" cy="12" r="9"/><path d="M12 2.8v1.2M12 20v1.2" opacity=".7"/>` +
    `<path d="M12 6.2l2.3 5.8-2.3 5.8-2.3-5.8z">${at('rotate', ['0 12 12', '0 12 12', '28 12 12', '-12 12 12', '5 12 12', '-2 12 12', '0 12 12'], [0, 0.1, 0.3, 0.5, 0.65, 0.8, 1])}</path>` +
    `<circle cx="12" cy="12" r=".6"/>`,

  // Lightning bolt that lifts and flashes.
  catalyst: () =>
    `<g><path d="M13 2.5L5.5 13.5H11l-1 8 8.5-11.5H13z"/>` +
    `${an('opacity', ['0.8', '1', '0.8'])}` +
    `${at('translate', ['0 0', '0 -.8', '0 0'])}</g>`,

  // One big four-point star and two small ones, twinkling.
  creative: () => {
    const star = 'M0-6.5L1.6-1.6 6.5 0 1.6 1.6 0 6.5-1.6 1.6-6.5 0-1.6-1.6z'
    return (
      `<g transform="translate(11 13)"><path d="${star}">${at('scale', ['1', '0.9', '1.05', '1'], [0, 0.4, 0.7, 1])}</path></g>` +
      `<g transform="translate(19 5) scale(.4)" stroke-width="4.5"><path d="${star}">${an('opacity', ['0.35', '0.9', '0.35', '0.35'], [0, 0.3, 0.6, 1])}</path></g>` +
      `<g transform="translate(19 19) scale(.3)" stroke-width="6"><path d="${star}">${an('opacity', ['0.35', '0.35', '0.9', '0.35'], [0, 0.4, 0.75, 1])}</path></g>`
    )
  },

  // Two nodes joined by a link; a pulse travels back and forth.
  connector: (c) =>
    `<circle cx="5" cy="12" r="2.6"/><circle cx="19" cy="12" r="2.6"/><path d="M7.8 12h8.4" opacity=".6"/>` +
    `<circle cx="8" cy="12" r="1.5" fill="${c}" stroke="none">${an('cx', ['8', '16', '8'])}${an('opacity', ['0.9', '0.6', '0.9'])}</circle>`,

  // Light bulb whose glass and rays glow.
  learner: (c) =>
    `<path d="M12 3.5a5.5 5.5 0 0 0-3.2 10c.7.6 1.2 1.4 1.2 2.5v1.5h4V16c0-1.1.5-1.9 1.2-2.5A5.5 5.5 0 0 0 12 3.5z" fill="${c}" fill-opacity=".05">` +
    `${an('fill-opacity', ['0.05', '0.25', '0.05'])}</path><path d="M10 20.5h4"/>` +
    `<path d="M3.6 6.2l1.3.8M20.4 6.2l-1.3.8M2.5 11.5H4M20 11.5h1.5" opacity=".25">${an('opacity', ['0.25', '0.75', '0.25'])}</path>`,
}

export const archetypeIcon = (id: ArchetypeId, size: number, x?: number, y?: number): string => {
  const c = ARCHETYPE_COLOR[id]
  const pos = x !== undefined && y !== undefined ? ` x="${Number(x)}" y="${Number(y)}"` : ''
  const s = Number(size)
  const plane =
    `<circle cx="12" cy="12" r="11" fill="${c}" fill-opacity=".09" stroke="none">` +
    `${an('r', ['10.4', '11.4', '10.4'])}${an('fill-opacity', ['0.07', '0.13', '0.07'])}</circle>`
  return (
    `<svg xmlns="http://www.w3.org/2000/svg"${pos} width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" ` +
    `stroke-width="1.6" stroke-opacity=".92" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${plane}${BODY[id](c)}</svg>`
  )
}
