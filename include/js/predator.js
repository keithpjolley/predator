// <!-- 01SEP2017 keithpjolley@gmail.com Squalor Heights, CA. MIT License -->

'use strict';

var svg = { phase: d3.select("#phase"),
            time:  d3.select("#time")},
    margin = {top: 20, right: 80, bottom: 30, left: 50},
    width  = {phase: svg.phase.attr("width") - margin.left - margin.right,
               time: svg.time.attr("width") - margin.left - margin.right},
    height = {phase: svg.phase.attr("height") - margin.top - margin.bottom,
               time: svg.time.attr("height") - margin.top - margin.bottom},
    x = { phase: d3.scaleLinear().range([0, width.phase]),
           time: d3.scaleLinear().range([0, width.time])},
    y = { phase: d3.scaleLinear().range([height.phase, 0]),
           time: d3.scaleLinear().range([height.time, 0])},
    z = d3.scaleOrdinal(d3.schemeCategory10);

let sliders = [ 
    {id: "bh", class_: "h", value: 0.2, min: 0, max: 1,    step: 0.001},
    {id: "dh", class_: "h", value: 0.9, min: 0, max: 1,    step: 0.001},
    {id: "bp", class_: "p", value: 0.6, min: 0, max: 1,    step: 0.001},
    {id: "dp", class_: "p", value: 0.2, min: 0, max: 1,    step: 0.001},
    {id: "n",  class_: "n", value: 30,  min: 1, max: 1000, step: 1}
  ],
  h0 = 0.25,
  p0 = 0.25,
  first = 0,
  tsteps = 250;

let timeline = d3.line()
      .x(function(d,i) { return x.time(i); })
      .y(function(d,i) { return y.time(d); });

sliders.forEach(function(d) {
  let control = d3.select("#thecontrols")
      .append("div")
      .attr("class", "controls " + d.class_ + "slider")
      .attr("id", d.id + "control");
  let div = control.append("div")
      .attr("class", "slider-wrapper");
  div.append("input")
      .attr("type",  "range")
      .attr("min",   d.min)
      .attr("max",   d.max)
      .attr("value", d.value)
      .attr("step",  d.step);
});

function createdata(laststep) {
  let dh = +d3.select("#dhcontrol input").node().value,
      bh = +d3.select("#bhcontrol input").node().value,
      dp = +d3.select("#dpcontrol input").node().value,
      bp = +d3.select("#bpcontrol input").node().value;
  function f(p1,p2) { return Math.pow(p1,4) - Math.pow(p1-p2, 4); }
  let h = laststep.h,
      p = laststep.p,
      H = h - h*f(1,dh*p) + (1-h-p)*f(1-p,bh*h),
      P = p - dp*p + bp*h*f(1,dh*p);
  return  { h: H, p: P };
};

function make_yp_gridlines() {
  return d3.axisLeft(y.phase).ticks(5);
};

x.phase.domain([0,0.5]);
y.phase.domain([0,0.5]);
x.time.domain([0,tsteps]);
y.time.domain([0,0.5]);

let defs = svg.phase.append("defs")
defs.append("marker")
    .attr("id", "arrow")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 5)
    .attr("refY", 0)
    .attr("markerWidth", 5)
    .attr("markerHeight", 5)
    .attr("orient", "auto")
    .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("class","arrowHead");
  
let gp = svg.phase.append("g")
    .attr("id", "refresh")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

gp.append("g")
    .attr("class", "axis")// axis--x")
    .attr("transform", "translate(" + 0 + "," + height.phase + ")")
    .call(d3.axisBottom(x.phase))
  .append("text")
    .attr("class", "label")
    .attr("x", x.phase(d3.max(x.phase.domain())))
    .attr("y", 0)
    .attr("dy", "-0.5em")
    .style("fill", z("h"))
    .text("prey >");

