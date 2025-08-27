// --- MANUAL .env PARSER ---
const fs = require('fs');
const path = require('path');

try {
  const envPath = path.resolve(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envFileContent = fs.readFileSync(envPath, { encoding: 'utf-8' });
    envFileContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        const value = valueParts.join('=').trim();
        if (key) {
          process.env[key.trim()] = value;
        }
      }
    });
    console.log('.env file manually parsed and loaded.');
  } else {
    console.log('.env file not found. Skipping manual parsing.');
  }
} catch (err) {
  console.error('Error manually parsing .env file:', err);
}
// --- END of MANUAL .env PARSER ---


const express = require('express')
const axios = require('axios')
const cors = require('cors')
const rateLimit = require('express-rate-limit')

const app = express()
app.use(cors())
app.use(express.json())
app.use((req,res,next)=>{res.set('Cache-Control','no-store');next()})

const limiter = rateLimit({ windowMs: 60 * 1000, max: 20 })
app.use('/api/', limiter)

const BASE_URL = process.env.JIRA_BASE_URL || 'https://cmoneyteam.atlassian.net'
const { authHeader } = require('./auth');

// --- REFACTORED FUNCTION to get all active sprints for a project ---
async function getActiveSprints(projectKey) {
  try {
    const boardUrl = `${BASE_URL}/rest/agile/1.0/board`;
    const boardRes = await axios.get(boardUrl, {
      params: { projectKeyOrId: projectKey },
      headers: { ...authHeader(), 'Accept': 'application/json' }
    });

    if (!boardRes.data?.values?.length) {
      console.error('No board found for project:', projectKey);
      return [];
    }
    const boardId = boardRes.data.values[0].id;

    const sprintUrl = `${BASE_URL}/rest/agile/1.0/board/${boardId}/sprint`;
    const sprintRes = await axios.get(sprintUrl, {
      params: { state: 'active' },
      headers: { ...authHeader(), 'Accept': 'application/json' }
    });

    if (!sprintRes.data?.values?.length) {
      console.error('No active sprints found for board:', boardId);
      return [];
    }

    // Map to a simpler format and sort by start date, newest first
    return sprintRes.data.values
      .map(sprint => ({
        id: sprint.id,
        name: sprint.name,
        startDate: sprint.startDate,
      }))
      .sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

  } catch (err) {
    console.error(`Error fetching active sprints for project ${projectKey}:`, err.message);
    return [];
  }
}

// --- Wrapper function to maintain old functionality ---
async function getLatestActiveSprint(projectKey = 'HRTX') {
    const sprints = await getActiveSprints(projectKey);
    return sprints.length > 0 ? sprints[0].id : null;
}

// --- NEW ENDPOINT to get active sprints ---
app.get('/api/sprints', async (req, res) => {
  const projectKey = req.query.projectKey;
  if (!projectKey) {
    return res.status(400).json({ error: true, message: 'projectKey query parameter is required.' });
  }
  try {
    const sprints = await getActiveSprints(projectKey);
    res.json(sprints);
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});


app.get('/api/issues', async (req, res) => {
  let jql = req.query.jql;
  let sprintIdUsed = null;

  if (!jql) {
    const latestSprintId = await getLatestActiveSprint('HRTX');
    
    if (!latestSprintId) {
      return res.status(404).json({ error: true, message: `Could not find an active sprint for project HRTX.` });
    }

    sprintIdUsed = latestSprintId;
    console.log(`No JQL provided, using latest active sprint: ${sprintIdUsed}`);
    jql = `component = Android_RD and project = HRTX and sprint = ${sprintIdUsed} and type IN (Stage-bug, Bug, Sub-task) and status IN ("To Do", "In Progress", Done, 等候驗收) ORDER BY status DESC, originalEstimate ASC`;
  } else {
    const match = jql.match(/sprint = (\d+)/);
    if (match) {
      sprintIdUsed = match[1];
    }
  }

  try {
    const url = `${BASE_URL}/rest/api/2/search`
    const fields = ['summary','status','assignee','priority','issuetype','timeoriginalestimate','timespent','timetracking','customfield_10016','customfield_10033']
    const { data } = await axios.get(url, {
      params: { jql, maxResults: 100, fields: fields.join(',') },
      headers: { ...authHeader(), 'Accept': 'application/json' }
    })

    const issues = (data.issues || []).map(it => ({
      id: it.id,
      key: it.key,
      summary: it.fields?.summary,
      status: it.fields?.status ? { name: it.fields.status.name } : null,
      assignee: it.fields?.assignee ? { display_name: it.fields.assignee.displayName, avatar_url: it.fields.assignee.avatarUrls?.['48x48'] } : null,
      priority: it.fields?.priority ? { name: it.fields.priority.name } : null,
      issue_type: it.fields?.issuetype ? { name: it.fields.issuetype.name } : null,
      originalEstimate: (it.fields?.timetracking?.originalEstimateSeconds || null),
      storyPoints: (it.fields?.customfield_10016?.value ?? it.fields?.customfield_10016 ?? it.fields?.customfield_10033?.value ?? it.fields?.customfield_10033 ?? null),
      timeSpent: (it.fields?.timetracking?.timeSpentSeconds || null)
    }))

    res.json({ total: data.total, issues, sprintIdUsed })
  } catch (err) {
    const status = err.response?.status || 500
    const errorMessage = err.response?.data?.errorMessages?.[0] || err.message;
    console.error('Error searching issues:', errorMessage);
    res.status(status).json({ error: true, status, message: errorMessage })
  }
})

app.get('/', (req,res)=>res.sendFile(path.join(__dirname,'index.html')))
app.use(express.static(path.join(__dirname)))

const port = process.env.PORT || 3000
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => console.log(`Server running on http://localhost:${port}`))
}

module.exports = app
