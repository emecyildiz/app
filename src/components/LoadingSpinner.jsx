const LoadingSpinner = ({ size = 'md', fullScreen = false }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  }

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className={`${sizeClasses[size]} border-gray-300 border-t-primary-500 rounded-full animate-spin`} />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center p-8">
      <div className={`${sizeClasses[size]} border-gray-300 border-t-primary-500 rounded-full animate-spin`} />
    </div>
  )
}

export default LoadingSpinner