import type { Product } from '@/lib/types/database'
import Image from 'next/image'

export default function FeaturedProducts({ products }: { products: Product[] }) {
  if (!products || products.length === 0) return null

  return (
    <section className="py-8 px-4 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
        <span>🌟</span> DESTACADOS
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-6 snap-x hide-scrollbar">
        {products.map((product) => (
          <div 
            key={product.id} 
            className="flex-none w-[280px] snap-center bg-card border border-border rounded-2xl shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col group cursor-pointer"
          >
            <div className="relative h-40 w-full bg-muted overflow-hidden">
              {product.image_url ? (
                <Image 
                  src={product.image_url} 
                  alt={product.name}
                  fill
                  sizes="280px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-secondary/10 text-secondary">
                  No Image
                </div>
              )}
              {product.compare_price && (
                <div className="absolute top-2 left-2 bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                  OFERTA
                </div>
              )}
            </div>
            
            <div className="p-4 flex flex-col flex-grow">
              <h3 className="font-bold text-lg mb-1 line-clamp-1">{product.name}</h3>
              <p className="text-sm text-foreground/70 mb-3 line-clamp-2 flex-grow">{product.description}</p>
              
              <div className="flex items-center justify-between mt-auto">
                <div className="flex flex-col">
                  {product.compare_price && (
                    <span className="text-xs line-through text-foreground/50">${product.compare_price}</span>
                  )}
                  <span className="font-bold text-lg text-primary">${product.price}</span>
                </div>
                <button className="bg-primary/10 hover:bg-primary/20 text-primary p-2 rounded-full transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
