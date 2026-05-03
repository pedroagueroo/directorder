import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

const PREFIX = 'sc1:'

/** Hash para guardar en DB (registro / cambio de contraseña). */
export function hashPassword(plain: string): string {
  const salt = randomBytes(16)
  const hash = scryptSync(plain, salt, 64)
  return `${PREFIX}${salt.toString('hex')}:${hash.toString('hex')}`
}

/** Verifica contraseña: soporta legado en texto plano (migración gradual). */
export function verifyPassword(plain: string, stored: string): boolean {
  if (!plain || !stored) return false
  if (!stored.startsWith(PREFIX)) {
    return plain === stored
  }
  const rest = stored.slice(PREFIX.length)
  const colon = rest.indexOf(':')
  if (colon === -1) return false
  const saltHex = rest.slice(0, colon)
  const hashHex = rest.slice(colon + 1)
  try {
    const salt = Buffer.from(saltHex, 'hex')
    const expected = Buffer.from(hashHex, 'hex')
    const actual = scryptSync(plain, salt, 64)
    if (actual.length !== expected.length) return false
    return timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}

export function isPasswordHashed(stored: string): boolean {
  return stored.startsWith(PREFIX)
}
