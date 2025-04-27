// API endpoints
const LOGIN_PATH = "https://01.gritlab.ax/api/auth/signin";
const GRAPHQL_PATH = "https://01.gritlab.ax/api/graphql-engine/v1/graphql";

// DOM elements
const LOGIN_DIV = document.getElementById("login_div");
const PROFILE_DIV = document.getElementById("profile_div");
const LOGIN_BTN = document.getElementById("login-btn");
const LOGOUT_BTN = document.getElementById("logout-btn");
const TOAST_MESSAGE = document.getElementById("toast-message");

// GraphQL query
const PROFILE_QUERY = `{
  user {
    id
    login
    attrs
    campus
    auditRatio
    totalUp
    totalDown
  }
  
  completed: result(
    where: {
      _and: [
        { path: { _ilike: "/gritlab/school-curriculum/%" } },
        { path: { _nilike: "/gritlab/school-curriculum/%/%" } },
        { path: { _nilike: "/gritlab/school-curriculum/piscine" } },
        { path: { _nilike: "/gritlab/school-curriculum/checkpoint" } }
      ],
      isLast: {_eq: true}
    }
    order_by: [{createdAt: asc}]
  ) {
    objectId
    path
    grade
    createdAt
  }
  
  xp_view: transaction(
    where: {
      _and: [
        { path: { _ilike: "/gritlab/school-curriculum/%" } },
        { path: { _nilike: "/gritlab/school-curriculum/%/%" } },
        { path: { _nilike: "/gritlab/school-curriculum/piscine" } },
        { path: { _nilike: "/gritlab/school-curriculum/checkpoint" } }
      ],
      type: {_eq: "xp"}
    }
    order_by: [{createdAt: asc}]
  ) {
    objectId
    path
    amount
    createdAt
  }
  
  audits: transaction(
    where: {
      _and: [
        { path: { _ilike: "/gritlab/school-curriculum/%" } },
        { path: { _nilike: "/gritlab/school-curriculum/%/%" } },
        { path: { _nilike: "/gritlab/school-curriculum/piscine" } },
        { path: { _nilike: "/gritlab/school-curriculum/checkpoint" } }
      ],
      type: {_in: ["up", "down"]}
    }
    order_by: [{createdAt: desc}]
  ) {
    attrs
    type
    objectId
    path
    amount
    createdAt
  }
  
  skills: transaction(
    order_by: [{ type: desc }, { amount: desc }]
    distinct_on: [type]
    where: { type: { _ilike: "skill_%" } }
  ) {
    objectId
    eventId
    type
    amount
    createdAt
  }
}`;

// Check if token is valid
function isTokenValid(token) {
  if (!token) {
    return false;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();

    if (currentTime < expirationTime) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Invalid token:", error);
    return false;
  }
}

// Show toast message
function showMessage(message) {
  if (message === "") {
    return;
  }

  TOAST_MESSAGE.textContent = message;
  TOAST_MESSAGE.style.display = "block";

  setTimeout(function () {
    TOAST_MESSAGE.style.display = "none";
  }, 3000);
}

// Update page display based on login status
function updateDisplay() {
  const token = sessionStorage.getItem("jwt");

  if (isTokenValid(token)) {
    LOGIN_DIV.style.display = "none";
    PROFILE_DIV.style.display = "block";
    fetchProfileData();
  } else {
    LOGIN_DIV.style.display = "block";
    PROFILE_DIV.style.display = "none";
  }
}

// Execute GraphQL query
async function executeGraphql(query) {
  const jwtToken = sessionStorage.getItem("jwt");

  return fetch(GRAPHQL_PATH, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + jwtToken,
    },
    body: JSON.stringify({ query: query }),
  })
    .then(function (response) {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error("GraphQL query failed");
      }
    })
    .catch(function (error) {
      console.error("Error:", error);
      showMessage("An error occurred fetching your data");
    });
}

// Update DOM with user info
function insertData(elementId, data) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = data;
  }
}

// Format date
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString();
}

