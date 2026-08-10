import { ArrowUpRight, Github } from 'lucide-react'
import { Link } from 'react-router-dom'
import { APP_NAME } from '../config/appConfig'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-white/10 bg-[#10110e] text-[#a09d95]">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.4fr_0.6fr_0.6fr] lg:px-12 lg:py-20">
        <div className="max-w-xl">
          <Link to="/" className="inline-flex items-center gap-3 font-display text-3xl text-[#e8e3d9] transition hover:text-[#e85d4a]">
            <span aria-hidden="true" className="grid h-9 w-9 place-items-center bg-[#e85d4a] text-xl italic text-[#17130f]">r</span>
            {APP_NAME}
          </Link>
          <p className="mt-4 max-w-md text-sm leading-7">
            A personal film archive for discovering, rating, and remembering what you watch.
          </p>
          <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.22em] text-[#77756f]">
            An Emecworks project
          </p>
        </div>

        <div>
          <p className="ui-eyebrow">Explore</p>
          <nav className="mt-5 flex flex-col items-start gap-3 text-sm">
            <Link to="/movies" className="transition hover:text-[#e8e3d9]">Film index</Link>
            <Link to="/about" className="transition hover:text-[#e8e3d9]">About the project</Link>
            <Link to="/privacy" className="transition hover:text-[#e8e3d9]">Privacy</Link>
            <Link to="/terms" className="transition hover:text-[#e8e3d9]">Terms</Link>
          </nav>
        </div>

        <div>
          <p className="ui-eyebrow">Elsewhere</p>
          <div className="mt-5 flex flex-col items-start gap-3 text-sm">
            <a
              href="https://github.com/emecyildiz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 transition hover:text-[#e8e3d9]"
            >
              <Github className="h-4 w-4" /> GitHub
            </a>
            <a
              href="https://emecworks.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 transition hover:text-[#e8e3d9]"
            >
              Emecworks <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-5 py-5 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#66645f] sm:flex-row sm:items-center sm:justify-between">
          <span>&copy; {currentYear} {APP_NAME}</span>
          <span>Independent film notes, without the noise</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
