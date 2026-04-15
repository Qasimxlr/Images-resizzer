import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import { KEYBOARD_SHORTCUTS } from '../config/presets'

export default function ShortcutsPanel() {
  const { activePanel, setActivePanel } = useAppStore()

  if (activePanel !== 'shortcuts') return null

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
            <div className="w-6 h-6 rounded-md bg-apple-purple/20 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#AF52DE" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h8M6 16h.01M18 16h.01M10 16h4"/>
              </svg>
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-white/80">Keyboard Shortcuts</h3>
              <p className="text-[10px] text-white/30">Quick reference</p>
            </div>
          </div>
          <button
            onClick={() => setActivePanel('none')}
            className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {KEYBOARD_SHORTCUTS.map((shortcut, idx) => (
            <motion.div
              key={shortcut.key}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.03] transition-all"
            >
              <span className="text-[12px] text-white/50">{shortcut.action}</span>
              <kbd className="px-2 py-1 rounded-md bg-white/[0.06] border border-white/[0.08]
                text-[10px] font-mono text-white/40 min-w-[40px] text-center shadow-sm
                shadow-black/20">
                {shortcut.key}
              </kbd>
            </motion.div>
          ))}
        </div>

        {/* Tips section */}
        <div className="p-4 border-t border-white/[0.06]">
          <div className="p-3 rounded-lg bg-apple-purple/5 border border-apple-purple/10">
            <div className="flex items-start gap-2">
              <span className="text-[11px]">💡</span>
              <div>
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Hold <kbd className="px-1 py-0.5 rounded bg-white/[0.06] text-[9px] font-mono">Alt</kbd> and drag to pan the preview canvas at any time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
