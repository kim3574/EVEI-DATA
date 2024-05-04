const { ipcRenderer } = require('electron');
const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

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
    const lines = file.split('\n');
    const headers = lines[15].split(',');  // Assuming line 15 has headers
    console.log(headers[8]); // latitude
    console.log(headers[9]); // longitude

    let indices = [];
    for (let i = data_start; i < lines.length; i++) {
        if(lines[i].includes('# Lap')) {
            indices.push(i);
        }
    }
    getCoordinates(lines, headers, indices);
}

function getCoordinates(lines, headers, indices) {
    const lapData = indices.map((startIndex, index) => {
        const endIndex = index + 1 < indices.length ? indices[index + 1] : lines.length;
        const lapPoints = [];
        for (let i = startIndex; i < endIndex; i++) {
            let data = lines[i].split(',');
            if (!isNaN(data[0])) {
                lapPoints.push({
                    lat: parseFloat(data[8]),
                    long: parseFloat(data[9])
                });
            }
        }
        return lapPoints;
    });

    updateLapSelection(lapData);
}

function updateLapSelection(lapData) {
    const lapSelectionDiv = document.getElementById('lapSelection');
    lapSelectionDiv.innerHTML = ''; // Clear existing checkboxes

    lapData.forEach((lap, index) => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'lap' + index;
        checkbox.checked = true;
        checkbox.onchange = () => toggleLapVisibility(index, checkbox.checked);
        const label = document.createElement('label');
        label.className = 'label-large';
        label.htmlFor = 'lap' + index;
        label.textContent = 'Lap ' + (index + 1);
        label.style.color = colorScale(index);  // Set the label's text color to match the lap color

        lapSelectionDiv.appendChild(checkbox);
        lapSelectionDiv.appendChild(label);
    });

    drawGPSData(lapData);
}

function drawGPSData(lapData) {
    const allPoints = lapData.flat();
    const width = 600;  // Set the width of your SVG from your HTML
    const height = 450; // Set the height of your SVG from your HTML
    const svg = d3.select('.time-contents');
    svg.selectAll('*').remove(); // Clear existing drawing
    const zoom = d3.zoom()
    .scaleExtent([1, 10])  // This allows scaling between 1x and 10x
    .translateExtent([[-100, -100], [width + 100, height + 100]])  // Limits the panning
    .on("zoom", (event) => {
        // Apply transformations to the group
        g.attr("transform", event.transform);
    });
    // Create clip path for zooming to contain elements within the SVG
    svg.append("defs").append("clipPath")
       .attr("id", "clip")
       .append("rect")
       .attr("width", width)
       .attr("height", height);

    const g = svg.append("g")
        .attr("clip-path", "url(#clip)");

    const xScale = d3.scaleLinear()
        .domain([d3.min(allPoints, d => d.long), d3.max(allPoints, d => d.long)])
        .range([0, width]);
    const yScale = d3.scaleLinear()
        .domain([d3.min(allPoints, d => d.lat), d3.max(allPoints, d => d.lat)])
        .range([height, 0]);

 

    svg.call(zoom);  // Call the zoom behavior on the SVG

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(lapData.map((_, i) => i));

        lapData.forEach((lapPoints, index) => {
            const group = g.append('g').attr('id', 'lapGroup' + index);
            group.selectAll('circle')
                .data(lapPoints)
                .enter()
                .append('circle')
                .attr('cx', d => xScale(d.long))
                .attr('cy', d => yScale(d.lat))
                .attr('r', 5)
                .style('fill', () => colorScale(index));  // Use the global color scale
        });
}


function toggleLapVisibility(lapIndex, isVisible) {
    const lapGroup = d3.select('#lapGroup' + lapIndex);
    lapGroup.style('display', isVisible ? 'block' : 'none');
}


function redirectToDash() {
    ipcRenderer.send('redirect-to-dash');
}
function redirectToTime() {
    ipcRenderer.send('redirect-to-time');
  }
  