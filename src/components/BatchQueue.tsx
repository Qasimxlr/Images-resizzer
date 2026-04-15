import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'

export default function BatchQueue() {
  const {
    files,
    selectedFileId,
    setSelectedFileId,
    removeFile,
    clearFiles,
    isProcessing,
  } = useAppStore()

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-white/20',
    processing: 'bg-apple-blue animate-pulse',
    done: 'bg-apple-green',
    error: 'bg-apple-red',
  }

  return (
    <div className="flex-shrink-0 h-[130px] border-t border-white/[0.06] bg-apple-gray-950/90 flex flex-col">
      {/* Queue header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">
            Batch Queue
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/30 font-mono">
            {files.length}
          </span>
        </div>
        {files.length > 0 && !isProcessing && (
          <button
            onClick={clearFiles}
            className="text-[11px] text-white/25 hover:text-apple-red transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Queue items */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-3 py-2">
        <div className="flex gap-2 h-full">
          <AnimatePresence mode="popLayout">
            {files.map((file, idx) => (
              <motion.div
                key={file.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                className={`relative flex-shrink-0 w-[80px] h-full rounded-lg overflow-hidden cursor-pointer
                  transition-all duration-200 group ${
                  selectedFileId === file.id
                    ? 'ring-2 ring-apple-blue ring-offset-1 ring-offset-apple-gray-950'
                    : 'ring-1 ring-white/[0.08] hover:ring-white/[0.15]'
                }`}
                onClick={() => setSelectedFileId(file.id)}
              >
                {/* Thumbnail */}
                <img
                  src={file.base64}
                  alt={file.filename}
                  className="w-full h-full object-cover"
                  draggable={false}
                />

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Status dot */}
                <div className={`absolute top-1.5 left-1.5 w-2 h-2 rounded-full ${statusColors[file.status]}`} />

                {/* Remove button */}
                {!isProcessing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(file.id)
                    }}
                    className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/60 text-white/50
                      hover:text-white hover:bg-apple-red/80 opacity-0 group-hover:opacity-100
                      transition-all duration-200 flex items-center justify-center"
                  >
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}

                {/* Index & info */}
                <div className="absolute bottom-1 left-1 right-1 flex items-end justify-between">
                  <span className="text-[9px] font-mono text-white/50 leading-none">{idx + 1}</span>
                  <span className="text-[8px] font-mono text-white/30 leading-none">
                    {formatFileSize(file.metadata.size)}
                  </span>
                </div>

                {/* Processing overlay */}
                {file.status === 'processing' && (
                  <div className="absolute inset-0 bg-apple-blue/10 flex items-center justify-center backdrop-blur-[1px]">
                    <svg className="animate-spin h-5 w-5 text-apple-blue" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  </div>
                )}

                {/* Done checkmark overlay */}
                {file.status === 'done' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-apple-green/5 flex items-center justify-center"
                  >
                    <div className="w-6 h-6 rounded-full bg-apple-green/20 flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty state placeholder */}
          {files.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[11px] text-white/15">Drop images here or click "Add Images"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
