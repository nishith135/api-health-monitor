// Writes one JSON log line per call with level, message, optional data, and timestamp.
function log(level, message, data) {
  const payload = data && typeof data === "object" ? data : {};
  if (level === "debug" && process.env.POLL_LOG === "false") {
    return;
  }
  console.log(
    JSON.stringify({
      level,
      message,
      ...payload,
      timestamp: new Date().toISOString()
    })
  );
}

// Logs an informational message with optional structured data.
function info(message, data) {
  log("info", message, data);
}

// Logs a warning message with optional structured data.
function warn(message, data) {
  log("warn", message, data);
}

// Logs an error message with optional structured data.
function error(message, data) {
  log("error", message, data);
}

// Logs a debug message with optional structured data (suppressed when POLL_LOG is false).
function debug(message, data) {
  log("debug", message, data);
}

module.exports = {
  log,
  info,
  warn,
  error,
  debug
};
