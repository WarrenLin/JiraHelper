const dotenv = require('dotenv');

dotenv.config();

const EMAIL = process.env.JIRA_EMAIL;
const API_TOKEN = process.env.JIRA_API_TOKEN;

function authHeader() {
  if (!EMAIL || !API_TOKEN) {
    throw new Error('Missing JIRA_EMAIL or JIRA_API_TOKEN in env');
  }
  const token = Buffer.from(`${EMAIL}:${API_TOKEN}`).toString('base64');
  return { Authorization: `Basic ${token}` };
}

module.exports = { authHeader };
