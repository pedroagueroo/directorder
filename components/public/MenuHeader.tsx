'use client'

import { useState } from 'react'
import type { Restaurant } from '@/lib/types/database'
import Image from 'next/image'
import Link from 'next/link'

/** Preferida si no hay `banner_url` en el local */
const DEFAULT_BANNER =
  'https://images.unsplash.com/photo-1572802419224-296b224a5eec?auto=format&fit=crop&w=1920&q=88'

/** Respaldo si la URL configurada o la default devuelven error (404, etc.) */
const FALLBACK_BANNER =
  'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1920&q=80'

export default function MenuHeader({ restaurant }: { restaurant: Restaurant }) {
  const initial = restaurant.banner_url?.trim() || DEFAULT_BANNER
  const [bannerSrc, setBannerSrc] = useState(initial)

  return (
    <header className="relative z-0">
      <div className="absolute left-3 top-3 z-20 sm:left-4 sm:top-4">
        <Link
          href="/"
          className="inline-flex items-center rounded-full border border-white/25 bg-black/35 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md hover:bg-black/45 focus-visible:outline focus-visible:ring-2 focus-visible:ring-white/60"
        >
          ← Inicio
        </Link>
      </div>
      <div className="relative h-[216px] w-full overflow-hidden sm:h-[292px] md:h-[328px] lg:rounded-b-[2rem] shadow-[0_20px_50px_-28px_rgba(45,35,30,0.45)]">
        <Image
          src={bannerSrc}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_42%] scale-[1.02]"
          onError={() => setBannerSrc(FALLBACK_BANNER)}
        />
        {/* Contraste arriba para profundidad */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/5 to-transparent pointer-events-none sm:from-black/30"
          aria-hidden
        />
        {/* Fundido al color de página: sin “manchón” blanco duro */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-background from-10% via-background/55 to-transparent pointer-events-none"
          aria-hidden
        />
        <div
          className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-background via-background/40 to-transparent pointer-events-none"
          aria-hidden
        />
      </div>

      <div className="relative z-10 -mt-16 sm:-mt-24 px-5 sm:px-8 pb-10 sm:pb-14 max-w-2xl mx-auto flex flex-col items-center text-center">
        {restaurant.logo_url ? (
          <div className="mb-2 -mt-0.5 sm:-mt-1 relative">
            <Image
              src={restaurant.logo_url}
              alt={restaurant.name}
              width={96}
              height={96}
              className="w-[4.5rem] h-[4.5rem] sm:w-24 sm:h-24 rounded-2xl object-cover shadow-lg ring-1 ring-black/5 bg-card"
            />
          </div>
        ) : (
          <div
            className="mb-2 h-1 w-14 rounded-full bg-gradient-to-r from-primary/20 via-primary to-primary/20 shadow-sm"
            aria-hidden
          />
        )}

        <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.42em] text-muted-foreground mb-1 sm:mb-2">
          Menú online
        </p>

        <h1 className="font-display text-[clamp(2.125rem,5.5vw,3.5rem)] leading-[1.08] font-medium tracking-[-0.02em] text-foreground max-w-[16ch]">
          {restaurant.name}
        </h1>

        {restaurant.description ? (
          <p className="mt-5 text-muted-foreground text-sm sm:text-[15px] max-w-md leading-relaxed font-normal">
            {restaurant.description}
          </p>
        ) : null}

        <div className="mt-8 sm:mt-10">
          {restaurant.is_open ? (
            <span className="inline-flex items-center gap-2.5 rounded-full border border-emerald-800/10 bg-emerald-950/5 px-4 py-2.5 text-sm font-medium text-emerald-900 shadow-sm backdrop-blur-md dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-40" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
              </span>
              Abierto ahora
            </span>
          ) : (
            <span className="inline-flex items-center gap-2.5 rounded-full border border-border bg-muted/80 px-4 py-2.5 text-sm font-medium text-muted-foreground backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/50 shrink-0" aria-hidden />
              Cerrado en este momento
            </span>
          )}
        </div>
      </div>
    </header>
  )
}
