import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

// ESM __dirname polyfill
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const require = createRequire(import.meta.url)

// Sharp import - handle gracefully if not available
let sharp: any = null
function loadSharp() {
  try {
    sharp = require('sharp')
  } catch (e) {
    console.warn('Sharp not available, image processing will be simulated')
  }
}

const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null

function createWindow() {
  // Resolve icon path - more robust for packaged apps
  let iconPath = path.join(__dirname, '../public/icon.png')
  if (!isDev) {
    // In production, icons are often in the Resources folder or bundled asar
    const possiblePaths = [
      path.join(process.resourcesPath, 'icon.png'),
      path.join(app.getAppPath(), 'dist/icon.png'),
      path.join(__dirname, '../dist/icon.png'),
    ]
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        iconPath = p
        break
      }
    }
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    titleBarStyle: 'hiddenInset',
    vibrancy: 'sidebar',
    visualEffectState: 'active',
    trafficLightPosition: { x: 20, y: 18 },
    backgroundColor: '#0a0a0a',
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    show: false,
  })

  // Set dock icon on macOS
  if (process.platform === 'darwin' && app.dock) {
    try {
      if (fs.existsSync(iconPath)) {
        app.dock.setIcon(iconPath)
      }
    } catch (e) {
      console.warn('Could not set dock icon:', e)
    }
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    // Standard robust way to load index.html from asar
    const indexPath = path.join(__dirname, '../dist/index.html')
    mainWindow.loadFile(indexPath).catch(err => {
      console.error('Failed to load index.html:', err)
    })
  }

  // Debugging: open devtools if load fails or in general for testing
  // mainWindow.webContents.openDevTools()

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  loadSharp()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// ===== IPC Handlers =====

// Select output folder
ipcMain.handle('select-output-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Output Folder',
    buttonLabel: 'Select Folder',
  })
  if (result.canceled) return null
  return result.filePaths[0]
})

// Open file dialog for images
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'tiff', 'tif', 'webp', 'heic'] },
    ],
    title: 'Select Images',
    buttonLabel: 'Import',
  })
  if (result.canceled) return []
  return result.filePaths
})

// Read image file and return base64 + metadata
ipcMain.handle('read-image-file', async (_event, filePath: string) => {
  try {
    // Validate path - must be absolute
    const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath)

    if (!fs.existsSync(resolvedPath)) {
      return { error: `File not found: ${resolvedPath}` }
    }

    const buffer = fs.readFileSync(resolvedPath)
    const ext = path.extname(resolvedPath).toLowerCase()
    const stats = fs.statSync(resolvedPath)

    let metadata: any = {
      width: 0,
      height: 0,
      format: ext.replace('.', ''),
      size: stats.size,
      hasAlpha: false,
      colorSpace: 'srgb',
    }

    if (sharp) {
      try {
        const sharpMeta = await sharp(buffer).metadata()
        metadata = {
          width: sharpMeta.width || 0,
          height: sharpMeta.height || 0,
          format: sharpMeta.format || ext.replace('.', ''),
          size: stats.size,
          hasAlpha: sharpMeta.hasAlpha || false,
          colorSpace: sharpMeta.space || 'srgb',
          channels: sharpMeta.channels || 3,
          density: sharpMeta.density || 72,
        }
      } catch (sharpErr) {
        console.warn('Sharp metadata failed, using buffer fallback')
      }
    }

    // Fallback: extract dimensions from raw buffer headers
    if (metadata.width === 0) {
      const dims = getImageDimensionsFromBuffer(buffer, ext)
      if (dims) {
        metadata.width = dims.width
        metadata.height = dims.height
      }
    }

    const mimeType = ext === '.png' ? 'image/png' :
                     ext === '.webp' ? 'image/webp' :
                     ext === '.tiff' || ext === '.tif' ? 'image/tiff' :
                     'image/jpeg'

    return {
      base64: `data:${mimeType};base64,${buffer.toString('base64')}`,
      metadata,
      filename: path.basename(resolvedPath),
      filepath: resolvedPath,
    }
  } catch (err: any) {
    return { error: err.message }
  }
})

