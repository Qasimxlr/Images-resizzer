import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  selectOutputFolder: () => ipcRenderer.invoke('select-output-folder'),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  readImageFile: (filePath: string) => ipcRenderer.invoke('read-image-file', filePath),
  processImage: (options: any) => ipcRenderer.invoke('process-image', options),
  revealInFinder: (filePath: string) => ipcRenderer.invoke('reveal-in-finder', filePath),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
})
