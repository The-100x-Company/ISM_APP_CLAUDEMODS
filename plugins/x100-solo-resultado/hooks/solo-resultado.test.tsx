import { expect, test } from 'claude-code/testing'

const TOOL_ROW = {
  component: 'ToolUse',
  props: { tool_use_id: 'toolu_test', tool: 'Bash', input: { command: 'ls' }, isRunning: false, isErrored: false, isInterrupted: false },
} as const

test('the thread hides tool rows by default and shows them once switched off', async ($, on) => {
  // Stands for the engine's own row.
  on('ui.render', { component: 'ToolUse' }, ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>engine row</Text>
  })

  const hidden = await $.ui.mount({ plugin: 'x100-solo-resultado', surface: 'desktop', ...TOOL_ROW })
  expect(await hidden.find({ type: 'Text', text: /engine row/ })).toBeUndefined()
  await hidden.unmount()

  const ran = await $.command.run({ command: 'solo-resultado', args: '' } as Parameters<typeof $.command.run>[0])
  expect(ran.text ?? '').toMatch(/apagado/)

  const shown = await $.ui.mount({ plugin: 'x100-solo-resultado', surface: 'desktop', ...TOOL_ROW })
  expect(await shown.find({ type: 'Text', text: /engine row/ })).toBeDefined()
  await shown.unmount()
})

test('a final reply in the four-part format stays visible', async ($, on) => {
  on('ui.render', { component: 'AssistantMessage' }, ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>{e.props.text}</Text>
  })

  const final = await $.ui.mount({
    plugin: 'x100-solo-resultado',
    surface: 'desktop',
    component: 'AssistantMessage',
    props: { text: '**PASOS EJECUTADOS** ───\n- Leí el código.\n\n**RESULTADOS** ───\n- Listo.' },
  } as Parameters<typeof $.ui.mount>[0])
  expect(await final.find({ type: 'Text', text: /RESULTADOS/ })).toBeDefined()
  await final.unmount()

  const step = await $.ui.mount({
    plugin: 'x100-solo-resultado',
    surface: 'desktop',
    component: 'AssistantMessage',
    props: { text: 'Ahora reviso el archivo de configuración.' },
  } as Parameters<typeof $.ui.mount>[0])
  expect(await step.find({ type: 'Text', text: /reviso/ })).toBeUndefined()
  await step.unmount()
})
