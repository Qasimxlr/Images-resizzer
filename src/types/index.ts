export interface ElectronAPI {
  selectOutputFolder: () => Promise<string | null>
  openFileDialog: () => Promise<string[]>
  readImageFile: (filePath: string) => Promise<ImageFileResult>
  processImage: (options: ProcessOptions) => Promise<ProcessResult>
  revealInFinder: (filePath: string) => void
  getAppVersion: () => Promise<string>
}

export interface ImageFileResult {
  base64?: string
  metadata?: ImageMetadata
  filename?: string
  filepath?: string
  error?: string
}

export interface ImageMetadata {
  width: number
  height: number
  format: string
  size: number
  hasAlpha: boolean
  colorSpace: string
  channels?: number
  density?: number
}

export type AssetType = 'appicon' | 'feature' | 'phone' | 'tablet'

export interface AssetPreset {
  id: string
  label: string
  width: number
  height: number
  description: string
}

export interface ImageFile {
  id: string
  filename: string
  filepath: string
  base64: string
  metadata: ImageMetadata
  status: 'pending' | 'processing' | 'done' | 'error'
  progress: number
  result?: ProcessResult
  transform?: {
    x: number
    y: number
    scale: number
  }
}

export interface ProcessOptions {
  inputPath: string
  inputBase64?: string
  outputDir: string
  type: AssetType
  preset: string
  format: 'png' | 'jpeg'
  quality: number
  width: number
  height: number
  maintainAspect: boolean
  index?: number
  originalFilename?: string
  transform?: {
    x: number
    y: number
    scale: number
  }
}

export interface ProcessResult {
  success: boolean
  outputPath?: string
  filename?: string
  size?: number
  width?: number
  height?: number
  error?: string
  simulated?: boolean
}

export interface ExportHistoryEntry {
  filename: string
  type: string
  dimensions: string
  format: string
  size: number
  outputPath: string
  timestamp: string
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
