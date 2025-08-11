import { app, BrowserWindow, ipcMain, dialog, Menu, MenuItemConstructorOptions, shell } from 'electron'
import { join, basename } from 'node:path'
import { promises as fs } from 'node:fs'

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : join(process.env.DIST, '../public')

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'default',
    show: false,
  })

  // Build application menu
  const isMac = process.platform === 'darwin'
  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{
      label: app.getName(),
      submenu: [
        { role: 'about' } as MenuItemConstructorOptions,
        { type: 'separator' } as MenuItemConstructorOptions,
        { role: 'services' } as MenuItemConstructorOptions,
        { type: 'separator' } as MenuItemConstructorOptions,
        { role: 'hide' } as MenuItemConstructorOptions,
        { role: 'hideOthers' } as MenuItemConstructorOptions,
        { role: 'unhide' } as MenuItemConstructorOptions,
        { type: 'separator' } as MenuItemConstructorOptions,
        { role: 'quit' } as MenuItemConstructorOptions,
      ]
    } as MenuItemConstructorOptions] : []),
    {
      label: 'File',
      submenu: [
        { label: 'New', accelerator: isMac ? 'Cmd+N' : 'Ctrl+N', click: () => win?.webContents.send('menu-action', { type: 'new' }) } as MenuItemConstructorOptions,
        { label: 'Open…', accelerator: isMac ? 'Cmd+O' : 'Ctrl+O', click: () => win?.webContents.send('menu-action', { type: 'open' }) } as MenuItemConstructorOptions,
        { type: 'separator' } as MenuItemConstructorOptions,
        { label: 'Save', accelerator: isMac ? 'Cmd+S' : 'Ctrl+S', click: () => win?.webContents.send('menu-action', { type: 'save' }) } as MenuItemConstructorOptions,
        { label: 'Save As…', accelerator: isMac ? 'Shift+Cmd+S' : 'Shift+Ctrl+S', click: () => win?.webContents.send('menu-action', { type: 'save-as' }) } as MenuItemConstructorOptions,
        ...(isMac 
          ? ([{ type: 'separator' } as MenuItemConstructorOptions, { role: 'close' } as MenuItemConstructorOptions])
          : ([{ type: 'separator' } as MenuItemConstructorOptions, { role: 'quit' } as MenuItemConstructorOptions])
        )
      ] as MenuItemConstructorOptions[]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' } as MenuItemConstructorOptions,
        { role: 'redo' } as MenuItemConstructorOptions,
        { type: 'separator' } as MenuItemConstructorOptions,
        { role: 'cut' } as MenuItemConstructorOptions,
        { role: 'copy' } as MenuItemConstructorOptions,
        { role: 'paste' } as MenuItemConstructorOptions,
        ...(isMac ? [
          { role: 'pasteAndMatchStyle' } as MenuItemConstructorOptions,
          { role: 'delete' } as MenuItemConstructorOptions,
          { role: 'selectAll' } as MenuItemConstructorOptions,
          { type: 'separator' } as MenuItemConstructorOptions,
          { label: 'Speech', submenu: [{ role: 'startSpeaking' } as MenuItemConstructorOptions, { role: 'stopSpeaking' } as MenuItemConstructorOptions] } as MenuItemConstructorOptions,
        ] : [
          { role: 'delete' } as MenuItemConstructorOptions,
          { type: 'separator' } as MenuItemConstructorOptions,
          { role: 'selectAll' } as MenuItemConstructorOptions,
        ])
      ] as MenuItemConstructorOptions[]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' } as MenuItemConstructorOptions,
        { role: 'forceReload' } as MenuItemConstructorOptions,
        { role: 'toggleDevTools' } as MenuItemConstructorOptions,
        { type: 'separator' } as MenuItemConstructorOptions,
        { role: 'resetZoom' } as MenuItemConstructorOptions,
        { role: 'zoomIn' } as MenuItemConstructorOptions,
        { role: 'zoomOut' } as MenuItemConstructorOptions,
        { type: 'separator' } as MenuItemConstructorOptions,
        { role: 'togglefullscreen' } as MenuItemConstructorOptions,
      ] as MenuItemConstructorOptions[]
    },
    {
      role: 'windowMenu',
      submenu: [
        { role: 'minimize' } as MenuItemConstructorOptions,
        { role: 'zoom' } as MenuItemConstructorOptions,
        ...(isMac 
          ? ([{ type: 'separator' } as MenuItemConstructorOptions, { role: 'front' } as MenuItemConstructorOptions])
          : ([{ role: 'close' } as MenuItemConstructorOptions])
        )
      ] as MenuItemConstructorOptions[]
    },
    {
      role: 'help',
      submenu: [
        { label: 'Learn More', click: () => { shell.openExternal('https://github.com') } } as MenuItemConstructorOptions,
      ] as MenuItemConstructorOptions[]
    }
  ]
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(join(process.env.DIST, 'index.html'))
  }

  win.once('ready-to-show', () => {
    win?.show()
  })
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)

// IPC handlers for file operations
ipcMain.handle('dialog-open-questionnaire', async () => {
  if (!win) return { success: false, error: 'No window' }
  const result = await dialog.showOpenDialog(win, {
    title: 'Open Questionnaire',
    properties: ['openFile'],
    filters: [{ name: 'Questionnaire JSON', extensions: ['json'] }]
  })
  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, canceled: true }
  }
  try {
    const filePath = result.filePaths[0]
    const content = await fs.readFile(filePath, 'utf-8')
    return { success: true, filePath, fileName: basename(filePath), content }
  } catch (error: any) {
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('dialog-save-questionnaire-as', async (_event, content: string, suggestedName?: string) => {
  if (!win) return { success: false, error: 'No window' }
  const result = await dialog.showSaveDialog(win, {
    title: 'Save Questionnaire',
    defaultPath: suggestedName || 'questionnaire.json',
    filters: [{ name: 'Questionnaire JSON', extensions: ['json'] }]
  })
  if (result.canceled || !result.filePath) {
    return { success: false, canceled: true }
  }
  try {
    await fs.writeFile(result.filePath, content, 'utf-8')
    return { success: true, filePath: result.filePath, fileName: basename(result.filePath) }
  } catch (error: any) {
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('write-questionnaire-to-path', async (_event, filePath: string, content: string) => {
  try {
    await fs.writeFile(filePath, content, 'utf-8')
    return { success: true, filePath, fileName: basename(filePath) }
  } catch (error: any) {
    return { success: false, error: String(error) }
  }
})