import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:4000";
const TOKEN = __ENV.AUTH_TOKEN || "";

export const options = {
  scenarios: {
    advisory_read_path: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 10 },
        { duration: "60s", target: 25 },
        { duration: "60s", target: 50 },
        { duration: "30s", target: 0 },
      ],
      gracefulRampDown: "10s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.03"],
    http_req_duration: ["p(95)<2500", "p(99)<4000"],
  },
};

function authHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (TOKEN) {
    headers.Authorization = `Bearer ${TOKEN}`;
  }
  return headers;
}

export default function () {
  const recs = http.get(`${BASE_URL}/api/advisory/recommendations/my?limit=10`, {
    headers: authHeaders(),
  });
  check(recs, {
    "recommendations status is 200": (r) => r.status === 200,
  });

  const ops = http.get(`${BASE_URL}/api/advisory/ops/metrics?windowHours=24`, {
    headers: authHeaders(),
  });
  check(ops, {
    "ops metrics status is 200": (r) => r.status === 200,
  });

  const rollout = http.get(`${BASE_URL}/api/advisory/rollout/status`, {
    headers: authHeaders(),
  });
  check(rollout, {
    "rollout status is 200": (r) => r.status === 200,
  });

  sleep(1);
}
