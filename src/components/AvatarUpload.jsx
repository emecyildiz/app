import { useState, useRef } from 'react'
import { Camera, X, Upload } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const AvatarUpload = ({ currentAvatar, onUpload, size = 'large' }) => {
  const [preview, setPreview] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  const sizeClasses = {
    small: 'w-20 h-20',
    medium: 'w-32 h-32',
    large: 'w-40 h-40'
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('The file must be smaller than 5 MB.')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!preview) return

    setIsUploading(true)
    try {
      // In a real app, you would upload to a server here
      // For now, we'll just use the base64 preview
      await onUpload(preview)
      setPreview(null)
    } catch (error) {
      toast.error('The photo could not be uploaded.')
    } finally {
      setIsUploading(false)
    }
  }

  const cancelUpload = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="relative">
      <div className={`relative ${sizeClasses[size]} group`}>
        <img
          src={preview || currentAvatar}
          alt="Avatar"
          className={`${sizeClasses[size]} rounded-full object-cover border-4 border-dark-300`}
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          <Camera className="w-8 h-8 text-white" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-full left-0 right-0 mt-4 p-4 bg-dark-200 rounded-lg shadow-xl"
          >
            <p className="text-sm text-gray-300 mb-3">New photo preview</p>
            <div className="flex gap-2">
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1 btn btn-primary btn-sm"
              >
                {isUploading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    Uploading...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload
                  </span>
                )}
              </button>
              <button
                onClick={cancelUpload}
                disabled={isUploading}
                className="btn btn-secondary btn-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AvatarUpload
