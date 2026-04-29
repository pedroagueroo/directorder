/**
 * Valida que la dirección de delivery tenga nombre de calle (letras) y número (dígitos).
 * No reemplaza un catastro oficial; evita entradas obviamente incompletas.
 */
export function validateAddressFormat(raw: string): { ok: true } | { ok: false; message: string } {
  const s = raw.trim()
  if (s.length < 6) {
    return { ok: false, message: 'La dirección es demasiado corta. Incluí calle y número.' }
  }

  const hasDigit = /\d/.test(s)
  const hasLetter = /[a-záéíóúüñA-ZÁÉÍÓÚÜÑ]/.test(s)

  if (!hasLetter) {
    return { ok: false, message: 'Falta el nombre de la calle (no puede ser solo números).' }
  }
  if (!hasDigit) {
    return { ok: false, message: 'Falta el número de puerta (ej. San Martín 1234).' }
  }

  // Solo números y separadores, sin texto de calle sustancial
  const lettersStripped = s.replace(/[\d\s,.\-#/°º]/g, '')
  if (lettersStripped.length < 2) {
    return { ok: false, message: 'Escribí el nombre de la calle (no solo el número).' }
  }

  // Caso "solo números" con espacios: "1234" ya falla por lettersStripped; "12 34" igual
  const onlyNumbersAndSep = /^[\d\s,.\-#/]+$/.test(s)
  if (onlyNumbersAndSep) {
    return { ok: false, message: 'Tenés que indicar el nombre de la calle, no solo números.' }
  }

  return { ok: true }
}
