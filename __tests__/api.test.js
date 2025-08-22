const request = require('supertest');
const app = require('../server');
const { authHeader } = require('../auth');
const axios = require('axios');

// Mock the auth module
jest.mock('../auth');
// Mock axios
jest.mock('axios');

describe('GET /', () => {
  it('should return the index.html file', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });
});

describe('GET /api/issues', () => {
  // Reset mocks before each test
  beforeEach(() => {
    authHeader.mockReset();
    if (axios.get.mockReset) {
      axios.get.mockReset();
    }
  });

  it('should return a 500 error if authHeader throws an error', async () => {
    // Configure the mock to throw an error
    authHeader.mockImplementation(() => {
      throw new Error('Missing credentials');
    });

    const res = await request(app).get('/api/issues');
    expect(res.statusCode).toEqual(500);
    expect(res.body.message).toBe('Missing credentials');
  });

  it('should return a 200 OK and issue data on success', async () => {
    // Configure mocks for a successful call
    authHeader.mockReturnValue({ Authorization: 'Basic FAKETOKEN' });
    const mockJiraResponse = {
      total: 1,
      issues: [
        {
          id: '123',
          key: 'PROJ-1',
          fields: {
            summary: 'Test issue',
            status: { name: 'To Do' },
            assignee: { displayName: 'Test User', avatarUrls: { '48x48': 'url' } },
            priority: { name: 'High' },
            issuetype: { name: 'Bug' },
            timetracking: { originalEstimate: '1h', timeSpent: '30m' },
            customfield_10016: { value: 8 }
          }
        }
      ]
    };
    axios.get.mockResolvedValue({ data: mockJiraResponse });

    const res = await request(app).get('/api/issues');
    expect(res.statusCode).toEqual(200);
    expect(res.body.total).toBe(1);
    expect(res.body.issues).toHaveLength(1);
    expect(res.body.issues[0].summary).toBe('Test issue');
    expect(res.body.issues[0].storyPoints).toBe(8);
  });

  it('should return the upstream error status if the Jira API call fails', async () => {
    // Configure mocks for a failed Jira API call
    authHeader.mockReturnValue({ Authorization: 'Basic FAKETOKEN' });
    axios.get.mockRejectedValue({
      response: {
        status: 404,
        data: { message: 'Not Found' }
      },
      message: 'Request failed with status code 404'
    });

    const res = await request(app).get('/api/issues');
    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toBe('Request failed with status code 404');
  });
});