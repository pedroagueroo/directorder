import Sidebar from '@/components/admin/Sidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-muted/30 overflow-hidden font-sans">
       <Sidebar />
       <main className="flex-1 overflow-y-auto">
          {children}
       </main>
    </div>
  )
}
