import { cookies } from 'next/headers'

/** ID del restaurante de la sesión (cookie httpOnly tras login). */
export function getAuthRestaurantId(): string | null {
  return cookies().get('auth-restaurant-id')?.value ?? null
}
