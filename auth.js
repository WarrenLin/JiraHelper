function authHeader() {
  const EMAIL = process.env.JIRA_EMAIL;
  const API_TOKEN = process.env.JIRA_API_TOKEN;

  if (!EMAIL || !API_TOKEN) {
    throw new Error('JIRA_EMAIL or JIRA_API_TOKEN not found in environment variables. Please check your .env file.');
  }
  const token = Buffer.from(`${EMAIL}:${API_TOKEN}`).toString('base64');
  return { Authorization: `Basic ${token}` };
}

module.exports = { authHeader };
