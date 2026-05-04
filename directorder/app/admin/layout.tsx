import { cookies } from 'next/headers'
import Sidebar from '@/components/admin/Sidebar'
import * as db from '@/lib/db'
import { redirect } from 'next/navigation'

function hexToHslChannels(hex: string, fallback: string) {
  const normalized = String(hex || '').trim().replace('#', '')
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return fallback

  const r = parseInt(full.slice(0, 2), 16) / 255
  const g = parseInt(full.slice(2, 4), 16) / 255
  const b = parseInt(full.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  let h = 0
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6
    else if (max === g) h = (b - r) / delta + 2
    else h = (r - g) / delta + 4
  }
  h = Math.round(h * 60)
  if (h < 0) h += 360

  const l = (max + min) / 2
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))

  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const restaurantId = cookies().get('auth-restaurant-id')?.value
  const userId = cookies().get('auth-user-id')?.value
  const user = userId ? db.getUserById(userId) : null
  const restaurant =
    restaurantId && user && user.restaurant_id === restaurantId
      ? db.getRestaurantById(restaurantId)
      : null

  if (!restaurant || !user) {
    redirect('/login')
  }
  const primary = hexToHslChannels(restaurant?.primary_color ?? '', '14 46% 40%')
  const secondary = hexToHslChannels(restaurant?.secondary_color ?? '', '32 30% 46%')
  const adminThemeVars = {
    '--primary': primary,
    '--secondary': secondary,
    '--ring': primary,
  } as Record<string, string>

  return (
    <div
      className="flex h-screen bg-muted/30 overflow-hidden font-sans"
      style={adminThemeVars}
    >
       <Sidebar />
       <main className="flex-1 overflow-y-auto">
          {children}
       </main>
    </div>
  )
}
