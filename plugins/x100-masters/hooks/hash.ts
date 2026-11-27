// SHA-256 in plain TypeScript: the mod runs with no Node and no Web Crypto, and the email must be hashed on the
// person's machine before anything leaves it. The server computes the same digest for older mods.
const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
])

const utf8 = (text: string): number[] => {
  const out: number[] = []
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0
    if (code < 0x80) out.push(code)
    else if (code < 0x800) out.push(0xc0 | (code >> 6), 0x80 | (code & 63))
    else if (code < 0x10000) out.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63))
    else out.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 63), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63))
  }
  return out
}

export const sha256 = (text: string): string => {
  const bytes = utf8(text)
  const bits = bytes.length * 8
  bytes.push(0x80)
  while (bytes.length % 64 !== 56) bytes.push(0)
  for (let i = 7; i >= 0; i--) bytes.push(i >= 4 ? 0 : (bits >>> (i * 8)) & 255)
  const h = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19])
  const w = new Uint32Array(64)
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n))
  for (let at = 0; at < bytes.length; at += 64) {
    for (let i = 0; i < 16; i++) w[i] = ((bytes[at + i * 4] ?? 0) << 24) | ((bytes[at + i * 4 + 1] ?? 0) << 16) | ((bytes[at + i * 4 + 2] ?? 0) << 8) | (bytes[at + i * 4 + 3] ?? 0)
    for (let i = 16; i < 64; i++) {
      const a = w[i - 15] ?? 0
      const b = w[i - 2] ?? 0
      w[i] = ((w[i - 16] ?? 0) + (rotr(a, 7) ^ rotr(a, 18) ^ (a >>> 3)) + (w[i - 7] ?? 0) + (rotr(b, 17) ^ rotr(b, 19) ^ (b >>> 10))) >>> 0
    }
    let [a, b, c, d, e, f, g, k] = [h[0] ?? 0, h[1] ?? 0, h[2] ?? 0, h[3] ?? 0, h[4] ?? 0, h[5] ?? 0, h[6] ?? 0, h[7] ?? 0]
    for (let i = 0; i < 64; i++) {
      const t1 = (k + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + (K[i] ?? 0) + (w[i] ?? 0)) >>> 0
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0
      k = g
      g = f
      f = e
      e = (d + t1) >>> 0
      d = c
      c = b
      b = a
      a = (t1 + t2) >>> 0
    }
    const add = [a, b, c, d, e, f, g, k]
    for (let i = 0; i < 8; i++) h[i] = ((h[i] ?? 0) + (add[i] ?? 0)) >>> 0
  }
  return Array.from(h, n => n.toString(16).padStart(8, '0')).join('')
}

// The person's id in the database: never the email itself.
export const personaOf = (email: string) => sha256(`x100-masters:${email.trim().toLowerCase()}`)

// The name shown in the ranking, from the account's full name or, failing that, the email's local part.
// «Marta Ruiz Peña» → «Marta Ruiz»; «marta.ruiz@…» → «Marta Ruiz»; «marta.r@…» → «Marta R.».
// With no surname to deduce it is the first name alone. Pure; only letters, spaces and . ' - survive; 60 characters.
const clean = (word: string) => word.replace(/[^\p{L}.'-]/gu, '').replace(/^[.'-]+|[-']+$/g, '')
const fold = (word: string) => word.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const cap = (word: string) => word.charAt(0).toLocaleUpperCase('es-MX') + word.slice(1).toLocaleLowerCase('es-MX')
// A one-letter word is an initial: «M» → «M.».
const initial = (word: string) => (Array.from(word.replace(/\./g, '')).length === 1 ? `${word.replace(/\./g, '').toLocaleUpperCase('es-MX')}.` : word)

export const nameOf = (fullName: string, email: string): string => {
  const given = fullName.trim().split(/\s+/).map(clean).filter(word => /\p{L}/u.test(word))
  const local = (email.split('@')[0] ?? '').split('+')[0] ?? ''
  const fromEmail = local.split(/[._-]+/).map(clean).filter(word => /\p{L}/u.test(word)).map(cap)
  let words: string[]
  if (given.length >= 2) words = given.slice(0, 2)
  else if (given.length === 1 && fromEmail.length >= 2 && fold(given[0] ?? '') === fold(fromEmail[0] ?? '')) words = [given[0] ?? '', fromEmail[1] ?? '']
  else if (given.length === 1) words = given
  else words = fromEmail.slice(0, 2)
  const first = words[0] ?? ''
  const second = words[1]
  const out = second === undefined ? first : `${first} ${initial(second)}`

  return out.slice(0, 60).trim()
}
