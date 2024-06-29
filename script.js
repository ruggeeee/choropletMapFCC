const width = 960;
const height = 600;

const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

const path = d3.geoPath();

const x = d3.scaleLinear()
  .domain([2.6, 75.1])
  .rangeRound([600, 860]);

const color = d3.scaleThreshold()
  .domain(d3.range(2.6, 75.1, (75.1 - 2.6) / 8))
  .range(d3.schemeBlues[9]);

const g = svg.append("g")
  .attr("class", "key")
  .attr("transform", "translate(0,40)");

g.selectAll("rect")
  .data(color.range().map(d => {
    d = color.invertExtent(d);
    if (d[0] == null) d[0] = x.domain()[0];
    if (d[1] == null) d[1] = x.domain()[1];
    return d;
  }))
  .enter().append("rect")
  .attr("height", 8)
  .attr("x", d => x(d[0]))
  .attr("width", d => x(d[1]) - x(d[0]))
  .attr("fill", d => color(d[0]));

g.append("text")
  .attr("class", "caption")
  .attr("x", x.range()[0])
  .attr("y", -6)
  .attr("fill", "#000")
  .attr("text-anchor", "start")
  .attr("font-weight", "bold")
  .text("Percentage");

g.call(d3.axisBottom(x)
  .tickSize(13)
  .tickFormat(x => Math.round(x) + '%')
  .tickValues(color.domain()))
  .select(".domain")
  .remove();

Promise.all([
  d3.json("https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json"),
  d3.json("https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json")
]).then(([us, education]) => {
  const educationById = {};
  education.forEach(d => {
    educationById[d.fips] = +d.bachelorsOrHigher;
  });

  svg.append("g")
    .attr("class", "counties")
    .selectAll("path")
    .data(topojson.feature(us, us.objects.counties).features)
    .enter().append("path")
    .attr("class", "county")
    .attr("data-fips", d => d.id)
    .attr("data-education", d => educationById[d.id])
    .attr("fill", d => color(educationById[d.id]))
    .attr("d", path)
    .on("mouseover", function(event, d) {
      const edu = educationById[d.id];
      d3.select("#tooltip")
        .style("opacity", 1)
        .html(`FIPS: ${d.id}<br>Education: ${edu}%`)
        .attr("data-education", edu);
    })
    .on("mousemove", function(event) {
      d3.select("#tooltip")
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      d3.select("#tooltip")
        .style("opacity", 0);
    });

  svg.append("path")
    .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
    .attr("class", "states")
    .attr("d", path);

  // Legend
  const legendWidth = 400;
  const legendHeight = 20;
  const legendColors = color.range();

  const legend = svg.append("g")
    .attr("id", "legend")
    .attr("transform", `translate(${(width - legendWidth) / 2}, ${height + 40})`);

  const legendScale = d3.scaleLinear()
    .domain([2.6, 75.1])
    .range([0, legendWidth]);

  legend.selectAll("rect")
    .data(color.range().map(d => {
      d = color.invertExtent(d);
      if (d[0] == null) d[0] = legendScale.domain()[0];
      if (d[1] == null) d[1] = legendScale.domain()[1];
      return d;
    }))
    .enter().append("rect")
    .attr("x", d => legendScale(d[0]))
    .attr("y", 0)
    .attr("width", d => legendScale(d[1]) - legendScale(d[0]))
    .attr("height", legendHeight)
    .style("fill", d => color(d[0]));

  legend.append("g")
    .attr("transform", `translate(0, ${legendHeight})`)
    .call(d3.axisBottom(legendScale)
      .tickSize(13)
      .tickValues(color.domain()))
    .select(".domain")
    .remove();
});
