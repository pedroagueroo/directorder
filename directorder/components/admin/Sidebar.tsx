'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, UtensilsCrossed, ShoppingBag, Users, Settings, LogOut, Award } from 'lucide-react'
import { logout } from '@/lib/actions/auth'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <div className="flex flex-col w-[260px] bg-card border-r border-border h-full p-5 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
      <div className="flex items-center gap-3 mb-10 px-2 mt-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex justify-center items-center text-white font-black text-xl shadow-lg shadow-primary/20">
          D
        </div>
        <span className="font-extrabold text-2xl tracking-tight">DirectOrder</span>
      </div>
      
      <nav className="flex-1 space-y-2">
         <SidebarLink href="/admin/dashboard" icon={<LayoutDashboard size={20}/>} label="Dashboard" active={pathname === '/admin/dashboard'} />
         <SidebarLink href="/admin/menu" icon={<UtensilsCrossed size={20}/>} label="Menú" active={pathname === '/admin/menu'} />
         <SidebarLink href="/staff" icon={<ShoppingBag size={20}/>} label="Cocina (KDS)" active={pathname === '/staff'} />
         <SidebarLink href="/admin/customers" icon={<Users size={20}/>} label="Clientes" active={pathname === '/admin/customers'} />
         <SidebarLink href="/admin/loyalty" icon={<Award size={20}/>} label="Fidelización" active={pathname === '/admin/loyalty'} />
         <SidebarLink href="/admin/settings" icon={<Settings size={20}/>} label="Configuración" active={pathname === '/admin/settings'} />
      </nav>
      
      <div className="pt-4 border-t border-border mt-auto">
         <button 
           onClick={handleLogout}
           className="flex items-center gap-3 w-full px-4 py-3 text-rose-500 hover:bg-rose-500/10 rounded-2xl font-bold transition-all hover:scale-[1.02]"
         >
            <LogOut size={20} /> Cerrar Sesión
         </button>
      </div>
    </div>
  )
}

function SidebarLink({ href, icon, label, active = false }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <Link href={href} className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all ${
      active 
      ? 'bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(232,93,4,0.3)] hover:-translate-y-0.5' 
      : 'text-foreground/70 hover:bg-muted hover:text-foreground'
    }`}>
      {icon} {label}
    </Link>
  )
}
