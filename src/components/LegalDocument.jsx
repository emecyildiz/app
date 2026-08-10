import { motion } from 'framer-motion'
import BrandMark from './BrandMark'

const LegalDocument = ({ eyebrow, title, summary, updated, sections }) => (
  <main className="min-h-screen bg-[#0d0e0c] pt-24 text-[#f2eee5]">
    <header className="border-b border-white/10">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 md:py-24">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-[#e85d4a]">{eyebrow}</p>
          <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_0.55fr] lg:items-end">
            <h1 className="font-display text-5xl leading-none sm:text-6xl lg:text-7xl">{title}</h1>
            <div className="border-l border-[#e85d4a]/45 pl-6">
              <p className="leading-7 text-white/60">{summary}</p>
              <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.2em] text-white/35">Last updated · {updated}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </header>

    <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 md:py-20">
      <div className="grid gap-12 lg:grid-cols-[0.28fr_0.72fr]">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <BrandMark />
          <p className="mt-5 max-w-xs text-sm leading-6 text-white/40">
            Plain-language information for the Ratemet movie journal.
          </p>
        </aside>

        <motion.article
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-white/15"
        >
          {sections.map(([Icon, sectionTitle, body], index) => (
            <section key={sectionTitle} className="grid gap-5 border-b border-white/10 py-9 sm:grid-cols-[3.5rem_1fr]">
              <div className="flex items-center gap-3 sm:block">
                <Icon className="h-5 w-5 text-[#e85d4a]" strokeWidth={1.5} aria-hidden="true" />
                <span className="font-mono text-[11px] text-white/25 sm:mt-4 sm:block">0{index + 1}</span>
              </div>
              <div>
                <h2 className="font-display text-3xl">{sectionTitle}</h2>
                <p className="mt-4 leading-7 text-white/60">{body}</p>
              </div>
            </section>
          ))}
        </motion.article>
      </div>
    </div>
  </main>
)

export default LegalDocument
