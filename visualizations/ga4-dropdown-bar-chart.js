looker.plugins.visualizations.add({
  id: "ga4-dropdown-bar-chart",
  label: "GA4 - Dropdown Bar Chart",
  create: function(element, config) {
    // Set up the chart container and dropdowns
    element.innerHTML = `
      <div style="font-family: sans-serif;">
                <select id="measure-select" style="font-family: sans-serif;"></select>
        <span style="font-family: 'Poppins', sans-serif;"> &nbsp; by &nbsp; </span>
                <select id="dimension-select" style="font-family: sans-serif;"></select>
      </div>
      <div class="chart-container" style="height: 85%; width: 100%; margin-top: 10px;">
        <!-- Chart will be rendered here -->
      </div>
    `;

    // Load D3.js library
    const script = document.createElement('script');
    script.src = 'https://d3js.org/d3.v6.min.js';
    script.async = true;
    document.body.appendChild(script);

    // Load custom font
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@100;300;400;500;700&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
  },
  updateAsync: function(data, element, config, queryResponse, details, doneRendering) {
    this.clearErrors();

    // Check if D3 library is loaded
    let intervalId = setInterval(() => {
      if (typeof d3 !== 'undefined') {
        clearInterval(intervalId);

        // Extract all dimensions and measures dynamically
        const dimensions = queryResponse.fields.dimensions;
        const measures = queryResponse.fields.measures;

        if (dimensions.length === 0 || measures.length === 0) {
          this.addError({ title: "No Data", message: "This visualization requires at least one dimension and one measure." });
          return;
        }

        // Populate the dropdowns
        const dimensionSelect = element.querySelector('#dimension-select');
        const measureSelect = element.querySelector('#measure-select');

        dimensionSelect.innerHTML = dimensions.map(dim => `<option value="${dim.name}">${dim.label}</option>`).join('');
        measureSelect.innerHTML = measures.map(meas => `<option value="${meas.name}">${meas.label}</option>`).join('');

        // Add event listeners to the dropdowns
        dimensionSelect.addEventListener('change', () => renderChart());
        measureSelect.addEventListener('change', () => renderChart());

        // Function to render the chart
        const renderChart = () => {
          // Get the selected dimension and measure
          const dimensionName = dimensionSelect.value || dimensions[0].name;
          const measureName = measureSelect.value || measures[0].name;

          // Process the data to create the chart-friendly structure
          let aggregatedData = d3.rollups(
            data,
            v => d3.sum(v, d => d[measureName].value),
            d => d[dimensionName].value
          ).map(([key, value]) => ({ [dimensionName]: key === null ? "N/A" : key, [measureName]: value }));

          // Limit the number of bars to 9
          aggregatedData = aggregatedData.slice(0, 9);

          // Set up the chart container
          const chartContainer = element.querySelector('.chart-container');
          chartContainer.innerHTML = ''; // Clear previous chart

          // Set up the D3.js chart
          const margin = { top: 10, right: 20, bottom: 40, left: 110 }; // Increase bottom margin for x-axis label
          const width = chartContainer.clientWidth - margin.left - margin.right;
          const height = chartContainer.clientHeight - margin.top - margin.bottom;

          const svg = d3.select(chartContainer)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

          // Set up the scales
          const y = d3.scaleBand()
            .domain(aggregatedData.map(d => d[dimensionName]))
            .range([0, height])
            .padding(0.1); // Increase padding to make bars slimmer and add more space between them

          const x = d3.scaleLinear()
            .domain([0, d3.max(aggregatedData, d => d[measureName])])
            .nice()
            .range([0, width]);

          // Add vertical gridlines
          svg.append("g")
          .attr("class", "grid")
          .call(d3.axisBottom(x)
            .ticks(3)
            .tickSize(height)
            .tickFormat(d3.format(",d")))
          .selectAll("line")
          .attr("stroke", "lightgrey");

          // Remove the x-axis line
          svg.selectAll(".domain").remove(); // Remove the x-axis line

          // Add the bars
          svg.selectAll(".bar")
            .data(aggregatedData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", 0)
            .attr("y", d => y(d[dimensionName]))
            .attr("width", d => x(d[measureName]))
            .attr("height", y.bandwidth())
            .attr("fill", "#1A73E8")
            .on("mouseover", function(event, d) {
              tooltip.transition()
                .style("opacity", 1);
              tooltip.html(`
                <div style="text-align: left;">
                  ${dimensionName}<br><strong>${d[dimensionName]}</strong><br><br>
                  ${measureName}<br><strong>${d3.format(",")(d[measureName])}</strong>
                </div>`);

              // Calculate tooltip position
              let tooltipX = event.pageX + 5;
              let tooltipY = event.pageY - 28;

              // Ensure tooltip stays within the viewport
              const tooltipWidth = tooltip.node().offsetWidth;
              const tooltipHeight = tooltip.node().offsetHeight;
              const windowWidth = window.innerWidth;
              const windowHeight = window.innerHeight;

              if (tooltipX + tooltipWidth > windowWidth) {
                tooltipX = windowWidth - tooltipWidth - 10;
              }
              if (tooltipY + tooltipHeight > windowHeight) {
                tooltipY = windowHeight - tooltipHeight - 10;
              }

              tooltip.style("left", tooltipX + "px")
                .style("top", tooltipY + "px")
                .style("color", "white");
            })
            .on("mouseout", function(d) {
              tooltip.transition()
                .style("opacity", 0);
            });

          // Add value labels to each bar
          svg.selectAll(".label")
            .data(aggregatedData)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x", d => x(d[measureName]) + 5)
            .attr("y", d => y(d[dimensionName]) + y.bandwidth() / 2)
            .attr("dy", ".35em")
            .attr("text-anchor", "start")
            .text(d => d3.format(",")(d[measureName])) // Format with commas
            .style("font-family", "Arial, sans-serif")
            .style("font-size", "12px")
            .style("font-weight", "600")
            .style("fill", "#1A73E8");

          // Add dimension value labels at the axis
          svg.selectAll(".dimension-label")
            .data(aggregatedData)
            .enter()
            .append("text")
            .attr("class", "dimension-label")
            .attr("x", -5) // Align to the left
            .attr("y", d => y(d[dimensionName]) + y.bandwidth() / 2)
            .attr("dy", ".35em")
            .attr("text-anchor", "end")
            .text(d => d[dimensionName].length > 15 ? d[dimensionName].substring(0, 15) + '...' : d[dimensionName])
            .style("font-family", "sans-serif")
            .style("font-size", "12px")
            .style("font-weight", "400")
            .style("fill", "#000");

          // Add y-axis label
          svg.append("text")
            .attr("class", "y-axis-label")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left)
            .attr("x", -height / 2)
            .attr("dy", "1em")
            .attr("text-anchor", "middle")
            .text(dimensionName)
            .style("font-family", "sans-serif")
            .style("font-size", "12px")
            .style("font-weight", "400")
            .style("fill", "#000");

          // Add x-axis label
          svg.append("text")
            .attr("class", "x-axis-label")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 10)
            .attr("text-anchor", "middle")
            .text(measureName)
            .style("font-family", "sans-serif")
            .style("font-size", "12px")
            .style("font-weight", "400")
            .style("fill", "#000");

          // Add tooltip div
          const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("text-align", "left") // Align text to the left
            .style("min-width", "120px") // Set a minimum width
            .style("height", "auto")
            .style("padding", "15px 5px") // Add more margin for top and bottom
            .style("font", "12px sans-serif")
            .style("background", "#262d33") // Change tooltip background color
            .style("border", "0px")
            .style("border-radius", "8px")
            .style("pointer-events", "none")
            .style("opacity", 0);
        };

        // Initial render
        renderChart();

        // Add resize event listener to make the chart responsive
        window.addEventListener('resize', renderChart);

        doneRendering();
      }
    }, 100);
  }
});
