require('dotenv').config();
const express = require('express');
const cors = require('cors');
const api = require('./api');

const app = express();
const port = Number(process.env.PORT || 10000);

// Public API: any web origin may call these REST endpoints.
// Credentials/cookies are intentionally not enabled with wildcard CORS.
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api/v1', api);

app.get('/', (_req, res) => res.json({ success: true, name: 'Pirganj API', version: 'v1' }));
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(port, '0.0.0.0', () => console.log(`Pirganj Express API listening on port ${port}`));
}

module.exports = app;
