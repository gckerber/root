// apps/village-site/src/components/HeroCarousel.jsx
// Shared full-width hero carousel used on both the Home and Police pages.
import { useState, useEffect, useCallback } from 'react'

export default function HeroCarousel({
  images = [],          // [{ id, url, caption }]
  fallbackUrl = null,   // shown when images array is empty
  children,             // overlay content (text, CTAs, header, etc.)
  heightClass = 'h-[65vh] min-h-[480px] max-h-[800px]',
  gradient = 'bg-gradient-to-t from-blue-950/80 via-blue-900/30 to-transparent',
}) {
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)

  const advance = useCallback(() => {
    setIdx((i) => (i + 1) % Math.max(images.length, 1))
  }, [images.length])

  useEffect(() => {
    if (images.length <= 1 || paused) return
    const t = setInterval(advance, 5000)
    return () => clearInterval(t)
  }, [images.length, paused, advance])

  const hasImages = images.length > 0

  return (
    <div
      className={`relative ${heightClass} overflow-hidden bg-gray-900`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Images */}
      {hasImages ? (
        images.map((img, i) => (
          <img
            key={img.id}
            src={img.url}
            alt={img.caption || ''}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              i === idx ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))
      ) : fallbackUrl ? (
        <img
          src={fallbackUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { e.target.style.display = 'none' }}
        />
      ) : null}

      {/* Gradient overlay */}
      <div className={`absolute inset-0 ${gradient}`} />

      {/* Overlay content */}
      {children && (
        <div className="relative h-full">{children}</div>
      )}

      {/* Dot navigation — only shown when there are multiple images */}
      {images.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === idx ? 'bg-yellow-400 w-6' : 'bg-white/50 w-2 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}

      {/* Caption — bottom-right, only shown when image has one */}
      {hasImages && images[idx]?.caption && (
        <p className="absolute bottom-8 right-4 text-white/60 text-xs italic z-10 max-w-xs text-right leading-tight">
          {images[idx].caption}
        </p>
      )}
    </div>
  )
}
