import type { Register } from 'claude-code'

// The label every session of the organization carries. One constant: change it here, bump the version.
const LABEL = 'ISMO'

export const register: Register = on => {
  // SessionMode is the row of dim mode labels beside the prompt, drawn on the terminal and the desktop app.
  // The desktop's own title bar (the Chat/Code toggle) is not a render site, so this is the closest persistent spot.
  on('ui.render', { component: 'SessionMode' }, ($, e, next) => {
    if (e.props.modes.includes(LABEL)) {
      return next(e)
    }

    return next({ ...e, props: { ...e.props, modes: [LABEL, ...e.props.modes] } })
  })

  // The band right above the prompt input: drawn on the terminal and the desktop app. Yields to a survey.
  on('ui.render', { component: 'AbovePrompt' }, ($, e, next) => {
    if (e.props.hasSurvey) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box>
        <Text bold>{LABEL}</Text>
      </Box>
    )
  })
}
