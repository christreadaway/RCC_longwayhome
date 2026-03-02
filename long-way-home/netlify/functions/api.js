/**
 * Netlify serverless function that wraps the Express API.
 * All /api/* requests are proxied here via netlify.toml redirect.
 */
const serverless = require('serverless-http');
const app = require('../../server/index');

module.exports.handler = serverless(app);
