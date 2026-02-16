import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 5 },  // Ramp up to 5 users
    { duration: '30s', target: 5 },  // Stay at 5 users
    { duration: '10s', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests below 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% failure
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

export function setup() {
  const payload = JSON.stringify({
    email: 'admin@example.com',
    password: 'password123',
  });
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const loginRes = http.post(`${BASE_URL}/auth/login`, payload, params);

  check(loginRes, {
    'logged in successfully': (r) => r.status === 201 || r.status === 200,
  });

  const authToken = loginRes.json('access_token');
  return { authToken };
}

export default function (data) {
  const params = {
    headers: {
      'Authorization': `Bearer ${data.authToken}`,
      'Content-Type': 'application/json',
    },
  };

  const pages = [1, 2, 3];
  const page = pages[Math.floor(Math.random() * pages.length)];

  // Test paginated endpoints
  const responses = http.batch([
    ['GET', `${BASE_URL}/tasks/my?page=${page}&limit=10`, null, params],
    ['GET', `${BASE_URL}/cmr/reviews?page=${page}&limit=10`, null, params],
    ['GET', `${BASE_URL}/cmr/decisions?page=${page}&limit=10`, null, params],
    ['GET', `${BASE_URL}/field-observation?page=${page}&limit=10`, null, params],
  ]);

  check(responses[0], { 'tasks status 200': (r) => r.status === 200 });
  check(responses[1], { 'reviews status 200': (r) => r.status === 200 });
  check(responses[2], { 'decisions status 200': (r) => r.status === 200 });
  check(responses[3], { 'observations status 200': (r) => r.status === 200 });

  sleep(1);
}
