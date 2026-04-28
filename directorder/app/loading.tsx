export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex justify-center items-center text-white font-black text-2xl shadow-lg shadow-orange-500/30 animate-pulse">
          D
        </div>
        <p className="text-foreground/50 font-bold text-lg animate-pulse">Cargando...</p>
      </div>
    </div>
  )
}
