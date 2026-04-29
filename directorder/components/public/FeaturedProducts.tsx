'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Product } from '@/lib/types/database'
import Image from 'next/image'
import ProductModal from './ProductModal'

const CARD_WIDTH = 272
const GAP = 16

export default function FeaturedProducts({ products }: { products: Product[] }) {
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

  if (!products || products.length === 0) return null

  return (
    <>
      <section className="py-10 max-w-5xl mx-auto px-4">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-2">
            Selección del local
          </p>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
            Destacados
          </h2>
        </div>

        <div className="relative">
          {canPrev && (
            <button
              type="button"
              aria-label="Ver anteriores"
              onClick={() => scrollByDir(-1)}
              className="absolute left-0 top-1/2 z-20 flex h-9 w-9 sm:h-10 sm:w-10 -translate-y-1/2 -translate-x-0.5 sm:-translate-x-2 items-center justify-center rounded-full border border-border bg-card/95 text-foreground shadow-md backdrop-blur-sm hover:bg-muted"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          )}
          {canNext && (
            <button
              type="button"
              aria-label="Ver siguientes"
              onClick={() => scrollByDir(1)}
              className="absolute right-0 top-1/2 z-20 flex h-9 w-9 sm:h-10 sm:w-10 -translate-y-1/2 translate-x-0.5 sm:translate-x-2 items-center justify-center rounded-full border border-border bg-card/95 text-foreground shadow-md backdrop-blur-sm hover:bg-muted"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          )}

          <div
            ref={scrollerRef}
            className="featured-carousel flex gap-4 overflow-x-auto overflow-y-hidden pb-3 pt-1 scroll-smooth snap-x snap-mandatory touch-pan-x [-webkit-overflow-scrolling:touch] px-0.5"
            style={{ scrollbarGutter: 'stable' }}
          >
            {products.map((product) => (
              <div
                key={product.id}
                role="button"
                tabIndex={0}
                className="flex-none w-[272px] snap-start bg-card border border-border rounded-2xl shadow-sm hover:shadow-md hover:border-border/80 transition-all duration-300 overflow-hidden flex flex-col group cursor-pointer shrink-0"
                onClick={() => setSelectedProduct(product)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelectedProduct(product)
                  }
                }}
              >
                <div className="relative h-36 w-full bg-muted overflow-hidden">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      sizes="272px"
                      className="object-cover group-hover:scale-[1.03] transition-transform duration-500 pointer-events-none"
                      draggable={false}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                      Sin imagen
                    </div>
                  )}
                  {product.compare_price && (
                    <div className="absolute top-2 left-2 bg-foreground/90 text-background text-xs font-semibold px-2 py-1 rounded-md">
                      Oferta
                    </div>
                  )}
                </div>

                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-semibold text-base mb-1 line-clamp-1">{product.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2 flex-grow leading-relaxed">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between mt-auto pt-1">
                    <div className="flex flex-col">
                      {product.compare_price && (
                        <span className="text-xs line-through text-muted-foreground">${product.compare_price}</span>
                      )}
                      <span className="font-semibold text-lg text-primary">${product.price}</span>
                    </div>
                    <span className="text-sm font-medium text-primary border border-primary/25 rounded-full px-3 py-1.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      Ver
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Podés deslizar la barra inferior, usar las flechas o el dedo en el celular.
          </p>
        </div>
      </section>

      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </>
  )
}
