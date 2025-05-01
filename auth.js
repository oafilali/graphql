// auth.js - Authentication

import { showMessage, updateDisplay } from "./ui.js"

// API endpoints
const LOGIN_PATH = "https://01.gritlab.ax/api/auth/signin"

// Check if token is valid
function isTokenValid(token) {
  if (!token) {
    return false
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    const expirationTime = payload.exp * 1000
    const currentTime = Date.now()

    if (currentTime < expirationTime) {
      return true
    } else {
      return false
    }
  } catch (error) {
    console.error("Invalid token:", error)
    return false
  }
}

// Handle login button click
async function handleLogin(event) {
  event.preventDefault()

  const userField = document.getElementById("userField").value
  const password = document.getElementById("password").value

  // Validate inputs
  if (userField.trim() === "") {
    showMessage("Email/Username is required")
    return
  }

  if (password.trim() === "") {
    showMessage("Password is required")
    return
  }

  // Attempt login with async/await
  try {
    const response = await fetch(LOGIN_PATH, {
      method: "POST",
      headers: {
        Authorization: "Basic " + window.btoa(userField + ":" + password),
      },
    })

    // Check if response was successful
    if (!response.ok) {
      throw new Error("Login failed")
    }

    console.log("Login successful")
    const token = await response.json()
    sessionStorage.setItem("jwt", token)
    updateDisplay()
  } catch (error) {
    console.error("Login failed:", error)
    showMessage("Invalid username or password")
  }
}

// Handle logout button click
function handleLogout(event) {
  event.preventDefault()
  sessionStorage.removeItem("jwt")
  showMessage("Logout successful")
  updateDisplay()
}

// Export functions
export { isTokenValid, handleLogin, handleLogout }
