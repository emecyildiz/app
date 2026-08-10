import { motion } from 'framer-motion'
import { ArrowRight, Bookmark, Film, Search, Star, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/newAuthStore'

const genres = [
  { name: 'Action', slug: 'action', number: '01' },
  { name: 'Comedy', slug: 'comedy', number: '02' },
  { name: 'Drama', slug: 'drama', number: '03' },
  { name: 'Science fiction', slug: 'science-fiction', number: '04' },
  { name: 'Horror', slug: 'horror', number: '05' },
  { name: 'Romance', slug: 'romance', number: '06' },
]

const pillars = [
  {
    icon: Search,
    number: '01 / Discover',
    title: 'Find the next film worth your time.',
    description: 'Explore a current catalog, move between genres, and keep discovery focused instead of endless.',
  },
  {
    icon: Star,
    number: '02 / Reflect',
    title: 'Rate what you watched.',
    description: 'Turn viewing history into a useful record with ratings, comments, and a clear personal archive.',
  },
  {
    icon: Users,
    number: '03 / Exchange',
    title: 'Share recommendations with people.',
    description: 'Follow other film enthusiasts and send recommendations without the noise of a general social feed.',
  },
]

const Home = () => {
  const { isAuthenticated, user, profile } = useAuthStore()
  const displayName = profile?.name || user?.email?.split('@')[0] || 'film lover'

  return (
    <div className="overflow-hidden bg-[#0d0e0c] text-[#f3efe6]">
      <section className="relative border-b border-white/10">
        <div className="absolute inset-0 pointer-events-none opacity-40 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="relative mx-auto grid min-h-[calc(100svh-4.5rem)] max-w-[1440px] grid-cols-1 lg:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="flex flex-col justify-center px-6 py-20 sm:px-10 lg:col-span-8 lg:px-16 lg:py-28 xl:px-24"
          >
            <p className="ui-eyebrow mb-8">
              {isAuthenticated ? `Welcome back, ${displayName}` : 'Ratemet / a personal cinema archive'}
            </p>

            <h1 className="max-w-5xl font-display text-[clamp(3.6rem,8.6vw,9.5rem)] font-normal leading-[0.88] tracking-[-0.055em] text-[#f3efe6]">
              {isAuthenticated ? (
                <>Your film life,<br /><em className="font-normal text-[#e85d4a]">in one place.</em></>
              ) : (
                <>Watch less blindly.<br /><em className="font-normal text-[#e85d4a]">Remember more.</em></>
              )}
            </h1>

            <p className="mt-9 max-w-2xl text-lg leading-8 text-[#aaa79f] sm:text-xl">
              Discover films, keep a thoughtful record of what you watch, and exchange recommendations with people whose taste you trust.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link to="/movies" className="ui-button-primary">
                Explore the catalog <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to={isAuthenticated ? '/profile/overview' : '/register'} className="ui-button-secondary">
                {isAuthenticated ? 'Open your journal' : 'Create your journal'}
              </Link>
            </div>
          </motion.div>

          <aside className="relative flex flex-col justify-between border-t border-white/10 bg-[#151613]/90 px-6 py-10 sm:px-10 lg:col-span-4 lg:border-l lg:border-t-0 lg:px-12 lg:py-16">
            <div>
              <p className="ui-eyebrow">Issue 001 / The viewing record</p>
              <p className="mt-10 max-w-sm font-display text-4xl leading-tight text-[#ded8cc] sm:text-5xl">
                A quieter place for films that stay with you.
              </p>
            </div>

            <div className="mt-16 space-y-0 border-t border-white/10">
              {[
                ['Catalog', 'Current movie data'],
                ['Journal', 'Ratings and watch history'],
                ['Community', 'Friends and recommendations'],
              ].map(([label, value]) => (
                <div key={label} className="grid grid-cols-[6rem_1fr] gap-4 border-b border-white/10 py-4 text-sm">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#77756f]">{label}</span>
                  <span className="text-[#c8c3b9]">{value}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#11120f]">
        <div className="mx-auto max-w-[1440px] px-6 py-16 sm:px-10 lg:px-16 xl:px-24">
          <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="ui-eyebrow">Browse / by genre</p>
              <h2 className="mt-4 font-display text-4xl tracking-tight text-[#f3efe6] sm:text-5xl">Start with a mood.</h2>
            </div>
            <Link to="/movies" className="inline-flex items-center gap-2 text-sm text-[#bbb6ac] transition hover:text-white">
              View every film <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid border-l border-t border-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {genres.map((genre) => (
              <Link
                key={genre.slug}
                to={`/movies?genre=${genre.slug}`}
                className="group flex min-h-32 items-end justify-between border-b border-r border-white/10 p-5 transition duration-300 hover:bg-[#e85d4a] hover:text-[#15110f] sm:min-h-40 sm:p-7"
              >
                <span className="font-display text-3xl sm:text-4xl">{genre.name}</span>
                <span className="font-mono text-[10px] tracking-[0.16em] text-[#77756f] group-hover:text-[#4f211a]">{genre.number}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 py-20 sm:px-10 lg:px-16 lg:py-28 xl:px-24">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
          <div>
            <p className="ui-eyebrow">How it works</p>
            <h2 className="mt-5 max-w-md font-display text-5xl leading-[0.98] tracking-tight sm:text-6xl">
              Built around the film, not the feed.
            </h2>
            <p className="mt-7 max-w-md leading-7 text-[#96938c]">
              Ratemet keeps the useful parts of a movie community and removes the visual noise that makes choosing harder.
            </p>
          </div>

          <div className="border-t border-white/10">
            {pillars.map((pillar) => {
              const Icon = pillar.icon
              return (
                <article key={pillar.number} className="grid gap-5 border-b border-white/10 py-8 sm:grid-cols-[3rem_1fr] sm:py-10">
                  <Icon className="h-6 w-6 text-[#e85d4a]" strokeWidth={1.5} />
                  <div>
                    <p className="ui-eyebrow">{pillar.number}</p>
                    <h3 className="mt-3 font-display text-3xl text-[#e8e3d9]">{pillar.title}</h3>
                    <p className="mt-3 max-w-xl leading-7 text-[#96938c]">{pillar.description}</p>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#e7dfd1] text-[#181714]">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-10 px-6 py-16 sm:px-10 lg:flex-row lg:items-end lg:justify-between lg:px-16 lg:py-20 xl:px-24">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#7e776c]">Your next entry</p>
            <h2 className="mt-5 max-w-3xl font-display text-5xl leading-[0.95] tracking-tight sm:text-7xl">
              Find it. Watch it. Keep it.
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <Link to="/movies" className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#181714] px-6 text-sm font-semibold text-[#f3efe6] transition hover:bg-[#e85d4a]">
              Browse films <Film className="h-4 w-4" />
            </Link>
            {!isAuthenticated && (
              <Link to="/register" className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#181714]/30 px-6 text-sm font-semibold transition hover:border-[#181714]">
                Start a journal <Bookmark className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
