import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import { ASSET_TYPE_CONFIG } from '../config/presets'

export default function DropZone() {
  const { assetType, addFiles, setSelectedFileId, addNotification } = useAppStore()
  const config = ASSET_TYPE_CONFIG[assetType]

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const maxFiles = config.maxQuantity
    const filesToProcess = acceptedFiles.slice(0, maxFiles)

    if (acceptedFiles.length > maxFiles) {
      addNotification({
        type: 'warning',
        message: `Only ${maxFiles} files allowed for ${config.label}. Extra files were skipped.`,
      })
    }

    const newFiles = []

    for (const file of filesToProcess) {
      try {
        // In Electron, File objects have an absolute `.path` property
        const electronPath = (file as any).path as string | undefined
        const hasElectronAPI = typeof window.electronAPI !== 'undefined'
        const hasValidPath = electronPath && electronPath.length > 0 && !electronPath.startsWith('.')

        if (hasElectronAPI && hasValidPath) {
          // === ELECTRON MODE: Use IPC to read file via Sharp ===
          const result = await window.electronAPI.readImageFile(electronPath)
          if (result.error || !result.base64 || !result.metadata) {
            addNotification({ type: 'error', message: `Failed to read ${file.name}: ${result.error}` })
            continue
          }

          newFiles.push({
            id: crypto.randomUUID(),
            filename: result.filename!,
            filepath: result.filepath!,
            base64: result.base64,
            metadata: result.metadata,
            status: 'pending' as const,
            progress: 0,
          })
        } else {
          // === BROWSER MODE: Read via FileReader (no Sharp, no filepath) ===
          const base64 = await readFileAsDataURL(file)
          const dimensions = await getImageDimensions(base64)

          newFiles.push({
            id: crypto.randomUUID(),
            filename: file.name,
            filepath: '', // No real filesystem path in browser
            base64,
            metadata: {
              width: dimensions.width,
              height: dimensions.height,
              format: file.type.split('/')[1] || file.name.split('.').pop() || 'unknown',
              size: file.size,
              hasAlpha: file.type === 'image/png',
              colorSpace: 'srgb',
            },
            status: 'pending' as const,
            progress: 0,
          })
        }
      } catch (err: any) {
        addNotification({ type: 'error', message: `Failed to load ${file.name}: ${err?.message || 'Unknown error'}` })
      }
    }

    if (newFiles.length > 0) {
      addFiles(newFiles)
      setSelectedFileId(newFiles[0].id)
      addNotification({
        type: 'success',
        message: `Added ${newFiles.length} image${newFiles.length > 1 ? 's' : ''} (${newFiles.map(f => `${f.metadata.width}×${f.metadata.height}`).join(', ')})`,
      })
    }
  }, [assetType, addFiles, setSelectedFileId, addNotification, config])

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/tiff': ['.tiff', '.tif'],
      'image/webp': ['.webp'],
      'image/heic': ['.heic'],
    },
    maxFiles: 20,
    noClick: false,
  })

  return (
    <div
      {...getRootProps()}
      className={`flex-1 flex items-center justify-center p-8 transition-all duration-300 cursor-pointer ${
        isDragActive
          ? isDragReject
            ? 'bg-apple-red/5'
            : 'bg-apple-blue/5'
          : 'drop-zone-pattern'
      }`}
    >
      <input {...getInputProps()} />

      <motion.div
        className={`relative w-full max-w-lg p-12 rounded-2xl border-2 border-dashed transition-all duration-300 text-center ${
          isDragActive
            ? isDragReject
              ? 'border-apple-red/40 bg-apple-red/5'
              : 'border-apple-blue/40 bg-apple-blue/10 glow-blue'
            : 'border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.02]'
        }`}
        animate={isDragActive ? { scale: 1.02 } : { scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {/* Animated icon */}
        <motion.div
          className="mb-6"
          animate={isDragActive ? { y: -8 } : { y: 0 }}
          transition={{ duration: 0.3, type: 'spring' }}
        >
          {isDragReject ? (
            <div className="w-16 h-16 mx-auto rounded-2xl bg-apple-red/10 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
          ) : isDragActive ? (
            <div className="w-16 h-16 mx-auto rounded-2xl bg-apple-blue/10 flex items-center justify-center animate-pulse-glow">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
          ) : (
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-apple-blue/10 to-apple-indigo/10 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#dropGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <defs>
                  <linearGradient id="dropGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#007AFF"/>
                    <stop offset="100%" stopColor="#5856D6"/>
                  </linearGradient>
                </defs>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
          )}
        </motion.div>

        {/* Text */}
        <h3 className={`text-[16px] font-semibold mb-2 transition-colors duration-300 ${
          isDragReject ? 'text-apple-red' : isDragActive ? 'text-apple-blue' : 'text-white/70'
        }`}>
          {isDragReject
            ? 'Unsupported File Type'
            : isDragActive
              ? 'Drop to Import'
              : 'Drop Images Here'}
        </h3>

        <p className="text-[13px] text-white/30 mb-6">
          {isDragReject
            ? 'Only PNG, JPEG, TIFF, WebP, and HEIC files are supported'
            : `Drag & drop up to ${config.maxQuantity} images, or click to browse`}
        </p>

        {/* Spec summary for current mode */}
        <div className="flex items-center justify-center gap-3 mb-4 text-[10px] text-white/20 font-mono">
          <span>{config.defaultWidth}×{config.defaultHeight}px</span>
          <span className="text-white/10">•</span>
          <span>{config.defaultFormat.toUpperCase()}</span>
          <span className="text-white/10">•</span>
          <span>Max {formatBytes(config.maxFileSize)}</span>
        </div>

        {/* Format badges */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {['PNG', 'JPEG', 'TIFF', 'WebP', 'HEIC'].map((fmt) => (
            <span
              key={fmt}
              className="px-2 py-1 rounded-md bg-white/[0.04] text-[10px] text-white/20 font-mono"
            >
              {fmt}
            </span>
          ))}
        </div>

        {/* Current mode indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
          <span className="text-sm">{config.icon}</span>
          <span className="text-[11px] text-white/40 font-medium">{config.label} Mode</span>
        </div>
      </motion.div>
    </div>
  )
}

// Utility functions
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve({ width: 0, height: 0 })
    img.src = dataUrl
  })
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
