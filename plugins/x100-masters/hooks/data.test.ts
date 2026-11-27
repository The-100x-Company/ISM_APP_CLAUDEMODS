import { expect, test } from 'claude-code/testing'
import { nameOf } from './hash'
import { isMemoryWrite } from './score'
import { ALL_METRICS } from './rubric'

test('the name takes the surname from the full name or the email', () => {
  expect(nameOf('Marta Ruiz Peña', 'x@y.com')).toBe('Marta Ruiz')
  expect(nameOf('', 'marta.ruiz@y.com')).toBe('Marta Ruiz')
  expect(nameOf('', 'marta.r@y.com')).toBe('Marta R.')
  expect(nameOf('Ana', 'ana.lopez@y.com')).toBe('Ana Lopez')
  expect(nameOf('', 'mruiz@y.com')).toBe('Mruiz')
  expect(nameOf('Ana <b>', 'a@y.com')).toBe('Ana B.')
})

test('memory writes are told by path', () => {
  expect(isMemoryWrite('Write', { file_path: String.raw`C:\Users\a\.claude\projects\p\memory\nota.md` })).toBe(true)
  expect(isMemoryWrite('Edit', { file_path: '/home/a/proj/CLAUDE.md' })).toBe(true)
  expect(isMemoryWrite('Edit', { file_path: 'MEMORY.md' })).toBe(true)
  expect(isMemoryWrite('Read', { file_path: 'MEMORY.md' })).toBe(false)
  expect(isMemoryWrite('Write', { file_path: '/a/memory/sub/nota.md' })).toBe(false)
  expect(isMemoryWrite('Write', { file_path: '/a/src/app.ts' })).toBe(false)
})

test('there are 41 metrics with one-word names', () => {
  expect(ALL_METRICS.length).toBe(41)
  expect(ALL_METRICS.filter(metric => /\s/.test(metric.name)).length).toBe(0)
})
