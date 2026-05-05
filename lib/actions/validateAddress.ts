'use server'

/**
 * Geocodificación para delivery: zona definida por `geocodeSuffix`.
 * Si el sufijo menciona "Mar del Plata", se aplica bbox estricto; si no, bbox amplio de Argentina continental.
 */
const MDP_BBOX = {
  minLat: -38.28,
  maxLat: -37.82,
  minLon: -57.82,
  maxLon: -57.38,
}

const AR_BBOX = {
  minLat: -55.2,
  maxLat: -21.8,
  minLon: -73.6,
  maxLon: -53.6,
}

function inBbox(lat: number, lon: number, box: typeof AR_BBOX): boolean {
  return lat >= box.minLat && lat <= box.maxLat && lon >= box.minLon && lon <= box.maxLon
}

function regionFromSuffix(suffix: string): 'mdp' | 'ar' {
  return suffix.toLowerCase().includes('mar del plata') ? 'mdp' : 'ar'
}

function acceptPoint(lat: number, lon: number, region: 'mdp' | 'ar'): boolean {
  if (region === 'mdp') return inBbox(lat, lon, MDP_BBOX)
  return inBbox(lat, lon, AR_BBOX)
}

async function tryPhoton(query: string, region: 'mdp' | 'ar'): Promise<{ lat: number; lon: number } | null> {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=es`
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })
  if (!res.ok) return null
  const json = (await res.json()) as {
    features?: Array<{ geometry?: { coordinates?: [number, number] } }>
  }
  const features = json.features
  if (!Array.isArray(features)) return null
  for (const f of features) {
    const coords = f.geometry?.coordinates
    if (!coords || coords.length < 2) continue
    const [lon, lat] = coords
    if (typeof lat === 'number' && typeof lon === 'number' && !Number.isNaN(lat) && !Number.isNaN(lon)) {
      if (acceptPoint(lat, lon, region)) return { lat, lon }
    }
  }
  return null
}

async function tryNominatim(query: string, region: 'mdp' | 'ar'): Promise<{ lat: number; lon: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1&countrycodes=ar`
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'DirectOrder/1.0 (address-check; https://github.com/pedroagueroo/directorder)',
    },
    cache: 'no-store',
  })
  if (!res.ok) return null
  const data = (await res.json()) as Array<{ lat: string; lon: string }>
  if (!Array.isArray(data)) return null
  for (const row of data) {
    const lat = parseFloat(row.lat)
    const lon = parseFloat(row.lon)
    if (!Number.isNaN(lat) && !Number.isNaN(lon) && acceptPoint(lat, lon, region)) {
      return { lat, lon }
    }
  }
  return null
}

/**
 * @param geocodeSuffix - Si es null o vacío, no llama APIs externas (el caller ya validó formato).
 */
export async function validateDeliveryAddress(
  address: string,
  geocodeSuffix: string | null
): Promise<{ ok: true } | { ok: false; message: string }> {
  const trimmed = address.trim()
  if (!trimmed) {
    return { ok: false, message: 'Ingresá una dirección.' }
  }

  const suffix = (geocodeSuffix ?? '').trim()
  if (!suffix) {
    return { ok: true }
  }

  const query = `${trimmed}, ${suffix}`
  const region = regionFromSuffix(suffix)

  try {
    let point = await tryPhoton(query, region)
    if (!point) {
      point = await tryNominatim(query, region)
    }

    if (!point) {
      return {
        ok: false,
        message:
          region === 'mdp'
            ? 'No encontramos esa dirección en Mar del Plata. Revisá calle y número.'
            : 'No encontramos esa dirección en la zona configurada del local. Revisá calle y número.',
      }
    }

    return { ok: true }
  } catch {
    return {
      ok: false,
      message: 'No pudimos verificar la dirección. Intentá de nuevo en un momento.',
    }
  }
}

/** @deprecated Usar validateDeliveryAddress con sufijo configurable */
export async function validateMarDelPlataAddress(
  address: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  return validateDeliveryAddress(address, 'Mar del Plata, Buenos Aires, Argentina')
}
