import { expect, test } from 'claude-code/testing'

for (const surface of ['terminal', 'desktop'] as const) {
  test(`ISMO leads the mode labels on ${surface}`, async ($, on) => {
    let seen: readonly string[] = []

    on('ui.render', { component: 'SessionMode' }, ($, e) => {
      seen = e.props.modes
      const { Text } = $.ui.resolve(e)

      return <Text>{seen.join(' & ')}</Text>
    })

    const ui = await $.ui.mount({ plugin: 'x100-org-badge', surface, component: 'SessionMode', props: { modes: ['focus'] } })
    expect(seen).toEqual(['ISMO', 'focus'])
    await ui.unmount()
  })

  test(`ISMO is not repeated on ${surface}`, async ($, on) => {
    let seen: readonly string[] = []

    on('ui.render', { component: 'SessionMode' }, ($, e) => {
      seen = e.props.modes
      const { Text } = $.ui.resolve(e)

      return <Text>{seen.join(' & ')}</Text>
    })

    const ui = await $.ui.mount({ plugin: 'x100-org-badge', surface, component: 'SessionMode', props: { modes: ['ISMO'] } })
    expect(seen).toEqual(['ISMO'])
    await ui.unmount()
  })

  test(`the band above the prompt reads ISMO on ${surface}`, async $ => {
    const ui = await $.ui.mount({
      plugin: 'x100-org-badge',
      surface,
      component: 'AbovePrompt',
      props: {
        hasSurvey: false,
        isWorking: false,
        maxRows: 10,
        bodyColumns: 80,
        scroll: { offset: 0, bodyRows: 9 },
        view: {},
      },
    })
    expect(await ui.find({ type: 'Text', text: /ISMO/ })).toBeDefined()
    await ui.unmount()
  })
}
