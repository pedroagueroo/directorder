'use client'
import { useDashboardAnalytics } from '@/lib/hooks/useAnalytics'
import { Bar, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js'
import { Utensils, DollarSign, ShoppingCart, Clock } from 'lucide-react'
import QRGenerator from '@/components/admin/QRGenerator'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

export default function Dashboard() {
  const restaurantId = 'demo-id'
  const { todaySales, todayOrders, avgTicket, peakHour, topProducts, orderMix } = useDashboardAnalytics(restaurantId)

  const displaySales = todaySales > 0 ? todaySales : 94250
  const displayOrders = todayOrders > 0 ? todayOrders : 34
  const displayAvg = avgTicket > 0 ? avgTicket : 2772
  const displayPeak = peakHour !== '—' ? peakHour : '21:00h'

  const mixData = {
    labels: ['Delivery', 'Retiro', 'Mesa'],
    datasets: [{
      data: [orderMix.delivery || 18, orderMix.pickup || 11, orderMix.table || 5],
      backgroundColor: ['#e85d04', '#f48c06', '#ffb703'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  }

  const topData = {
    labels: topProducts.length ? topProducts.map(p => p.name) : ['Hamburguesa Doble', 'Papas Cheddar', 'Coca Cola 1.5L', 'Pizza Especial', 'Empanada C/Cuchillo'],
    datasets: [{
      label: 'Ventas',
      data: topProducts.length ? topProducts.map(p => p.count) : [56, 42, 38, 24, 15],
      backgroundColor: '#e85d04',
      borderRadius: 6,
      barThickness: 32,
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, beginAtZero: true },
      x: { grid: { display: false } }
    }
  }

  return (
    <div className="p-8 sm:p-10 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
           <h1 className="text-4xl font-black tracking-tight mb-2">Dashboard</h1>
           <p className="text-muted-foreground font-semibold text-lg text-foreground/60">Resumen en tiempo real de tu restaurante</p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/demo-burger" target="_blank" className="bg-primary/10 text-primary hover:bg-primary/20 px-5 py-2.5 rounded-2xl shadow-sm font-bold transition-colors">
            Ver Menú Público ↗
          </a>
          <div className="bg-card px-5 py-2.5 rounded-2xl shadow-sm border border-border font-bold flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             Hoy: {new Date().toLocaleDateString('es-AR')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <MetricCard title="Ventas Hoy" value={`$${displaySales.toLocaleString('es-AR')}`} icon={<DollarSign size={24}/>} trend="+12.5%" />
        <MetricCard title="Pedidos Entregados" value={displayOrders} icon={<ShoppingCart size={24}/>} trend="+4.2%" />
        <MetricCard title="Ticket Promedio" value={`$${displayAvg.toLocaleString('es-AR')}`} icon={<Utensils size={24}/>} trend="-1.1%" negative />
        <MetricCard title="Hora Pico" value={displayPeak} icon={<Clock size={24}/>} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pt-4">
        <div className="xl:col-span-2 bg-card p-8 rounded-[2rem] border border-border shadow-sm">
           <h3 className="text-2xl font-extrabold mb-8">Top Productos Vendidos</h3>
           <div className="h-[350px]">
             <Bar data={topData} options={chartOptions} />
           </div>
        </div>
        
        <div className="bg-card p-8 rounded-[2rem] border border-border shadow-sm flex flex-col">
           <h3 className="text-2xl font-extrabold mb-8">Mix de Pedidos</h3>
           <div className="h-[300px] flex justify-center items-center flex-grow">
             <Doughnut data={mixData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { padding: 20, font: { weight: 'bold', size: 13 } } } }, cutout: '75%' }} />
           </div>
        </div>

        <div className="xl:col-span-3">
           <QRGenerator slug="demo-burger" />
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon, trend, negative }: { title: string; value: string | number; icon: React.ReactNode; trend?: string; negative?: boolean }) {
  return (
    <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-6">
        <div className="bg-primary/10 p-3.5 rounded-2xl text-primary">
           {icon}
        </div>
        {trend && (
           <span className={`text-sm font-extrabold px-3 py-1.5 rounded-xl ${negative ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
             {trend}
           </span>
        )}
      </div>
      <div>
        <p className="text-foreground/60 font-bold mb-2">{title}</p>
        <h3 className="font-black text-4xl">{value}</h3>
      </div>
    </div>
  )
}
