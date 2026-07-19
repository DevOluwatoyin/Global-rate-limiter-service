import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 20, // 20 virtual users
  duration: "15s", // run for 15 seconds
};

export default function () {
  const payload = JSON.stringify({
    clientId: `load-client-${__VU}`, // each virtual user acts as a different client
    limit: 100,
    windowSeconds: 60,
  });

  const params = {
    headers: { "Content-Type": "application/json" },
  };

  const res = http.post(
    "http://host.docker.internal:3000/check",
    payload,
    params,
  );

  check(res, {
    "status is 200": (r) => r.status === 200,
    "response time < 50ms": (r) => r.timings.duration < 50,
  });

  sleep(0.1);
}
