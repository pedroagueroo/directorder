export default function AdminLoyaltyPage() {
  return (
    <div className="p-8 sm:p-10 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-10">
        <div>
           <h1 className="text-4xl font-black tracking-tight mb-2">Fidelización</h1>
           <p className="text-muted-foreground font-semibold text-lg text-foreground/60">Campañas y descuentos para tus clientes</p>
        </div>
      </div>
      
      <div className="bg-card p-12 rounded-[2rem] border border-border shadow-sm flex flex-col items-center justify-center text-center">
         <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-6 text-4xl">🎁</div>
         <h2 className="text-2xl font-black mb-3">Sección en Construcción</h2>
         <p className="text-foreground/60 font-medium max-w-md">Próximamente podrás crear cupones de descuento y programas de puntos para premiar a tus mejores clientes.</p>
      </div>
    </div>
  )
}