// Fetch and display profile data
async function fetchProfileData() {
  const data = await executeGraphql(PROFILE_QUERY);
  if (data && data.data) {
    // User info
    const user = data.data.user[0];
    insertData("id", user.id);
    insertData("login", user.login);
    insertData("campus", user.campus);

    // Display more user info if available
    if (user.attrs) {
      if (user.attrs.firstName && user.attrs.lastName) {
        insertData("name", user.attrs.firstName + " " + user.attrs.lastName);
      }
      if (user.attrs.email) {
        insertData("email", user.attrs.email);
      }
      if (user.attrs.gender) {
        insertData("gender", user.attrs.gender);
      }
      if (user.attrs.nationality) {
        insertData("nationality", user.attrs.nationality);
      }
    }

    // Draw charts
    drawXPGrowthChart(data.data.xp_view);
    drawAuditHorizontalChart(user);
    drawVerticalProjectsTimeline(data.data.completed);

    // Update project statistics
    updateProjectStatistics(data.data.completed);

    // Update skills table
    updateSkillsTable(data.data.skills);
  }
}

// Update skills table
function updateSkillsTable(skillsData) {
  const skillsTableDiv = document.getElementById("skills-table");

  if (!skillsData || skillsData.length === 0) {
    skillsTableDiv.innerHTML =
      '<p class="no-data">No skills data available</p>';
    return;
  }

  // Create table structure
  let tableHTML = `
        <table class="skills-table">
            <thead>
                <tr>
                    <th>Skill</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
    `;

  // Format skill names for better display
  skillsData.forEach((skill) => {
    // Extract skill name from type (remove "skill_" prefix)
    let skillName = skill.type.replace("skill_", "");

    // Replace underscores with spaces and capitalize each word
    skillName = skillName
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    tableHTML += `
            <tr>
                <td>${skillName}</td>
                <td>${skill.amount.toLocaleString()}</td>
            </tr>
        `;
  });

  tableHTML += `
            </tbody>
        </table>
    `;

  skillsTableDiv.innerHTML = tableHTML;
}

// Update project statistics
function updateProjectStatistics(completedProjects) {
  const completedCount = document.getElementById("completedCount");
  const successRate = document.getElementById("successRate");

  if (!completedProjects || completedProjects.length === 0) {
    completedCount.textContent = "0";
    successRate.textContent = "0%";
    return;
  }

  const total = completedProjects.length;
  const passed = completedProjects.filter(
    (project) => project.grade >= 1
  ).length;
  const rate = Math.round((passed / total) * 100);

  completedCount.textContent = total;
  successRate.textContent = rate + "%";

  // Add color based on success rate
  if (rate >= 80) {
    successRate.style.color = "#4CAF50"; // Green for high success
  } else if (rate >= 60) {
    successRate.style.color = "#FFC107"; // Yellow for medium success
  } else {
    successRate.style.color = "#F44336"; // Red for low success
  }
}

