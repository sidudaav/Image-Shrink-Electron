const path = require('path')
const os = require('os')
const {app, BrowserWindow, Menu, ipcMain, shell} = require('electron')
const imagemin = require('imagemin')
const imageminMozjpeg = require('imagemin-mozjpeg')
const imageminPngquant = require('imagemin-pngquant')
const slash = require('slash')
log = require('electron-log')

process.env.NODE_ENV = 'production'

const isDev = process.env.NODE_ENV != 'production' ? true : false
const isMac = process.platform === 'darwin' ? true : false

let mainWindow, aboutWindow

const createMainWindow = () => {
     mainWindow = new BrowserWindow({
        title: 'ImageShrink',
        width: isDev ? 800 : 500,
        height: 600,
        icon: `${__dirname}/assets/Icon_256x256.png`,
        resizable: isDev? true : false,
        webPreferences: {
          nodeIntegration: true,
        }
    })

    mainWindow.loadFile(`./app/index.html`)
}

const createAboutWindow = () => {
  aboutWindow = new BrowserWindow({
     title: 'AboutImageShrink',
     width: 300,
     height: 300,
     icon: `${__dirname}/assets/Icon_256x256.png`,
     resizable: false,
 })

  aboutWindow.loadFile(`./app/about.html`)
}

app.on('ready', () => {
    createMainWindow()
    
    const mainMenu = Menu.buildFromTemplate(menu)
    Menu.setApplicationMenu(mainMenu)

    mainWindow.on('close', () => mainWindow = null)
})

app.on('window-all-closed', () => {
  if (!isMac) {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow()
  }
})

const menu = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        {
          label: 'About',
          click: createAboutWindow
        }
      ]
    }] : []),
    {
      role: 'fileMenu',
    },
    ...(isMac ? [{
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: createAboutWindow,
        }
      ]
    }] : []),
    ...(isDev ? [
      {
        label: 'Developer',
        submenu: [
          { role: 'reload' },
          { role: 'forcereload' },
          { type: 'separator' },
          { role: 'toggledevtools' },
        ]
      }
    ] : [])
]

ipcMain.on('image:minimize', (e, options) => {
  options.dest = path.join(os.homedir(), 'imageshrink')
  shrinkImage(options)
})

const shrinkImage = async ({ imgPath, quality, dest}) => {
  console.log(imgPath, dest, quality)
  try {
    const pngQuality = quality / 100

    const files = await imagemin([slash(imgPath)], {
      destination: dest,
      plugins: [
        imageminMozjpeg({ quality }),
        imageminPngquant({
          quality: [pngQuality, pngQuality],
        }),
      ],
    })

    log.info(files)

    shell.openPath(dest)

    mainWindow.webContents.send('image:done')

  } catch(err) {
    console.log(err)
  }
}