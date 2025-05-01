// ui.js - UI rendering and DOM manipulation

import { isTokenValid } from "./auth.js"
import { fetchProfileData } from "./data.js"
import { LOGIN_DIV, PROFILE_DIV } from "./index.js"

// Toast message element
const TOAST_MESSAGE = document.getElementById("toast-message")

// Show toast message
function showMessage(message) {
  if (message === "") {
    return
  }

  TOAST_MESSAGE.textContent = message
  TOAST_MESSAGE.style.display = "block"

  setTimeout(function () {
    TOAST_MESSAGE.style.display = "none"
  }, 3000)
}

// Update page display based on login status
function updateDisplay() {
  const token = sessionStorage.getItem("jwt")

  if (isTokenValid(token)) {
    LOGIN_DIV.style.display = "none"
    PROFILE_DIV.style.display = "block"
    fetchProfileData()
  } else {
    LOGIN_DIV.style.display = "block"
    PROFILE_DIV.style.display = "none"
  }
}

// Format date
function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString()
}

// Update DOM with user info
function insertData(elementId, data) {
  const element = document.getElementById(elementId)
  if (element) {
    element.textContent = data
  }
}

// SVG Helper Functions - only including what we actually use
function addCircle(cx, cy, r, fill, parent) {
  const circle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  )
  circle.setAttribute("cx", cx)
  circle.setAttribute("cy", cy)
  circle.setAttribute("r", r)
  circle.setAttribute("fill", fill)
  parent.appendChild(circle)
  return circle
}

function addText(x, y, fill, text, parent) {
  const textElem = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
  )
  textElem.setAttribute("x", x)
  textElem.setAttribute("y", y)
  textElem.setAttribute("fill", fill)
  textElem.textContent = text
  parent.appendChild(textElem)
  return textElem
}

function addLine(x1, y1, x2, y2, stroke, strokeWidth, parent) {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line")
  line.setAttribute("x1", x1)
  line.setAttribute("y1", y1)
  line.setAttribute("x2", x2)
  line.setAttribute("y2", y2)
  line.setAttribute("stroke", stroke)
  line.setAttribute("stroke-width", strokeWidth)
  parent.appendChild(line)
  return line
}

function addPath(d, stroke, parent) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
  path.setAttribute("d", d)
  path.setAttribute("fill", "none")
  path.setAttribute("stroke", stroke)
  path.setAttribute("stroke-width", "3")
  parent.appendChild(path)
  return path
}

function addRect(x, y, width, height, fill, parent) {
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect")
  rect.setAttribute("x", x)
  rect.setAttribute("y", y)
  rect.setAttribute("width", width)
  rect.setAttribute("height", height)
  rect.setAttribute("fill", fill)
  parent.appendChild(rect)
  return rect
}

