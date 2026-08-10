import { motion } from 'framer-motion'
import { ArrowRight, Bookmark, Clapperboard, MessageCircle, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import { APP_NAME } from '../config/appConfig'

const features = [
  [Clapperboard, 'Discover', 'Browse current, popular, and highly rated films through a deliberately quiet catalog.'],
  [Sparkles, 'Remember', 'Keep ratings, favorites, and viewing history together as a personal film record.'],
  [Users, 'Connect', 'Follow friends and exchange recommendations without turning the experience into a noisy feed.'],
  [MessageCircle, 'Discuss', 'Add concise reviews and comments when a film deserves more than a score.'],
  [Bookmark, 'Collect', 'Build a profile that reflects what you watched, loved, and plan to revisit.'],
  [ShieldCheck, 'Self-hosted', 'The application owns its account and social data instead of outsourcing its core product.'],
]

const About = () => (
  <main className="min-h-screen bg-[#0d0e0c] pt-24 text-[#f2eee5]">
    <section className="border-b border-white/10">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 md:py-24 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
        <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-[#e85d4a]">About the project · 01</p>
          <h1 className="mt-7 max-w-4xl font-display text-5xl leading-[0.98] sm:text-6xl lg:text-8xl">
            A quieter place to keep track of films.
          </h1>
        </motion.div>

        <motion.aside
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.12 }}
          className="border-l border-[#e85d4a]/45 pl-6"
        >
          <p className="text-base leading-7 text-white/65">
            {APP_NAME} is an experimental, self-hosted movie journal built to explore full-stack product engineering through a real, usable application.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/movies" className="ui-button-primary">Browse the archive <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/register" className="ui-button-secondary">Create an account</Link>
          </div>
        </motion.aside>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-24">
      <div className="mb-10 flex items-end justify-between border-b border-white/10 pb-5">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-white/40">The product · 02</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl">Designed around the viewing record.</h2>
        </div>
        <BrandMark to="/" compact className="hidden sm:flex" />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3">
        {features.map(([Icon, title, description], index) => (
          <motion.article
            key={title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ delay: index * 0.04 }}
            className="group border-b border-white/10 px-1 py-8 md:border-r md:px-7 lg:min-h-64 lg:first:pl-1 lg:[&:nth-child(3n)]:border-r-0"
          >
            <div className="flex items-center justify-between">
              <Icon className="h-6 w-6 text-[#e85d4a]" strokeWidth={1.5} aria-hidden="true" />
              <span className="font-mono text-xs text-white/25">0{index + 1}</span>
            </div>
            <h3 className="mt-10 font-display text-3xl transition-colors group-hover:text-[#e85d4a]">{title}</h3>
            <p className="mt-4 max-w-sm leading-7 text-white/55">{description}</p>
          </motion.article>
        ))}
      </div>
    </section>

    <section className="border-y border-white/10 bg-[#141512]">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 md:grid-cols-2 md:py-20">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[#e85d4a]">Project note · 03</p>
          <h2 className="mt-5 font-display text-4xl">Built as a product, presented as engineering.</h2>
        </div>
        <p className="self-end leading-7 text-white/60">
          The application combines a React interface, an API, PostgreSQL-backed accounts and social features, background email delivery, and a self-hosted deployment. It remains a portfolio experiment, so features may evolve as the project is refined.
        </p>
      </div>
    </section>
  </main>
)

export default About
