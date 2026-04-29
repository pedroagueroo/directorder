'use client'
import { useEffect, useState } from 'react'
import { summarizeDailySales, DEFAULT_ANALYTICS_TIMEZONE } from '@/lib/utils/analytics'

const empty = {
  todaySales: 0,
  todayOrders: 0,
  avgTicket: 0,
  peakHour: '—',
  weekSales: [] as number[],
  topProducts: [] as Array<{ name: string; count: number }>,
  orderMix: { delivery: 0, pickup: 0, table: 0 },
}

export function useDashboardAnalytics(restaurantId: string) {
  const [data, setData] = useState(empty)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/orders', { credentials: 'include' })
        if (res.status === 401) {
          setData(empty)
          return
        }
        if (!res.ok) return
        const orders = await res.json()
        const summary = summarizeDailySales(orders, DEFAULT_ANALYTICS_TIMEZONE)

        setData({
          todaySales: summary.todaySales,
          todayOrders: summary.todayOrders,
          avgTicket: summary.avgTicket,
          peakHour: summary.peakHour,
          weekSales: [],
          orderMix: summary.orderMix,
          topProducts: summary.topProducts,
        })
      } catch (e) {
        console.error(e)
      }
    }

    fetchData()
  }, [restaurantId])

  return data
}
