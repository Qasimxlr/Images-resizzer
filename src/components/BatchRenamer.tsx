import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'

const TEMPLATE_VARS = [
  { key: '{type}', label: 'Asset type', example: 'AppIcon' },
  { key: '{width}', label: 'Width', example: '512' },
  { key: '{height}', label: 'Height', example: '512' },
  { key: '{index}', label: 'Sequence #', example: '1' },
  { key: '{date}', label: 'Date', example: '2024-01-15' },
  { key: '{time}', label: 'Time', example: '143052' },
  { key: '{original}', label: 'Original name', example: 'myicon' },
  { key: '{format}', label: 'Format', example: 'png' },
]

export default function BatchRenamer() {
  const {
    namingTemplate,
    setNamingTemplate,
    activePanel,
    setActivePanel,
    assetType,
    selectedPreset,
    files,
  } = useAppStore()

  const [previewNames, setPreviewNames] = useState<string[]>([])

  if (activePanel !== 'renamer') return null

  const typeNames: Record<string, string> = {
    appicon: 'AppIcon',
    feature: 'FeatureGraphic',
    phone: 'PhoneScreenshot',
    tablet: 'TabletScreenshot',
  }

  const generatePreview = (template: string, idx: number, filename?: string): string => {
    const now = new Date()
    const base = filename ? filename.replace(/\.[^/.]+$/, '') : 'image'

    return template
      .replace(/\{type\}/g, typeNames[assetType] || 'Asset')
      .replace(/\{width\}/g, String(selectedPreset.width))
      .replace(/\{height\}/g, String(selectedPreset.height))
      .replace(/\{index\}/g, String(idx + 1))
      .replace(/\{date\}/g, now.toISOString().slice(0, 10))
      .replace(/\{time\}/g, now.toTimeString().slice(0, 8).replace(/:/g, ''))
      .replace(/\{original\}/g, base)
      .replace(/\{format\}/g, 'png')
  }

  const insertVar = (varKey: string) => {
    setNamingTemplate(namingTemplate + varKey)
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
            <div className="w-6 h-6 rounded-md bg-apple-teal/20 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5AC8FA" strokeWidth="2">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-white/80">Batch Rename</h3>
              <p className="text-[10px] text-white/30">Custom naming template</p>
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

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Template input */}
          <div>
            <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-2 block">
              Naming Template
            </label>
            <input
              type="text"
              value={namingTemplate}
              onChange={(e) => setNamingTemplate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08]
                text-[12px] text-white/80 font-mono focus:border-apple-blue/40 focus:ring-1
                focus:ring-apple-blue/20 outline-none transition-all placeholder:text-white/15"
              placeholder="{type}_{width}x{height}_{index}"
            />
          </div>

          {/* Quick presets */}
          <div>
            <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-2 block">
              Quick Presets
            </label>
            <div className="space-y-1">
              {[
                { label: 'Default', template: '{type}_{width}x{height}_{index}' },
                { label: 'Date + Type', template: '{date}_{type}_{index}' },
                { label: 'Original Name', template: '{original}_{width}x{height}' },
                { label: 'Store Ready', template: '{type}-{index}-{width}x{height}' },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setNamingTemplate(preset.template)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all ${
                    namingTemplate === preset.template
                      ? 'bg-apple-blue/10 border border-apple-blue/20'
                      : 'bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="text-[11px] text-white/60">{preset.label}</span>
                  <span className="text-[9px] font-mono text-white/25">{preset.template}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Variable chips */}
          <div>
            <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-2 block">
              Insert Variable
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_VARS.map((v) => (
                <button
                  key={v.key}
                  onClick={() => insertVar(v.key)}
                  className="px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.06]
                    text-[10px] font-mono text-white/40 hover:text-apple-teal
                    hover:bg-apple-teal/10 hover:border-apple-teal/20 transition-all"
                  title={`${v.label} — e.g. "${v.example}"`}
                >
                  {v.key}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-2 block">
              Preview
            </label>
            <div className="space-y-1 p-3 rounded-lg bg-black/30 border border-white/[0.04]">
              {(files.length > 0 ? files.slice(0, 5) : [null, null, null]).map((file, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-[9px] text-white/15 font-mono w-4 text-right">{idx + 1}.</span>
                  <span className="text-[10px] font-mono text-apple-teal/70 truncate">
                    {generatePreview(namingTemplate, idx, file?.filename)}.{assetType === 'appicon' ? 'png' : 'jpg'}
                  </span>
                </div>
              ))}
              {files.length > 5 && (
                <div className="text-[9px] text-white/15 pl-6">+{files.length - 5} more...</div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
