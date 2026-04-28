import * as db from '@/lib/db'

export default async function AdminMenuPage() {
  const restaurantId = 'demo-id'
  const categories = db.getCategories(restaurantId)
  const products = db.getProducts(restaurantId)

  return (
    <div className="p-8 sm:p-10 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-10">
        <div>
           <h1 className="text-4xl font-black tracking-tight mb-2">Gestión de Menú</h1>
           <p className="text-muted-foreground font-semibold text-lg text-foreground/60">Agrega o edita categorías y productos (JSON Local)</p>
        </div>
        <button className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-2xl shadow-sm hover:bg-primary/90 transition-all">
          + Nuevo Producto
        </button>
      </div>
      
      <div className="space-y-12">
        {categories.map((cat: any) => {
          const categoryProducts = products.filter((p: any) => p.category_id === cat.id)
          
          return (
            <div key={cat.id} className="bg-card p-8 rounded-[2rem] border border-border shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                <h2 className="text-2xl font-black flex items-center gap-3">
                  <span>{cat.emoji}</span> {cat.name}
                </h2>
                <button className="text-muted-foreground hover:text-foreground font-bold text-sm transition-colors">
                  Editar Categoría
                </button>
              </div>
              
              <div className="space-y-4">
                {categoryProducts.map((prod: any) => (
                  <div key={prod.id} className="flex justify-between items-center p-4 rounded-2xl border border-border hover:border-primary/30 transition-colors group">
                    <div className="flex items-center gap-4">
                      {prod.image_url ? (
                        <img src={prod.image_url} alt={prod.name} className="w-16 h-16 rounded-xl object-cover" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center text-2xl">🍔</div>
                      )}
                      <div>
                        <h4 className="font-bold text-lg">{prod.name}</h4>
                        <p className="font-semibold text-primary">${prod.price}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="px-4 py-2 bg-muted text-foreground font-bold rounded-xl hover:bg-foreground/10 transition-colors">
                        Editar
                      </button>
                      <button className="px-4 py-2 bg-rose-500/10 text-rose-500 font-bold rounded-xl hover:bg-rose-500/20 transition-colors">
                        Ocultar
                      </button>
                    </div>
                  </div>
                ))}
                
                {categoryProducts.length === 0 && (
                  <p className="text-muted-foreground italic p-4 text-center border border-dashed border-border rounded-2xl">
                    No hay productos en esta categoría.
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
