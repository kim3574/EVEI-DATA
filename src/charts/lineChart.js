
function Main() {
    var svg = d3.select("svg"),
    margin = 200,
    width = svg.attr("width") - margin,
    height = svg.attr("height") - margin;

    var xScale = d3.scaleBand().range([0, width]).padding(0.4),
    yScale = d3.scaleLinear().range([height, 0]);

    var g = svg.append("g").attr("transform", "translate(" + 100 + "," + 100 + ")");
    d3.csv("../../a.csv" ).then(function(data) {
        xScale.domain(data.map(function(d) { return d.year; }));
        yScale.domain([0, d3.max(data, function(d) { return d.value; })]);

        g.append("g").attr("transform", "translate(0," + height + ")").call(d3.axisBottom(xScale));
        g.append("g").call(d3.axisLeft(yScale));
    g.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return xScale(d.year); })
        .attr("y", function(d) { return yScale(d.value); })
        .attr("width", xScale.bandwidth())
        .attr("height", function(d) { return height - yScale(d.value); });
    });
}
