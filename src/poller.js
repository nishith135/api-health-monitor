const axios = require("axios");
const cron = require("node-cron");
const logger = require("./logger");
const { generateCheckId } = require("./requestId");
const { recordResult, getStats } = require("./store");
const { saveResult } = require("./db");
const { checkAndAlert } = require("./alerter");

// Builds a cron expression from an interval in seconds.
function buildCronExpression(intervalSeconds) {
  if (intervalSeconds < 60) {
    return `*/${intervalSeconds} * * * * *`;
  }
  if (intervalSeconds === 60) {
    return "0 * * * * *";
  }
  throw new Error(
    `Unsupported interval "${intervalSeconds}" seconds; use 1-60 seconds for this scheduler.`
  );
}

// Executes one health check, saves the result to DB, and fires alerts if needed.
async function runHealthCheck(apiConfig, checkId, db) {
  const startedAt = Date.now();
  const result = {
    id: apiConfig.id,
    name: apiConfig.name,
    url: apiConfig.url,
    status: "DOWN",
    httpStatus: null,
    latencyMs: null,
    reason: null,
    checkedAt: new Date().toISOString()
  };

  try {
    const response = await axios.get(apiConfig.url, {
      timeout: apiConfig.timeout,
      validateStatus: () => true
    });

    result.httpStatus = response.status;
    result.latencyMs = Date.now() - startedAt;

    if (response.status === apiConfig.expectedStatus) {
      result.status = "UP";
      result.reason = null;
    } else {
      result.status = "DOWN";
      result.reason = "unexpected_status";
    }
  } catch (error) {
    result.latencyMs = Date.now() - startedAt;
    if (error.code === "ECONNABORTED") {
      result.reason = "timeout";
    } else if (error.response) {
      result.httpStatus = error.response.status || null;
      result.reason = "unexpected_status";
    } else {
      result.reason = "network_error";
    }
  }

  // Save to memory store
  recordResult(result);

  // Save to database
  saveResult(db, result);

  // Fire alert if needed
  await checkAndAlert(result);

  // Log updated stats
  const statsAfterCheck = getStats(result.id);
  if (statsAfterCheck) {
    logger.debug("stats updated", {
      checkId,
      id: result.id,
      uptimePercent: statsAfterCheck.uptimePercent,
      avgLatencyMs: statsAfterCheck.avgLatencyMs,
      consecutiveFailures: statsAfterCheck.consecutiveFailures
    });
  }

  // Log result at appropriate level
  if (result.status === "DOWN" && result.reason === "unexpected_status") {
    logger.warn("api degraded", {
      checkId,
      id: result.id,
      name: result.name,
      reason: result.reason,
      httpStatus: result.httpStatus
    });
  } else if (
    result.status === "DOWN" &&
    (result.reason === "timeout" || result.reason === "network_error")
  ) {
    logger.error("api unreachable", {
      checkId,
      id: result.id,
      name: result.name,
      reason: result.reason
    });
  }

  logger.info("check complete", {
    checkId,
    id: result.id,
    name: result.name,
    url: result.url,
    status: result.status,
    httpStatus: result.httpStatus,
    latencyMs: result.latencyMs,
    reason: result.reason,
    checkedAt: result.checkedAt
  });
}

// Starts cron-based polling jobs for all configured APIs.
function startPolling(apiConfigs, db) {
  for (const apiConfig of apiConfigs) {
    const cronExpression = buildCronExpression(apiConfig.interval);

    cron.schedule(cronExpression, async () => {
      const checkId = generateCheckId();

      logger.debug("check started", {
        checkId,
        id: apiConfig.id,
        name: apiConfig.name,
        url: apiConfig.url
      });

      try {
        await runHealthCheck(apiConfig, checkId, db);
      } catch (error) {
        logger.error("unexpected poller error", {
          checkId,
          id: apiConfig.id,
          name: apiConfig.name,
          message: error.message
        });
      }
    });
  }
}

module.exports = { startPolling };
