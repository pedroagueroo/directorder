'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, UtensilsCrossed, ShoppingBag, Settings, LogOut, User, Store } from 'lucide-react'
import toast from 'react-hot-toast'
import { logout } from '@/lib/actions/auth'

const branchSwitcherClass =
  'flex items-center gap-3 w-full px-4 py-3 rounded-2xl font-bold text-foreground/75 hover:bg-muted hover:text-foreground transition-colors text-left'

export default function Sidebar({ hasMultipleBranches }: { hasMultipleBranches: boolean }) {
  const pathname = usePathname()

  const handleLogout = async () => {
    await logout()
    window.location.assign('/login')
  }

  return (
    <div className="flex flex-col w-[260px] bg-card border-r border-border h-full p-5 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
      <Link
        href="/"
        className="group flex items-center gap-3 mb-10 px-2 py-2 -mx-2 mt-2 rounded-2xl outline-none transition-colors hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        aria-label="Volver a la página principal"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex justify-center items-center text-white font-black text-xl shadow-lg shadow-primary/20 transition-transform group-hover:scale-[1.02]">
          D
        </div>
        <span className="font-extrabold text-2xl tracking-tight text-foreground">DirectOrder</span>
      </Link>
      
      <nav className="flex-1 space-y-2">
         <SidebarLink href="/admin/dashboard" icon={<LayoutDashboard size={20}/>} label="Centro de Control" active={pathname === '/admin/dashboard'} />
         <SidebarLink href="/admin/menu" icon={<UtensilsCrossed size={20}/>} label="Menú" active={pathname === '/admin/menu'} />
         <SidebarLink href="/staff" icon={<ShoppingBag size={20}/>} label="Cocina (KDS)" active={pathname === '/staff'} />
         <SidebarLink href="/admin/settings" icon={<Settings size={20}/>} label="Configuración" active={pathname === '/admin/settings'} />
      </nav>
      
      <div className="pt-4 border-t border-border mt-auto">
         <div className="space-y-2">
           <Link
             href="/admin/profile"
             className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl font-bold text-foreground/75 hover:bg-muted hover:text-foreground transition-colors"
           >
             <User size={19} /> Ver perfil
           </Link>
          {hasMultipleBranches ? (
            <Link href="/select-branch" className={branchSwitcherClass}>
              <Store size={19} /> Cambiar sucursal
            </Link>
          ) : (
            <button
              type="button"
              className={branchSwitcherClass}
              onClick={() =>
                toast.error('No podés cambiar de sucursal: no tenés otra sucursal cargada.', {
                  duration: 4000,
                })
              }
            >
              <Store size={19} /> Cambiar sucursal
            </button>
          )}
           <button
             onClick={handleLogout}
             className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl font-bold text-rose-500 hover:bg-rose-500/10 transition-colors"
           >
             <LogOut size={19} /> Cerrar sesión
           </button>
         </div>
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
