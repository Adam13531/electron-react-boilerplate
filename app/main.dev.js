/* eslint global-require: 0, flowtype-errors/show-errors: 0 */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 *
 * @flow
 */
import { app, BrowserWindow } from 'electron';
import MenuBuilder from './menu';
import MidiWrapper from './mainprocess_src/midiwrapper';
import KeyRecognizer from './mainprocess_src/keyrecognizer';

const keyRecognizer = new KeyRecognizer();
const midiWrapper = new MidiWrapper(keyRecognizer);

let mainWindow = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
  require('electron-debug')();
  const path = require('path');
  const p = path.join(__dirname, '..', 'app', 'node_modules');
  require('module').globalPaths.push(p);
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = [
    'REACT_DEVELOPER_TOOLS',
    'REDUX_DEVTOOLS'
  ];

  return Promise
    .all(extensions.map(name => installer.default(installer[name], forceDownload)))
    .catch(console.log);
};


/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


app.on('ready', async () => {
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728
  });

  mainWindow.loadURL(`file://${__dirname}/app.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    mainWindow.show();
    mainWindow.focus();
  });

  // midiWrapper.addEventListener()
  // Configure a callback.
  // input.on('message', function(deltaTime, message) {
  //   // The message is an array of numbers corresponding to the MIDI bytes:
  //   //   [status, data1, data2]
  //   // https://www.cs.cf.ac.uk/Dave/Multimedia/node158.html has some helpful
  //   // information interpreting the messages.
  //   //
  //   // http://computermusicresource.com/MIDI.Commands.html
  //   const [status, data1, data2] = message;
  //   console.log('m:' + message + ' d:' + deltaTime);
  //   mainWindow.webContents.send('midi', message, deltaTime);
  //   if (status === 128 && data1 === 36) {
  //     for (let i = 0; i < 15; i++) {
  //       console.log(' ');
  //     }
  //   }

  // });

  mainWindow.on('closed', () => {
    midiWrapper.dispose();
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();
});
