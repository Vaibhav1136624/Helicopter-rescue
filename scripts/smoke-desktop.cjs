const { app, BrowserWindow } = require('electron');
const path = require('node:path');

const timeout = setTimeout(() => {
  console.error('Desktop smoke check timed out');
  app.exit(1);
}, 20000);

app.whenReady().then(async () => {
  try {
    const window = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
    await window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
    const count = await window.webContents.executeJavaScript(
      "document.querySelectorAll('[data-mission]').length"
    );
    if (count !== 6) throw new Error(`Expected six missions, found ${count}`);
    console.log('PASS Offline desktop bundle loads all six missions');
    clearTimeout(timeout);
    app.exit(0);
  } catch (error) {
    console.error(error);
    app.exit(1);
  }
});
