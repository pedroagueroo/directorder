'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useDashboardAnalytics(restaurantId: string) {
  const [data, setData] = useState({
    todaySales: 0,
    todayOrders: 0,
    avgTicket: 0,
    peakHour: '',
    weekSales: [] as number[],
    topProducts: [] as Array<{ name: string; count: number }>,
    orderMix: { delivery: 0, pickup: 0, table: 0 }
  })

  useEffect(() => {
    if (!restaurantId) return;
    const supabase = createClient()

    async function fetchData() {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Ventas del día
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('total, type, created_at')
        .eq('restaurant_id', restaurantId)
        .eq('status', 'delivered')
        .gte('created_at', today.toISOString())

      if (todayOrders) {
        const sales = todayOrders.reduce((s, o) => s + o.total, 0)
        const avg = todayOrders.length ? sales / todayOrders.length : 0

        // Hora pico
        const hourCounts: Record<number, number> = {}
        todayOrders.forEach(o => {
          const h = new Date(o.created_at).getHours()
          hourCounts[h] = (hourCounts[h] || 0) + 1
        })
        let peakH = undefined;
        if (Object.keys(hourCounts).length > 0) {
           peakH = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]
        }

        // Mix
        const mix = { delivery: 0, pickup: 0, table: 0 }
        todayOrders.forEach(o => {
          if (o.type in mix) mix[o.type as keyof typeof mix]++
        })

        setData(prev => ({
          ...prev,
          todaySales: sales,
          todayOrders: todayOrders.length,
          avgTicket: avg,
          peakHour: peakH ? `${peakH[0]}h` : '—',
          orderMix: mix
        }))
      }

      // Top productos (últimos 30 días)
      const { data: topItems } = await supabase
        .from('products')
        .select('name, sold_count')
        .eq('restaurant_id', restaurantId)
        .order('sold_count', { ascending: false })
        .limit(5)

      if (topItems) {
        setData(prev => ({
          ...prev,
          topProducts: topItems.map(p => ({ name: p.name, count: p.sold_count }))
        }))
      }
    }

    fetchData()
  }, [restaurantId])

  return data
}
