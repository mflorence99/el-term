import * as path from 'path';
import * as url from 'url';

/**
 * Electron event dispatcher
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const isDev = process.env['DEV_MODE'] === '1';
const pids = [];
let theWindow = null;

app.on('ready', () => {
  theWindow = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: true
  });
  if (isDev) {
    require('devtron').install();
    const { default: installExtension } = require('electron-devtools-installer');
    // https://chrome.google.com/webstore/detail/redux-devtools/
    //   lmhkpmbekcpmknklioeibfkpmmfibljd
    installExtension('lmhkpmbekcpmknklioeibfkpmmfibljd')
      .then((name) => console.log(`Added Extension:  ${name}`))
      .catch((err) => console.log('An error occurred: ', err));
    // https://chrome.google.com/webstore/detail/local-storage-explorer/
    //   hglfomidogadbhelcfomenpieffpfaeb?hl=en
    installExtension('hglfomidogadbhelcfomenpieffpfaeb')
      .then((name) => console.log(`Added Extension:  ${name}`))
      .catch((err) => console.log('An error occurred: ', err));
    theWindow.loadURL(url.format({
      hostname: 'localhost',
      pathname: path.join(),
      port: 4200,
      protocol: 'http:',
      query: {isDev: true},
      slashes: true
    }));
    theWindow.webContents.openDevTools();
  }
  else {
    theWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true
    }));
  }
  theWindow.setMenu(null);
  // event handlers
  const sendBounds = () =>
    theWindow.webContents.send('bounds', theWindow.getBounds());
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
