import { createClient } from '@/lib/supabase/client'

type EventName =
  | 'menu_view'
  | 'product_view'
  | 'cart_add'
  | 'cart_remove'
  | 'checkout_start'
  | 'order_placed'
  | 'search_query'

export async function trackEvent(
  restaurantId: string,
  event: EventName,
  properties: Record<string, unknown> = {}
) {
  const supabase = createClient()
  await supabase.from('analytics_events').insert({
    restaurant_id: restaurantId,
    event,
    properties: { ...properties, session_id: getSessionId() },
  })
}

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let sid = sessionStorage.getItem('do_session')
  if (!sid) {
    sid = crypto.randomUUID()
    sessionStorage.setItem('do_session', sid)
  }
  return sid
}
