import { AssetPreset, AssetType } from '../types'

export const ASSET_PRESETS: Record<AssetType, AssetPreset[]> = {
  appicon: [
    { id: 'icon-512', label: 'App Icon 512×512', width: 512, height: 512, description: 'macOS / iOS App Icon (Default)' },
    { id: 'icon-1024', label: 'App Icon 1024×1024', width: 1024, height: 1024, description: 'High-res App Store Icon' },
    { id: 'icon-256', label: 'App Icon 256×256', width: 256, height: 256, description: 'macOS Small Icon' },
    { id: 'icon-128', label: 'App Icon 128×128', width: 128, height: 128, description: 'macOS Dock Icon' },
    { id: 'icon-64', label: 'App Icon 64×64', width: 64, height: 64, description: 'Spotlight / Mini Icon' },
    { id: 'icon-32', label: 'App Icon 32×32', width: 32, height: 32, description: 'Toolbar / Retina 16pt' },
    { id: 'icon-16', label: 'App Icon 16×16', width: 16, height: 16, description: 'Finder / List View' },
  ],
  feature: [
    { id: 'feature-google', label: '1024 × 500', width: 1024, height: 500, description: 'Google Play Feature Graphic (Default)' },
    { id: 'feature-appstore', label: '1024 × 500 (App Store)', width: 1024, height: 500, description: 'App Store Promotional Banner' },
    { id: 'feature-wide', label: '1280 × 720', width: 1280, height: 720, description: 'TV Banner / Wide Format' },
  ],
  phone: [
    { id: 'phone-standard', label: '1080 × 1920', width: 1080, height: 1920, description: 'Standard Portrait (Default)' },
    { id: 'phone-landscape', label: '1920 × 1080', width: 1920, height: 1080, description: 'Standard Landscape' },
    { id: 'phone-6-7', label: '1290 × 2796', width: 1290, height: 2796, description: 'iPhone 6.7" (14 Pro Max, 15 Plus)' },
    { id: 'phone-6-5', label: '1284 × 2778', width: 1284, height: 2778, description: 'iPhone 6.5" (11 Pro Max, XS Max)' },
    { id: 'phone-6-1', label: '1170 × 2532', width: 1170, height: 2532, description: 'iPhone 6.1" (12, 13, 14)' },
    { id: 'phone-5-5', label: '1242 × 2208', width: 1242, height: 2208, description: 'iPhone 5.5" (8 Plus, 7 Plus)' },
    { id: 'phone-15pro', label: '1320 × 2868', width: 1320, height: 2868, description: 'iPhone 15 Pro Max' },
    { id: 'phone-se', label: '750 × 1334', width: 750, height: 1334, description: 'iPhone SE / 8 (4.7")' },
    { id: 'phone-pixel', label: '1080 × 2400', width: 1080, height: 2400, description: 'Android Pixel (OLED)' },
  ],
  tablet: [
    { id: 'tablet-7inch', label: '1200 × 1920', width: 1200, height: 1920, description: '7-inch Tablet Portrait (Default)' },
    { id: 'tablet-7inch-land', label: '1920 × 1200', width: 1920, height: 1200, description: '7-inch Tablet Landscape' },
    { id: 'tablet-10inch', label: '1600 × 2560', width: 1600, height: 2560, description: '10-inch Tablet Portrait' },
    { id: 'tablet-10inch-land', label: '2560 × 1600', width: 2560, height: 1600, description: '10-inch Tablet Landscape' },
    { id: 'tablet-ipad11', label: '1640 × 2360', width: 1640, height: 2360, description: 'iPad Pro 11" Portrait' },
    { id: 'tablet-ipad13', label: '2048 × 2732', width: 2048, height: 2732, description: 'iPad Pro 12.9" Portrait' },
    { id: 'tablet-ipad13-land', label: '2732 × 2048', width: 2732, height: 2048, description: 'iPad Pro 12.9" Landscape' },
  ],
}

export const ASSET_TYPE_CONFIG: Record<AssetType, {
  label: string
  icon: string
  description: string
  defaultFormat: 'png' | 'jpeg'
  maxFileSize: number
  minQuantity: number
  maxQuantity: number
  allowAlpha: boolean
  defaultWidth: number
  defaultHeight: number
}> = {
  appicon: {
    label: 'App Icon',
    icon: '🎨',
    description: '512×512, 32-bit PNG with alpha, max 1024KB',
    defaultFormat: 'png',
    maxFileSize: 1024 * 1024,  // 1024KB = 1MB
    minQuantity: 1,
    maxQuantity: 4,
    allowAlpha: true,
    defaultWidth: 512,
    defaultHeight: 512,
  },
  feature: {
    label: 'Feature Graphic',
    icon: '🖼️',
    description: '1024×500, JPEG or 24-bit PNG, max 1MB',
    defaultFormat: 'jpeg',
    maxFileSize: 1024 * 1024,  // 1MB
    minQuantity: 1,
    maxQuantity: 1,
    allowAlpha: false,
    defaultWidth: 1024,
    defaultHeight: 500,
  },
  phone: {
    label: 'Phone Screenshots',
    icon: '📱',
    description: 'Min 2, Max 8. 320–3840px range',
    defaultFormat: 'jpeg',
    maxFileSize: 8 * 1024 * 1024,  // 8MB
    minQuantity: 2,
    maxQuantity: 8,
    allowAlpha: false,
    defaultWidth: 1080,
    defaultHeight: 1920,
  },
  tablet: {
    label: 'Tablet Screenshots',
    icon: '📲',
    description: 'Min 4, Max 8. 7" or 10" displays',
    defaultFormat: 'jpeg',
    maxFileSize: 8 * 1024 * 1024,  // 8MB
    minQuantity: 4,
    maxQuantity: 8,
    allowAlpha: false,
    defaultWidth: 1200,
    defaultHeight: 1920,
  },
}

export const KEYBOARD_SHORTCUTS = [
  { key: '⌘1', action: 'App Icon mode' },
  { key: '⌘2', action: 'Feature Graphic mode' },
  { key: '⌘3', action: 'Phone Screenshot mode' },
  { key: '⌘4', action: 'Tablet Screenshot mode' },
  { key: '⌘O', action: 'Open files' },
  { key: '⌘E', action: 'Export all' },
  { key: '⌘0', action: 'Fit to screen' },
  { key: '⌘+', action: 'Zoom in' },
  { key: '⌘-', action: 'Zoom out' },
  { key: 'Space', action: 'Toggle pan mode' },
  { key: 'Delete', action: 'Remove selected image' },
  { key: '?', action: 'Show shortcuts' },
]
