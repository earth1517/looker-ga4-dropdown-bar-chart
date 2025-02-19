looker.plugins.visualizations.add({
  id: "ga4-dropdown-bar-chart",
  label: "GA4 - Drop-down Bar Chart",
  create: function(element, config) {

    // Insert a <style> tag with updated styles for layout, headings, and content
    element.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@400;700&display=swap');

      .hello-world-vis {
        height: 100%;
        display: flex;
        flex-direction: column; /* Stack rows */
        text-align: left;
        font-family: 'Kanit', sans-serif;
        padding: 20px;
        gap: 15px;
      }

      .hello-world-header {
        font-size: 1.5em;
        font-weight: 400; /* Regular font weight for header */
        text-align: left; /* Align header to the left */
        margin-bottom: 20px;
        color: #3a4245; /* Change the header color here */
      }


      .hello-world-row {
        display: flex;
        gap: 15px;
        justify-content: space-between;
      }

      .hello-world-box {
        flex: 1;
        padding: 15px;
        border-radius: 10px;
        box-shadow: 2px 2px 10px rgba(0,0,0,0.1);
        font-size: 14px; /* Smaller font size */
      }

      /* Set background color for the first two boxes */
      .first-box {
        background: #57b0f2;
        color: white;
      }

      .second-box {
        background: #57b0f2;
        color: white;
      }

      /* Default color for third box */
      .third-box {
        background: #f5f5f5; /* Light gray */
        color: black;
      }

      .hello-world-heading {
        font-size: 1em; /* Regular font size for headers */
        font-weight: 500; /* Regular font weight for headers */
        margin-bottom: 8px;
      }

      .hello-world-content {
        font-size: 12px; /* Light font for content */
        font-weight: 300; /* Lighter font weight for content */
      }

      .info-text {
        font-size: 12px;
        margin-top: 20px;
        text-align: center;
        color: #555;
        font-style: italic;
      }
    </style>
  `;

    var container = element.appendChild(document.createElement("div"));
    container.className = "hello-world-vis";

    // Add the "Need help generating content?" header
    this._header = container.appendChild(document.createElement("div"));
    this._header.className = "hello-world-header";
    this._header.innerHTML = "Need help generating content?";

    // First row (2 boxes side by side)
    var rowContainer = container.appendChild(document.createElement("div"));
    rowContainer.className = "hello-world-row";

    this._firstBox = rowContainer.appendChild(document.createElement("div"));
    this._firstBox.className = "hello-world-box first-box"; // Apply first box class

    this._secondBox = rowContainer.appendChild(document.createElement("div"));
    this._secondBox.className = "hello-world-box second-box"; // Apply second box class

    // Third box (below the first row)
    this._thirdBox = container.appendChild(document.createElement("div"));
    this._thirdBox.className = "hello-world-box third-box"; // Apply third box class

    // Add the info text underneath the boxes
    this._infoText = container.appendChild(document.createElement("div"));
    this._infoText.className = "info-text";
    this._infoText.innerHTML = "The Generative Feature operates within a controlled environment, meaning that the generated content may not fully capture the true underlying nature of the selected trending topic. To gain a more comprehensive understanding, please use the 'Explore More' action to learn more about the content.";
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors();

    if (queryResponse.fields.dimensions.length < 3) {
      this.addError({title: "Not Enough Dimensions", message: "This chart requires at least three dimensions."});
      return;
    }

    var firstRow = data[0];
    var firstCell = firstRow[queryResponse.fields.dimensions[0].name];
    var secondCell = firstRow[queryResponse.fields.dimensions[1].name];
    var thirdCell = firstRow[queryResponse.fields.dimensions[2].name];

    // Format content for all three cells
    const formattedFirstCell = formatContent(LookerCharts.Utils.htmlForCell(firstCell));
    const formattedSecondCell = formatContent(LookerCharts.Utils.htmlForCell(secondCell));
    const formattedThirdCell = formatContent(LookerCharts.Utils.htmlForCell(thirdCell));

    // Insert formatted data into the boxes with headings
    this._firstBox.innerHTML = `<div class="hello-world-heading">Topic</div><div class="hello-world-content">${formattedFirstCell}</div>`;
    this._secondBox.innerHTML = `<div class="hello-world-heading">User's Prompt</div><div class="hello-world-content">${formattedSecondCell}</div>`;
    this._thirdBox.innerHTML = `<div class="hello-world-heading">Generated Content</div><div class="hello-world-content">${formattedThirdCell}</div>`;

    done();
  }
});

function formatContent(content) {
  let formattedContent = '<div>';

  // Split content by lines
  const lines = content.split('\n');

  lines.forEach(line => {
      let cleanedLine = line.trim().replace(/^>\s*/, ''); // Remove '>' from the start

      if (cleanedLine.startsWith('## ')) {
          formattedContent += `<span style="font-size: 1.5em; font-weight: 400;">${cleanedLine.substring(3)}</span><br>`;
      } else if (cleanedLine.includes('**')) {
          cleanedLine = cleanedLine.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
          formattedContent += `${cleanedLine}<br>`;
      } else {
          formattedContent += `${cleanedLine}<br>`;
      }
  });

  formattedContent += '</div>';
  return formattedContent;
}
