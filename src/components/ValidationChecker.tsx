import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import { ASSET_TYPE_CONFIG } from '../config/presets'

interface ValidationItem {
  id: string
  label: string
  passed: boolean
  detail: string
  severity: 'error' | 'warning' | 'info'
}

export default function ValidationChecker() {
  const {
    files,
    assetType,
    selectedPreset,
    outputFormat,
    outputFolder,
    activePanel,
    setActivePanel,
  } = useAppStore()

  const config = ASSET_TYPE_CONFIG[assetType]

  const validations = useMemo((): ValidationItem[] => {
    const items: ValidationItem[] = []

    // 1. Check minimum file count
    items.push({
      id: 'file-count',
      label: 'File Count',
      passed: files.length >= config.minQuantity,
      detail: files.length >= config.minQuantity
        ? `${files.length} file(s) ready (min: ${config.minQuantity})`
        : `Need at least ${config.minQuantity} file(s), have ${files.length}`,
      severity: 'error',
    })

    // 2. Check maximum file count
    items.push({
      id: 'max-files',
      label: 'Max Files',
      passed: files.length <= config.maxQuantity,
      detail: files.length <= config.maxQuantity
        ? `Within limit (${files.length}/${config.maxQuantity})`
        : `Exceeds limit: ${files.length}/${config.maxQuantity}`,
      severity: 'error',
    })

    // 3. Check output folder
    items.push({
      id: 'output-folder',
      label: 'Output Folder',
      passed: !!outputFolder,
      detail: outputFolder ? `Set to: .../${outputFolder.split('/').pop()}` : 'No output folder selected',
      severity: 'error',
    })

    // 4. Check format compatibility
    const formatOk = assetType === 'appicon' ? outputFormat === 'png' : true
    items.push({
      id: 'format',
      label: 'Output Format',
      passed: formatOk,
      detail: formatOk
        ? `${outputFormat.toUpperCase()} is compatible with ${config.label}`
        : 'App Icons require PNG format with alpha channel',
      severity: 'error',
    })

    // 5. Check source resolution for each file
    const lowResFiles = files.filter(f =>
      f.metadata.width < selectedPreset.width || f.metadata.height < selectedPreset.height
    )
    items.push({
      id: 'resolution',
      label: 'Source Resolution',
      passed: lowResFiles.length === 0,
      detail: lowResFiles.length === 0
        ? `All files meet minimum ${selectedPreset.width}×${selectedPreset.height}`
        : `${lowResFiles.length} file(s) below target resolution — upscaling may reduce quality`,
      severity: 'warning',
    })

    // 6. Check color space (if available)
    const nonSrgb = files.filter(f => f.metadata.colorSpace && f.metadata.colorSpace !== 'srgb')
    items.push({
      id: 'color-space',
      label: 'Color Space',
      passed: nonSrgb.length === 0,
      detail: nonSrgb.length === 0
        ? 'All files are sRGB (auto-conversion enabled)'
        : `${nonSrgb.length} file(s) use non-sRGB color space — will be auto-converted`,
      severity: 'info',
    })

    // 7. Check alpha channel for icons
    if (assetType === 'appicon') {
      const noAlpha = files.filter(f => !f.metadata.hasAlpha)
      items.push({
        id: 'alpha',
        label: 'Alpha Channel',
        passed: true, // will be added during processing
        detail: noAlpha.length > 0
          ? `${noAlpha.length} file(s) without alpha — transparent background will be added`
          : 'All files have alpha channel',
        severity: 'info',
      })
    }

    // 8. Check file sizes
    const oversized = files.filter(f => f.metadata.size > config.maxFileSize)
    items.push({
      id: 'file-size',
      label: 'File Size Limit',
      passed: true, // processing will compress
      detail: oversized.length > 0
        ? `${oversized.length} file(s) exceed ${formatBytes(config.maxFileSize)} — will be compressed`
        : `All files within ${formatBytes(config.maxFileSize)} limit`,
      severity: 'info',
    })

    // 9. Check file formats
    const unsupported = files.filter(f => {
      const fmt = f.metadata.format.toLowerCase()
      return !['png', 'jpg', 'jpeg', 'tiff', 'tif', 'webp', 'heic'].includes(fmt)
    })
    items.push({
      id: 'input-format',
      label: 'Input Formats',
      passed: unsupported.length === 0,
      detail: unsupported.length === 0
        ? 'All files are supported formats'
        : `${unsupported.length} unsupported format(s)`,
      severity: 'error',
    })

    return items
  }, [files, assetType, selectedPreset, outputFormat, outputFolder, config])

  const passedCount = validations.filter(v => v.passed).length
  const totalCount = validations.length
  const allPassed = passedCount === totalCount
  const hasErrors = validations.some(v => !v.passed && v.severity === 'error')

  if (activePanel !== 'validation') return null

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
            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
              allPassed ? 'bg-apple-green/20' : hasErrors ? 'bg-apple-red/20' : 'bg-apple-orange/20'
            }`}>
              {allPassed ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={hasErrors ? '#FF3B30' : '#FF9500'} strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              )}
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-white/80">Validation</h3>
              <p className="text-[10px] text-white/30">{passedCount}/{totalCount} checks passed</p>
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

        {/* Progress ring */}
        <div className="flex justify-center py-5">
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4"/>
              <circle
                cx="40" cy="40" r="34"
                fill="none"
                stroke={allPassed ? '#34C759' : hasErrors ? '#FF3B30' : '#FF9500'}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - passedCount / totalCount)}`}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-[18px] font-bold ${allPassed ? 'text-apple-green' : hasErrors ? 'text-apple-red' : 'text-apple-orange'}`}>
                {Math.round((passedCount / totalCount) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Validation items */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {validations.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-3 rounded-lg border transition-all ${
                item.passed
                  ? 'bg-apple-green/5 border-apple-green/10'
                  : item.severity === 'error'
                    ? 'bg-apple-red/5 border-apple-red/10'
                    : item.severity === 'warning'
                      ? 'bg-apple-orange/5 border-apple-orange/10'
                      : 'bg-apple-blue/5 border-apple-blue/10'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5 flex-shrink-0">
                  {item.passed ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : item.severity === 'error' ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  ) : item.severity === 'warning' ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FF9500" strokeWidth="2.5">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-white/70">{item.label}</div>
                  <div className="text-[10px] text-white/35 mt-0.5 leading-relaxed">{item.detail}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Status bar */}
        <div className={`px-4 py-3 border-t border-white/[0.06] text-center text-[11px] font-medium ${
          allPassed ? 'text-apple-green' : hasErrors ? 'text-apple-red' : 'text-apple-orange'
        }`}>
          {allPassed ? '✓ Ready for submission' : hasErrors ? '✕ Fix errors before processing' : '⚠ Warnings — processing may proceed'}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
