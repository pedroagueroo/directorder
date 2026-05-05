'use client'
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import type { Product } from '@/lib/types/database'
import Image from 'next/image'
import ProductModal from './ProductModal'

const CARD_WIDTH = 272
const GAP = 16

export default function FeaturedProducts({
  products,
  restaurantSlug,
}: {
  products: Product[]
  restaurantSlug: string
}) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setCanPrev(scrollLeft > 2)
    setCanNext(scrollLeft < scrollWidth - clientWidth - 2)
  }, [])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    updateArrows()
    el.addEventListener('scroll', updateArrows, { passive: true })
    const ro = new ResizeObserver(updateArrows)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', updateArrows)
      ro.disconnect()
    }
  }, [products, updateArrows])

  const scrollByDir = (dir: -1 | 1) => {
    const el = scrollerRef.current
    if (!el) return
    const delta = dir * (CARD_WIDTH + GAP)
    el.scrollBy({ left: delta, behavior: 'smooth' })
  }

  const openProduct = (product: Product) => setSelectedProduct(product)

  const cardKeyDown = (e: KeyboardEvent, product: Product) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openProduct(product)
    }
  }

  if (!products || products.length === 0) return null

  return (
    <>
      <section className="py-8 sm:py-10 max-w-5xl mx-auto px-4">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-2">
            Selección del local
          </p>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
            Destacados
          </h2>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            aria-label="Ver anteriores"
            disabled={!canPrev}
            onClick={() => scrollByDir(-1)}
            className="flex h-11 w-11 touch-manipulation sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm hover:bg-muted disabled:pointer-events-none disabled:opacity-40 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>

          <div
            ref={scrollerRef}
            className="featured-carousel min-w-0 flex-1 flex gap-4 overflow-x-auto overflow-y-hidden pb-3 pt-1 scroll-smooth snap-x snap-mandatory touch-pan-x [-webkit-overflow-scrolling:touch]"
          >
            {products.map((product) => (
              <div
                key={product.id}
                role="button"
                tabIndex={0}
                aria-label={`Abrir ${product.name}`}
                className="group flex w-[272px] shrink-0 snap-start cursor-pointer touch-manipulation flex-col overflow-hidden rounded-2xl border border-border bg-card text-left font-sans shadow-sm outline-none ring-offset-2 transition-all hover:border-border/80 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99]"
                onClick={() => openProduct(product)}
                onKeyDown={(e) => cardKeyDown(e, product)}
              >
                <div className="relative h-36 w-full shrink-0 overflow-hidden bg-muted">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      sizes="272px"
                      className="pointer-events-none object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      draggable={false}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                      Sin imagen
                    </div>
                  )}
                  {product.compare_price && (
                    <div className="absolute left-2 top-2 rounded-md bg-foreground/90 px-2 py-1 text-xs font-semibold text-background">
                      Oferta
                    </div>
                  )}
                </div>

                <div className="flex flex-grow flex-col p-4">
                  <h3 className="mb-1 line-clamp-1 text-base font-semibold">{product.name}</h3>
                  <p className="mb-3 line-clamp-2 flex-grow text-sm leading-relaxed text-muted-foreground">
                    {product.description}
                  </p>

                  <div className="mt-auto flex items-center justify-between pt-1">
                    <div className="flex flex-col">
                      {product.compare_price && (
                        <span className="text-xs line-through text-muted-foreground">${product.compare_price}</span>
                      )}
                      <span className="text-lg font-semibold text-primary">${product.price}</span>
                    </div>
                    <span className="rounded-full border border-primary/25 px-3 py-1.5 text-sm font-medium text-primary">
                      Ver
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            aria-label="Ver siguientes"
            disabled={!canNext}
            onClick={() => scrollByDir(1)}
            className="flex h-11 w-11 touch-manipulation sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm hover:bg-muted disabled:pointer-events-none disabled:opacity-40 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>

        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Deslizá el carrusel, usá las flechas o la barra de scroll debajo.
        </p>
      </section>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          restaurantSlug={restaurantSlug}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  )
}
