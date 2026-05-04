// apps/village-site/src/components/HeroSection.jsx
// Multi-image carousel hero for the village homepage.
// Images are managed via Admin → Hero Images and stored in the village-images Cosmos container.
// Falls back to the single hero.jpg if no carousel images have been uploaded yet.
import { useState, useEffect } from 'react'
import HeroCarousel from './HeroCarousel'
import axios from 'axios'

const API          = 'https://func-village-prod.azurewebsites.net'
const FALLBACK_URL = 'https://stslvprodfs7n7vax.blob.core.windows.net/hero/hero.jpg'

export default function HeroSection() {
  const [images, setImages] = useState([])

  useEffect(() => {
    axios.get(`${API}/api/village-images`)
      .then((r) => setImages(r.data.items || []))
      .catch(() => {/* use fallback */})
  }, [])

  return (
    <HeroCarousel
      images={images}
      fallbackUrl={FALLBACK_URL}
      heightClass="h-[70vh] min-h-[480px] max-h-[800px]"
    >
      {/* Village name + CTA overlay */}
      <div className="h-full flex flex-col justify-end pb-12 px-6 sm:px-12 lg:px-20 max-w-7xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-yellow-400/90 text-blue-900 px-4 py-1.5 rounded-full text-sm font-bold mb-4 w-fit">
          <span className="w-2 h-2 bg-blue-900 rounded-full" />
          Licking County, Ohio · Est. 1833
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight drop-shadow-lg">
          Village of
          <br />
          <span className="text-yellow-300">Saint Louisville</span>
        </h1>

        <p className="mt-4 text-lg sm:text-xl text-blue-100 max-w-2xl leading-relaxed drop-shadow">
          A proud small community in the heart of Licking County.
          Serving our residents with transparency, integrity, and care.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href="/bulletin"
            className="px-6 py-3 bg-yellow-400 text-blue-900 font-bold rounded-lg hover:bg-yellow-300 transition-colors shadow-lg text-sm sm:text-base"
          >
            Latest Announcements
          </a>
          <a
            href="/minutes"
            className="px-6 py-3 bg-white/15 text-white font-semibold rounded-lg border border-white/30 hover:bg-white/25 transition-colors backdrop-blur-sm text-sm sm:text-base"
          >
            Council Meeting Minutes
          </a>
          <a
            href="https://water.saintlouisvilleohio.gov"
            className="px-6 py-3 bg-blue-600/80 text-white font-semibold rounded-lg border border-blue-400/50 hover:bg-blue-500/80 transition-colors backdrop-blur-sm text-sm sm:text-base"
          >
            Pay Water Bill
          </a>
        </div>
      </div>
    </HeroCarousel>
  )
}
