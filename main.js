const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        height: 600,
        width: 300,
        minWidth: 300,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: true, // Allow Node.js integration
            contextIsolation: false, 
        }
    });

    const { Menu } = require('electron');
    Menu.setApplicationMenu(null);

    mainWindow.setAspectRatio(1 / 2);

    mainWindow.loadFile(path.join(__dirname, 'www', 'index.html'));

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
