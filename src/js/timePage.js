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
    getLabTime(lines, headers, indices);
  }


function getLabTime(lines, headers, indices){

    let LapTime = [];

    for(let i = 0; i< indices.length-1; i++) {
      let start = lines[indices[i]+1].split(',')[0];
      let end = lines[indices[i+1]+1].split(',')[0];
      let time = parseFloat(end) - parseFloat(start);
      LapTime.push(time);
    }
    let startLast = lines[indices[indices.length-1]+1].split(',')[0];
    let endLast = lines[lines.length-2].split(',')[0];
    let timeLast = parseFloat(endLast) - parseFloat(startLast);
    LapTime.push(timeLast);






    const width = 700,
        height = 400;
    let margin = { top: 50, right: 20, bottom: 100, left: 70 };
    let graphWidth = width - margin.left - margin.right;
    let graphHeight = height - margin.top - margin.bottom;



    
    const svg = d3.select('.canvas-time').append('svg')
        .attr('width', width)
        .attr('height', height);

    const graph = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Scales
    const x = d3.scaleBand()
        .domain(LapTime.map((d, index) => index + 1))
        .range([0, graphWidth])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([d3.min(LapTime) * 0.7, d3.max(LapTime)])
        .range([graphHeight, 0]);

    // Axis
    const xAxis = d3.axisBottom(x);
    const yAxis = d3.axisLeft(y).ticks(10);

    graph.append('g')
        .attr('transform', `translate(0, ${graphHeight})`)
        .call(xAxis);

    graph.append('g')
        .call(yAxis);

    // Add title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', margin.top / 2)
        .attr('text-anchor', 'middle')
        .attr('font-size', '2.0em')
        .attr('font-weight', 'bold')
        .attr('fill', 'white')
        .text('Lap Times');

    // Add x axis label
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height - margin.bottom / 2)
        .attr('text-anchor', 'middle')
        .attr('font-size', '1.5em')
        .attr('font-weight', 'bold')
        .attr('fill', 'white')
        .text('Lap #');

    // Add y axis label
    graph.selectAll('rect')
    .data(LapTime)
    .enter()
    .append('rect')
    .attr('x', (d, i) => x(i + 1))
    .attr('y', d => y(d))
    .attr('width', x.bandwidth())
    .attr('height', d => graphHeight - y(d))
    .attr('fill', '#33B36E')
    .attr('class', 'bar')
    .attr('cursor', 'pointer')
    .each(function(d, i) {
        const bar = d3.select(this);
        bar.on('mouseover', function() {
            bar.attr('fill', 'tomato');
            
            const lapNumber = i + 1;
            const lapTime = d;
            document.getElementById('lapCursored').innerHTML = `Lap ${lapNumber}`;
            document.getElementById('CursoredValue').innerHTML = `${lapTime.toFixed(1)} s`;
            document.getElementById('CursoredValue').style.color = `orange`;
            document.getElementById('lapCursored').style.color = `orange`;
        });
        bar.on('mouseout', function() {
            if (!bar.classed('selected')) {
                bar.attr('fill', '#33B36E');
            }
            else{
                bar.attr('fill', 'orange');
            }
        });
        bar.on('click', function() {
            const isSelected = bar.classed('selected');
            bar.classed('selected', !isSelected);
            bar.attr('fill', isSelected ? '#33B36E' : 'orange');

            const detailedTimes = getSpeed(lines, indices, i);
            renderLineGraph(detailedTimes, i);
        });
    });
    

   
    

        const allTimeElement = document.getElementById('allTime');
        allTimeElement.innerHTML = (LapTime.reduce((a, b) => a + b, 0)).toFixed(1)+' s';
        const avgTimeElement = document.getElementById('avgTime');
        avgTimeElement.innerHTML = (LapTime.reduce((a, b) => a + b, 0)/LapTime.length).toFixed(1)+'s';
        const minTimeElement = document.getElementById('minTime');
        minTimeElement.innerHTML = 'Lap ' + (LapTime.indexOf(Math.min(...LapTime))+1);
        const maxTimeElement = document.getElementById('maxTime');
        maxTimeElement.innerHTML = 'Lap ' + (LapTime.indexOf(Math.max(...LapTime))+1);

}


function getSpeed(lines, indices, lapNumber) {
    let Speed = [];
    for (let i = indices[lapNumber] + 1; i < indices[lapNumber + 1]; i++) {
        let data = lines[i].split(',');
        if (isNaN(parseFloat(data[12]))) continue;
        Speed.push(parseFloat(data[12]));
    }
    
    return Speed;
}

function renderLineGraph(detailedTimes, lapNumber) {
    const detailWidth = 600, detailHeight = 300;
    let graphId = `line-graph-${lapNumber}`; // Unique ID for each lap's line graph

    // Check if the line graph already exists
    let existingGraph = d3.select(`#${graphId}`);
    if (!existingGraph.empty()) {
        // If it exists, remove it
        existingGraph.remove();
        return; // Stop further execution since we're toggling off
    }

    // Create new line graph if it doesn't exist
    let detailSvg = d3.select('.canvas-speed').append('svg')
        .attr('id', graphId)
        .attr('width', detailWidth)
        .attr('height', detailHeight)
        .attr('style', 'margin-top: 20px; position: absolute; top: 0; left: 50;') // Overlay on the same space

    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const plotWidth = detailWidth - margin.left - margin.right;
    const plotHeight = detailHeight - margin.top - margin.bottom;

    const xScale = d3.scaleLinear()
        .domain([0, detailedTimes.length - 1])
        .range([0, plotWidth]);

    const yScale = d3.scaleLinear()
        .domain([0, Math.max(...detailedTimes) * 1.1])
        .range([plotHeight, 0]);

    const xAxis = d3.axisBottom(xScale).ticks(5);
    const yAxis = d3.axisLeft(yScale).ticks(5);

    const graph = detailSvg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    graph.append('g')
        .attr('transform', `translate(0, ${plotHeight})`)
        .call(xAxis);

    graph.append('g')
        .call(yAxis);

    const line = d3.line()
        .x((d, i) => xScale(i))
        .y(d => yScale(d));

    graph.append('path')
        .datum(detailedTimes)
        .attr('fill', 'none')
        .attr('stroke', d3.schemeCategory10[lapNumber % 10]) // Color by lap number
        .attr('stroke-width', 2)
        .attr('d', line);
}

function redirectToDash() {
    ipcRenderer.send('redirect-to-dash');
}
function redirectToTrack() {
    ipcRenderer.send('redirect-to-track');
}