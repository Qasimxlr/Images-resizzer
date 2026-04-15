import { create } from 'zustand'
import { AssetType, ImageFile, AssetPreset } from '../types'
import { ASSET_PRESETS, ASSET_TYPE_CONFIG } from '../config/presets'

export type ActivePanel = 'none' | 'validation' | 'history' | 'renamer' | 'shortcuts'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

export interface ExportRecord {
  id: string
  filename: string
  type: AssetType
  dimensions: string
  format: string
  size: number
  outputPath: string
  timestamp: string
}

interface AppState {
  // Asset type selection
  assetType: AssetType
  setAssetType: (type: AssetType) => void

  // Preset
  selectedPreset: AssetPreset
  setSelectedPreset: (preset: AssetPreset) => void

  // Output
  outputFormat: 'png' | 'jpeg'
  setOutputFormat: (format: 'png' | 'jpeg') => void
  outputQuality: number
  setOutputQuality: (quality: number) => void

  // Output folder
  outputFolder: string | null
  setOutputFolder: (folder: string | null) => void

  // Custom naming template
  namingTemplate: string
  setNamingTemplate: (template: string) => void

  // Files
  files: ImageFile[]
  addFiles: (files: ImageFile[]) => void
  removeFile: (id: string) => void
  clearFiles: () => void
  updateFile: (id: string, updates: Partial<ImageFile>) => void
  setFileTransform: (id: string, transform: { x: number, y: number, scale: number }) => void

  // Selected file for preview
  selectedFileId: string | null
  setSelectedFileId: (id: string | null) => void

  // Zoom
  zoom: number
  setZoom: (zoom: number) => void

  // Pan
  isPanning: boolean
  setIsPanning: (panning: boolean) => void

  // Processing
  isProcessing: boolean
  setIsProcessing: (processing: boolean) => void
  processingProgress: number
  setProcessingProgress: (progress: number) => void

  // UI State
  showGuides: boolean
  toggleGuides: () => void
  showBeforeAfter: boolean
  toggleBeforeAfter: () => void
  showDeviceFrame: boolean
  toggleDeviceFrame: () => void

  // Active panel (right side or modal)
  activePanel: ActivePanel
  setActivePanel: (panel: ActivePanel) => void

  // Export history
  exportHistory: ExportRecord[]
  addExportRecord: (record: Omit<ExportRecord, 'id'>) => void
  clearExportHistory: () => void

  // Watermark
  watermarkText: string
  setWatermarkText: (text: string) => void
  watermarkEnabled: boolean
  toggleWatermark: () => void

  // Notifications
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  assetType: 'appicon',
  setAssetType: (type) => {
    const presets = ASSET_PRESETS[type]
    const config = ASSET_TYPE_CONFIG[type]
    set({
      assetType: type,
      selectedPreset: presets[0],
      outputFormat: config.defaultFormat,
    })
  },

  selectedPreset: ASSET_PRESETS.appicon[0],
  setSelectedPreset: (preset) => set({ selectedPreset: preset }),

  outputFormat: 'png',
  setOutputFormat: (format) => set({ outputFormat: format }),
  outputQuality: 90,
  setOutputQuality: (quality) => set({ outputQuality: quality }),

  outputFolder: null,
  setOutputFolder: (folder) => set({ outputFolder: folder }),

  namingTemplate: '{type}_{width}x{height}_{index}',
  setNamingTemplate: (template) => set({ namingTemplate: template }),

  files: [],
  addFiles: (newFiles) => set((state) => {
    const config = ASSET_TYPE_CONFIG[state.assetType]
    const remaining = config.maxQuantity - state.files.length
    const toAdd = newFiles.slice(0, Math.max(0, remaining))
    return { files: [...state.files, ...toAdd] }
  }),
  removeFile: (id) => set((state) => {
    const files = state.files.filter(f => f.id !== id)
    const selectedFileId = state.selectedFileId === id
      ? (files.length > 0 ? files[0].id : null)
      : state.selectedFileId
    return { files, selectedFileId }
  }),
  clearFiles: () => set({ files: [], selectedFileId: null }),
  updateFile: (id, updates) => set((state) => ({
    files: state.files.map(f => f.id === id ? { ...f, ...updates } : f)
  })),
  setFileTransform: (id, transform) => set((state) => ({
    files: state.files.map((f) => (f.id === id ? { ...f, transform } : f)),
  })),

  selectedFileId: null,
  setSelectedFileId: (id) => set({ selectedFileId: id }),

  zoom: 1,
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(5, zoom)) }),

  isPanning: false,
  setIsPanning: (panning) => set({ isPanning: panning }),

  isProcessing: false,
  setIsProcessing: (processing) => set({ isProcessing: processing }),
  processingProgress: 0,
  setProcessingProgress: (progress) => set({ processingProgress: progress }),

  showGuides: false,
  toggleGuides: () => set((state) => ({ showGuides: !state.showGuides })),
  showBeforeAfter: false,
  toggleBeforeAfter: () => set((state) => ({ showBeforeAfter: !state.showBeforeAfter })),
  showDeviceFrame: false,
  toggleDeviceFrame: () => set((state) => ({ showDeviceFrame: !state.showDeviceFrame })),

  activePanel: 'none',
  setActivePanel: (panel) => set((state) => ({
    activePanel: state.activePanel === panel ? 'none' : panel
  })),

  exportHistory: [],
  addExportRecord: (record) => set((state) => ({
    exportHistory: [{ ...record, id: crypto.randomUUID() }, ...state.exportHistory].slice(0, 100)
  })),
  clearExportHistory: () => set({ exportHistory: [] }),

  watermarkText: '',
  setWatermarkText: (text) => set({ watermarkText: text }),
  watermarkEnabled: false,
  toggleWatermark: () => set((state) => ({ watermarkEnabled: !state.watermarkEnabled })),

  notifications: [],
  addNotification: (notification) => set((state) => ({
    notifications: [...state.notifications, { ...notification, id: crypto.randomUUID() }]
  })),
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),
}))
