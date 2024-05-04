const { info } = require('console');
const { ipcRenderer } = require('electron');


let data_start = 17;



document.addEventListener('DOMContentLoaded', () => {
  ipcRenderer.on('csv-file-path', (event, selectedFilePath) => {
    const fs = require('fs');
    fs.readFile(selectedFilePath, 'utf-8', (err, data) => {
      if (err) {
        logErrorToMain('Error reading the file:', err);
        return;
      }        
      parsingCSV(data);
      
    });
  });
});



function parsingCSV(file) {
  const arrays = [];

  const lines = file.split('\n');
  const headers = lines[15].split(',');  // check if the headers are correct
  //console.log(headers);

  indices = [];

  for (let i = data_start; i < lines.length; i++) {
    if(lines[i].includes('# Lap')) {
      indices.push(i);
    }
  }
  //console.log(indices);
  getLabTime(lines, headers, indices);
  getSpeed(lines, headers, indices);
}

function getLabTime(lines, headers, indices){
  let LapTime = [];

  for(let i = 0; i< indices.length-1; i++) {
    let start = lines[indices[i]+1].split(',');
    let end = lines[indices[i+1]+1].split(',');
    let time = end[0] - start[0];
    LapTime.push(time);
  }
  let start = lines[indices[indices.length-1]+1].split(',');
  let end = lines[lines.length-2].split(',');
  let time = end[0] - start[0];
  LapTime.push(time);
  // console.log(LapTime);
  const allTimeElement = document.getElementById('allTime');
  allTimeElement.innerHTML = (LapTime.reduce((a, b) => a + b, 0)).toFixed(1)+' s';
  const avgTimeElement = document.getElementById('avgTime');
  avgTimeElement.innerHTML = (LapTime.reduce((a, b) => a + b, 0)/LapTime.length).toFixed(1)+'s';
  const minTimeElement = document.getElementById('minTime');
  minTimeElement.innerHTML = Math.min(...LapTime).toFixed(1)+' s' + '(Lap ' + (LapTime.indexOf(Math.min(...LapTime))+1) +')';
  const maxTimeElement = document.getElementById('maxTime');
  maxTimeElement.innerHTML = Math.max(...LapTime).toFixed(1)+' s' + '(Lap ' + (LapTime.indexOf(Math.max(...LapTime))+1) +')';
  maxTimeElement.style.color = 'orange'
  minTimeElement.style.color = '#38ACEC'
}

function getSpeed(lines, headers, indices){
  let lapSpeed = [];
  //console.log(headers[12]);

  for(let i = 0; i< indices.length -1 ; i++) {
    let speed = 0;
    let count = 0;
    for(let j = indices[i]+1; j < indices[i+1]; j++) {
      let data = lines[j].split(',');
      if(isNaN(data[0])) continue;
      speed += parseFloat(data[12]);
      count++;
    }
    lapSpeed.push(speed/count);
  }
  let speed = 0;
  let count = 0;
  for(let j = indices[indices.length-1]+1; j < lines.length -2; j++) {
    let data = lines[j].split(',');
    if(isNaN(data[0])) {
      continue;
    }
    speed += parseFloat(data[12]);
    count++;
  }

  lapSpeed.push(speed/count);
//  console.log(lapSpeed);

  const avgSpeed = document.getElementById('avgSpeed');
  avgSpeed.innerHTML = (lapSpeed.reduce((a, b) => a + b, 0)/lapSpeed.length).toFixed(1)+' mph';
  const minSpeed = document.getElementById('minSpeed');
  minSpeed.innerHTML = Math.min(...lapSpeed).toFixed(1)+' mph' +'(Lap ' + (lapSpeed.indexOf(Math.min(...lapSpeed))+1) +')';
  minSpeed.style.color = '#38ACEC';
  const maxSpeed = document.getElementById('maxSpeed');
  maxSpeed.style.color = 'orange';
  maxSpeed.innerHTML = Math.max(...lapSpeed).toFixed(1)+' mph' + '(Lap ' + (lapSpeed.indexOf(Math.max(...lapSpeed))+1) +')';
}


function redirectToTime() {
  ipcRenderer.send('redirect-to-time');
}

function redirectToTrack() {
  ipcRenderer.send('redirect-to-track');
}