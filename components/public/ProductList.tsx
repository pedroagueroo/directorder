'use client'
import { useState, type KeyboardEvent } from 'react'
import type { Product } from '@/lib/types/database'
import Image from 'next/image'
import ProductModal from './ProductModal'

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0
  }).format(amount)
}

export default function ProductList({
  products,
  categories
}: {
  products: Product[]
  categories: any[]
  restaurantId?: string
}) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  if (!products || products.length === 0) return null

  return (
    <>
      <section className="py-2 px-4 max-w-5xl mx-auto mb-24">
        {categories.map((cat) => {
          const catProducts = products.filter((p) => p.category_id === cat.id)
          if (catProducts.length === 0) return null

          return (
            <div key={cat.id} id={`cat-${cat.id}`} className="mb-12 scroll-mt-28 sm:scroll-mt-24 md:scroll-mt-[5.5rem]">
              <h2 className="text-lg sm:text-xl font-semibold mb-5 flex items-center gap-2 border-b border-border/90 pb-3 pt-1">
                {cat.emoji && <span className="text-base opacity-90">{cat.emoji}</span>}
                {cat.name}
              </h2>

              <div className="flex flex-col gap-3">
                {catProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex bg-card active:bg-muted/40 hover:bg-muted/30 border border-border rounded-2xl p-3 sm:p-4 gap-3 sm:gap-4 transition-shadow hover:shadow-md group"
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label={`${product.name}, ${formatPrice(product.price)}`}
                      className="min-w-0 flex-grow flex cursor-pointer touch-manipulation flex-col justify-center rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => setSelectedProduct(product)}
                      onKeyDown={(e: KeyboardEvent) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setSelectedProduct(product)
                        }
                      }}
                    >
                      <h3 className="font-semibold text-base sm:text-lg">{product.name}</h3>
                      {product.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2 pr-2 leading-relaxed">
                          {product.description}
                        </p>
                      )}
                      <div className="mt-3">
                        <span className="font-semibold text-base text-primary">{formatPrice(product.price)}</span>
                      </div>
                    </div>

                    <div className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 relative rounded-xl overflow-hidden bg-muted border border-border/80">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 96px, 112px"
                          className="object-cover group-hover:scale-[1.04] transition-transform duration-500 pointer-events-none"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground pointer-events-none">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="28"
                            height="28"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8v8" />
                            <path d="M8 12h8" />
                          </svg>
                        </div>
                      )}
                      <button
                        type="button"
                        aria-label={`Elegir ${product.name}`}
                        className="absolute bottom-1 right-1 z-10 flex h-11 w-11 touch-manipulation items-center justify-center rounded-xl border border-border bg-card text-primary shadow-md transition-all hover:bg-primary hover:text-primary-foreground active:scale-95 group-hover:scale-100 sm:h-10 sm:w-10"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setSelectedProduct(product)
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14" />
                          <path d="M12 5v14" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </section>

      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </>
  )
}
