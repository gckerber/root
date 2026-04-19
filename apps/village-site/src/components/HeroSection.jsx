// apps/village-site/src/components/HeroSection.jsx
// Place your high-resolution town photo at /public/hero.jpg
// Recommended: 1920x1080px or larger, landscape orientation

export default function HeroSection() {
  return (
    <div className="relative h-[70vh] min-h-[480px] max-h-[800px] overflow-hidden">
      {/* Hero image — replace hero.jpg with your actual town photo */}
      <img
        src="/hero.jpg"
        alt="Aerial view of Saint Louisville, Ohio"
        className="absolute inset-0 w-full h-full object-cover object-center"
        loading="eager"
      />

      {/* Gradient overlay — darkens bottom for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 via-blue-900/30 to-transparent" />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end pb-12 px-6 sm:px-12 lg:px-20 max-w-7xl mx-auto">
        {/* Village seal / badge */}
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

      {/* Scrolling indicator */}
      <div className="absolute bottom-4 right-6 text-white/50 text-xs flex flex-col items-center gap-1 animate-bounce">
        <span>↓</span>
      </div>
    </div>
  )
}
