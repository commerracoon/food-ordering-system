const { app, BrowserWindow, session } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let pythonProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      partition: 'persist:food-ordering'  // Enable persistent session
    },
    icon: path.join(__dirname, 'assets/icon.png')
  });

  // Configure session to accept third-party cookies
  const ses = mainWindow.webContents.session;
  ses.webRequest.onBeforeSendHeaders((details, callback) => {
    callback({ requestHeaders: details.requestHeaders });
  });

  // Load ordering page first (allows guest browsing)
  mainWindow.loadFile('frontend/modules/auth/login.html');

  // Open DevTools in development mode only
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('close', function (e) {
    // Clear cart from localStorage before closing
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.executeJavaScript(`
        localStorage.removeItem('guest_cart');
      `).catch(err => {
        console.error('Error clearing cart:', err);
      });
    }
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

function startPythonBackend() {
  // Start Python Flask server
  pythonProcess = spawn('python', ['backend/app.py']);

  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python Error: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python process exited with code ${code}`);
  });
}

app.on('ready', () => {
  startPythonBackend();
  // Wait a bit for Python server to start
  setTimeout(createWindow, 2000);
});

app.on('window-all-closed', function () {
  // Clear cart from localStorage before quitting
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.executeJavaScript(`
      localStorage.removeItem('guest_cart');
    `).catch(err => {
      console.error('Error clearing cart on window close:', err);
    });
  }

  if (pythonProcess) {
    pythonProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('quit', () => {
  if (pythonProcess) {
    pythonProcess.kill();
  }
});

