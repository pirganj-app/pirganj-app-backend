require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const api = require('./api');
const { getVersionPayload } = require('./config');

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be configured in production');
}

const app = express();
const port = Number(process.env.PORT || 10000);
const rateWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60 * 1000);
const apiRateLimitMax = Number(process.env.API_RATE_LIMIT_MAX || 300);
const authRateLimitMax = Number(process.env.AUTH_RATE_LIMIT_MAX || 30);
const configuredOrigins = String(process.env.CORS_ORIGINS || '*')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || configuredOrigins.includes('*') || configuredOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  maxAge: 86400,
};
const apiLimiter = rateLimit({
  windowMs: rateWindowMs,
  limit: apiRateLimitMax,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path === '/version',
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: authRateLimitMax,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter, api);
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
