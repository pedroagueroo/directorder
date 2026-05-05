import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 px-6 py-16 text-center bg-background text-foreground">
      <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">404</p>
      <h1 className="text-2xl sm:text-3xl font-black tracking-tight max-w-md">No encontramos esa página</h1>
      <p className="text-muted-foreground font-medium max-w-sm">
        Puede que el enlace esté desactualizado o que hayas escrito mal la dirección.
      </p>
      <div className="flex flex-wrap gap-3 justify-center pt-2">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-sm hover:opacity-95"
        >
          Ir al inicio
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-2xl border border-border bg-card px-5 py-3 text-sm font-bold hover:bg-muted"
        >
          Iniciar sesión
        </Link>
      </div>
    </div>
  )
}
