import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'
import type { FinalKeys } from '../types'

// Result-only thread. Two parts:
// - Format: each prompt typed by a person carries, unseen, the four-part reply format. Prompts from
//   `claude -p`, the SDK, schedules and other plugins are left alone, so scripted output never changes.
// - Display: the thread hides the steps (tools, their results, intermediate messages, task notices) and
//   keeps the person's prompts, a one-line work status and each turn's final reply. Display only:
//   the work and the transcript are untouched. `/solo-resultado` switches it off for the session.

const FORMAT = [
  'Formato de cada respuesta final. En el hilo, el usuario solo ve esa respuesta:',
  '- Si respondes sin usar herramientas, responde directo y corto, sin titulos.',
  '- Si usaste herramientas, usa estos titulos en este orden. Cada titulo va en negrita y seguido de una linea: **TITULO** ───────────────',
  '  **PASOS EJECUTADOS**: que hiciste, supuestos y herramientas. Maximo 2 lineas por paso. Muy corto.',
  '  **RESULTADOS**: lo logrado o encontrado, sin repetir datos. Maximo 2 lineas por punto. Muy corto.',
  '  **ALERTAS**: solo si hay riesgos, bloqueos o algo sin confirmar. Maximo 2 lineas por punto. Si no hay, omite el titulo.',
  '  **TUS PRÓXIMAS ACCIONES**: numeradas, lo mas importante primero. Bajo cada accion, bullets de recomendacion:',
  '    el primer bullet es la recomendacion (lo que deberia hacer). Si hay alternativas reales, agrega 2 bullets mas',
  '    (3 opciones en total); si la recomendacion es una sola, deja solo ese bullet.',
  '- No escribas mensajes intermedios largos: el usuario no los ve.',
].join('\n')

// A reply in the four-part format is a final one even before its turn ends.
const FINAL = /\*\*RESULTADOS\*\*/

// Only a person's own prompt gets the format: typed at the box, or through Remote Control.
const PERSON = new Set(['composer', 'bridge'])

const isOn = atom({ plugin: 'x100-solo-resultado', key: 'on' } as const, true)
const finals = atom({ plugin: 'x100-solo-resultado', key: 'finals' } as const, [] as FinalKeys)

// How a reply is recognised in the transcript: its text, whitespace folded, cut to a stable prefix.
const keyOf = (text: string) => text.replace(/\s+/g, ' ').trim().slice(0, 160)

// The final reply of each turn: the last assistant text before the person's next prompt.
const collectFinals = async ($: EngineInterface) => {
  const rows = await $.session.messages()
  const found: string[] = []
  let last = ''
  for (const row of rows) {
    const isPrompt = row.role === 'user' && (row.toolResults ?? []).length === 0 && row.text.trim() !== '' && !row.text.trimStart().startsWith('<')
    if (isPrompt) {
      if (last !== '') found.push(keyOf(last))
      last = ''
    } else if (row.role === 'assistant' && row.text.trim() !== '') {
      last = row.text
    }
  }
  if (last !== '') found.push(keyOf(last))

  return found
}

const hidden = ($: EngineInterface, e: Parameters<EngineInterface['ui']['resolve']>[0]) => {
  const { Box } = $.ui.resolve(e)

  return <Box display="none" />
}

export const register: Register = on => {
  // Tool calls of the running turn and the last tool used; module variables, so a reload starts them over.
  let turnTools = 0
  let lastTool = ''

  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'solo-resultado', description: 'Enciende o apaga el hilo solo resultado en esta sesión' })

    return next(e)
  })

  on('command.run', { command: 'solo-resultado' }, async $ => {
    const found = await collectFinals($).catch((): string[] => [])
    await update($, finals, () => found)
    await update($, isOn, value => !value)

    return {
      text: (await read($, isOn))
        ? 'Solo resultado: ACTIVADO. El hilo muestra tus mensajes, el estado y la respuesta final.'
        : 'Solo resultado: apagado en esta sesión. El hilo vuelve a mostrar cada paso.',
    }
  })

  on('prompt.submit', async ($, e, next) =>
    (await read($, isOn)) && PERSON.has(e.origin.kind) ? next({ ...e, context: [...(e.context ?? []), FORMAT] }) : next(e),
  )

  on('turn.start', ($, e, next) => {
    turnTools = 0

    return next(e)
  })

  on('tool.call', ($, e, next) => {
    const name = String(e.tool)
    turnTools += 1
    lastTool = name.startsWith('mcp__') ? name.split('__').slice(1).join(' · ') : name

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) {
      const found = await collectFinals($).catch((): string[] => [])
      const answer = keyOf(e.answer)
      await update($, finals, () => (answer !== '' && !found.includes(answer) ? [...found, answer] : found))
    }

    return next(e)
  })

  on('ui.render', { component: 'Spinner' }, async ($, e, next) =>
    (await read($, isOn)) ? next({ ...e, props: { ...e.props, message: turnTools === 0 ? 'Pensando' : `Paso ${turnTools} · usando ${lastTool}` } }) : next(e),
  )

  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => ((await read($, isOn)) ? hidden($, e) : next(e)))

  on('ui.render', { component: 'ToolResult' }, async ($, e, next) => ((await read($, isOn)) ? hidden($, e) : next(e)))

  on('ui.render', { component: 'ToolProgress' }, async ($, e, next) => ((await read($, isOn)) ? hidden($, e) : next(e)))

  // A step group the person opened stays open.
  on('ui.render', { component: 'ToolGroup' }, async ($, e, next) => ((await read($, isOn)) && !e.props.isExpanded ? hidden($, e) : next(e)))

  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    const isFinal = e.props.isSummary === true || FINAL.test(e.props.text) || (await read($, finals)).includes(keyOf(e.props.text))

    return (await read($, isOn)) && !isFinal ? hidden($, e) : next(e)
  })

  on('ui.render', { component: 'UserMessage' }, async ($, e, next) =>
    (await read($, isOn)) && e.props.origin.kind === 'task-notification' ? hidden($, e) : next(e),
  )
}
