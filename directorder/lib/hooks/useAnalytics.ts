'use client'
import { useEffect, useState } from 'react'

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
    async function fetchData() {
      try {
        const res = await fetch('/api/orders')
        if (!res.ok) return
        const orders = await res.json()
        
        // Ventas del día (simulamos que todo es hoy)
        const deliveredOrders = orders.filter((o: any) => o.status === 'delivered')
        const sales = deliveredOrders.reduce((s: number, o: any) => s + o.total, 0)
        const avg = deliveredOrders.length ? sales / deliveredOrders.length : 0

        // Hora pico
        const hourCounts: Record<number, number> = {}
        deliveredOrders.forEach((o: any) => {
          const h = new Date(o.created_at).getHours()
          hourCounts[h] = (hourCounts[h] || 0) + 1
        })
        let peakH = undefined;
        if (Object.keys(hourCounts).length > 0) {
           peakH = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]
        }

        // Mix
        const mix = { delivery: 0, pickup: 0, table: 0 }
        deliveredOrders.forEach((o: any) => {
          if (o.type in mix) mix[o.type as keyof typeof mix]++
        })

        // Top productos (simulado de todos los items de todos los pedidos)
        const productCounts: Record<string, number> = {}
        orders.forEach((o: any) => {
          o.order_items.forEach((i: any) => {
             productCounts[i.product_name] = (productCounts[i.product_name] || 0) + i.quantity
          })
        })
        const topItems = Object.entries(productCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }))

        setData({
          todaySales: sales,
          todayOrders: deliveredOrders.length,
          avgTicket: avg,
          peakHour: peakH ? `${peakH[0]}h` : '—',
          weekSales: [],
          orderMix: mix,
          topProducts: topItems
        })
      } catch (e) {
        console.error(e)
      }
    }

    fetchData()
  }, [restaurantId])

  return data
}
