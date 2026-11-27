import { expect, test } from 'claude-code/testing'

const BAND = {
  component: 'AbovePrompt',
  props: { hasSurvey: false, isCollapsed: false, isWorking: false, maxRows: 10, bodyColumns: 120, scroll: { offset: 0, bodyRows: 9 }, view: {} },
} as const

const RAN = { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false }

test('pressing the band writes the portal and opens it', async ($, on) => {
  const seen: string[] = []
  on('store.get', () => ({ value: undefined }))
  on('store.set', () => ({ value: undefined }))
  on('fs.read', () => ({ deny: 'no file' }))
  on('fs.write', (_$, e) => {
    seen.push(`write ${e.path}`)

    return { value: undefined }
  })
  on('process.run', (_$, e) => {
    seen.push(`run ${e.argv[0] ?? ''}`)

    return { value: RAN } as never
  })
  on('http.fetch', () => ({ deny: 'offline' }))
  const band = await $.ui.mount({ plugin: 'x100-masters', surface: 'desktop', ...BAND })
  await band.press({ key: 'masters-open' })
  expect(seen.some(s => s.startsWith('write'))).toBe(true)
  expect(seen.some(s => s.startsWith('run'))).toBe(true)
  await band.unmount()
})

test('a refused write falls back to the next folder and a refused open says where the page is', async ($, on) => {
  const seen: string[] = []
  const toasts: string[] = []
  on('store.get', () => ({ value: undefined }))
  on('store.set', () => ({ value: undefined }))
  on('fs.read', () => ({ deny: 'no file' }))
  on('fs.write', (_$, e) => {
    if (/[\\/]\.claude[\\/]tu-claude-score\.html$/.test(e.path)) return { deny: 'protected' }
    seen.push(e.path)

    return { value: undefined }
  })
  on('process.run', () => ({ deny: 'no process' }))
  on('ui.toast', (_$, e) => {
    toasts.push(String((e as { text?: string }).text ?? ''))

    return { value: undefined } as never
  })
  on('http.fetch', () => ({ deny: 'offline' }))
  const band = await $.ui.mount({ plugin: 'x100-masters', surface: 'desktop', ...BAND })
  await band.press({ key: 'masters-open' })
  expect(seen.length).toBe(1)
  expect(toasts.some(t => t.includes('ábrelo desde ahí'))).toBe(true)
  await band.unmount()
})
