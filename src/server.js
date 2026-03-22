const express = require("express");
const { getSnapshot, getStats } = require("./store");
const { getRecentChecks } = require("./db");
const logger = require("./logger");

// Creates and starts the HTTP API server, returning the listening server instance.
function startServer(port, db) {
  const app = express();
  app.use(express.json());

  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString()
    });
  });

  app.get("/status", (req, res) => {
    logger.debug("status requested", { route: "/status" });
    res.status(200).json(getSnapshot());
  });

  app.get("/status/:id", (req, res) => {
    const id = req.params.id;
    logger.debug("status requested", { route: "/status/:id", id });
    const stats = getStats(id);
    if (stats == null) {
      return res.status(404).json({ error: "API not found", id });
    }
    return res.status(200).json(stats);
  });

  app.get("/history/:id", (req, res) => {
    const rows = getRecentChecks(db, req.params.id);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "no history found", id: req.params.id });
    }
    return res.status(200).json(rows);
  });

  app.use((req, res) => {
    res.status(404).json({ error: "route not found" });
  });

  const server = app.listen(port, () => {
    logger.info("server started", { port });
  });

  return server;
}

module.exports = {
  startServer
};
