import { Link } from 'react-router-dom'
import { APP_NAME } from '../config/appConfig'

const BrandMark = ({ compact = false, className = '' }) => (
  <Link
    to="/"
    aria-label={`${APP_NAME} home`}
    className={`group inline-flex items-center gap-3 ${className}`}
  >
    <span
      aria-hidden="true"
      className="grid h-9 w-9 place-items-center border border-[#e85d4a] bg-[#e85d4a] font-display text-xl italic text-[#17130f] transition group-hover:bg-transparent group-hover:text-[#e85d4a]"
    >
      r
    </span>
    {!compact && (
      <span className="font-display text-2xl tracking-[-0.04em] text-[#f3efe6] transition group-hover:text-[#e85d4a]">
        {APP_NAME}
      </span>
    )}
  </Link>
)

export default BrandMark
