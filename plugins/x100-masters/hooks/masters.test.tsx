import { expect, test } from 'claude-code/testing'

const BAND = {
  component: 'AbovePrompt',
  props: { hasSurvey: false, isCollapsed: false, isWorking: false, maxRows: 10, bodyColumns: 120, scroll: { offset: 0, bodyRows: 9 }, view: {} },
} as const

test('the band keeps what others draw and adds one tiny button', async ($, on) => {
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>banda</Text>
  })

  const band = await $.ui.mount({ plugin: 'x100-masters', surface: 'desktop', ...BAND })
  expect(await band.find({ type: 'Text', text: /banda/ })).toBeDefined()
  expect(await band.find({ key: 'masters-open' })).toBeDefined()
  await band.unmount()
})

test('/masters builds the profile and opens the panel', async ($, on) => {
  // Stand for the host: an empty store, a verified group account and a placed pane.
  on('store.get', () => ({ value: undefined }))
  on('store.set', () => ({ value: undefined }))
  on('session.identity', () => ({ value: { kind: 'claude.ai', email: 'ana@ismomotors.com', organizationId: 'org', isVerified: true } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))

  const ran = await $.command.run({ command: 'masters', args: '' } as Parameters<typeof $.command.run>[0])
  expect(ran.text ?? '').toMatch(/Tu Nivel en Claude/)
})
