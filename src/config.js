const fs = require("fs");
const path = require("path");

const REQUIRED_FIELDS = ["id", "name", "url", "interval", "expectedStatus", "timeout"];

// Loads and validates API monitor configurations from config/apis.json.
function loadApiConfigs() {
  const configPath = path.resolve(__dirname, "..", "config", "apis.json");
  let parsedConfigs;

  try {
    const raw = fs.readFileSync(configPath, "utf8");
    parsedConfigs = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Failed to read or parse API config file at ${configPath}: ${error.message}`);
  }

  if (!Array.isArray(parsedConfigs) || parsedConfigs.length === 0) {
    throw new Error("API config must be a non-empty array in config/apis.json.");
  }

  parsedConfigs.forEach((api, index) => {
    if (api === null || typeof api !== "object" || Array.isArray(api)) {
      throw new Error(`API config at index ${index} must be an object.`);
    }

    for (const field of REQUIRED_FIELDS) {
      if (!(field in api)) {
        throw new Error(`API config at index ${index} is missing required field: ${field}`);
      }
    }

    if (typeof api.id !== "string" || api.id.trim() === "") {
      throw new Error(`API config at index ${index} has invalid id; expected non-empty string.`);
    }

    if (typeof api.name !== "string" || api.name.trim() === "") {
      throw new Error(`API config "${api.id}" has invalid name; expected non-empty string.`);
    }

    if (typeof api.url !== "string" || api.url.trim() === "") {
      throw new Error(`API config "${api.id}" has invalid url; expected non-empty string.`);
    }

    try {
      new URL(api.url);
    } catch (error) {
      throw new Error(`API config "${api.id}" has malformed url: ${api.url}`);
    }

    if (!Number.isInteger(api.interval) || api.interval <= 0) {
      throw new Error(`API config "${api.id}" has invalid interval; expected positive integer seconds.`);
    }

    if (!Number.isInteger(api.expectedStatus) || api.expectedStatus < 100 || api.expectedStatus > 599) {
      throw new Error(`API config "${api.id}" has invalid expectedStatus; expected HTTP code 100-599.`);
    }

    if (!Number.isInteger(api.timeout) || api.timeout <= 0) {
      throw new Error(`API config "${api.id}" has invalid timeout; expected positive integer milliseconds.`);
    }
  });

  return parsedConfigs;
}

module.exports = {
  loadApiConfigs
};