// Update skills table
function updateSkillsTable(skillsData) {
  const skillsTableDiv = document.getElementById("skills-table")

  if (!skillsData || skillsData.length === 0) {
    skillsTableDiv.innerHTML = '<p class="no-data">No skills data available</p>'
    return
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
    `

  // Format skill names for better display
  skillsData.forEach(function (skill) {
    // Extract skill name from type (remove "skill_" prefix)
    let skillName = skill.type.replace("skill_", "")

    // Replace underscores with spaces and capitalize each word
    skillName = skillName
      .split("_")
      .map(function (word) {
        return word.charAt(0).toUpperCase() + word.slice(1)
      })
      .join(" ")

    tableHTML += `
            <tr>
                <td>${skillName}</td>
                <td>${skill.amount.toLocaleString()}</td>
            </tr>
        `
  })

  tableHTML += `
            </tbody>
        </table>
    `

  skillsTableDiv.innerHTML = tableHTML
}

// Draw XP growth over time chart - Improved with helper functions
function drawXPGrowthChart(xpData) {
  const svg = document.getElementById("xpChart")
  svg.innerHTML = ""

  if (!xpData || xpData.length === 0) {
    drawNoDataMessage(svg, "No XP data available")
    return
  }

  // Chart dimensions
  const width = svg.clientWidth || 600
  const height = svg.clientHeight || 300
  const margin = { top: 40, right: 40, bottom: 40, left: 70 }
  const chartWidth = width - margin.left - margin.right
  const chartHeight = height - margin.top - margin.bottom

  // Sort by date
  xpData.forEach((item) => {
    item.createdAt = new Date(item.createdAt)
  })
  xpData.sort(function (a, b) {
    return a.createdAt - b.createdAt
  })

  // Calculate cumulative XP
  let cumulativeXP = 0
  const dataPoints = xpData.map(function (item) {
    cumulativeXP += item.amount
    return {
      date: item.createdAt,
      amount: item.amount,
      cumulative: cumulativeXP,
      path: item.path,
    }
  })

  // Find min and max dates and total XP
  const minDate = dataPoints[0].date.getTime()
  const maxDate = dataPoints[dataPoints.length - 1].date.getTime()
  const dateRange = maxDate - minDate
  const totalXP = dataPoints[dataPoints.length - 1].cumulative
  const maxXP = Math.ceil(totalXP / 1000) * 1000

  // Draw axes
  addLine(
    margin.left,
    height - margin.bottom,
    width - margin.right,
    height - margin.bottom,
    "white",
    2,
    svg
  )
  addLine(
    margin.left,
    margin.top,
    margin.left,
    height - margin.bottom,
    "white",
    2,
    svg
  )

  // Draw grid and labels
  const numGridLines = 5
  for (let i = 0; i <= numGridLines; i++) {
    const y = margin.top + (chartHeight / numGridLines) * i
    const yValue = maxXP - (maxXP / numGridLines) * i

    // Add grid line
    if (i < numGridLines) {
      const gridLine = addLine(
        margin.left,
        y,
        width - margin.right,
        y,
        "#555",
        1,
        svg
      )
      gridLine.setAttribute("stroke-dasharray", "5,5")
    }

    // Add Y-axis label
    const label = addText(
      margin.left - 10,
      y,
      "white",
      Math.round(yValue).toLocaleString() + " XP",
      svg
    )
    label.setAttribute("text-anchor", "end")
  }

  // Draw date labels
  addText(
    margin.left,
    height - 10,
    "white",
    formatDate(dataPoints[0].date),
    svg
  )
  const endLabel = addText(
    width - margin.right,
    height - 10,
    "white",
    formatDate(dataPoints[dataPoints.length - 1].date),
    svg
  )
  endLabel.setAttribute("text-anchor", "end")

  // Draw XP growth line
  let pathData = ""
  const points = []

  dataPoints.forEach(function (point, index) {
    // Convert date and XP to coordinates
    const x =
      margin.left + ((point.date.getTime() - minDate) / dateRange) * chartWidth
    const y = height - margin.bottom - (point.cumulative / maxXP) * chartHeight

    points.push({ x, y, data: point })

    if (index === 0) {
      pathData = "M " + x + " " + y
    } else {
      pathData += " L " + x + " " + y
    }
  })

  // Draw the line
  addPath(pathData, "#b77ac7", svg)

  // Draw dots at XP gain points
  points.forEach(function (point) {
    addCircle(point.x, point.y, 5, "#b77ac7", svg)
  })

  // Draw title with total XP
  const title = addText(
    width / 2,
    20,
    "white",
    "XP Growth Over Time: " + totalXP.toLocaleString() + " XP",
    svg
  )
  title.setAttribute("text-anchor", "middle")
}

// Draw horizontal audit bars chart - Improved
function drawAuditHorizontalChart(userData) {
  const svg = document.getElementById("auditChart")
  svg.innerHTML = ""

  const totalUp = userData.totalUp || 0
  const totalDown = userData.totalDown || 0

  if (totalUp === 0 && totalDown === 0) {
    drawNoDataMessage(svg, "No audit data available")
    return
  }

  // Chart dimensions
  const width = svg.clientWidth || 300
  const height = svg.clientHeight || 200
  const margin = { top: 40, right: 100, bottom: 40, left: 70 }
  const maxBarWidth = width - margin.left - margin.right

  // Calculate sizes
  const maxAudit = Math.max(totalUp, totalDown)
  const barHeight = 40
  const barSpacing = 60

  // Draw up bar
  const upWidth = (totalUp / maxAudit) * maxBarWidth
  addRect(margin.left, margin.top, upWidth, barHeight, "#4CAF50", svg)

  // Draw down bar
  const downWidth = (totalDown / maxAudit) * maxBarWidth
  addRect(
    margin.left,
    margin.top + barSpacing,
    downWidth,
    barHeight,
    "#F44336",
    svg
  )

  // Add labels
  const upLabel = addText(
    margin.left - 5,
    margin.top + barHeight / 2,
    "white",
    "Up",
    svg
  )
  upLabel.setAttribute("text-anchor", "end")

  const downLabel = addText(
    margin.left - 5,
    margin.top + barSpacing + barHeight / 2,
    "white",
    "Down",
    svg
  )
  downLabel.setAttribute("text-anchor", "end")

  // Add values
  addText(
    margin.left + upWidth + 5,
    margin.top + barHeight / 2,
    "white",
    totalUp.toLocaleString(),
    svg
  )
  addText(
    margin.left + downWidth + 5,
    margin.top + barSpacing + barHeight / 2,
    "white",
    totalDown.toLocaleString(),
    svg
  )

  // Add ratio
  let ratio
  if (totalDown > 0) {
    ratio = (totalUp / totalDown).toFixed(2)
  } else {
    ratio = "N/A"
  }

  const ratioText = addText(
    width / 2,
    height - 10,
    "#b77ac7",
    "Audit Ratio: " + ratio,
    svg
  )
  ratioText.setAttribute("text-anchor", "middle")
}

// Draw vertical project timeline - Improved
function drawVerticalProjectsTimeline(completedProjects) {
  const svg = document.getElementById("passFailChart")
  svg.innerHTML = ""

  if (!completedProjects || completedProjects.length === 0) {
    drawNoDataMessage(svg, "No project data available")
    return
  }

  // Chart dimensions
  const width = svg.clientWidth || 600
  const lineX = width / 2
  const margin = { top: 50, right: 20, bottom: 30, left: 20 }

  // Sort projects by date
  completedProjects.forEach((project) => {
    project.createdAt = new Date(project.createdAt)
  })
  completedProjects.sort(function (a, b) {
    return a.createdAt - b.createdAt
  })

  // Calculate height
  const projectSpacing = 40
  const chartHeight = (completedProjects.length - 1) * projectSpacing
  const height = margin.top + chartHeight + margin.bottom
  svg.setAttribute("height", height)

  // Draw title
  const title = addText(width / 2, 20, "white", "Project Timeline", svg)
  title.setAttribute("text-anchor", "middle")

  // Draw timeline
  const lastProjectY = margin.top + chartHeight
  addLine(lineX, margin.top, lineX, lastProjectY, "white", 2, svg)

  // Add projects
  completedProjects.forEach(function (project, i) {
    const y = margin.top + i * projectSpacing
    const isPassed = project.grade >= 1

    // Create dot
    addCircle(lineX, y, 6, isPassed ? "#4CAF50" : "#F44336", svg)

    // Get project name
    const projectName = project.path.split("/").pop()

    // Alternate project info left and right
    if (i % 2 === 0) {
      // Project info on right
      addText(
        lineX + 15,
        y,
        "white",
        projectName + " [" + formatDate(project.createdAt) + "]",
        svg
      )
    } else {
      // Project info on left
      const text = addText(
        lineX - 15,
        y,
        "white",
        projectName + " [" + formatDate(project.createdAt) + "]",
        svg
      )
      text.setAttribute("text-anchor", "end")
    }
  })
}

// Draw no data message
function drawNoDataMessage(svg, message) {
  // Get dimensions from the SVG element
  const width = svg.clientWidth || 300
  const height = svg.clientHeight || 200

  const text = addText(width / 2, height / 2, "#888", message, svg)
  text.setAttribute("text-anchor", "middle")
}

// Export functions
export {
  showMessage,
  updateDisplay,
  insertData,
  formatDate,
  updateSkillsTable,
  drawXPGrowthChart,
  drawAuditHorizontalChart,
  drawVerticalProjectsTimeline,
}