// Draw XP growth over time chart - Improved
function drawXPGrowthChart(xpData) {
  const svg = document.getElementById("xpChart");
  svg.innerHTML = "";

  if (!xpData || xpData.length === 0) {
    drawNoDataMessage(svg, "No XP data available");
    return;
  }

  // Make the chart responsive to the container
  const containerWidth = svg.parentElement.clientWidth || 600;
  const width = containerWidth - 40; // Allow for padding
  const height = 300;
  const margin = { top: 40, right: 40, bottom: 40, left: 110 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Update SVG dimensions
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);

  // Sort by date
  xpData.sort(function (a, b) {
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  // Calculate cumulative XP
  let cumulativeXP = 0;
  const dataPoints = xpData.map(function (item) {
    cumulativeXP += item.amount;
    return {
      date: new Date(item.createdAt),
      amount: item.amount,
      cumulative: cumulativeXP,
      path: item.path,
    };
  });

  // Find min and max dates and total XP
  const minDate = dataPoints[0].date;
  const maxDate = dataPoints[dataPoints.length - 1].date;
  const totalXP = dataPoints[dataPoints.length - 1].cumulative;

  // Round up max XP to a nice number for display
  const maxXP = Math.ceil(totalXP / 1000) * 1000;

  // Draw axes
  const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
  xAxis.setAttribute("x1", margin.left);
  xAxis.setAttribute("y1", height - margin.bottom);
  xAxis.setAttribute("x2", width - margin.right);
  xAxis.setAttribute("y2", height - margin.bottom);
  xAxis.setAttribute("stroke", "white");
  xAxis.setAttribute("stroke-width", 2);
  svg.appendChild(xAxis);

  const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
  yAxis.setAttribute("x1", margin.left);
  yAxis.setAttribute("y1", margin.top);
  yAxis.setAttribute("x2", margin.left);
  yAxis.setAttribute("y2", height - margin.bottom);
  yAxis.setAttribute("stroke", "white");
  yAxis.setAttribute("stroke-width", 2);
  svg.appendChild(yAxis);

  // Draw horizontal grid lines
  const numGridLines = 5;
  for (let i = 0; i < numGridLines; i++) {
    const y = margin.top + (chartHeight / numGridLines) * i;
    const gridLine = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    gridLine.setAttribute("x1", margin.left);
    gridLine.setAttribute("y1", y);
    gridLine.setAttribute("x2", width - margin.right);
    gridLine.setAttribute("y2", y);
    gridLine.setAttribute("stroke", "#555");
    gridLine.setAttribute("stroke-width", 1);
    gridLine.setAttribute("stroke-dasharray", "5,5");
    svg.appendChild(gridLine);

    // Y-axis labels at each grid line
    const yValue = maxXP - (maxXP / numGridLines) * i;
    const yLabel = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    yLabel.setAttribute("x", margin.left - 10);
    yLabel.setAttribute("y", y);
    yLabel.setAttribute("text-anchor", "end");
    yLabel.setAttribute("dominant-baseline", "middle");
    yLabel.setAttribute("fill", "white");
    yLabel.textContent = Math.round(yValue).toLocaleString() + " XP";
    svg.appendChild(yLabel);
  }

  // Draw bottom grid line and label (0 XP)
  const bottomY = height - margin.bottom;
  const bottomGridLine = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "line"
  );
  bottomGridLine.setAttribute("x1", margin.left);
  bottomGridLine.setAttribute("y1", bottomY);
  bottomGridLine.setAttribute("x2", width - margin.right);
  bottomGridLine.setAttribute("y2", bottomY);
  bottomGridLine.setAttribute("stroke", "#555");
  bottomGridLine.setAttribute("stroke-width", 1);
  svg.appendChild(bottomGridLine);

  const zeroLabel = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
  );
  zeroLabel.setAttribute("x", margin.left - 10);
  zeroLabel.setAttribute("y", bottomY);
  zeroLabel.setAttribute("text-anchor", "end");
  zeroLabel.setAttribute("dominant-baseline", "middle");
  zeroLabel.setAttribute("fill", "white");
  zeroLabel.textContent = "0 XP";
  svg.appendChild(zeroLabel);

  // Draw XP growth line
  let pathData = "";
  const points = [];

  dataPoints.forEach(function (point, index) {
    // Convert date and XP to coordinates
    const x =
      margin.left + ((point.date - minDate) / (maxDate - minDate)) * chartWidth;
    const y = height - margin.bottom - (point.cumulative / maxXP) * chartHeight;

    points.push({ x, y, data: point });

    if (index === 0) {
      pathData = "M " + x + " " + y;
    } else {
      pathData += " L " + x + " " + y;
    }
  });

  // Draw the line
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", pathData);
  path.setAttribute("stroke", "#b77ac7");
  path.setAttribute("stroke-width", 3);
  path.setAttribute("fill", "none");
  svg.appendChild(path);

  // Draw dots at XP gain points
  points.forEach(function (point) {
    const dot = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    dot.setAttribute("cx", point.x);
    dot.setAttribute("cy", point.y);
    dot.setAttribute("r", 5);
    dot.setAttribute("fill", "#b77ac7");
    dot.setAttribute("stroke", "white");
    dot.setAttribute("stroke-width", 1);
    svg.appendChild(dot);
  });

  // Draw date labels on X-axis
  const startDateLabel = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
  );
  startDateLabel.setAttribute("x", margin.left);
  startDateLabel.setAttribute("y", height - 10);
  startDateLabel.setAttribute("fill", "white");
  startDateLabel.textContent = formatDate(minDate);
  svg.appendChild(startDateLabel);

  const endDateLabel = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
  );
  endDateLabel.setAttribute("x", width - margin.right);
  endDateLabel.setAttribute("y", height - 10);
  endDateLabel.setAttribute("text-anchor", "end");
  endDateLabel.setAttribute("fill", "white");
  endDateLabel.textContent = formatDate(maxDate);
  svg.appendChild(endDateLabel);

  // Draw title with total XP
  const title = document.createElementNS("http://www.w3.org/2000/svg", "text");
  title.setAttribute("x", width / 2);
  title.setAttribute("y", 20);
  title.setAttribute("text-anchor", "middle");
  title.setAttribute("fill", "white");
  title.setAttribute("font-weight", "bold");
  title.textContent =
    "XP Growth Over Time: " + totalXP.toLocaleString() + " XP";
  svg.appendChild(title);
}

