const axios = require("axios");
const logger = require("./logger");

const alertState = {};

// Initializes per-API alert state for webhook notifications.
function initAlerter(apiConfigs) {
  for (const api of apiConfigs) {
    alertState[api.id] = {
      alertSent: false,
      alertedAt: null
    };
  }
}

// Sends DOWN/RECOVERY webhook alerts based on check result and prior alert state.
async function checkAndAlert(result) {
  const url = process.env.WEBHOOK_URL;
  if (!url || String(url).trim() === "") {
    return;
  }

  const id = result.id;
  const state = alertState[id];
  if (!state) {
    return;
  }

  try {
    if (result.status === "DOWN" && state.alertSent === false) {
      await axios.post(
        url,
        {
          content: `🔴 API DOWN: ${result.name} — reason: ${result.reason} — at ${result.checkedAt}`
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 10000,
          validateStatus: () => true
        }
      );
      state.alertSent = true;
      state.alertedAt = result.checkedAt;
      logger.warn("alert sent", {
        id,
        name: result.name,
        reason: result.reason
      });
    } else if (result.status === "UP" && state.alertSent === true) {
      await axios.post(
        url,
        {
          content: `🟢 API RECOVERED: ${result.name} — at ${result.checkedAt}`
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 10000,
          validateStatus: () => true
        }
      );
      state.alertSent = false;
      state.alertedAt = null;
      logger.info("recovery alert sent", { id, name: result.name });
    }
  } catch (error) {
    logger.error("webhook alert failed", {
      id,
      message: error.message
    });
  }
}

module.exports = {
  initAlerter,
  checkAndAlert
};
