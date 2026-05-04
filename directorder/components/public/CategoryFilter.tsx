'use client'
import { useState } from 'react'

export default function CategoryFilter({ categories }: { categories: any[] }) {
  const [activeId, setActiveId] = useState(categories?.[0]?.id)

  if (!categories || categories.length === 0) return null

  const handleScroll = (id: string) => {
    setActiveId(id)
    const el = document.getElementById(`cat-${id}`)
    if (el) {
      const stickyH = 72
      window.scrollTo({ top: el.offsetTop - stickyH, behavior: 'smooth' })
    }
  }

  return (
    <div className="sticky top-0 z-20 border-b border-border/60 bg-background/90 pt-safe pb-3 sm:pb-3.5 shadow-[0_8px_24px_-20px_rgba(45,35,30,0.12)] backdrop-blur-xl">
      <div className="max-w-5xl mx-auto px-4 overflow-x-auto hide-scrollbar scroll-smooth snap-x snap-mandatory touch-pan-x">
        <div className="flex w-max min-w-full gap-2 pb-0.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleScroll(cat.id)}
              className={`snap-start whitespace-nowrap touch-manipulation px-4 py-3 sm:py-2.5 min-h-11 rounded-xl text-sm font-medium transition-colors active:scale-[0.98] ${
                activeId === cat.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card text-foreground/80 border border-border hover:bg-muted hover:text-foreground'
              }`}
            >
              {cat.emoji && <span className="mr-1.5 opacity-90">{cat.emoji}</span>}
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
