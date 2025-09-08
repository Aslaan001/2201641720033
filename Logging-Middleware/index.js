const axios = require('axios');

/**
 * Log function for AffordMed assignment
 * @param {string} stack - 'backend' or 'frontend'
 * @param {string} level - 'debug', 'info', 'warn', 'error', 'fatal'
 * @param {string} pkg - package name (see assignment doc)
 * @param {string} message - descriptive log message
 * @param {string} [token] - optional Bearer token for protected API
 */
async function Log(stack, level, pkg, message, token) {
  try {
    const body = {
      stack: stack.toLowerCase(),
      level: level.toLowerCase(),
      package: pkg.toLowerCase(),
      message: message
    };
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    await axios.post('http://20.244.56.144/evaluation-service/logs', body, { headers });
  } catch (err) {
    // Optionally handle logging errors (do not throw)
  }
}

module.exports = Log;

