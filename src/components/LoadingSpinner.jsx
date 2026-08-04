const LoadingSpinner = ({ size = 'md', fullScreen = false }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-4',
    lg: 'w-16 h-16 border-4',
  }

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0d0e0c]/92 backdrop-blur-sm" role="status" aria-label="Loading">
        <div className="flex flex-col items-center gap-4">
          <div className={`${sizeClasses[size]} animate-spin rounded-full border-white/15 border-t-primary-500`} />
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#77756f]">Loading archive</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center p-8">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-white/15 border-t-primary-500`} role="status" aria-label="Loading" />
    </div>
  )
}

export default LoadingSpinner
