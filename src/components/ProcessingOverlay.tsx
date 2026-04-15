import { motion } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'

export default function ProcessingOverlay() {
  const { processingProgress, files } = useAppStore()

  const doneCount = files.filter(f => f.status === 'done').length
  const totalCount = files.length
  const currentFile = files.find(f => f.status === 'processing')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-2xl p-8 border border-white/[0.08] shadow-2xl max-w-sm w-full mx-4"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative w-10 h-10">
            {/* Spinning ring */}
            <svg className="animate-spin w-10 h-10" viewBox="0 0 40 40">
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="3"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="#007AFF"
                strokeWidth="3"
                strokeDasharray="100"
                strokeDashoffset={100 - processingProgress}
                strokeLinecap="round"
                transform="rotate(-90 20 20)"
              />
            </svg>
            {/* Center percentage */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-bold text-apple-blue">
                {Math.round(processingProgress)}%
              </span>
            </div>
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-white/90">Processing Images</h3>
            <p className="text-[12px] text-white/40">
              {doneCount} of {totalCount} complete
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden mb-4">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-apple-blue to-apple-indigo"
            initial={{ width: 0 }}
            animate={{ width: `${processingProgress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>

        {/* Current file */}
        {currentFile && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.04]">
            <svg className="animate-spin h-3 w-3 text-apple-blue flex-shrink-0" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <span className="text-[11px] text-white/40 truncate">{currentFile.filename}</span>
          </div>
        )}

        {/* File list progress */}
        <div className="mt-3 space-y-1 max-h-[120px] overflow-y-auto">
          {files.map((file, idx) => (
            <div
              key={file.id}
              className="flex items-center gap-2 text-[10px]"
            >
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                file.status === 'done' ? 'bg-apple-green' :
                file.status === 'processing' ? 'bg-apple-blue animate-pulse' :
                file.status === 'error' ? 'bg-apple-red' :
                'bg-white/15'
              }`} />
              <span className={`truncate ${
                file.status === 'done' ? 'text-white/40 line-through' :
                file.status === 'processing' ? 'text-apple-blue' :
                'text-white/20'
              }`}>
                {file.filename}
              </span>
              {file.status === 'done' && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="3" className="flex-shrink-0 ml-auto">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
