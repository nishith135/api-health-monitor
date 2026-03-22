const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const logger = require("./logger");

// Creates the data directory, opens the SQLite DB, and returns the database instance.
function initDb() {
  const dataDir = path.join(__dirname, "..", "data");
  fs.mkdirSync(dataDir, { recursive: true });

  const dbPath = path.join(dataDir, "monitor.db");
  const db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      apiId TEXT NOT NULL,
      name TEXT NOT NULL,
      status TEXT NOT NULL,
      httpStatus INTEGER,
      latencyMs INTEGER,
      reason TEXT,
      checkedAt TEXT NOT NULL
    )
  `);

  logger.info("database ready", { path: "data/monitor.db" });
  return db;
}

// Inserts one check result row into the database using a prepared statement.
function saveResult(db, result) {
  try {
    const stmt = db.prepare(`
      INSERT INTO checks (apiId, name, status, httpStatus, latencyMs, reason, checkedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      result.id,
      result.name,
      result.status,
      result.httpStatus ?? null,
      result.latencyMs ?? null,
      result.reason ?? null,
      result.checkedAt
    );
  } catch (error) {
    logger.error("database insert failed", {
      message: error.message,
      apiId: result.id
    });
  }
}

// Returns recent check rows for an API, newest first, ordered by checkedAt.
function getRecentChecks(db, apiId, limit) {
  const cap = typeof limit === "number" && limit > 0 ? limit : 20;
  const stmt = db.prepare(`
    SELECT id, apiId, name, status, httpStatus, latencyMs, reason, checkedAt
    FROM checks
    WHERE apiId = ?
    ORDER BY checkedAt DESC
    LIMIT ?
  `);
  return stmt.all(apiId, cap);
}

module.exports = {
  initDb,
  saveResult,
  getRecentChecks
};
