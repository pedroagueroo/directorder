'use client'
import type { Product } from '@/lib/types/database'
import { useCartStore } from '@/store/cart'
import Image from 'next/image'

export default function ProductList({ products, categories, restaurantId }: { products: Product[], categories: any[], restaurantId: string }) {
  const cart = useCartStore()

  if (!products || products.length === 0) return null

  const handleAdd = (product: Product) => {
    cart.addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1
    })
  }

  return (
    <section className="py-4 px-4 max-w-5xl mx-auto mb-24">
      {categories.map(cat => {
        const catProducts = products.filter(p => p.category_id === cat.id)
        if (catProducts.length === 0) return null
        
        return (
          <div key={cat.id} id={`cat-${cat.id}`} className="mb-10 scroll-mt-[100px]">
            <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-2 border-b border-border pb-2 sticky top-[70px] bg-background/95 backdrop-blur-xl z-10 pt-4">
              {cat.emoji && <span>{cat.emoji}</span>}
              {cat.name}
            </h2>
            
            <div className="flex flex-col gap-4">
              {catProducts.map(product => (
                <div 
                  key={product.id} 
                  className="flex bg-card hover:bg-muted/40 border border-border rounded-2xl p-3 sm:p-4 gap-4 transition-all hover:shadow-md cursor-pointer group"
                  onClick={() => handleAdd(product)}
                >
                  <div className="flex-grow flex flex-col justify-center">
                    <h3 className="font-bold text-lg">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-foreground/60 mt-1 line-clamp-2 pr-2">{product.description}</p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-bold text-lg text-primary">${product.price}</span>
                    </div>
                  </div>
                  
                  <div className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 relative rounded-xl overflow-hidden bg-muted border border-border">
                    {product.image_url ? (
                      <Image 
                        src={product.image_url} 
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 96px, 112px"
                        className="object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary/5 text-secondary/40">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
                      </div>
                    )}
                    <button className="absolute bottom-1 right-1 bg-white shadow-md text-primary p-2 rounded-lg hover:bg-primary hover:text-white transition-all scale-95 group-hover:scale-100 z-10">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </section>
  )
}