gp.append("g")
    .attr("class", "axis axis--y")
    .call(d3.axisLeft(y.phase))
  .append("text")
    .attr("class", "label")
    .attr("transform", "rotate(-90)")
    .attr("x", 0)
    .attr("y", y.phase(d3.max(y.phase.domain())))
    .attr("dx", "-0.5em")
    .attr("dy", "1em")
    .attr("text-anchor", "end")
    .style("fill", z("p"))
    .text("predator >");

gp.append("g")
    .attr("class", "grid")
    .call(make_yp_gridlines().tickSize(-width.phase).tickFormat(""));

let gt = svg.time.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

gt.append("g")
    .attr("class", "axis")// axis--x")
    .attr("transform", "translate(" + 0 + "," + height.time + ")")
    .call(d3.axisBottom(x.time).tickValues([]))
  .append("text")
    .attr("class", "label")
    .attr("x", x.time(d3.max(x.time.domain())))
    .attr("y", 0)
    .attr("dy", "-0.5em")
    .text("time");

gt.append("g")
    .attr("class", "axis axis--y")
    .call(d3.axisLeft(y.time))
  .append("text")
    .attr("class", "label")
    .attr("transform", "rotate(-90)")
    .attr("x", 0)
    .attr("y", y.time(d3.max(y.time.domain())))
    .attr("dx", "-0.5em")
    .attr("dy", "1em")
    .attr("text-anchor", "end")
    .text("");

function pupdate(pdata) {

  let phase = gp.selectAll(".phase")
      .data(pdata, function(d) { return d; });
  phase.exit().remove();
  phase.enter().append("line")
      .attr("class", "phase line" + (first++ ? "" : " first")) // could not get "first" to .exit().  ??
      .attr("marker-end", "url(#arrow)")
      .attr("x1", function(d) { return x.phase(d.h0); })
      .attr("y1", function(d) { return y.phase(d.p0); })
      .attr("x2", function(d) { return x.phase(d.h1); })
      .attr("y2", function(d) { return y.phase(d.p1); });
};

function tupdate(tdata) {
  let time = gt.selectAll(".time")
      .data(tdata, function(d) { return d; });
  time.exit().remove();
  time.enter().append("path")
      .attr("class", "time line")
      .style("stroke", function(d,i) { return z(d.id); })
      .attr("d", function(d,i) { return timeline(d.values); });
}; 

document.addEventListener('DOMContentLoaded', function() {

  d3.select("#thetitle").text("Predator/Prey"); // set our title

  // init
  let step = {h: h0, p: p0},       // starting point
      lstep,                       // last step
      pdata = [],                  // phase graph data
      tdata = [{id:"",values:[]}]; // time series data (include a dummy row)

  // initialize tdata array and set the background color of the sliders
  Object.keys(step).forEach(function(d,i) {
    d3.selectAll("." + d + "slider .ui-slider-track").style("background-color", z(d));
    tdata.push({id: d, values: [] })
  });

  // label the slider handles
  sliders.forEach(function(d) {
    d3.selectAll("#" + d.id + "control a" ).text(d.id);
  });

  // main loop
  d3.interval(
    function(){
      // get how many steps to show in the phase plot
      let N = +d3.select("#ncontrol input").node().value;
      lstep = step; // keep track of our last step
      step = createdata(step); // this time step

      // push this step onto the data arrays
      pdata.push({p0: lstep.p, h0: lstep.h, p1: step.p, h1: step.h});
      // take off any old data
      while(pdata.length > N+1) { pdata.shift(); }

      // push new, remove old tdata
      Object.keys(step).forEach(function(d,i) {
        tdata[tdata.findIndex(function(c,j) { return c.id==d })].values.push(step[d])
        while(tdata[tdata.findIndex(function(c,j) { return c.id==d })].values.length > tsteps) {
          tdata[tdata.findIndex(function(c,j) { return c.id==d })].values.shift();
        };
      });

      // update graphs
      pupdate(pdata);
      tupdate(tdata);
    },
    100,
  );
}, false);