// Simple dimension extraction from buffer headers (fallback when Sharp is unavailable)
function getImageDimensionsFromBuffer(buffer: Buffer, ext: string): { width: number; height: number } | null {
  try {
    if (ext === '.png' && buffer.length > 24) {
      const width = buffer.readUInt32BE(16)
      const height = buffer.readUInt32BE(20)
      return { width, height }
    }
    if ((ext === '.jpg' || ext === '.jpeg') && buffer.length > 2) {
      let offset = 2
      while (offset < buffer.length - 1) {
        if (buffer[offset] !== 0xFF) break
        const marker = buffer[offset + 1]
        if (marker === 0xC0 || marker === 0xC2) {
          const height = buffer.readUInt16BE(offset + 5)
          const width = buffer.readUInt16BE(offset + 7)
          return { width, height }
        }
        const segLength = buffer.readUInt16BE(offset + 2)
        offset += 2 + segLength
      }
    }
  } catch {}
  return null
}

// Process image
ipcMain.handle('process-image', async (_event, options: {
  inputPath: string,
  inputBase64?: string,
  outputDir: string,
  type: string,
  preset: string,
  format: string,
  quality: number,
  width: number,
  height: number,
  maintainAspect: boolean,
  index?: number,
  originalFilename?: string,
}) => {
  try {
    const { inputPath, inputBase64, outputDir, type, format, quality, width, height, index, originalFilename } = options
    const timestamp = Date.now()

    // Determine Sharp input: use file path if valid, otherwise use base64 buffer
    let sharpInput: string | Buffer
    const hasValidPath = inputPath && inputPath.length > 1 && path.isAbsolute(inputPath) && fs.existsSync(inputPath)

    if (hasValidPath) {
      sharpInput = inputPath
    } else if (inputBase64) {
      // Convert data URI to buffer: "data:image/png;base64,iVBOR..."
      const base64Data = inputBase64.includes(',') ? inputBase64.split(',')[1] : inputBase64
      sharpInput = Buffer.from(base64Data, 'base64')
    } else {
      return { success: false, error: `No valid input: path="${inputPath}" is not accessible and no base64 data provided` }
    }

    // Save directly to the selected output folder (no subfolders)
    const outputSubDir = outputDir
    if (!fs.existsSync(outputSubDir)) {
      fs.mkdirSync(outputSubDir, { recursive: true })
    }

    // Build filename
    const typeNames: Record<string, string> = {
      appicon: 'AppIcon',
      feature: 'FeatureGraphic',
      phone: 'PhoneScreenshot',
      tablet: 'TabletScreenshot',
    }

    // Use original filename stem if available, otherwise use type name
    const baseName = originalFilename
      ? originalFilename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_')
      : (typeNames[type] || 'Asset')

    const idx = index !== undefined ? `-${index + 1}` : ''
    const ext = format === 'png' ? 'png' : 'jpg'
    const filename = `${baseName}${idx}-${width}x${height}.${ext}`
    const outputPath = path.join(outputSubDir, filename)

    if (sharp) {
      // Create the final canvas with the target dimensions
      let base = sharp({
        create: {
          width,
          height,
          channels: format === 'png' && type === 'appicon' ? 4 : 3,
          background: format === 'png' && type === 'appicon' ? { r: 0, g: 0, b: 0, alpha: 0 } : { r: 255, g: 255, b: 255 }
        }
      })

      // Prepare the input image with its transform
      const transform = options.transform || { x: 0, y: 0, scale: 1 }
      
      // Calculate scaled dimensions
      // In the preview, 1.0 scale = object-cover.
      // We'll mimic this: first resize to cover, then apply the extra user scale and offsets.
      const overlay = sharp(sharpInput)
      const meta = await overlay.metadata()
      const sourceAspect = (meta.width || 1) / (meta.height || 1)
      const targetAspect = width / height

      let resizeWidth, resizeHeight
      if (sourceAspect > targetAspect) {
        resizeHeight = height
        resizeWidth = Math.round(height * sourceAspect)
      } else {
        resizeWidth = width
        resizeHeight = Math.round(width / sourceAspect)
      }

      // Apply user scale on top of cover scale
      const finalResizeWidth = Math.round(resizeWidth * transform.scale)
      const finalResizeHeight = Math.round(resizeHeight * transform.scale)

      // Resize the overlay to the calculated dimensions
      const resizedOverlay = await overlay
        .resize(finalResizeWidth, finalResizeHeight, { kernel: 'lanczos3' })
        .toBuffer()

      // Calculate position: center the image, then apply user offset scaled from preview to real pixels
      const previewScale = Math.min(width * 0.3, 500) / width
      const realX = Math.round((transform.x || 0) / previewScale)
      const realY = Math.round((transform.y || 0) / previewScale)

      // === FIX: Sharp composite() requires overlay <= canvas AND top/left >= 0 ===
      // We extract only the visible portion of the overlay that overlaps the canvas.
      let compositeLeft = Math.round((width - finalResizeWidth) / 2 + realX)
      let compositeTop = Math.round((height - finalResizeHeight) / 2 + realY)

      // Compute which region of the overlay is actually visible on the canvas
      const srcX = Math.max(0, -compositeLeft)
      const srcY = Math.max(0, -compositeTop)

      // Clamp composite position to canvas bounds (must be >= 0 for Sharp)
      const clampedLeft = Math.max(0, compositeLeft)
      const clampedTop = Math.max(0, compositeTop)

      // Compute visible overlay dimensions (must fit within canvas)
      const visibleWidth = Math.min(finalResizeWidth - srcX, width - clampedLeft)
      const visibleHeight = Math.min(finalResizeHeight - srcY, height - clampedTop)

      if (visibleWidth > 0 && visibleHeight > 0) {
        if (srcX === 0 && srcY === 0 && finalResizeWidth <= width && finalResizeHeight <= height) {
          // Overlay fits within canvas entirely — use as-is
          base = base.composite([{ input: resizedOverlay, top: clampedTop, left: clampedLeft }])
        } else {
          // Overlay is larger or has negative offset — extract only the visible region
          const croppedOverlay = await sharp(resizedOverlay)
            .extract({
              left: srcX,
              top: srcY,
              width: Math.floor(visibleWidth),
              height: Math.floor(visibleHeight),
            })
            .toBuffer()
          base = base.composite([{ input: croppedOverlay, top: clampedTop, left: clampedLeft }])
        }
      }
      // If visibleWidth/Height <= 0, the image is panned fully off-canvas — leave blank background

      // Output format and quality
      if (format === 'png') {
        if (type === 'appicon') {
          base = base.png({ compressionLevel: 9, force: true })
        } else {
          base = base.png({ compressionLevel: 9, force: true })
        }
      } else {
        base = base.jpeg({ quality: quality || 90, progressive: true, force: true })
      }

      const info = await base.toFile(outputPath)

      // File size validation for app icons (must be < 1024KB)
      if (type === 'appicon') {
        let outputStats = fs.statSync(outputPath)
        if (outputStats.size > 1024 * 1024) {
          await base.png({ compressionLevel: 9, quality: 70, force: true }).toFile(outputPath)
        }
      }

      const finalStats = fs.statSync(outputPath)

      // Log export
      const logPath = path.join(outputDir, 'export-history.json')
      let history: any[] = []
      if (fs.existsSync(logPath)) {
        try { history = JSON.parse(fs.readFileSync(logPath, 'utf-8')) } catch {}
      }
      history.push({
        filename,
        type,
        dimensions: `${width}x${height}`,
        format: ext,
        size: finalStats.size,
        outputPath,
        timestamp: new Date().toISOString(),
      })
      fs.writeFileSync(logPath, JSON.stringify(history, null, 2))

      return {
        success: true,
        outputPath,
        filename,
        size: finalStats.size,
        width: info.width,
        height: info.height,
      }
    } else {
      // Sharp not available
      if (hasValidPath) {
        fs.copyFileSync(inputPath, outputPath)
      } else if (inputBase64) {
        const base64Data = inputBase64.includes(',') ? inputBase64.split(',')[1] : inputBase64
        fs.writeFileSync(outputPath, Buffer.from(base64Data, 'base64'))
      }
      const finalStats = fs.statSync(outputPath)
      return {
        success: true,
        outputPath,
        filename,
        size: finalStats.size,
        width,
        height,
        simulated: true,
      }
    }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

// Reveal in Finder
ipcMain.handle('reveal-in-finder', async (_event, filePath: string) => {
  shell.showItemInFolder(filePath)
})

// Get app version
ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})
