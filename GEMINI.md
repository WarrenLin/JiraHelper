## Project Overview

This project is a web-based Jira issue tracker. It provides a user-friendly interface to view and filter Jira issues. The application consists of a Node.js Express backend that serves a static HTML frontend and acts as a proxy to the Jira API.

**Key Technologies:**

*   **Backend:** Node.js, Express.js, Axios
*   **Frontend:** HTML, CSS, JavaScript
*   **Dependencies:** `axios`, `cors`, `dotenv`, `express`, `express-rate-limit`

**Architecture:**

The application follows a simple client-server architecture. The frontend is a single HTML file that makes API calls to the backend. The backend handles the communication with the Jira API, including authentication and data fetching.

## Building and Running

**Prerequisites:**

*   Node.js and npm installed.
*   A `.env` file with the following Jira credentials:
    *   `JIRA_BASE_URL`: The base URL of your Jira instance (e.g., `https://your-domain.atlassian.net`).
    *   `JIRA_EMAIL`: Your Jira account email.
    *   `JIRA_API_TOKEN`: Your Jira API token.

**Installation:**

```bash
npm install
```

**Running the application:**

```bash
npm start
```

The server will start on port 3000 by default. You can access the application at `http://localhost:3000`.

**Development:**

To run the server in development mode with a different port, you can use the `dev` script:

```bash
npm run dev
```

This will start the server on port 3000.

**Testing:**

There are no tests configured for this project.

## Development Conventions

The project uses a standard Node.js project structure. The backend code is in `server.js`, and the frontend is in `index.html`. The code is written in JavaScript (CommonJS). There are no specific coding style guidelines or linting configurations.
