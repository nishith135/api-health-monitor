const store = {};

// Initializes the in-memory metrics store with one entry per configured API.
function initStore(apiConfigs) {
  for (const key of Object.keys(store)) {
    delete store[key];
  }
  for (const api of apiConfigs) {
    store[api.id] = {
      id: api.id,
      name: api.name,
      url: api.url,
      totalChecks: 0,
      totalUp: 0,
      totalDown: 0,
      consecutiveFailures: 0,
      lastStatus: null,
      lastCheckedAt: null,
      latencyReadings: []
    };
  }
}

// Applies a single poll result to the metrics for that API id.
function recordResult(result) {
  const entry = store[result.id];
  if (!entry) {
    return;
  }

  entry.totalChecks += 1;
  if (result.status === "UP") {
    entry.totalUp += 1;
    entry.consecutiveFailures = 0;
  } else {
    entry.totalDown += 1;
    entry.consecutiveFailures += 1;
  }
  entry.lastStatus = result.status;
  entry.lastCheckedAt = result.checkedAt;

  if (typeof result.latencyMs === "number" && !Number.isNaN(result.latencyMs)) {
    entry.latencyReadings.push(result.latencyMs);
    while (entry.latencyReadings.length > 10) {
      entry.latencyReadings.shift();
    }
  }
}

// Returns a copy of metrics for one API with derived uptime and latency fields.
function getStats(id) {
  const entry = store[id];
  if (!entry) {
    return undefined;
  }

  const uptimePercent =
    entry.totalChecks === 0
      ? null
      : Math.round((entry.totalUp / entry.totalChecks) * 1000) / 10;

  const avgLatencyMs =
    entry.latencyReadings.length === 0
      ? null
      : Math.round(
          entry.latencyReadings.reduce((sum, n) => sum + n, 0) /
            entry.latencyReadings.length
        );

  return {
    ...entry,
    latencyReadings: [...entry.latencyReadings],
    uptimePercent,
    avgLatencyMs
  };
}

// Returns an array of getStats() for every API currently in the store.
function getSnapshot() {
  return Object.keys(store).map((apiId) => getStats(apiId));
}

module.exports = {
  initStore,
  recordResult,
  getStats,
  getSnapshot
};
