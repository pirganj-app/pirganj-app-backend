require('dotenv').config();
const express = require('express');
const cors = require('cors');
const api = require('./api');
const { getVersionPayload } = require('./config');

const app = express();
const port = Number(process.env.PORT || 10000);

// Mobile clients use bearer tokens, so wildcard CORS is safe for this API surface.
app.use(cors({ origin: process.env.CORS_ORIGINS || '*' }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api', api);
app.get('/version', async (_req, res, next) => {
  try { return res.json({ success: true, data: await getVersionPayload() }); } catch (error) { return next(error); }
});

app.get('/', (_req, res) => res.json({ success: true, name: 'Pirganj API', version: '1.0' }));
app.use((error, _req, res, _next) => {
  console.error(error);
  const data = { message: error.status ? error.message : 'Internal server error' };
  if (error.retryAfterSeconds) data.retryAfterSeconds = error.retryAfterSeconds;
  res.status(error.status || 500).json({ success: false, data });
});

if (require.main === module) {
  app.listen(port, '0.0.0.0', () => console.log(`Pirganj Express API listening on port ${port}`));
}

module.exports = app;
