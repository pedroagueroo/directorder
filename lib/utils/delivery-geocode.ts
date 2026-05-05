import type { Restaurant } from '@/lib/types/database'

/**
 * Resuelve el sufijo de geocodificación para delivery.
 * - `delivery_geocode_suffix` en DB tiene prioridad.
 * - Si el local indica Mar del Plata en la dirección visible o es la demo, se mantiene el comportamiento anterior.
 * - Si no hay sufijo: solo validación de formato en checkout (sin llamadas a mapas).
 */
export function resolveDeliveryGeocodeSuffix(restaurant: Restaurant): string | null {
  const explicit = restaurant.delivery_geocode_suffix?.trim()
  if (explicit) return explicit

  const addr = (restaurant.address ?? '').toLowerCase()
  if (addr.includes('mar del plata')) {
    return 'Mar del Plata, Buenos Aires, Argentina'
  }
  if (restaurant.slug === 'demo-burger') {
    return 'Mar del Plata, Buenos Aires, Argentina'
  }
  return null
}

export function deliveryGeocodeHint(restaurant: Restaurant): string {
  const suffix = resolveDeliveryGeocodeSuffix(restaurant)
  if (!suffix) {
    return 'Calle y número obligatorios. El local no usa verificación con mapa para esta zona.'
  }
  if (suffix.toLowerCase().includes('mar del plata')) {
    return 'Calle y número obligatorios. Comprobamos la ubicación con mapa abierto (zona configurada del local).'
  }
  return 'Calle y número obligatorios. Comprobamos la ubicación con mapa abierto en la zona configurada del local.'
}
