var svg ,inter, id ;

var FetchData = function(N, lastTime){
   var xhttp = new XMLHttpRequest();
         xhttp.onreadystatechange = function() {
           if (xhttp.readyState == 4 && xhttp.status == 200) {
                var data = eval(xhttp.responseText);
                data = data.map(function(r){
                    return {
                        "temperature": r.temperature,
                        "humidity": r.humidity,
                        "timestamp": r.insertedOnTicks
                    }
                });
                renderChart(data);    
            }
        };
      id = document.getElementById("teamId").value;
      xhttp.open("GET", "http://iotsl.azurewebsites.net/Weather/GetDeviceTemperature?id="+id+"&noOfRecords=10", true);
      xhttp.setRequestHeader("Access-Control-Allow-Origin","*");
      xhttp.send();
}

function renderChart(data){


if(svg){
   d3.select("svg").remove(); 
}
if(inter){
  clearInterval(inter);  
}


var pollingInterval = document.getElementById("pollingInterval").value;

//alert("Go for "+id);

var globalData = data;


var margin = {top: 30, right: 50, bottom: 30, left: 50},
    width = 1200 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;
var scalePadding = 5;
var x = d3.time.scale()
    .range([scalePadding, width-scalePadding]);

var y = d3.scale.linear()
    .range([height -scalePadding, scalePadding]);

var y1 = d3.scale.linear()
    .range([height - scalePadding, scalePadding]);

x.domain(d3.extent(globalData, function (d) { return d.timestamp; }));
y.domain(d3.extent(globalData, function (d) { return d.temperature;}));
y1.domain(d3.extent(globalData, function (d) { return d.humidity;}));


var xAxis = d3.svg.axis().scale(x)
    .orient("bottom")
    .ticks(d3.time.minutes, 1)
    .tickFormat(d3.time.format('%X'))
    .tickSize(1)
    .tickPadding(8);

var xAxisTop = d3.svg.axis().scale(x)
    .orient("bottom").tickFormat("").tickSize(0);

var yAxis = d3.svg.axis().scale(y)
    .orient("left")
    .ticks(5);

var yAxisRight = d3.svg.axis().scale(y1)
    .orient("right").ticks(5);

var tempLine = d3.svg.line()
    .x(function (d) { return x(d.timestamp); })
    .y(function (d) { return y(d.temperature); });

var humidityLine = d3.svg.line()
    .x(function (d) { return x(d.timestamp); })
    .y(function (d) { return y1(d.humidity); });

var zoom = d3.behavior.zoom()
    .x(x)
    .y(y)
    .scaleExtent([1, 4])
    .on("zoom", zoomed);

svg = d3.select("body")
    .append("svg")
    .attr("id", id)
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .call(zoom);

svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "plot"); // ????

var clip = svg.append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width)
    .attr("height", height);

var chartBody = svg.append("g")
    .attr("clip-path", "url(#clip)");

chartBody.append("path")        // Add the tempLine path
    .datum(globalData)
    .attr("class", "temp")
    .attr("d", tempLine);

chartBody.append("path")        // Add the humidityLine path
    .datum(globalData)
    .attr("class", "humidity")
    .attr("d", humidityLine);

svg.append("g")         // Add the X Axis
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

svg.append("g")         // Add the Y Axis
    .attr("class", "y axis")
    .call(yAxis);



svg.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate("+ width +",0)")
    .call(yAxisRight);

svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + String(0) + ")")
    .call(xAxisTop);

svg.append("text")
    .attr("class","temp")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", (0 - (height / 2)))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Temperature (Celcius)");

svg.append("text")
    .attr("class","humidity")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - (margin.left+width))
    .attr("x", (0 - (height / 2)))
    .attr("dy", 2 *(margin.left + width ) - 10)
    .style("text-anchor", "middle")
    .text("Humidity");

inter = setInterval(function () {
   FetchData();
}, pollingInterval);

var panMeasure = 0;
var oldScale = 1;
function zoomed() {

    d3.event.translate[1] = 0;
    svg.select(".x.axis").call(xAxis);
    
    if (Math.abs(oldScale - d3.event.scale) > 1e-5) {
        oldScale = d3.event.scale;
        svg.select(".y.axis").call(yAxis);
    }

    svg.select("path.line").attr("transform",
     "translate(" +d3.event.translate[0] + ",0)scale(" + d3.event.scale + ", 1)");
    
    panMeasure = d3.event.translate[0];
    console.log(panMeasure);
}


//////////////////////////////////////////////////////////////

var N = 2;
var dx = 0;
function update(data){
    globalData = data;
        if (panMeasure <= 0) { // add the new data and pan
        
        x1 = newData[0].timestamp;
        x2 = newData[newData.length - 1].timestamp;
        dx = dx + (x(x1) - x(x2)); // dx needs to be cummulative
        
        d3.select(".temp")
            .datum(globalData)
            .attr("class", "temp")
            .attr("d", tempLine(globalData));
            //.transition()
            //.ease("linear")
            //.attr("transform", "translate(" + String(dx) + ")");

        d3.select(".humidity")
            .datum(globalData)
            .attr("class", "humidity")
            .attr("d", humidityLine(globalData));
            //.transition()
            //.ease("linear")
            //.attr("transform", "translate(" + String(dx) + ")");


    }
    
    else { // otherwise - just add the new data 
        d3.select("path")
            .datum(globalData)
            .attr("class", "temp")
            .attr("d", tempLine(globalData));
         d3.select("path")
            .datum(globalData)
            .attr("class", "humidity")
            .attr("d", humidityLine(globalData));
    }
    x.domain(d3.extent(globalData, function (d) { return d.timestamp; }));
    svg.select(".x.axis").call(xAxis);
}
}
