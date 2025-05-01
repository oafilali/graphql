// data.js - Data fetching and processing

import {
  showMessage,
  insertData,
  updateSkillsTable,
  drawXPGrowthChart,
  drawAuditHorizontalChart,
  drawVerticalProjectsTimeline,
} from "./ui.js"

// API endpoints
const GRAPHQL_PATH = "https://01.gritlab.ax/api/graphql-engine/v1/graphql"

// GraphQL query for user profile data
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
     { path: { _nilike: "/gritlab/school-curriculum/piscine-js/%" } },
     { path: { _nilike: "/gritlab/piscine-go/%" } }
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
}`

// Execute GraphQL query
async function executeGraphql(query) {
  const jwtToken = sessionStorage.getItem("jwt")

  try {
    const response = await fetch(GRAPHQL_PATH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + jwtToken,
      },
      body: JSON.stringify({ query: query }),
    })

    if (!response.ok) {
      throw new Error("GraphQL query failed")
    }

    return await response.json()
  } catch (error) {
    console.error("Error:", error)
    showMessage("An error occurred fetching your data")
  }
}

// Fetch and display profile data
async function fetchProfileData() {
  const data = await executeGraphql(PROFILE_QUERY)
  if (data && data.data) {
    // User info
    const user = data.data.user[0]
    insertData("id", user.id)
    insertData("login", user.login)
    insertData("campus", user.campus)

    // Display more user info if available
    if (user.attrs) {
      if (user.attrs.firstName && user.attrs.lastName) {
        insertData("name", user.attrs.firstName + " " + user.attrs.lastName)
      }
      if (user.attrs.email) {
        insertData("email", user.attrs.email)
      }
      if (user.attrs.gender) {
        insertData("gender", user.attrs.gender)
      }
      if (user.attrs.nationality) {
        insertData("nationality", user.attrs.nationality)
      }
    }

    // Process and update project statistics
    updateProjectStatistics(data.data.completed)

    // Draw charts
    drawXPGrowthChart(data.data.xp_view)
    drawAuditHorizontalChart(user)
    drawVerticalProjectsTimeline(data.data.completed)

    // Update skills table
    updateSkillsTable(data.data.skills)
  }
}

// Update project statistics
function updateProjectStatistics(completedProjects) {
  const completedCount = document.getElementById("completedCount")
  const successRate = document.getElementById("successRate")

  if (!completedProjects || completedProjects.length === 0) {
    completedCount.textContent = "0"
    successRate.textContent = "0%"
    return
  }

  const total = completedProjects.length
  const passed = completedProjects.filter(function (project) {
    return project.grade >= 1
  }).length
  const rate = Math.round((passed / total) * 100)

  completedCount.textContent = total
  successRate.textContent = rate + "%"

  // Add color based on success rate
  if (rate >= 80) {
    successRate.style.color = "#4CAF50" // Green for high success
  } else if (rate >= 60) {
    successRate.style.color = "#FFC107" // Yellow for medium success
  } else {
    successRate.style.color = "#F44336" // Red for low success
  }
}

// Export functions
export { fetchProfileData, updateProjectStatistics }
