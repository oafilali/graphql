# GraphQL Profile

A responsive web application that displays user profile information and statistics from GritLab's GraphQL API.

## Live Demo

**[View Live Demo](https://oafilali.github.io/graphql/)**

## Features

- **Secure Authentication**: Login with username/email and password
- **User Profile Information**: Display basic user data (ID, login, name, email, etc.)
- **Interactive Data Visualizations**:
  - XP Growth Chart: Track your progress over time
  - Audit Ratio Chart: View your up/down audit statistics
  - Project Timeline: Visualize your completed projects with pass/fail status

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Data Visualization**: SVG-based custom charts
- **Authentication**: JWT (JSON Web Tokens)
- **API**: GraphQL for data fetching

## Implementation Details

The application uses pure JavaScript without any external libraries or frameworks. All data visualizations are created using SVG, with responsive design principles to ensure proper display on various screen sizes.

### Key Components

1. **Authentication System**: Handles login/logout and JWT token management
2. **GraphQL Integration**: Fetches user data through structured GraphQL queries
3. **Data Visualization**: Custom SVG charts for XP growth, audit statistics, and project timeline
4. **Responsive Design**: Adapts to different screen sizes with an elegant dark-themed UI

## Setup and Usage

1. Clone the repository
2. Open `index.html` in your browser
3. Log in with your GritLab credentials

## Future Improvements

- Additional chart types and statistics
- Filtering options for projects and XP data
- Theme customization options
- Export functionality for charts and data
