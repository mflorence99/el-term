import * as path from 'path';
import * as url from 'url';

import { BrowserWindow, app } from 'electron';

/**
 * Electron event dispatcher
 */

let theWindow: BrowserWindow;

app.on('ready', () => {
  theWindow = new BrowserWindow({
    width: 1600,
    height: 1024,
    resizable: true
  });
  // theWindow.loadURL('http://localhost:4200');
  theWindow.loadURL(url.format({
    // TODO: temporary -- not deploying from dist to get hot reload
    hostname: 'localhost',
    pathname: path.join(),
    port: 4200,
    protocol: 'http:',
    // pathname: path.join(__dirname, 'index.html'),
    // protocol: 'file:',
    slashes: true
  }));
  // theWindow.setMenu(null);
  theWindow.webContents.openDevTools();
});

app.on('window-all-closed', () => {
  theWindow.webContents.send('kill');
  app.quit();
});
