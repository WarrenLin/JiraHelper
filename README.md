# Jira Issue Tracker

This is a web-based Jira issue tracker. It provides a user-friendly interface to view and filter Jira issues. The application consists of a Node.js Express backend that serves a static HTML frontend and acts as a proxy to the Jira API.

## Key Technologies

*   **Backend:** Node.js, Express.js, Axios
*   **Frontend:** HTML, CSS, JavaScript

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/WarrenLin/JiraHelper.git
    cd JiraHelper
    ```

2.  **Create a `.env` file** in the root of the project with the following content, replacing the placeholder values with your actual Jira credentials:
    ```
    JIRA_BASE_URL=https://your-domain.atlassian.net
    JIRA_EMAIL=your-email@example.com
    JIRA_API_TOKEN=your-api-token
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    ```

## Running the Application

To start the server, run the following command:

```bash
npm start
```

The application will be available at `http://localhost:3000`.
