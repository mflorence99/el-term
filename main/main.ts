import * as path from 'path';
import * as url from 'url';

import { BrowserWindow, app, ipcMain } from 'electron';

/**
 * Electron event dispatcher
 */
const isDev = process.env['DEV_MODE'] === '1';

const pids = [];

let theWindow: BrowserWindow;

function sendBounds() {
  theWindow.webContents.send('bounds', theWindow.getBounds());
}

app.on('ready', () => {
  if (isDev)
    require('devtron').install();
  theWindow = new BrowserWindow({
    width: 800,
    height: 600,
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
  theWindow.setMenu(null);
  theWindow.on('move', sendBounds);
  theWindow.on('resize', sendBounds);
});

app.on('window-all-closed', () => {
  pids.forEach(pid => process.kill(pid, 'SIGTERM'));
  app.quit();
});

ipcMain.on('connect', (event: any,
                       pid: string) => {
  pids.push(pid);
});

ipcMain.on('kill', (event: any,
                    pid: string) => {
  const ix = pids.indexOf(pid);
  if (ix !== -1)
    pids.splice(ix, 1);
});