// Draw horizontal audit bars chart - Improved
function drawAuditHorizontalChart(userData) {
  const svg = document.getElementById("auditChart");
  svg.innerHTML = "";

  const totalUp = userData.totalUp || 0;
  const totalDown = userData.totalDown || 0;

  if (totalUp === 0 && totalDown === 0) {
    drawNoDataMessage(svg, "No audit data available");
    return;
  }

  // Make the chart responsive to the container
  const containerWidth = svg.parentElement.clientWidth || 300;
  const width = containerWidth - 40; // Allow for padding
  const height = 200; // Reduced height to eliminate empty space

  // Update SVG dimensions
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);

  // Increase right margin to accommodate larger numbers
  const margin = { top: 40, right: 100, bottom: 40, left: 70 };

  const maxAudit = Math.max(totalUp, totalDown);
  const barHeight = 40;
  const barSpacing = 60;

  // Calculate appropriate bar width to ensure text fits
  const maxBarWidth = width - margin.left - margin.right;

  // Draw up bar horizontally
  const upWidth = (totalUp / maxAudit) * maxBarWidth;
  const upBar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  upBar.setAttribute("x", margin.left);
  upBar.setAttribute("y", margin.top);
  upBar.setAttribute("width", upWidth);
  upBar.setAttribute("height", barHeight);
  upBar.setAttribute("fill", "#4CAF50"); // Green for up
  svg.appendChild(upBar);

  // Draw down bar horizontally
  const downWidth = (totalDown / maxAudit) * maxBarWidth;
  const downBar = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "rect"
  );
  downBar.setAttribute("x", margin.left);
  downBar.setAttribute("y", margin.top + barSpacing);
  downBar.setAttribute("width", downWidth);
  downBar.setAttribute("height", barHeight);
  downBar.setAttribute("fill", "#F44336"); // Red for down
  svg.appendChild(downBar);

  // Draw up label
  const upLabel = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
  );
  upLabel.setAttribute("x", margin.left - 5);
  upLabel.setAttribute("y", margin.top + barHeight / 2);
  upLabel.setAttribute("text-anchor", "end");
  upLabel.setAttribute("dominant-baseline", "middle");
  upLabel.setAttribute("fill", "white");
  upLabel.textContent = "Up";
  svg.appendChild(upLabel);

  // Draw down label
  const downLabel = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
  );
  downLabel.setAttribute("x", margin.left - 5);
  downLabel.setAttribute("y", margin.top + barSpacing + barHeight / 2);
  downLabel.setAttribute("text-anchor", "end");
  downLabel.setAttribute("dominant-baseline", "middle");
  downLabel.setAttribute("fill", "white");
  downLabel.textContent = "Down";
  svg.appendChild(downLabel);

  // Draw up value - ensure text fits
  const upText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  upText.setAttribute("x", margin.left + upWidth + 5);
  upText.setAttribute("y", margin.top + barHeight / 2);
  upText.setAttribute("dominant-baseline", "middle");
  upText.setAttribute("fill", "white");
  upText.textContent = totalUp.toLocaleString();
  svg.appendChild(upText);

  // Draw down value - ensure text fits
  const downText = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
  );
  downText.setAttribute("x", margin.left + downWidth + 5);
  downText.setAttribute("y", margin.top + barSpacing + barHeight / 2);
  downText.setAttribute("dominant-baseline", "middle");
  downText.setAttribute("fill", "white");
  downText.textContent = totalDown.toLocaleString();
  svg.appendChild(downText);

  // Draw ratio text
  const ratio = totalDown > 0 ? (totalUp / totalDown).toFixed(2) : "N/A";
  const ratioText = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
  );
  ratioText.setAttribute("x", width / 2);
  ratioText.setAttribute("y", height - 10);
  ratioText.setAttribute("text-anchor", "middle");
  ratioText.setAttribute("fill", "#b77ac7");
  ratioText.setAttribute("font-weight", "bold");
  ratioText.textContent = "Audit Ratio: " + ratio;
  svg.appendChild(ratioText);
}

