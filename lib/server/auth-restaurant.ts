import { cookies } from 'next/headers'

/** Sucursal activa de la sesión. */
export function getAuthActiveBranchId(): string | null {
  return (
    cookies().get('auth-active-branch-id')?.value ??
    cookies().get('auth-restaurant-id')?.value ??
    null
  )
}

/** Alias legacy: en el código existente restaurant === branch activa. */
export function getAuthRestaurantId(): string | null {
  return getAuthActiveBranchId()
}
