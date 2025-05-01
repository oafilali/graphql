// index.js - Main file and initialization

// Import other modules
import { isTokenValid, handleLogin, handleLogout } from "./auth.js"
import { fetchProfileData } from "./data.js"
import { showMessage, updateDisplay } from "./ui.js"

// DOM elements
const LOGIN_DIV = document.getElementById("login_div")
const PROFILE_DIV = document.getElementById("profile_div")
const LOGIN_BTN = document.getElementById("login-btn")
const LOGOUT_BTN = document.getElementById("logout-btn")

// Setup event listeners
function setupEventListeners() {
  LOGIN_BTN.onclick = handleLogin
  LOGOUT_BTN.onclick = handleLogout
}

// Setup responsive charts
function setupResponsiveCharts() {
  let resizeTimer
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(function () {
      // Only redraw if profile is visible
      if (document.getElementById("profile_div").style.display === "block") {
        fetchProfileData()
      }
    }, 250) // Debounce the resize event
  })
}

// Initialize the page on load
document.addEventListener("DOMContentLoaded", function () {
  setupEventListeners()
  updateDisplay()
  setupResponsiveCharts()
})

// Export any functions that might be needed in other files
export { LOGIN_DIV, PROFILE_DIV }
