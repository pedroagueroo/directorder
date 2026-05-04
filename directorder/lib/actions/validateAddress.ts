'use server'

/**
 * Valida dirección en Mar del Plata vía Photon (Komoot), API abierta y usable desde servidor.
 * Respaldo: Nominatim si Photon no devuelve resultados (puede fallar por IP en algunos hosts).
 */
const MDP_BBOX = {
  minLat: -38.28,
  maxLat: -37.82,
  minLon: -57.82,
  maxLon: -57.38
}

function inMarDelPlata(lat: number, lon: number): boolean {
  return lat >= MDP_BBOX.minLat && lat <= MDP_BBOX.maxLat && lon >= MDP_BBOX.minLon && lon <= MDP_BBOX.maxLon
}

async function tryPhoton(query: string): Promise<{ lat: number; lon: number } | null> {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=3&lang=es`
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    cache: 'no-store'
  })
  if (!res.ok) return null
  const json = (await res.json()) as {
    features?: Array<{ geometry?: { type?: string; coordinates?: [number, number] } }>
  }
  const features = json.features
  if (!Array.isArray(features)) return null
  for (const f of features) {
    const coords = f.geometry?.coordinates
    if (!coords || coords.length < 2) continue
    const [lon, lat] = coords
    if (typeof lat === 'number' && typeof lon === 'number' && !Number.isNaN(lat) && !Number.isNaN(lon)) {
      if (inMarDelPlata(lat, lon)) return { lat, lon }
    }
  }
  return null
}

async function tryNominatim(query: string): Promise<{ lat: number; lon: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=3&addressdetails=1`
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'DirectOrder/1.0 (address-check; valen-gastronomia-local)'
    },
    cache: 'no-store'
  })
  if (!res.ok) return null
  const data = (await res.json()) as Array<{ lat: string; lon: string }>
  if (!Array.isArray(data)) return null
  for (const row of data) {
    const lat = parseFloat(row.lat)
    const lon = parseFloat(row.lon)
    if (!Number.isNaN(lat) && !Number.isNaN(lon) && inMarDelPlata(lat, lon)) {
      return { lat, lon }
    }
  }
  return null
}

export async function validateMarDelPlataAddress(
  address: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const trimmed = address.trim()
  if (!trimmed) {
    return { ok: false, message: 'Ingresá una dirección.' }
  }

  const query = `${trimmed}, Mar del Plata, Buenos Aires, Argentina`

  try {
    let point = await tryPhoton(query)
    if (!point) {
      point = await tryNominatim(query)
    }

    if (!point) {
      return {
        ok: false,
        message: 'No encontramos esa dirección en Mar del Plata. Revisá calle y número.'
      }
    }

    return { ok: true }
  } catch {
    return {
      ok: false,
      message: 'No pudimos verificar la dirección. Intentá de nuevo en un momento.'
    }
  }
}
