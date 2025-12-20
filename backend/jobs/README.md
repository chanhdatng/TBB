# Product Analytics Engine

Automated batch processing system for computing product performance metrics.

## Overview

Runs daily at **00:00 Vietnam time** to compute:

- Product sales metrics (lifetime, 30d, 7d)
- Trend analysis
- Rankings (top sellers, revenue, slow movers)
- Time-series data

## Files

| File                            | Description            |
| ------------------------------- | ---------------------- |
| `analytics-engine.js`           | Main orchestrator      |
| `scheduler.js`                  | Cron job (00:00 daily) |
| `calculators/aggregator.js`     | Order aggregation      |
| `calculators/trend-analyzer.js` | Trend calculation      |
| `calculators/ranking-engine.js` | Rankings generation    |
| `calculators/timeseries.js`     | Daily data writer      |
| `utils/logger.js`               | Logging utility        |
| `utils/date-helpers.js`         | Date utilities         |

## Usage

### Manual Execution

```bash
cd backend
node jobs/analytics-engine.js
```

### API Endpoints

| Endpoint                 | Method | Description      |
| ------------------------ | ------ | ---------------- |
| `/api/analytics/status`  | GET    | Scheduler status |
| `/api/analytics/trigger` | POST   | Manual trigger   |
| `/api/analytics/health`  | GET    | Health check     |

## Firebase Collections

| Collection               | Description         |
| ------------------------ | ------------------- |
| `productAnalytics`       | Per-product metrics |
| `globalRankings/current` | Leaderboards        |
| `productTimeSeries`      | Daily sales data    |

## Performance

- **Target**: < 30 seconds
- **Actual**: ~1.6 seconds
- **Orders**: 4,000+
- **Products**: 26

## Environment

Requires `backend/.env`:

```
FIREBASE_DATABASE_URL=https://your-project.firebasedatabase.app
```

And `backend/serviceAccountKey.json` for Firebase Admin SDK.
