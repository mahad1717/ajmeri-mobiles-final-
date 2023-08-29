const { app, BrowserWindow } = require('electron');
const path = require('path');
let mainWindow;

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Handle navigation to different sections
function navigateToSection(section) {
    mainWindow.loadFile(path.join(__dirname, `sections/${section}.html`));
}

// Listen for navigation events from the renderer process
require('electron').ipcMain.on('navigate', (event, section) => {
    navigateToSection(section);
});
