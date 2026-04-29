'use client'
import { useState } from 'react'

export default function CategoryFilter({ categories }: { categories: any[] }) {
  const [activeId, setActiveId] = useState(categories?.[0]?.id)

  if (!categories || categories.length === 0) return null

  const handleScroll = (id: string) => {
    setActiveId(id)
    const el = document.getElementById(`cat-${id}`)
    if (el) {
      window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' })
    }
  }

  return (
    <div className="sticky top-0 z-20 border-b border-border/60 bg-background/90 py-3.5 shadow-[0_8px_24px_-20px_rgba(45,35,30,0.12)] backdrop-blur-xl">
      <div className="max-w-5xl mx-auto px-4 overflow-x-auto hide-scrollbar">
        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleScroll(cat.id)}
              className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
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