// Draw vertical project timeline - Improved
function drawVerticalProjectsTimeline(completedProjects) {
  const svg = document.getElementById("passFailChart");
  svg.innerHTML = "";

  if (!completedProjects || completedProjects.length === 0) {
    drawNoDataMessage(svg, "No project data available");
    return;
  }

  // Make the chart responsive to the container
  const containerWidth = svg.parentElement.clientWidth || 600;
  const width = containerWidth - 40; // Allow for padding

  // Center line position
  const lineX = width / 2;

  // Increase top margin to add space below title
  // Increase bottom margin to add padding after the last project
  const margin = { top: 50, right: 20, bottom: 30, left: 20 };

  // Sort projects by date
  completedProjects.sort(function (a, b) {
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  // Calculate height based on number of projects
  const projectSpacing = 40; // Spacing between projects

  // Calculate exact height needed - add extra space at bottom with margin.bottom
  const chartHeight = (completedProjects.length - 1) * projectSpacing;
  const height = margin.top + chartHeight + margin.bottom;

  // Set SVG dimensions
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);

  // Draw title
  const title = document.createElementNS("http://www.w3.org/2000/svg", "text");
  title.setAttribute("x", width / 2);
  title.setAttribute("y", 20);
  title.setAttribute("text-anchor", "middle");
  title.setAttribute("fill", "white");
  title.setAttribute("font-weight", "bold");
  title.textContent = "Project Timeline";
  svg.appendChild(title);

  // Draw vertical timeline line - stop exactly at the last project
  const lastProjectY = margin.top + chartHeight;
  const timeline = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "line"
  );
  timeline.setAttribute("x1", lineX);
  timeline.setAttribute("y1", margin.top);
  timeline.setAttribute("x2", lineX);
  timeline.setAttribute("y2", lastProjectY);
  timeline.setAttribute("stroke", "white");
  timeline.setAttribute("stroke-width", 2);
  svg.appendChild(timeline);

  // Add all completed projects
  completedProjects.forEach(function (project, i) {
    const y = margin.top + i * projectSpacing;

    // Draw dot
    const isPassed = project.grade >= 1;
    const dot = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    dot.setAttribute("cx", lineX);
    dot.setAttribute("cy", y);
    dot.setAttribute("r", 6);
    dot.setAttribute("fill", isPassed ? "#4CAF50" : "#F44336");
    svg.appendChild(dot);

    // Get project name
    const projectName = project.path.split("/").pop();

    // Alternate project info left and right
    if (i % 2 === 0) {
      // Project info on right
      const label = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      label.setAttribute("x", lineX + 15);
      label.setAttribute("y", y);
      label.setAttribute("dominant-baseline", "middle");
      label.setAttribute("fill", "white");
      label.textContent =
        projectName + " [" + formatDate(project.createdAt) + "]";
      svg.appendChild(label);
    } else {
      // Project info on left
      const label = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      label.setAttribute("x", lineX - 15);
      label.setAttribute("y", y);
      label.setAttribute("text-anchor", "end");
      label.setAttribute("dominant-baseline", "middle");
      label.setAttribute("fill", "white");
      label.textContent =
        projectName + " [" + formatDate(project.createdAt) + "]";
      svg.appendChild(label);
    }
  });
}

// Draw no data message
function drawNoDataMessage(svg, message) {
  // Get dimensions from the SVG element
  const width = parseInt(svg.getAttribute("width")) || 300;
  const height = parseInt(svg.getAttribute("height")) || 200;

  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("x", width / 2);
  text.setAttribute("y", height / 2);
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("fill", "#888");
  text.textContent = message;
  svg.appendChild(text);
}

// Helper function to add window resize event handling for responsiveness
function setupResponsiveCharts() {
  let resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      // Only redraw if profile is visible
      if (document.getElementById("profile_div").style.display === "block") {
        fetchProfileData();
      }
    }, 250); // Debounce the resize event
  });
}

// Handle login button click
LOGIN_BTN.onclick = function (event) {
  event.preventDefault();

  const userField = document.getElementById("userField").value;
  const password = document.getElementById("password").value;

  if (userField.trim() === "") {
    showMessage("Email/Username is required");
    return;
  }

  if (password.trim() === "") {
    showMessage("Password is required");
    return;
  }

  fetch(LOGIN_PATH, {
    method: "POST",
    headers: {
      Authorization: "Basic " + window.btoa(userField + ":" + password),
    },
  })
    .then(function (response) {
      if (response.ok) {
        console.log("Login successful");
        return response.json();
      } else {
        throw new Error("Login failed");
      }
    })
    .then(function (token) {
      sessionStorage.setItem("jwt", token);
      updateDisplay();
    })
    .catch(function (error) {
      console.error("Login failed:", error);
      showMessage("Invalid username or password");
    });
};

// Handle logout button click
LOGOUT_BTN.onclick = function (event) {
  event.preventDefault();
  sessionStorage.removeItem("jwt");
  showMessage("Logout successful");
  updateDisplay();
};

// Check login status on page load and set up responsive charts
document.addEventListener("DOMContentLoaded", function () {
  updateDisplay();
  setupResponsiveCharts();
});
