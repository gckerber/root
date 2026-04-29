// apps/village-site/src/pages/History.jsx
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import axios from 'axios'

const API = 'https://func-village-prod.azurewebsites.net'

const DEFAULT_HISTORY = 'Saint Louisville was established in 1833 in Licking County, Ohio, as a small but proud community in the heart of the state. Through more than 190 years of history, Saint Louisville has maintained its close-knit character, welcoming generations of families who have called this special place home.'

function usePhotos() {
  return useQuery({
    queryKey: ['photos'],
    queryFn: () => axios.get(`${API}/api/photos`).then((r) => r.data),
    placeholderData: { items: [] },
  })
}

function Lightbox({ photos, index, onClose, onPrev, onNext }) {
  if (index === null) return null
  const photo = photos[index]
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <button className="absolute top-4 right-4 text-white/70 hover:text-white" onClick={onClose}>
        <X size={28} />
      </button>
      <button
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20"
        onClick={(e) => { e.stopPropagation(); onPrev() }}
      >
        <ChevronLeft size={24} />
      </button>
      <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
        <img
          src={photo.url}
          alt={photo.caption}
          className="w-full max-h-[75vh] object-contain rounded-lg"
          onError={(e) => { e.target.src = 'https://placehold.co/800x500/1e3a5f/white?text=Historical+Photo' }}
        />
        <div className="mt-4 text-center text-white">
          <p className="font-semibold text-lg">{photo.caption}</p>
          {photo.year && <p className="text-white/60 text-sm mt-1">circa {photo.year}</p>}
        </div>
      </div>
      <button
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20"
        onClick={(e) => { e.stopPropagation(); onNext() }}
      >
        <ChevronRight size={24} />
      </button>
    </div>
  )
}

export default function History() {
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [historyText, setHistoryText] = useState(DEFAULT_HISTORY)
  const { data } = usePhotos()
  const photos = data?.items || []

  useEffect(() => {
    fetch(`${API}/api/history`)
      .then((r) => r.json())
      .then((d) => { if (d.text) setHistoryText(d.text) })
      .catch(() => {/* use default */})
  }, [])

  function handlePrev() {
    setLightboxIndex((i) => (i > 0 ? i - 1 : photos.length - 1))
  }
  function handleNext() {
    setLightboxIndex((i) => (i < photos.length - 1 ? i + 1 : 0))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Village History &amp; Heritage</h1>
        <p className="text-gray-500 max-w-2xl">
          {historyText}
        </p>
      </div>

      {/* History summary */}
      <div className="bg-blue-900 text-white rounded-2xl p-8 mb-12 grid sm:grid-cols-3 gap-6 text-center">
        {[
          { stat: '1833', label: 'Year Established' },
          { stat: 'Licking County', label: 'County' },
          { stat: '190+ Years', label: 'Community Heritage' },
        ].map(({ stat, label }) => (
          <div key={label}>
            <div className="text-3xl font-extrabold text-yellow-300">{stat}</div>
            <div className="text-blue-200 text-sm mt-1">{label}</div>
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">Historical Photo Gallery</h2>

      {photos.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          No photos yet. Add some from the admin panel.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map((photo, i) => (
            <button
              key={photo.id}
              onClick={() => setLightboxIndex(i)}
              className="group relative aspect-square overflow-hidden rounded-xl bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <img
                src={photo.url}
                alt={photo.caption}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                onError={(e) => {
                  e.target.src = `https://placehold.co/400x400/1e3a5f/white?text=${encodeURIComponent(photo.year || 'Historic')}`
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <div className="text-white text-left">
                  <p className="text-xs font-medium line-clamp-2">{photo.caption}</p>
                  {photo.year && <p className="text-white/60 text-xs">~{photo.year}</p>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <Lightbox
        photos={photos}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onPrev={handlePrev}
        onNext={handleNext}
      />

      <p className="mt-8 text-sm text-gray-400 text-center">
        Have historical photos to contribute? Email them to{' '}
        <a href="mailto:history@saintlouisvilleohio.gov" className="text-blue-600 hover:underline">
          history@saintlouisvilleohio.gov
        </a>
      </p>
    </div>
  )
}
