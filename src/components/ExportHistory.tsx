import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, ExportRecord } from '../store/useAppStore'

export default function ExportHistory() {
  const {
    exportHistory,
    clearExportHistory,
    activePanel,
    setActivePanel,
  } = useAppStore()

  if (activePanel !== 'history') return null

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const formatTime = (timestamp: string): string => {
    const d = new Date(timestamp)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (timestamp: string): string => {
    const d = new Date(timestamp)
    const today = new Date()
    if (d.toDateString() === today.toDateString()) return 'Today'
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  // Group by date
  const grouped = exportHistory.reduce<Record<string, ExportRecord[]>>((acc, record) => {
    const date = formatDate(record.timestamp)
    if (!acc[date]) acc[date] = []
    acc[date].push(record)
    return acc
  }, {})

  const typeIcons: Record<string, string> = {
    appicon: '🎨',
    feature: '🖼️',
    phone: '📱',
    tablet: '📲',
  }

  const handleReveal = (path: string) => {
    if (typeof window.electronAPI !== 'undefined') {
      window.electronAPI.revealInFinder(path)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="w-[320px] flex-shrink-0 border-l border-white/[0.06] sidebar-glass flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-apple-indigo/20 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5856D6" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-white/80">Export History</h3>
              <p className="text-[10px] text-white/30">{exportHistory.length} exports</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {exportHistory.length > 0 && (
              <button
                onClick={clearExportHistory}
                className="px-2 py-1 rounded text-[10px] text-white/25 hover:text-apple-red hover:bg-apple-red/10 transition-all"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setActivePanel('none')}
              className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-all"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Records */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {exportHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </div>
              <p className="text-[12px] text-white/20">No exports yet</p>
              <p className="text-[10px] text-white/10 mt-1">Process images to see history</p>
            </div>
          ) : (
            Object.entries(grouped).map(([date, records]) => (
              <div key={date} className="mb-4">
                <div className="text-[10px] font-semibold text-white/25 uppercase tracking-wider px-1 mb-2">
                  {date}
                </div>
                <div className="space-y-1">
                  {records.map((record, idx) => (
                    <motion.button
                      key={record.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => handleReveal(record.outputPath)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04]
                        border border-transparent hover:border-white/[0.06] transition-all text-left group"
                    >
                      <span className="text-sm">{typeIcons[record.type] || '📄'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-medium text-white/60 truncate group-hover:text-white/80">
                          {record.filename}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-white/25 font-mono">{record.dimensions}</span>
                          <span className="text-[9px] text-white/15">•</span>
                          <span className="text-[9px] text-white/25 font-mono">{formatBytes(record.size)}</span>
                          <span className="text-[9px] text-white/15">•</span>
                          <span className="text-[9px] text-white/25">{formatTime(record.timestamp)}</span>
                        </div>
                      </div>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        className="text-white/10 group-hover:text-white/30 transition-colors flex-shrink-0">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                    </motion.button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Stats footer */}
        {exportHistory.length > 0 && (
          <div className="px-4 py-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-white/25">
            <span>Total: {formatBytes(exportHistory.reduce((sum, r) => sum + r.size, 0))}</span>
            <span>{exportHistory.length} file(s)</span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
