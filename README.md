# API Health Monitor

A lightweight backend service that monitors the health of external APIs, tracks uptime metrics, persists check history, and fires webhook alerts when something goes down.

Built from scratch to learn core backend engineering concepts — uptime monitoring, structured logging, observability, and production-aware system design.

---

## What it does

- Polls a configurable list of APIs on set intervals
- Detects failures — timeouts, network errors, unexpected status codes
- Tracks uptime percentage, average latency, and consecutive failures per API
- Persists every check result to a SQLite database
- Exposes live stats and history via a REST API
- Sends Discord/Slack webhook alerts when an API goes down and when it recovers

---

## Tech stack

- **Runtime** — Node.js
- **HTTP client** — Axios
- **Scheduler** — node-cron
- **Database** — SQLite via better-sqlite3
- **Server** — Express

---

## Project structure
```
api-monitor/
├── src/
│   ├── index.js        # Entry point — boots the service
│   ├── config.js       # Loads and validates apis.json
│   ├── poller.js       # Core polling loop
│   ├── store.js        # In-memory metrics store
│   ├── db.js           # SQLite persistence
│   ├── server.js       # Express REST API
│   ├── alerter.js      # Webhook alert logic
│   ├── logger.js       # Structured JSON logger
│   └── requestId.js    # Check ID generator
├── config/
│   └── apis.json       # List of APIs to monitor
├── .env.example
└── package.json
```

---

## Getting started

### 1. Clone and install
```bash
git clone https://github.com/YOURUSERNAME/api-health-monitor.git
cd api-health-monitor
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
```

Open `.env` and fill in:
```
PORT=3000
POLL_LOG=true
WEBHOOK_URL=        # optional — paste your Discord or Slack webhook URL here
```

### 3. Configure APIs to monitor

Edit `config/apis.json` — each entry looks like this:
```json
[
  {
    "id": "jsonplaceholder",
    "name": "JSONPlaceholder",
    "url": "https://jsonplaceholder.typicode.com/posts/1",
    "interval": 30,
    "expectedStatus": 200,
    "timeout": 5000
  }
]
```

| Field | Description |
|---|---|
| `id` | Unique identifier for this API |
| `name` | Human-readable name |
| `url` | Endpoint to check |
| `interval` | How often to poll in seconds (1–60) |
| `expectedStatus` | HTTP status code considered healthy |
| `timeout` | Max milliseconds to wait before marking as timed out |

### 4. Run it
```bash
node src/index.js
```

---

## REST API

### `GET /health`
Liveness check — confirms the service is running.
```json
{ "status": "ok", "uptime": 142, "timestamp": "2024-01-15T10:23:01.000Z" }
```

### `GET /status`
Returns current stats for all monitored APIs including uptime percentage and average latency.

### `GET /status/:id`
Returns stats for a single API by its ID. Returns 404 if not found.

### `GET /history/:id`
Returns the last 20 check results from the database for a given API.

---

## Structured logging

Every log line is a JSON object with a level, message, timestamp, and context:
```json
{ "level": "info", "message": "check complete", "checkId": "chk_a3f9x2", "status": "UP", "latencyMs": 143 }
{ "level": "error", "message": "api unreachable", "checkId": "chk_b7k2m1", "reason": "timeout" }
```

| Level | When |
|---|---|
| `debug` | Check started, stats updated |
| `info` | Check complete, service started |
| `warn` | API returned unexpected status code |
| `error` | API timed out or unreachable |

---

## Webhook alerts

Set `WEBHOOK_URL` in `.env` to a Discord or Slack incoming webhook URL. You'll get a message when an API goes down and another when it recovers. Alert deduplication is built in — one alert per incident, not one every 30 seconds.

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port the HTTP server listens on |
| `POLL_LOG` | `true` | Set to `false` to suppress debug logs |
| `WEBHOOK_URL` | — | Discord or Slack webhook URL for alerts |

---

## What I learned building this

- **Uptime monitoring** — scheduling HTTP checks, measuring latency, detecting failure modes
- **Structured logging** — JSON logs with levels and request IDs so logs are machine-readable and traceable
- **Observability basics** — the difference between logging (what happened) and metrics (how is the system trending)
- **REST API design** — separating concerns across poller, store, and server layers
- **Persistence** — writing check history to SQLite so data survives restarts
- **Production awareness** — alert deduplication, silent failure handling, timeout management

---

## License

MIT
