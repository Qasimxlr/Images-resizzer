import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import { ASSET_PRESETS, ASSET_TYPE_CONFIG } from '../config/presets'
import { AssetType } from '../types'
import { WatermarkControls } from './WatermarkOverlay'

interface SidebarProps {
  onOpenFiles: () => void
}

export default function Sidebar({ onOpenFiles }: SidebarProps) {
  const {
    assetType,
    setAssetType,
    selectedPreset,
    setSelectedPreset,
    outputFormat,
    setOutputFormat,
    outputQuality,
    setOutputQuality,
    outputFolder,
    setOutputFolder,
    files,
    isProcessing,
    addNotification,
  } = useAppStore()

  const [isExporting, setIsExporting] = useState(false)

  const config = ASSET_TYPE_CONFIG[assetType]
  const presets = ASSET_PRESETS[assetType]

  const handleSelectFolder = async () => {
    if (typeof window.electronAPI === 'undefined') {
      // Fallback for browser dev
      setOutputFolder('/Users/dev/Desktop/AssetGen-Output')
      addNotification({ type: 'info', message: 'Demo mode: folder selection simulated' })
      return
    }
    const folder = await window.electronAPI.selectOutputFolder()
    if (folder) {
      setOutputFolder(folder)
      addNotification({ type: 'success', message: `Output folder set to ${folder.split('/').pop()}` })
    }
  }

  const handleProcessAll = async () => {
    if (files.length === 0) {
      addNotification({ type: 'warning', message: 'No images to process' })
      return
    }
    if (!outputFolder) {
      addNotification({ type: 'warning', message: 'Please select an output folder first' })
      return
    }

    const store = useAppStore.getState()
    store.setIsProcessing(true)
    store.setProcessingProgress(0)

    let processed = 0
    const total = files.length

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      store.updateFile(file.id, { status: 'processing', progress: 0 })

      try {
        if (typeof window.electronAPI !== 'undefined') {
          const result = await window.electronAPI.processImage({
            inputPath: file.filepath,
            inputBase64: file.base64,
            outputDir: outputFolder,
            type: assetType,
            preset: selectedPreset.id,
            format: outputFormat,
            quality: outputQuality,
            width: selectedPreset.width,
            height: selectedPreset.height,
            maintainAspect: true,
            index: i,
            originalFilename: file.filename,
            transform: file.transform,
          })

          if (result.success) {
            store.updateFile(file.id, { status: 'done', progress: 100, result })
            store.addExportRecord({
              filename: result.filename || file.filename,
              type: assetType,
              dimensions: `${selectedPreset.width}x${selectedPreset.height}`,
              format: outputFormat,
              size: result.size || 0,
              outputPath: result.outputPath || '',
              timestamp: new Date().toISOString(),
            })
            processed++
          } else {
            store.updateFile(file.id, { status: 'error', progress: 0 })
            addNotification({ type: 'error', message: `Failed to process ${file.filename}: ${result.error}` })
          }
        } else {
          // Simulate processing in browser
          await new Promise(r => setTimeout(r, 800))
          store.updateFile(file.id, { status: 'done', progress: 100 })
          processed++
        }
      } catch (err: any) {
        store.updateFile(file.id, { status: 'error', progress: 0 })
        addNotification({ type: 'error', message: `Error processing ${file.filename}` })
      }

      store.setProcessingProgress(((i + 1) / total) * 100)
    }

    store.setIsProcessing(false)
    addNotification({
      type: processed === total ? 'success' : 'warning',
      message: `Processed ${processed}/${total} images successfully`,
    })
  }

  // Listen for export trigger from keyboard shortcut
  useEffect(() => {
    const handler = () => handleProcessAll()
    window.addEventListener('trigger-export', handler)
    return () => window.removeEventListener('trigger-export', handler)
  }, [files, outputFolder, assetType, selectedPreset, outputFormat, outputQuality])

  const assetTypes: AssetType[] = ['appicon', 'feature', 'phone', 'tablet']

  return (
    <div className="w-[280px] flex-shrink-0 sidebar-glass border-r border-white/[0.06] flex flex-col overflow-hidden">
      {/* Asset Type Selection */}
      <div className="p-4 pt-2">
        <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-2 block">
          Asset Type
        </label>
        <div className="space-y-1">
          {assetTypes.map((type, idx) => {
            const cfg = ASSET_TYPE_CONFIG[type]
            const isActive = assetType === type
            return (
              <motion.button
                key={type}
                onClick={() => setAssetType(type)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 titlebar-no-drag ${
                  isActive
                    ? 'bg-apple-blue/20 border border-apple-blue/30 shadow-lg shadow-apple-blue/10'
                    : 'hover:bg-white/[0.04] border border-transparent'
                }`}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-lg">{cfg.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className={`text-[13px] font-medium ${isActive ? 'text-apple-blue' : 'text-white/80'}`}>
                    {cfg.label}
                  </div>
                  <div className="text-[10px] text-white/30 truncate">{cfg.description}</div>
                </div>
                <span className="text-[10px] text-white/20 font-mono">⌘{idx + 1}</span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-white/[0.06]" />

      {/* Preset Selection */}
      <div className="p-4 flex-1 overflow-y-auto">
        <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-2 block">
          Size Preset
        </label>
        <div className="space-y-1 mb-4">
          <AnimatePresence mode="wait">
            {presets.map((preset) => {
              const isActive = selectedPreset.id === preset.id
              return (
                <motion.button
                  key={preset.id}
                  onClick={() => setSelectedPreset(preset)}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 titlebar-no-drag ${
                    isActive
                      ? 'bg-white/[0.08] border border-white/[0.12]'
                      : 'hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    isActive ? 'bg-apple-blue shadow-sm shadow-apple-blue/50' : 'bg-white/20'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className={`text-[12px] font-medium ${isActive ? 'text-white' : 'text-white/60'}`}>
                      {preset.label}
                    </div>
                    <div className="text-[10px] text-white/25">{preset.description}</div>
                  </div>
                </motion.button>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Format Selection */}
        <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-2 block">
          Output Format
        </label>
        <div className="flex gap-2 mb-4 titlebar-no-drag">
          {(['png', 'jpeg'] as const).map((fmt) => (
            <button
              key={fmt}
              onClick={() => setOutputFormat(fmt)}
              disabled={assetType === 'appicon' && fmt === 'jpeg'}
              className={`flex-1 px-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-200 ${
                outputFormat === fmt
                  ? 'bg-apple-blue/20 text-apple-blue border border-apple-blue/30'
                  : 'bg-white/[0.04] text-white/50 border border-white/[0.06] hover:bg-white/[0.06]'
              } ${assetType === 'appicon' && fmt === 'jpeg' ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              {fmt.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Quality Slider (for JPEG) */}
        {outputFormat === 'jpeg' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 titlebar-no-drag"
          >
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">Quality</label>
              <span className="text-[12px] text-apple-blue font-mono">{outputQuality}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              value={outputQuality}
              onChange={(e) => setOutputQuality(Number(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5
                [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-apple-blue [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:shadow-apple-blue/30 [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </motion.div>
        )}

        {/* Output Folder */}
        <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-2 block">
          Output Folder
        </label>
        <button
          onClick={handleSelectFolder}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06]
            hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-200 text-left group titlebar-no-drag"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-apple-blue flex-shrink-0">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          <span className={`text-[12px] truncate flex-1 ${outputFolder ? 'text-white/70' : 'text-white/30'}`}>
            {outputFolder ? outputFolder.split('/').slice(-2).join('/') : 'Select folder...'}
          </span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/20 group-hover:text-white/40 transition-colors">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>

        {/* Watermark */}
        <div className="mt-4 titlebar-no-drag">
          <WatermarkControls />
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-white/[0.06]" />

      {/* Process Button */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-white/40">
            {files.length} image{files.length !== 1 ? 's' : ''} queued
          </span>
          <span className="text-[10px] text-white/20 font-mono">⌘E</span>
        </div>
        <motion.button
          onClick={handleProcessAll}
          disabled={isProcessing || files.length === 0}
          className={`w-full py-3 px-4 rounded-xl font-semibold text-[13px] transition-all duration-300 titlebar-no-drag ${
            files.length > 0 && !isProcessing
              ? 'bg-gradient-to-r from-apple-blue to-apple-indigo text-white shadow-lg shadow-apple-blue/25 hover:shadow-xl hover:shadow-apple-blue/30 active:scale-[0.98]'
              : 'bg-white/[0.06] text-white/25 cursor-not-allowed'
          }`}
          whileTap={files.length > 0 && !isProcessing ? { scale: 0.98 } : {}}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Processing...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Process All
            </span>
          )}
        </motion.button>

        {/* Open files button */}
        <button
          onClick={onOpenFiles}
          className="w-full mt-2 py-2 px-4 rounded-lg text-[12px] text-white/40 hover:text-white/60
            bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] hover:border-white/[0.08]
            transition-all duration-200 flex items-center justify-center gap-2 titlebar-no-drag"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Images
        </button>
      </div>
    </div>
  )
}
