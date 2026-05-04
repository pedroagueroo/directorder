'use client'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex justify-center items-center text-rose-500 font-black text-3xl mx-auto mb-6">
          !
        </div>
        <h2 className="text-2xl font-black mb-3">Algo salió mal</h2>
        <p className="text-foreground/50 font-medium mb-6">{error.message || 'Ocurrió un error inesperado.'}</p>
        <button
          onClick={reset}
          className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all hover:-translate-y-0.5 active:scale-95"
        >
          Reintentar
        </button>
      </div>
    </div>
  )
}
