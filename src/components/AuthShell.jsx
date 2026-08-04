import { ArrowLeft, Bookmark, Search, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import BrandMark from './BrandMark'

const journalNotes = [
  [Search, 'Discover', 'Move through a focused catalog without losing the thread.'],
  [Star, 'Reflect', 'Keep ratings and short notes attached to what you watched.'],
  [Bookmark, 'Remember', 'Build a personal record that becomes more useful over time.'],
]

const AuthShell = ({ eyebrow, title, description, children, footer }) => (
  <main className="min-h-screen bg-[#0d0e0c] text-[#e8e3d9] lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.72fr)]">
    <section className="relative flex min-h-screen flex-col px-5 py-6 sm:px-10 sm:py-9 lg:px-14 xl:px-20">
      <div className="flex items-center justify-between">
        <BrandMark />
        <Link
          to="/"
          className="inline-flex min-h-10 items-center gap-2 text-sm text-[#96938c] transition hover:text-[#f3efe6]"
        >
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-xl flex-1 items-center py-16">
        <div className="w-full">
          <p className="ui-eyebrow">{eyebrow}</p>
          <h1 className="mt-5 max-w-lg font-display text-5xl font-normal leading-[0.95] tracking-[-0.045em] text-[#f3efe6] sm:text-6xl">
            {title}
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-[#96938c]">{description}</p>

          <div className="mt-10 border-t border-white/10 pt-8">{children}</div>
          {footer && <div className="mt-8 border-t border-white/10 pt-6 text-sm text-[#96938c]">{footer}</div>}
        </div>
      </div>
    </section>

    <aside className="relative hidden overflow-hidden border-l border-white/10 bg-[#151613] lg:flex lg:min-h-screen lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:56px_56px]" />
      <div className="relative">
        <p className="ui-eyebrow">The viewing record / 001</p>
        <p className="mt-9 max-w-lg font-display text-5xl leading-[0.98] tracking-[-0.04em] text-[#ded8cc] xl:text-6xl">
          Films pass quickly. A good record does not.
        </p>
      </div>

      <div className="relative mt-20 border-t border-white/10">
        {journalNotes.map(([Icon, label, copy]) => (
          <div key={label} className="grid grid-cols-[2.5rem_1fr] gap-4 border-b border-white/10 py-5">
            <Icon className="mt-0.5 h-5 w-5 text-[#e85d4a]" strokeWidth={1.5} />
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#aaa79f]">{label}</p>
              <p className="mt-2 text-sm leading-6 text-[#77756f]">{copy}</p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  </main>
)

export default AuthShell
