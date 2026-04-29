'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  createProductAction,
  deleteProductAction,
  toggleCategoryVisibilityAction,
  toggleProductAvailabilityAction,
  updateProductAction,
} from '@/lib/actions/menu'

type Category = { id: string; name: string; emoji?: string | null; is_active: boolean }
type Product = {
  id: string
  category_id: string | null
  name: string
  description?: string | null
  price: number
  image_url?: string | null
  ingredients?: string[]
  is_available: boolean
}

export default function MenuManager({
  categories,
  products,
}: {
  categories: Category[]
  products: Product[]
}) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category_id: categories.find((c) => c.is_active)?.id ?? '',
  })
  const [newIngredient, setNewIngredient] = useState('')
  const [newIngredients, setNewIngredients] = useState<string[]>([])
  const [newImageFile, setNewImageFile] = useState<File | null>(null)
  const [newImagePreviewUrl, setNewImagePreviewUrl] = useState<string | null>(null)
  const [newImageError, setNewImageError] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(0)
  const newImageInputRef = useRef<HTMLInputElement | null>(null)
  const [showNewProductForm, setShowNewProductForm] = useState(false)
  const [activeCategoryEditId, setActiveCategoryEditId] = useState<string | null>(null)
  const [editIngredientInput, setEditIngredientInput] = useState<Record<string, string>>({})
  const [pendingDeleteProduct, setPendingDeleteProduct] = useState<{ id: string; name: string } | null>(
    null
  )
  const activeCategories = useMemo(
    () => categories.filter((category) => category.is_active),
    [categories]
  )

  useEffect(() => {
    if (!newImageFile) {
      setNewImagePreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(newImageFile)
    setNewImagePreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [newImageFile])
  const [drafts, setDrafts] = useState<Record<string, any>>(() =>
    Object.fromEntries(
      products.map((p) => [
        p.id,
        {
          name: p.name,
          description: p.description ?? '',
          price: String(p.price),
          image_url: p.image_url ?? '',
          category_id: p.category_id ?? categories[0]?.id ?? '',
          ingredients: Array.isArray(p.ingredients) ? p.ingredients : [],
        },
      ])
    )
  )

  const byCategory = useMemo(() => {
    const map = new Map<string, Product[]>()
    for (const c of categories) map.set(c.id, [])
    for (const p of products) {
      if (!p.category_id) continue
      if (!map.has(p.category_id)) map.set(p.category_id, [])
      map.get(p.category_id)!.push(p)
    }
    return map
  }, [categories, products])

  const runAction = (fn: () => Promise<any>) => {
    setError(null)
    startTransition(async () => {
      const res = await fn()
      if (res?.error) {
        setError(res.error)
        return
      }
      if (res?.ok) router.refresh()
    })
  }

  const toggleCategoryEdit = (catId: string) => {
    setActiveCategoryEditId((prev) => (prev === catId ? null : catId))
  }

  return (
    <div className="p-4 sm:p-8 sm:py-10 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center mb-6 sm:mb-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">Gestión de Menú</h1>
          <p className="text-muted-foreground font-semibold text-base sm:text-lg text-foreground/60">
            Agregá, editá y ocultá productos del menú.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNewProductForm((v) => !v)}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl border border-border bg-card font-semibold hover:bg-muted"
        >
          {showNewProductForm ? 'Cerrar formulario' : '+ Nuevo producto'}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {showNewProductForm && (
        <section className="bg-card p-4 sm:p-6 rounded-3xl border border-border shadow-sm">
          <h2 className="text-lg sm:text-xl font-black mb-4">+ Nuevo Producto</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className="rounded-xl border border-border bg-background px-3 py-2.5"
            placeholder="Nombre"
            value={newProduct.name}
            onChange={(e) => setNewProduct((s) => ({ ...s, name: e.target.value }))}
          />
          <input
            className="rounded-xl border border-border bg-background px-3 py-2.5"
            placeholder="Precio"
            inputMode="numeric"
            value={newProduct.price}
            onChange={(e) => setNewProduct((s) => ({ ...s, price: e.target.value }))}
          />
          <select
            className="rounded-xl border border-border bg-background px-3 py-2.5"
            value={newProduct.category_id}
            onChange={(e) => setNewProduct((s) => ({ ...s, category_id: e.target.value }))}
          >
            {activeCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
          <div
            className={`rounded-xl border bg-background px-3 py-2.5 text-sm ${
              newImageError ? 'border-red-400' : 'border-border'
            }`}
          >
            <span className="block mb-2 font-medium text-foreground">Imagen del producto</span>
            <input
              key={fileInputKey}
              ref={newImageInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null
                setNewImageFile(file)
                if (file) setNewImageError(false)
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => newImageInputRef.current?.click()}
              className="inline-flex items-center rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 font-semibold text-primary shadow-sm hover:bg-primary/15"
            >
              Elegir imagen
            </button>
            {newImageFile && (
              <div className="mt-2 flex items-center gap-2">
                <p className="min-w-0 flex-1 truncate text-xs text-foreground/80">Archivo: {newImageFile.name}</p>
                <button
                  type="button"
                  onClick={() => {
                    setNewImageFile(null)
                    setNewImageError(false)
                    if (newImageInputRef.current) newImageInputRef.current.value = ''
                    setFileInputKey((k) => k + 1)
                  }}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border bg-muted text-sm font-bold text-foreground/80 hover:bg-foreground/10"
                  aria-label="Quitar imagen seleccionada"
                  title="Quitar imagen"
                >
                  ×
                </button>
              </div>
            )}
            {newImagePreviewUrl && (
              <div className="mt-2">
                <p className="mb-1 text-xs text-foreground/70">Vista previa:</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={newImagePreviewUrl}
                  alt="Vista previa de imagen"
                  className="h-20 w-20 rounded-lg border border-border object-cover"
                />
              </div>
            )}
            {newImageError && (
              <p className="mt-2 text-xs font-semibold text-red-600">
                Tenés que cargar una imagen para guardar el producto.
              </p>
            )}
          </div>
          <textarea
            className="rounded-xl border border-border bg-background px-3 py-2.5 md:col-span-2"
            placeholder="Descripción"
            rows={2}
            value={newProduct.description}
            onChange={(e) => setNewProduct((s) => ({ ...s, description: e.target.value }))}
          />
          <div className="md:col-span-2 rounded-xl border border-border bg-background p-3">
            <p className="text-sm font-semibold mb-2">Ingredientes (uno por uno)</p>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl border border-border bg-card px-3 py-2.5"
                placeholder="Ej: Lechuga"
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const value = newIngredient.trim()
                    if (!value) return
                    setNewIngredients((prev) =>
                      prev.includes(value) ? prev : [...prev, value]
                    )
                    setNewIngredient('')
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const value = newIngredient.trim()
                  if (!value) return
                  setNewIngredients((prev) => (prev.includes(value) ? prev : [...prev, value]))
                  setNewIngredient('')
                }}
                className="px-4 py-2 bg-muted rounded-xl font-semibold hover:bg-foreground/10"
              >
                Agregar
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {newIngredients.map((ing) => (
                <span
                  key={ing}
                  className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-sm font-semibold"
                >
                  {ing}
                  <button
                    type="button"
                    onClick={() =>
                      setNewIngredients((prev) => prev.filter((x) => x !== ing))
                    }
                    className="text-primary/70 hover:text-primary"
                    aria-label={`Quitar ${ing}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
        <button
          disabled={isPending || activeCategories.length === 0}
          onClick={() =>
            runAction(async () => {
              if (!newImageFile) {
                setNewImageError(true)
                return { error: 'Falta la imagen del producto' }
              }
              const formData = new FormData()
              formData.set('name', newProduct.name)
              formData.set('description', newProduct.description)
              formData.set('price', String(Number(newProduct.price || '0')))
              formData.set('category_id', newProduct.category_id)
              formData.set('ingredients', JSON.stringify(newIngredients))
              if (newImageFile) formData.set('image', newImageFile)
              const res = await createProductAction(formData)
              if (res?.ok) {
                setNewProduct({
                  name: '',
                  description: '',
                  price: '',
                  category_id: activeCategories[0]?.id ?? '',
                })
                setNewIngredients([])
                setNewIngredient('')
                setNewImageFile(null)
                setNewImageError(false)
                setFileInputKey((k) => k + 1)
                setShowNewProductForm(false)
              }
              return res
            })
          }
          className="mt-4 bg-primary text-primary-foreground font-bold px-5 py-2.5 rounded-xl shadow-sm hover:bg-primary/90 disabled:opacity-50"
        >
          Guardar producto
        </button>
        </section>
      )}

      <div className="space-y-8 sm:space-y-12">
        {categories.map((cat) => {
          const categoryProducts = byCategory.get(cat.id) ?? []

          return (
            <div
              key={cat.id}
              className={`p-4 sm:p-8 rounded-[2rem] border shadow-sm ${
                cat.is_active
                  ? 'bg-card border-border'
                  : 'bg-amber-50/50 border-amber-300 border-dashed'
              }`}
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl sm:text-2xl font-black flex items-center gap-3">
                    <span>{cat.emoji}</span> {cat.name}
                  </h2>
                  {!cat.is_active && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      Oculta en menú
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {activeCategoryEditId === cat.id && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        runAction(() => toggleCategoryVisibilityAction(cat.id, !cat.is_active))
                      }
                      className="px-3 py-1.5 rounded-lg bg-muted text-foreground font-semibold text-xs sm:text-sm hover:bg-foreground/10 disabled:opacity-50"
                    >
                      {cat.is_active ? 'Ocultar categoría' : 'Mostrar categoría'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleCategoryEdit(cat.id)}
                    className="text-muted-foreground hover:text-foreground font-bold text-sm transition-colors"
                  >
                    {activeCategoryEditId === cat.id ? 'Cerrar edición' : 'Editar categoría'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {categoryProducts.map((prod) => {
                  const isEditing = editingId === prod.id
                  const draft = drafts[prod.id]
                  return (
                    <div
                      key={prod.id}
                      className="flex flex-col sm:flex-row justify-between gap-3 sm:items-center p-4 rounded-2xl border border-border hover:border-primary/30 transition-colors"
                    >
                      {isEditing ? (
                        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-2">
                          <input
                            className="rounded-xl border border-border bg-background px-3 py-2.5"
                            value={draft?.name ?? ''}
                            onChange={(e) =>
                              setDrafts((s) => ({
                                ...s,
                                [prod.id]: { ...s[prod.id], name: e.target.value },
                              }))
                            }
                          />
                          <input
                            className="rounded-xl border border-border bg-background px-3 py-2.5"
                            value={draft?.price ?? ''}
                            inputMode="numeric"
                            onChange={(e) =>
                              setDrafts((s) => ({
                                ...s,
                                [prod.id]: { ...s[prod.id], price: e.target.value },
                              }))
                            }
                          />
                          <select
                            className="rounded-xl border border-border bg-background px-3 py-2.5"
                            value={draft?.category_id ?? ''}
                            onChange={(e) =>
                              setDrafts((s) => ({
                                ...s,
                                [prod.id]: { ...s[prod.id], category_id: e.target.value },
                              }))
                            }
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.emoji} {c.name}
                              </option>
                            ))}
                          </select>
                          <input
                            className="rounded-xl border border-border bg-background px-3 py-2.5"
                            value={draft?.image_url ?? ''}
                            placeholder="URL imagen"
                            onChange={(e) =>
                              setDrafts((s) => ({
                                ...s,
                                [prod.id]: { ...s[prod.id], image_url: e.target.value },
                              }))
                            }
                          />
                          <textarea
                            className="rounded-xl border border-border bg-background px-3 py-2.5 md:col-span-2"
                            rows={2}
                            value={draft?.description ?? ''}
                            onChange={(e) =>
                              setDrafts((s) => ({
                                ...s,
                                [prod.id]: { ...s[prod.id], description: e.target.value },
                              }))
                            }
                          />
                          <div className="rounded-xl border border-border bg-card/50 p-3 md:col-span-2">
                            <p className="text-sm font-semibold mb-2">Ingredientes</p>
                            <div className="flex gap-2">
                              <input
                                className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5"
                                placeholder="Ej: Salsa criolla"
                                value={editIngredientInput[prod.id] ?? ''}
                                onChange={(e) =>
                                  setEditIngredientInput((s) => ({ ...s, [prod.id]: e.target.value }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key !== 'Enter') return
                                  e.preventDefault()
                                  const value = (editIngredientInput[prod.id] ?? '').trim()
                                  if (!value) return
                                  setDrafts((s) => ({
                                    ...s,
                                    [prod.id]: {
                                      ...s[prod.id],
                                      ingredients: (s[prod.id]?.ingredients ?? []).includes(value)
                                        ? s[prod.id]?.ingredients ?? []
                                        : [...(s[prod.id]?.ingredients ?? []), value],
                                    },
                                  }))
                                  setEditIngredientInput((s) => ({ ...s, [prod.id]: '' }))
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const value = (editIngredientInput[prod.id] ?? '').trim()
                                  if (!value) return
                                  setDrafts((s) => ({
                                    ...s,
                                    [prod.id]: {
                                      ...s[prod.id],
                                      ingredients: (s[prod.id]?.ingredients ?? []).includes(value)
                                        ? s[prod.id]?.ingredients ?? []
                                        : [...(s[prod.id]?.ingredients ?? []), value],
                                    },
                                  }))
                                  setEditIngredientInput((s) => ({ ...s, [prod.id]: '' }))
                                }}
                                className="px-4 py-2 rounded-xl bg-muted font-semibold hover:bg-foreground/10"
                              >
                                Agregar
                              </button>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {(draft?.ingredients ?? []).map((ing: string) => (
                                <span
                                  key={`${prod.id}-${ing}`}
                                  className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-sm font-semibold"
                                >
                                  {ing}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDrafts((s) => ({
                                        ...s,
                                        [prod.id]: {
                                          ...s[prod.id],
                                          ingredients: (s[prod.id]?.ingredients ?? []).filter(
                                            (x: string) => x !== ing
                                          ),
                                        },
                                      }))
                                    }
                                    className="text-primary/70 hover:text-primary"
                                    aria-label={`Quitar ${ing}`}
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4 min-w-0">
                          {prod.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={prod.image_url} alt={prod.name} className="w-16 h-16 rounded-xl object-cover" />
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center text-2xl">
                              🍔
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="font-bold text-lg truncate">{prod.name}</h4>
                            <p className="font-semibold text-primary">${prod.price}</p>
                            {!prod.is_available && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 font-semibold">
                                Oculto en menú
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
                        {isEditing && (
                          <>
                            <button
                              disabled={isPending}
                              onClick={() =>
                                runAction(async () => {
                                  const res = await updateProductAction(prod.id, {
                                    name: draft.name,
                                    description: draft.description,
                                    price: Number(draft.price || '0'),
                                    image_url: draft.image_url,
                                    category_id: draft.category_id,
                                    ingredients: draft.ingredients ?? [],
                                  })
                                  if (res?.ok) setEditingId(null)
                                  return res
                                })
                              }
                              className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90"
                            >
                              Guardar
                            </button>
                            <button
                              disabled={isPending}
                              onClick={() => setEditingId(null)}
                              className="px-4 py-2 bg-muted text-foreground font-bold rounded-xl hover:bg-foreground/10"
                            >
                              Cancelar
                            </button>
                          </>
                        )}

                        {!isEditing && activeCategoryEditId === cat.id && (
                          <>
                            <button
                              disabled={isPending}
                              onClick={() => setEditingId(prod.id)}
                              className="px-4 py-2 bg-muted text-foreground font-bold rounded-xl hover:bg-foreground/10"
                            >
                              Editar
                            </button>
                            <button
                              disabled={isPending}
                              onClick={() => runAction(() => toggleProductAvailabilityAction(prod.id))}
                              className="px-4 py-2 bg-rose-500/10 text-rose-500 font-bold rounded-xl hover:bg-rose-500/20"
                            >
                              {prod.is_available ? 'Ocultar' : 'Mostrar'}
                            </button>
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => setPendingDeleteProduct({ id: prod.id, name: prod.name })}
                              className="px-4 py-2 bg-red-600/10 text-red-600 font-bold rounded-xl hover:bg-red-600/20"
                            >
                              Eliminar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}

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

      {pendingDeleteProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-5 shadow-xl space-y-4">
            <h3 className="text-lg font-black">Confirmar eliminación</h3>
            <p className="text-sm text-muted-foreground">
              Seguro que quiere eliminar <strong>{pendingDeleteProduct.name}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setPendingDeleteProduct(null)}
                className="px-4 py-2 rounded-xl bg-muted font-semibold hover:bg-foreground/10"
              >
                No
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  runAction(async () => {
                    const res = await deleteProductAction(pendingDeleteProduct.id, 'ELIMINAR')
                    if (res?.ok) {
                      setSuccess(`"${pendingDeleteProduct.name}" se eliminó correctamente.`)
                      setPendingDeleteProduct(null)
                    }
                    return res
                  })
                }
                className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
