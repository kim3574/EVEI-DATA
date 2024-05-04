const { app, BrowserWindow, ipcMain, dialog } = require('electron');



let firstWindow = null;

function createWindow() {
    firstWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        resizable: false, // prevent resizing the window
        

        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false // Ensure this is false if using nodeIntegration
        }
    });
    console.log('Loading file');
    firstWindow.loadFile('./src/pages/entryPage.html');
}


let selectedFilePath = null; // Store the selected file path

ipcMain.on('open-file-dialog-for-csv', (event) => {
    dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'CSV Files', extensions: ['csv'] }]
    }).then(result => {
      if (!result.canceled && result.filePaths.length > 0) {
        selectedFilePath = result.filePaths[0];
        if (firstWindow) {
          firstWindow.close(); // Close the entry window
          firstWindow = null;
        }

        firstWindow = new BrowserWindow({
          width: 1500,
          height: 900,
          resizable: false, // prevent resizing the window

          webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false,
            devTools: true,
          }
        });
        firstWindow.loadFile('./src/pages/summaryPage.html');
        firstWindow.webContents.on('did-finish-load', () => {
          firstWindow.webContents.send('csv-file-path', selectedFilePath);
        });
      }
    }).catch(err => {
      console.log(err);
    });
 
    ipcMain.on('redirect-to-time', (event) => {
      firstWindow.loadFile('./src/pages/timePage.html');
        firstWindow.webContents.send('csv-file-path', selectedFilePath);
    });
    ipcMain.on('redirect-to-dash', (event) => {
      console.log('redirecting to dash');
      firstWindow.loadFile('./src/pages/summaryPage.html');
        firstWindow.webContents.send('csv-file-path', selectedFilePath);
    });
    ipcMain.on('redirect-to-track', (event) => {
      console.log('redirecting to dash');
      firstWindow.loadFile('./src/pages/track.html');
        firstWindow.webContents.send('csv-file-path', selectedFilePath);
    });


  });
 




app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});



ipcMain.on('log-to-main', (event, message) => {
  console.log(message);
});

ipcMain.on('log-error-to-main', (event, errorMessage) => {
  console.error(errorMessage);
});


