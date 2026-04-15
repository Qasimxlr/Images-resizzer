import { useRef, useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import DeviceFrame from './DeviceFrame'
import WatermarkOverlay from './WatermarkOverlay'

export default function PreviewCanvas() {
  const {
    files,
    selectedFileId,
    zoom,
    setZoom,
    isPanning,
    setIsPanning,
    showGuides,
    toggleGuides,
    showBeforeAfter,
    toggleBeforeAfter,
    showDeviceFrame,
    toggleDeviceFrame,
    selectedPreset,
    assetType,
    setFileTransform,
  } = useAppStore()

  const containerRef = useRef<HTMLDivElement>(null)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isDraggingImage, setIsDraggingImage] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [splitPosition, setSplitPosition] = useState(50)
  const [isDraggingSplit, setIsDraggingSplit] = useState(false)

  const selectedFile = files.find(f => f.id === selectedFileId)

  // Sync image transform when file changes
  useEffect(() => {
    if (selectedFile && !selectedFile.transform) {
      setFileTransform(selectedFile.id, { x: 0, y: 0, scale: 1 })
    }
  }, [selectedFileId])

  // Handle wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    if (e.ctrlKey || e.metaKey) {
      // Zoom image within frame
      if (selectedFile) {
        const delta = e.deltaY > 0 ? -0.05 : 0.05
        const currentScale = selectedFile.transform?.scale || 1
        const newScale = Math.max(0.1, Math.min(10, currentScale + delta))
        setFileTransform(selectedFile.id, {
          ...selectedFile.transform!,
          scale: newScale,
        })
      }
    } else {
      // Global zoom
      const delta = e.deltaY > 0 ? -0.05 : 0.05
      const newZoom = Math.max(0.1, Math.min(5, zoom + delta))
      setZoom(newZoom)
    }
  }, [zoom, setZoom, selectedFile, setFileTransform])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // Pan handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    
    // Check if we are dragging the image (inside the target frame)
    const target = e.target as HTMLElement
    const isInsideFrame = target.closest('.target-frame')

    if (isInsideFrame && !isPanning && !e.altKey) {
      setIsDraggingImage(true)
      const current = selectedFile?.transform || { x: 0, y: 0, scale: 1 }
      setDragStart({ x: e.clientX - current.x, y: e.clientY - current.y })
      return
    }

    if (isPanning || e.altKey) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
    if (isDraggingImage && selectedFile) {
      setFileTransform(selectedFile.id, {
        ...selectedFile.transform!,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
    if (isDraggingSplit && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const pos = ((e.clientX - rect.left) / rect.width) * 100
      setSplitPosition(Math.max(10, Math.min(90, pos)))
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setIsDraggingImage(false)
    setIsDraggingSplit(false)
  }

  const handleFitToScreen = () => {
    setZoom(1)
    setPanOffset({ x: 0, y: 0 })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const isScreenshotType = assetType === 'phone' || assetType === 'tablet'

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex-shrink-0 h-10 flex items-center justify-between px-4 border-b border-white/[0.06] bg-apple-gray-950/80">
        {/* Left: Image info */}
        <div className="flex items-center gap-3">
          {selectedFile && (
            <>
              <span className="text-[11px] text-white/40 font-medium truncate max-w-[180px]">
                {selectedFile.filename}
              </span>
              <div className="h-3 w-px bg-white/10" />
              <span className="text-[11px] font-mono text-white/30">
                {selectedFile.metadata.width} × {selectedFile.metadata.height}
              </span>
              <div className="h-3 w-px bg-white/10" />
              <span className="text-[11px] font-mono text-white/30">
                {formatFileSize(selectedFile.metadata.size)}
              </span>
              <div className="h-3 w-px bg-white/10" />
              <span className="text-[11px] font-mono text-white/30 uppercase">
                {selectedFile.metadata.format}
              </span>
              {selectedFile.metadata.hasAlpha && (
                <>
                  <div className="h-3 w-px bg-white/10" />
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-apple-purple/20 text-apple-purple font-medium">α</span>
                </>
              )}
            </>
          )}
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1">
          {/* Guides toggle */}
          <button
            onClick={toggleGuides}
            className={`px-2 py-1 rounded text-[11px] transition-all duration-200 ${
              showGuides
                ? 'bg-apple-blue/20 text-apple-blue'
                : 'text-white/30 hover:text-white/50 hover:bg-white/[0.04]'
            }`}
            title="Toggle Guides (Grid)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/>
              <line x1="2" y1="8" x2="22" y2="8" opacity="0.3"/><line x1="2" y1="16" x2="22" y2="16" opacity="0.3"/>
              <line x1="8" y1="2" x2="8" y2="22" opacity="0.3"/><line x1="16" y1="2" x2="16" y2="22" opacity="0.3"/>
            </svg>
          </button>

          {/* Before/After toggle */}
          <button
            onClick={toggleBeforeAfter}
            className={`px-2 py-1 rounded text-[11px] transition-all duration-200 ${
              showBeforeAfter
                ? 'bg-apple-orange/20 text-apple-orange'
                : 'text-white/30 hover:text-white/50 hover:bg-white/[0.04]'
            }`}
            title="Before/After Comparison"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3" width="20" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/>
              <path d="M8 12l-3 3 3 3" opacity="0.5"/><path d="M16 12l3-3-3-3" opacity="0.5"/>
            </svg>
          </button>

          {/* Device Frame toggle (only for screenshots) */}
          {isScreenshotType && (
            <button
              onClick={toggleDeviceFrame}
              className={`px-2 py-1 rounded text-[11px] transition-all duration-200 ${
                showDeviceFrame
                  ? 'bg-apple-green/20 text-apple-green'
                  : 'text-white/30 hover:text-white/50 hover:bg-white/[0.04]'
              }`}
              title="Device Frame Overlay"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                <line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
            </button>
          )}

          {/* Pan tool */}
          <button
            onClick={() => setIsPanning(!isPanning)}
            className={`px-2 py-1 rounded text-[11px] transition-all duration-200 ${
              isPanning
                ? 'bg-apple-blue/20 text-apple-blue'
                : 'text-white/30 hover:text-white/50 hover:bg-white/[0.04]'
            }`}
            title="Pan Tool (Alt+Drag)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
              <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/>
              <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/>
              <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
            </svg>
          </button>

          <div className="h-4 w-px bg-white/[0.06] mx-1" />

          {/* Zoom controls */}
          <button
            onClick={() => setZoom(zoom - 0.1)}
            className="px-1.5 py-1 rounded text-white/30 hover:text-white/50 hover:bg-white/[0.04] transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>

          <button
            onClick={handleFitToScreen}
            className="px-2 py-1 rounded text-[11px] font-mono text-white/40 hover:text-white/60 hover:bg-white/[0.04] transition-all min-w-[48px] text-center"
          >
            {Math.round(zoom * 100)}%
          </button>

          <button
            onClick={() => setZoom(zoom + 0.1)}
            className="px-1.5 py-1 rounded text-white/30 hover:text-white/50 hover:bg-white/[0.04] transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>

          <div className="h-4 w-px bg-white/[0.06] mx-1" />
          {[0.5, 1, 2].map((z) => (
            <button
              key={z}
              onClick={() => { setZoom(z); setPanOffset({ x: 0, y: 0 }) }}
              className={`px-2 py-1 rounded text-[10px] font-mono transition-all duration-200 ${
                Math.abs(zoom - z) < 0.05
                  ? 'bg-white/[0.08] text-white/60'
                  : 'text-white/25 hover:text-white/40 hover:bg-white/[0.04]'
              }`}
            >
              {z * 100}%
            </button>
          ))}
        </div>
      </div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-hidden relative ${
          assetType === 'appicon' ? 'checkerboard' : 'bg-apple-gray-950'
        } ${isPanning || isDragging ? 'cursor-grab' : ''} ${isDragging ? '!cursor-grabbing' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {selectedFile ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="relative transition-transform duration-75"
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
              }}
            >
              <DeviceFrame presetWidth={selectedPreset.width} presetHeight={selectedPreset.height}>
                {/* Target dimension frame */}
                <div
                  className="target-frame relative border border-dashed border-white/10 bg-black/20 overflow-hidden"
                  style={{
                    width: `${Math.min(selectedPreset.width * 0.3, 500)}px`,
                    height: `${Math.min(selectedPreset.height * 0.3, 600)}px`,
                  }}
                >
                  {/* Before/After split view */}
                  {showBeforeAfter ? (
                    <div className="relative w-full h-full">
                      {/* "After" - processed/fitted image */}
                      <img
                        src={selectedFile.base64}
                        alt="After"
                        className="absolute inset-0 w-full h-full object-cover origin-center"
                        style={{
                          transform: `translate(${selectedFile.transform?.x || 0}px, ${selectedFile.transform?.y || 0}px) scale(${selectedFile.transform?.scale || 1})`,
                        }}
                        draggable={false}
                      />
                      {/* "Before" - original with letterboxing visible */}
                      <div
                        className="absolute top-0 left-0 h-full overflow-hidden border-r-2 border-apple-orange"
                        style={{ width: `${splitPosition}%` }}
                      >
                        <img
                          src={selectedFile.base64}
                          alt="Before"
                          className="h-full object-contain"
                          style={{
                            width: `${100 / (splitPosition / 100)}%`,
                            maxWidth: 'none',
                            filter: 'none',
                          }}
                          draggable={false}
                        />
                        {/* "Before" label */}
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-[9px] text-white/60 font-mono text-center">
                          ORIGINAL
                        </div>
                      </div>
                      {/* "After" label */}
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[9px] text-white/60 font-mono text-center">
                        PROCESSED
                      </div>
                      {/* Draggable split handle */}
                      <div
                        className="absolute top-0 h-full w-4 cursor-col-resize flex items-center justify-center z-20"
                        style={{ left: `calc(${splitPosition}% - 8px)` }}
                        onMouseDown={(e) => { e.stopPropagation(); setIsDraggingSplit(true) }}
                      >
                        <div className="w-6 h-6 rounded-full bg-apple-orange flex items-center justify-center shadow-lg shadow-apple-orange/30">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <polyline points="15 18 9 12 15 6"/><polyline points="9 18 15 12 9 6" transform="translate(6,0)"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={selectedFile.base64}
                      alt={selectedFile.filename}
                      className="absolute inset-0 w-full h-full object-cover origin-center"
                      style={{
                        transform: `translate(${selectedFile.transform?.x || 0}px, ${selectedFile.transform?.y || 0}px) scale(${selectedFile.transform?.scale || 1})`,
                      }}
                      draggable={false}
                    />
                  )}

                  {/* Watermark overlay */}
                  <WatermarkOverlay />

                  {/* Smart Guides */}
                  {showGuides && !showBeforeAfter && (
                    <>
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-0 left-1/2 w-px h-full bg-apple-blue/30 -translate-x-px" />
                        <div className="absolute top-1/2 left-0 h-px w-full bg-apple-blue/30 -translate-y-px" />
                      </div>
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-0 left-1/3 w-px h-full bg-apple-orange/15" />
                        <div className="absolute top-0 left-2/3 w-px h-full bg-apple-orange/15" />
                        <div className="absolute top-1/3 left-0 h-px w-full bg-apple-orange/15" />
                        <div className="absolute top-2/3 left-0 h-px w-full bg-apple-orange/15" />
                      </div>
                      {assetType === 'feature' && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                          <div
                            className="border border-dashed border-apple-green/30 bg-apple-green/5 h-full"
                            style={{ width: `${(400 / selectedPreset.width) * 100}%` }}
                          >
                            <span className="absolute top-1 left-1 text-[8px] text-apple-green/50 font-mono">SAFE ZONE</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Dimension label */}
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-white/20 whitespace-nowrap">
                    {selectedPreset.width} × {selectedPreset.height}
                  </div>

                  {/* Status badge */}
                  {selectedFile.status === 'done' && !showBeforeAfter && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md bg-apple-green/20 border border-apple-green/30"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      <span className="text-[10px] text-apple-green font-medium">Processed</span>
                    </motion.div>
                  )}

                  {selectedFile.status === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md bg-apple-red/20 border border-apple-red/30"
                    >
                      <span className="text-[10px] text-apple-red font-medium">Error</span>
                    </motion.div>
                  )}
                </div>
              </DeviceFrame>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-[48px] mb-3 opacity-20">🖼️</div>
              <p className="text-[13px] text-white/20">Select an image from the queue below</p>
            </div>
          </div>
        )}

        {/* Resolution warning */}
        {selectedFile && selectedFile.metadata.width < selectedPreset.width && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 rounded-lg
              bg-apple-orange/10 border border-apple-orange/20 backdrop-blur-sm z-20"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF9500" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span className="text-[11px] text-apple-orange font-medium">
              Source ({selectedFile.metadata.width}×{selectedFile.metadata.height}) &lt; target ({selectedPreset.width}×{selectedPreset.height})
            </span>
          </motion.div>
        )}
      </div>
    </div>
  )
}
