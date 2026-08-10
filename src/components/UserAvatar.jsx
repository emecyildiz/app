const UserAvatar = ({
  src,
  name,
  username,
  className = 'h-10 w-10 rounded-full object-cover',
  fallbackClassName = '',
}) => {
  const label = String(name || username || 'Ratemet user').trim()
  const initial = label.charAt(0).toUpperCase() || 'R'

  if (src) {
    return <img src={src} alt={label} className={className} />
  }

  return (
    <span
      aria-label={label}
      role="img"
      className={`${className} ${fallbackClassName} inline-flex items-center justify-center bg-[#e85d4a] font-semibold text-white`}
    >
      {initial}
    </span>
  )
}

export default UserAvatar
