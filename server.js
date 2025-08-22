const express = require('express')
const axios = require('axios')
const dotenv = require('dotenv')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const path = require('path')

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())
app.use((req,res,next)=>{res.set('Cache-Control','no-store');next()})

const limiter = rateLimit({ windowMs: 60 * 1000, max: 20 })
app.use('/api/', limiter)

const BASE_URL = process.env.JIRA_BASE_URL || 'https://cmoneyteam.atlassian.net'
const { authHeader } = require('./auth');

app.get('/api/issues', async (req, res) => {
  const jql = req.query.jql || 'component = Android_RD and project = HRTX and sprint = 5649 and type IN (Stage-bug, Bug, Sub-task) and status IN ("To Do", "In Progress", Done, 等候驗收) ORDER BY status DESC, originalEstimate ASC'
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
      originalEstimate: (it.fields?.timetracking?.originalEstimate || null),
      storyPoints: (it.fields?.customfield_10016?.value ?? it.fields?.customfield_10016 ?? it.fields?.customfield_10033?.value ?? it.fields?.customfield_10033 ?? null),
      timeSpent: (it.fields?.timetracking?.timeSpent || it.fields?.timespent || null)
    }))

    res.json({ total: data.total, issues })
  } catch (err) {
    const status = err.response?.status || 500
    res.status(status).json({ error: true, status, message: err.message })
  }
})

app.get('/', (req,res)=>res.sendFile(path.join(__dirname,'index.html')))
app.use(express.static(path.join(__dirname)))

const port = process.env.PORT || 3000
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => console.log(`Server running on http://localhost:${port}`))
}

module.exports = app
