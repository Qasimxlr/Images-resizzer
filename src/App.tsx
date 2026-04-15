import { useEffect, useCallback } from 'react'
import { useAppStore } from './store/useAppStore'
import { AssetType } from './types'
import Sidebar from './components/Sidebar'
import PreviewCanvas from './components/PreviewCanvas'
import BatchQueue from './components/BatchQueue'
import DropZone from './components/DropZone'
import Notifications from './components/Notifications'
import ProcessingOverlay from './components/ProcessingOverlay'
import ValidationChecker from './components/ValidationChecker'
import ExportHistory from './components/ExportHistory'
import BatchRenamer from './components/BatchRenamer'
import ShortcutsPanel from './components/ShortcutsPanel'

function App() {
  const { files, setAssetType, isProcessing, activePanel } = useAppStore()

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey) {
      switch (e.key) {
        case '1':
          e.preventDefault()
          setAssetType('appicon')
          break
        case '2':
          e.preventDefault()
          setAssetType('feature')
          break
        case '3':
          e.preventDefault()
          setAssetType('phone')
          break
        case '4':
          e.preventDefault()
          setAssetType('tablet')
          break
        case 'o':
        case 'O':
          e.preventDefault()
          handleOpenFiles()
          break
        case 'e':
        case 'E':
          e.preventDefault()
          window.dispatchEvent(new CustomEvent('trigger-export'))
          break
        case '0':
          e.preventDefault()
          useAppStore.getState().setZoom(1)
          break
        case '=':
        case '+':
          e.preventDefault()
          useAppStore.getState().setZoom(useAppStore.getState().zoom + 0.1)
          break
        case '-':
          e.preventDefault()
          useAppStore.getState().setZoom(useAppStore.getState().zoom - 0.1)
          break
      }
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      const state = useAppStore.getState()
      if (state.selectedFileId && !isProcessing) {
        state.removeFile(state.selectedFileId)
      }
    }

    if (e.key === '?') {
      const state = useAppStore.getState()
      state.setActivePanel('shortcuts')
    }
  }, [setAssetType, isProcessing])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleOpenFiles = async () => {
    if (typeof window.electronAPI === 'undefined') return
    try {
      const filePaths = await window.electronAPI.openFileDialog()
      if (filePaths.length === 0) return

      for (const fp of filePaths) {
        const result = await window.electronAPI.readImageFile(fp)
        if (result.error || !result.base64 || !result.metadata) continue

        const imageFile = {
          id: crypto.randomUUID(),
          filename: result.filename!,
          filepath: result.filepath!,
          base64: result.base64,
          metadata: result.metadata,
          status: 'pending' as const,
          progress: 0,
        }

        useAppStore.getState().addFiles([imageFile])
        if (!useAppStore.getState().selectedFileId) {
          useAppStore.getState().setSelectedFileId(imageFile.id)
        }
      }
    } catch (err) {
      console.error('Failed to open files:', err)
    }
  }

  return (
    <div className="h-full w-full flex flex-col select-none-ui overflow-hidden bg-apple-gray-950">
      {/* Titlebar drag region */}
      <div className="titlebar-drag h-[52px] flex-shrink-0 flex items-end justify-between px-[88px] pb-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-apple-blue to-apple-indigo flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
          <span className="text-[13px] font-semibold text-white/80 tracking-tight">Asset Resizer Pro</span>
          <span className="text-[10px] text-white/15 font-mono ml-1">v1.0.1</span>
        </div>

        {/* Right toolbar for panels */}
        <div className="flex items-center gap-1 titlebar-no-drag">
          <ToolbarButton
            active={activePanel === 'validation'}
            onClick={() => useAppStore.getState().setActivePanel('validation')}
            label="Validation"
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
          />
          <ToolbarButton
            active={activePanel === 'renamer'}
            onClick={() => useAppStore.getState().setActivePanel('renamer')}
            label="Rename"
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>}
          />
          <ToolbarButton
            active={activePanel === 'history'}
            onClick={() => useAppStore.getState().setActivePanel('history')}
            label="History"
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
          />
          <ToolbarButton
            active={activePanel === 'shortcuts'}
            onClick={() => useAppStore.getState().setActivePanel('shortcuts')}
            label="Shortcuts"
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h8"/></svg>}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar onOpenFiles={handleOpenFiles} />

        {/* Main area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {files.length === 0 ? (
            <DropZone />
          ) : (
            <>
              <PreviewCanvas />
              <BatchQueue />
            </>
          )}
        </div>

        {/* Right panels */}
        <ValidationChecker />
        <ExportHistory />
        <BatchRenamer />
        <ShortcutsPanel />
      </div>

      {/* Overlays */}
      {isProcessing && <ProcessingOverlay />}
      <Notifications />
    </div>
  )
}

function ToolbarButton({ active, onClick, label, icon }: {
  active: boolean
  onClick: () => void
  label: string
  icon: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] transition-all duration-200 ${
        active
          ? 'bg-white/[0.08] text-white/70 border border-white/[0.1]'
          : 'text-white/25 hover:text-white/40 hover:bg-white/[0.04] border border-transparent'
      }`}
      title={label}
    >
      {icon}
      <span className="hidden lg:inline">{label}</span>
    </button>
  )
}

export default App
