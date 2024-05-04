const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
  const createNewButton = document.querySelector('.create-new');

  createNewButton.addEventListener('click', () => {
    ipcRenderer.send('open-file-dialog-for-csv');
  });
});
