import { BrowserWindow, app } from 'electron';

/**
 * Electron event dispatcher
 */

let theWindow: BrowserWindow;

app.on('ready', () => {
  theWindow = new BrowserWindow({
    width: 832,
    height: 1024,
    resizable: true
  });
  // TODO: also temporary -- not deploying from dist to get hot reload
  theWindow.loadURL('http://localhost:4200');
  theWindow.setMenu(null);
  theWindow.webContents.openDevTools();
});

app.on('window-all-closed', () => {
  app.quit();
});
