const dotenv = require("dotenv");
dotenv.config();

const { loadApiConfigs } = require("./config");
const logger = require("./logger");
const { initStore, getSnapshot } = require("./store");
const { initDb } = require("./db");
const { initAlerter } = require("./alerter");
const { startServer } = require("./server");
const { startPolling } = require("./poller");

const PORT = process.env.PORT || 3000;

// Boots the API monitor service and starts all polling jobs.
function bootstrap() {
  try {
    const apiConfigs = loadApiConfigs();
    initStore(apiConfigs);
    const db = initDb();
    initAlerter(apiConfigs);
    startServer(PORT, db);
    startPolling(apiConfigs, db);
    logger.info("monitor started", { apiCount: apiConfigs.length });

    setInterval(() => {
      const snapshot = getSnapshot();
      logger.info("monitor snapshot", { apis: snapshot });
    }, 60000);
  } catch (error) {
    logger.error("monitor failed to start", {
      status: "ERROR",
      message: error.message,
      checkedAt: new Date().toISOString()
    });
    process.exit(1);
  }
}

bootstrap();
